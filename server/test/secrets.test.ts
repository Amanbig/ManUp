import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDEK,
  encryptDEK,
  decryptDEK,
  encryptSecret,
  decryptSecret,
} from '../src/utils/crypto.js';

describe('Secret Versioning & Rollback Logic', () => {
  it('correctly tracks versions across revisions', () => {
    const versions: Array<{ version: number; value: string; key: string }> = [];
    const dek = generateDEK();

    // 1. Initial creation (v1)
    const v1Encrypted = encryptSecret('initial_db_pass_123', dek);
    versions.push({ version: 1, value: v1Encrypted, key: 'DB_PASSWORD' });

    assert.strictEqual(versions.length, 1);
    assert.strictEqual(versions[0]?.version, 1);
    assert.strictEqual(decryptSecret(versions[0]?.value || '', dek), 'initial_db_pass_123');

    // 2. Secret update (v2)
    const v2Encrypted = encryptSecret('updated_db_pass_456', dek);
    const nextVersion = (versions[versions.length - 1]?.version || 1) + 1;
    versions.push({ version: nextVersion, value: v2Encrypted, key: 'DB_PASSWORD' });

    assert.strictEqual(versions.length, 2);
    assert.strictEqual(versions[1]?.version, 2);
    assert.strictEqual(decryptSecret(versions[1]?.value || '', dek), 'updated_db_pass_456');

    // 3. Rollback to v1 (creates v3 with v1 content)
    const targetVersion = 1;
    const targetRecord = versions.find((v) => v.version === targetVersion);
    assert.ok(targetRecord);

    const rollbackVersion = (versions[versions.length - 1]?.version || 1) + 1;
    versions.push({
      version: rollbackVersion,
      value: targetRecord.value,
      key: targetRecord.key,
    });

    assert.strictEqual(versions.length, 3);
    assert.strictEqual(versions[2]?.version, 3);
    assert.strictEqual(decryptSecret(versions[2]?.value || '', dek), 'initial_db_pass_123');
  });
});
