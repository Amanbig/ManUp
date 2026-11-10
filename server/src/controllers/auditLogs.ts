import type { Request, Response } from 'express';
import { db } from '../db/index.js';
import { auditLogs } from '../models/auditLogs.js';
import { users } from '../models/users.js';
import { projects } from '../models/projects.js';
import { environments } from '../models/environments.js';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';

/**
 * Retrieve paginated audit logs for the current organization.
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    const limitParam = parseInt((req.query.limit as string) || '50', 10);
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 200);

    const offsetParam = parseInt((req.query.offset as string) || '0', 10);
    const offset = Math.max(isNaN(offsetParam) ? 0 : offsetParam, 0);

    const actionFilter = req.query.action as string | undefined;
    const entityTypeFilter = req.query.entityType as string | undefined;
    const projectIdFilter = req.query.projectId as string | undefined;
    const environmentIdFilter = req.query.environmentId as string | undefined;
    const searchFilter = req.query.search as string | undefined;

    const conditions = [eq(auditLogs.organization_id as any, user.organizationId)];

    if (actionFilter && actionFilter.trim() !== '') {
      conditions.push(eq(auditLogs.action, actionFilter.trim()));
    }

    if (entityTypeFilter && entityTypeFilter.trim() !== '') {
      conditions.push(eq(auditLogs.entity_type, entityTypeFilter.trim()));
    }

    if (projectIdFilter && projectIdFilter.trim() !== '') {
      conditions.push(eq(auditLogs.project_id as any, projectIdFilter.trim()));
    }

    if (environmentIdFilter && environmentIdFilter.trim() !== '') {
      conditions.push(eq(auditLogs.environment_id as any, environmentIdFilter.trim()));
    }

    if (searchFilter && searchFilter.trim() !== '') {
      const term = `%${searchFilter.trim()}%`;
      conditions.push(
        or(
          ilike(auditLogs.entity_name, term),
          ilike(auditLogs.action, term),
          ilike(auditLogs.ip_address, term),
        )!,
      );
    }

    const whereClause = and(...conditions);

    // Count total matching logs
    const [countResult] = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);

    const total = countResult?.count || 0;

    // Retrieve paginated records joined with user, project, and environment info
    const logs = await database
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entity_type,
        entityName: auditLogs.entity_name,
        ipAddress: auditLogs.ip_address,
        userAgent: auditLogs.user_agent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
        environment: {
          id: environments.id,
          name: environments.name,
        },
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.user_id as any, users.id))
      .leftJoin(projects, eq(auditLogs.project_id as any, projects.id))
      .leftJoin(environments, eq(auditLogs.environment_id as any, environments.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedLogs = logs.map((log: any) => {
      let parsedMetadata: any = null;
      if (log.metadata) {
        try {
          parsedMetadata = JSON.parse(log.metadata);
        } catch {
          parsedMetadata = log.metadata;
        }
      }
      return {
        ...log,
        metadata: parsedMetadata,
      };
    });

    return res.json({
      logs: formattedLogs,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to retrieve audit logs' });
  }
};
