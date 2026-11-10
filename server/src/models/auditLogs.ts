import { pgTable, varchar, text, timestamp, uuid, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { projects } from './projects.js';
import { environments } from './environments.js';
import { users } from './users.js';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organization_id: uuid('organization_id').notNull(),

    project_id: uuid('project_id'),

    environment_id: uuid('environment_id'),

    user_id: uuid('user_id'),

    action: varchar('action', {
      length: 50,
    }).notNull(),

    entity_type: varchar('entity_type', {
      length: 50,
    }).notNull(),

    entity_name: varchar('entity_name', {
      length: 255,
    }),

    ip_address: varchar('ip_address', {
      length: 100,
    }),

    user_agent: text('user_agent'),

    metadata: text('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organization_id],
      name: 'fk_audit_logs_organization_id',
      foreignColumns: [organizations.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.project_id],
      name: 'fk_audit_logs_project_id',
      foreignColumns: [projects.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.environment_id],
      name: 'fk_audit_logs_environment_id',
      foreignColumns: [environments.id],
    }).onDelete('set null'),
    foreignKey({
      columns: [table.user_id],
      name: 'fk_audit_logs_user_id',
      foreignColumns: [users.id],
    }).onDelete('set null'),
  ],
);
