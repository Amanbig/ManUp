import type { Request } from 'express';
import { db } from '../db/index.js';
import { auditLogs } from '../models/auditLogs.js';

export interface AuditLogParams {
  organizationId: string;
  projectId?: string | null | undefined;
  environmentId?: string | null | undefined;
  userId?: string | null | undefined;
  action: string;
  entityType: string;
  entityName?: string | null | undefined;
  req?: Request;
  metadata?: Record<string, any> | null | undefined;
}

/**
 * Asynchronously record an audit trail event.
 * Never throws or blocks main request execution if logging fails.
 */
export const logAuditEvent = async ({
  organizationId,
  projectId,
  environmentId,
  userId,
  action,
  entityType,
  entityName,
  req,
  metadata,
}: AuditLogParams): Promise<void> => {
  try {
    const database = db();
    if (!database || !organizationId) return;

    let ip: string | undefined;
    let userAgent: string | undefined;

    if (req) {
      const forwarded = req.headers['x-forwarded-for'];
      ip = (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : req.ip) || undefined;
      userAgent = req.headers['user-agent'] || undefined;
    }

    await database.insert(auditLogs).values({
      organization_id: organizationId as any,
      project_id: (projectId as any) || null,
      environment_id: (environmentId as any) || null,
      user_id: (userId as any) || null,
      action,
      entity_type: entityType,
      entity_name: entityName || null,
      ip_address: ip || null,
      user_agent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    // Non-blocking catch to ensure audit logging errors never disrupt application flows
    console.error('[AuditLog] Failed to record audit event:', err);
  }
};
