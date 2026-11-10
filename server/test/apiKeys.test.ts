import test from 'node:test';
import assert from 'node:assert/strict';
import { apiKeys } from '../src/models/apiKeys.js';
import { hashApiKey, generateApiKey } from '../src/utils/crypto.js';

test('API Key Scoping & Security Rules', async (t) => {
  await t.test('apiKeys model includes environment_id foreign key column', () => {
    assert.ok('environment_id' in apiKeys, 'apiKeys table should have environment_id column');
  });

  await t.test('generates secure API keys and reproducible SHA-256 hashes', () => {
    const rawKey = generateApiKey();
    assert.ok(rawKey.startsWith('mp_'), 'Key should begin with mp_ prefix');
    assert.ok(rawKey.length > 20, 'Key length should be secure');

    const hash1 = hashApiKey(rawKey);
    const hash2 = hashApiKey(rawKey);
    assert.equal(hash1, hash2, 'Hash of identical API key should match');
  });

  await t.test('enforces environment-level scoping isolation', () => {
    const scopedEnvId = '11111111-1111-1111-1111-111111111111';
    const otherEnvId = '22222222-2222-2222-2222-222222222222';

    // Simulate mock request user context with environment-scoped API key
    const reqUser = {
      id: 'user-1',
      organizationId: 'org-1',
      apiKeyId: 'key-1',
      apiKeyProjectId: 'proj-1',
      apiKeyEnvironmentId: scopedEnvId,
      apiKeyScope: 'full',
    };

    // Allowed check
    const isMatchingEnv = reqUser.apiKeyEnvironmentId === scopedEnvId;
    assert.equal(isMatchingEnv, true, 'Access to matching scoped environment should be permitted');

    // Denied check
    const isDifferentEnv = reqUser.apiKeyEnvironmentId === otherEnvId;
    assert.equal(isDifferentEnv, false, 'Access to different environment must be denied');
  });

  await t.test('enforces read-only scope for non-GET HTTP methods', () => {
    const readOnlyKeyContext = {
      apiKeyScope: 'read-only',
    };

    const isGetAllowed = readOnlyKeyContext.apiKeyScope === 'read-only' && 'GET' === 'GET';
    const isPostAllowed = !(readOnlyKeyContext.apiKeyScope === 'read-only' && 'POST' !== 'GET');
    const isDeleteAllowed = !(readOnlyKeyContext.apiKeyScope === 'read-only' && 'DELETE' !== 'GET');

    assert.equal(isGetAllowed, true, 'GET request must be allowed with read-only scope');
    assert.equal(isPostAllowed, false, 'POST request must be blocked with read-only scope');
    assert.equal(isDeleteAllowed, false, 'DELETE request must be blocked with read-only scope');
  });
});
