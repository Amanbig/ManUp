import crypto from "crypto";
import config from "../config/config.js";

// Derive a 32-byte key from the MASTER_KEY in env
const getMasterKeyBuffer = (): Buffer => {
    return crypto.createHash("sha256").update(config.MASTER_KEY).digest();
};

/**
 * Encrypt plaintext using AES-256-GCM with the provided 32-byte key.
 * Returns formatted string: "iv:authTag:ciphertext"
 */
export const encrypt = (plaintext: string, key: Buffer): string => {
    const iv = crypto.randomBytes(12); // Standard IV size for GCM is 12 bytes
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${authTag}:${ciphertext}`;
};

/**
 * Decrypt ciphertext formatted as "iv:authTag:ciphertext" using AES-256-GCM with the provided 32-byte key.
 */
export const decrypt = (encryptedString: string, key: Buffer): string => {
    const parts = encryptedString.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted format. Expected 'iv:authTag:ciphertext'");
    }
    
    const [ivHex, authTagHex, ciphertextHex] = parts;
    if (!ivHex || !authTagHex || !ciphertextHex) {
        throw new Error("Invalid encrypted format components");
    }
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(ciphertextHex, "hex", "utf8");
    plaintext += decipher.final("utf8");
    
    return plaintext;
};

/**
 * Generate a random 32-byte Data Encryption Key (DEK) in hex format
 */
export const generateDEK = (): string => {
    return crypto.randomBytes(32).toString("hex");
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
    const key = Buffer.from(dekHex, "hex");
    return encrypt(plaintext, key);
};

/**
 * Decrypt a secret value using a decrypted DEK
 */
export const decryptSecret = (encryptedValue: string, dekHex: string): string => {
    const key = Buffer.from(dekHex, "hex");
    return decrypt(encryptedValue, key);
};

/**
 * Encrypt a password by prepending a random salt, encrypting with MASTER_KEY, 
 * and formatting the stored result as "salt:iv:authTag:ciphertext".
 */
export const encryptPassword = (password: string): string => {
    const salt = crypto.randomBytes(16).toString("hex");
    const saltedPassword = `${salt}:${password}`;
    const encrypted = encrypt(saltedPassword, getMasterKeyBuffer());
    return `${salt}:${encrypted}`;
};

/**
 * Verify a password against a stored "salt:iv:authTag:ciphertext" string.
 */
export const verifyPassword = (password: string, passwordHash: string): boolean => {
    try {
        const parts = passwordHash.split(":");
        if (parts.length !== 4) {
            return false;
        }
        
        const [salt, iv, authTag, ciphertext] = parts;
        if (!salt || !iv || !authTag || !ciphertext) {
            return false;
        }
        
        const encryptedPart = `${iv}:${authTag}:${ciphertext}`;
        const decrypted = decrypt(encryptedPart, getMasterKeyBuffer());
        
        const colonIndex = decrypted.indexOf(":");
        if (colonIndex === -1) {
            return false;
        }
        
        const decryptedSalt = decrypted.substring(0, colonIndex);
        const decryptedPassword = decrypted.substring(colonIndex + 1);
        
        return decryptedSalt === salt && decryptedPassword === password;
    } catch (e) {
        return false;
    }
};

/**
 * Generate a secure random API key prefixed with 'mp_'
 */
export const generateApiKey = (): string => {
    return "mp_" + crypto.randomBytes(32).toString("base64url");
};

/**
 * Hash an API key using SHA-256 for secure storage in database
 */
export const hashApiKey = (apiKey: string): string => {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
};
