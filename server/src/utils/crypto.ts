import crypto from 'crypto';
import config from '../config/config.js';

// Derive a 32-byte key from the MASTER_KEY in env
const getMasterKeyBuffer = (): Buffer => {
  return crypto.createHash('sha256').update(config.MASTER_KEY).digest();
};

/**
 * Encrypt plaintext using AES-256-GCM with the provided 32-byte key.
 * Returns formatted string: "iv:authTag:ciphertext"
 */
export const encrypt = (plaintext: string, key: Buffer): string => {
  const iv = crypto.randomBytes(12); // Standard IV size for GCM is 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
};

/**
 * Decrypt ciphertext formatted as "iv:authTag:ciphertext" using AES-256-GCM with the provided 32-byte key.
 */
export const decrypt = (encryptedString: string, key: Buffer): string => {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected 'iv:authTag:ciphertext'");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted format components');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertextHex, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
};

/**
 * Generate a random 32-byte Data Encryption Key (DEK) in hex format
 */
export const generateDEK = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Encrypt the DEK using the MASTER_KEY
 */
export const encryptDEK = (dekHex: string): string => {
  return encrypt(dekHex, getMasterKeyBuffer());
};

/**
 * Decrypt the DEK using the MASTER_KEY
 */
export const decryptDEK = (encryptedDek: string): string => {
  return decrypt(encryptedDek, getMasterKeyBuffer());
};

/**
 * Encrypt a secret value using a decrypted DEK
 */
export const encryptSecret = (plaintext: string, dekHex: string): string => {
  const key = Buffer.from(dekHex, 'hex');
  return encrypt(plaintext, key);
};

/**
 * Decrypt a secret value using a decrypted DEK
 */
export const decryptSecret = (encryptedValue: string, dekHex: string): string => {
  const key = Buffer.from(dekHex, 'hex');
  return decrypt(encryptedValue, key);
};

/**
 * Legacy AES-256-GCM password encryption retained strictly for backward compatibility testing.
 */
export const _encryptPasswordLegacy = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const saltedPassword = `${salt}:${password}`;
  const encrypted = encrypt(saltedPassword, getMasterKeyBuffer());
  return `${salt}:${encrypted}`;
};

/**
 * One-way hash a password using modern salted scrypt.
 * Format: "scrypt:v1:<saltHex>:<derivedKeyHex>"
 */
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  return `scrypt:v1:${salt}:${derivedKey.toString('hex')}`;
};

/**
 * Backward compatibility alias for hashPassword
 */
export const encryptPassword = hashPassword;

/**
 * Checks if a stored password hash is using the legacy AES-256-GCM format
 * and should be upgraded to modern scrypt upon successful authentication.
 */
export const needsPasswordRehash = (storedHash: string): boolean => {
  return !storedHash || !storedHash.startsWith('scrypt:v1:');
};

/**
 * Verify a password against a stored hash string.
 * Supports:
 *  1. Modern salted scrypt: "scrypt:v1:<saltHex>:<derivedKeyHex>" (timing-safe comparison)
 *  2. Legacy AES-256-GCM encrypted passwords: "salt:iv:authTag:ciphertext" (for transparent backward compatibility)
 */
export const verifyPassword = (password: string, passwordHash: string): boolean => {
  if (!password || !passwordHash) {
    return false;
  }

  // 1. Modern scrypt format
  if (passwordHash.startsWith('scrypt:v1:')) {
    try {
      const parts = passwordHash.split(':');
      if (parts.length !== 4) {
        return false;
      }

      const [, , salt, expectedHex] = parts;
      if (!salt || !expectedHex || expectedHex.length < 32 || salt.length < 16) {
        return false;
      }

      // Ensure expectedHex only contains valid hex characters and has an even length
      if (expectedHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(expectedHex)) {
        return false;
      }

      const expectedKey = Buffer.from(expectedHex, 'hex');
      if (expectedKey.length === 0) {
        return false;
      }

      const actualKey = crypto.scryptSync(password, salt, expectedKey.length, {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 32 * 1024 * 1024,
      });

      return (
        actualKey.length === expectedKey.length && crypto.timingSafeEqual(actualKey, expectedKey)
      );
    } catch {
      return false;
    }
  }

  // 2. Legacy format: "salt:iv:authTag:ciphertext"
  try {
    const parts = passwordHash.split(':');
    if (parts.length !== 4) {
      return false;
    }

    const [salt, iv, authTag, ciphertext] = parts;
    if (!salt || !iv || !authTag || !ciphertext) {
      return false;
    }

    const encryptedPart = `${iv}:${authTag}:${ciphertext}`;
    const decrypted = decrypt(encryptedPart, getMasterKeyBuffer());

    const colonIndex = decrypted.indexOf(':');
    if (colonIndex === -1) {
      return false;
    }

    const decryptedSalt = decrypted.substring(0, colonIndex);
    const decryptedPassword = decrypted.substring(colonIndex + 1);

    return decryptedSalt === salt && decryptedPassword === password;
  } catch {
    return false;
  }
};

/**
 * Generate a secure random API key prefixed with 'mp_'
 */
export const generateApiKey = (): string => {
  return 'mp_' + crypto.randomBytes(32).toString('base64url');
};

/**
 * Hash an API key using SHA-256 for secure storage in database
 */
export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};
