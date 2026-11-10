import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { logAuditEvent, type AuditLogParams } from '../src/utils/audit.js';

describe('Audit Logging System', () => {
  it('gracefully handles audit logging when database or request is empty', async () => {
    // Should not throw even with missing db or undefined request
    await assert.doesNotReject(async () => {
      await logAuditEvent({
        organizationId: '00000000-0000-0000-0000-000000000000',
        action: 'SECRET_CREATED',
        entityType: 'secret',
        entityName: 'DATABASE_URL',
        metadata: { version: 1 },
      });
    });
  });

  it('correctly accepts all AuditLogParams variants without type mismatch', () => {
    const params: AuditLogParams = {
      organizationId: 'org-123',
      projectId: 'proj-456',
      environmentId: null,
      userId: undefined,
      action: 'API_KEY_CREATED',
      entityType: 'api_key',
      entityName: 'Production CI',
      metadata: { rateLimit: 100 },
    };

    assert.strictEqual(params.action, 'API_KEY_CREATED');
    assert.strictEqual(params.entityType, 'api_key');
  });
});
