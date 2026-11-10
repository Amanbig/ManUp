import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  needsPasswordRehash,
  _encryptPasswordLegacy,
  generateDEK,
  encryptDEK,
  decryptDEK,
  encryptSecret,
  decryptSecret,
} from '../src/utils/crypto.js';

describe('Password Security Hardening', () => {
  const password = 'SuperSecretPassword123!#';

  it('hashes passwords using scrypt with proper format', () => {
    const hash = hashPassword(password);
    assert.match(hash, /^scrypt:v1:[a-f0-9]{32}:[a-f0-9]{128}$/);
    assert.strictEqual(needsPasswordRehash(hash), false);
  });

  it('generates unique salts and hashes for the same password', () => {
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    assert.notStrictEqual(hash1, hash2);
    assert.strictEqual(verifyPassword(password, hash1), true);
    assert.strictEqual(verifyPassword(password, hash2), true);
  });

  it('verifies correct scrypt password and rejects incorrect password', () => {
    const hash = hashPassword(password);
    assert.strictEqual(verifyPassword(password, hash), true);
    assert.strictEqual(verifyPassword('WrongPassword123!', hash), false);
    assert.strictEqual(verifyPassword('', hash), false);
    assert.strictEqual(verifyPassword(password, ''), false);
  });

  it('transparently verifies legacy AES-256-GCM encrypted passwords for backward compatibility', () => {
    const legacyHash = _encryptPasswordLegacy(password);
    assert.strictEqual(needsPasswordRehash(legacyHash), true);
    assert.strictEqual(verifyPassword(password, legacyHash), true);
    assert.strictEqual(verifyPassword('WrongLegacyPassword!', legacyHash), false);
  });

  it('gracefully handles malformed password hashes without throwing', () => {
    assert.strictEqual(verifyPassword(password, 'malformed'), false);
    assert.strictEqual(verifyPassword(password, 'scrypt:v1:invalidsalt:invalidkey'), false);
    assert.strictEqual(verifyPassword(password, 'a:b:c'), false);
    assert.strictEqual(verifyPassword(password, 'a:b:c:d:e'), false);
  });
});

describe('Envelope Encryption (DEK & Secrets)', () => {
  it('encrypts and decrypts secrets with DEK roundtrip', () => {
    const dek = generateDEK();
    const encryptedDek = encryptDEK(dek);
    const decryptedDek = decryptDEK(encryptedDek);
    assert.strictEqual(decryptedDek, dek);

    const secretValue = 'postgresql://user:pass@db.example.com:5432/vault';
    const encryptedSecret = encryptSecret(secretValue, dek);
    const decryptedSecret = decryptSecret(encryptedSecret, dek);
    assert.strictEqual(decryptedSecret, secretValue);
  });
});
