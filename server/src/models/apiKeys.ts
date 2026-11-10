import { pgTable, varchar, timestamp, uuid, integer, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { users } from './users.js';
import { projects } from './projects.js';
import { environments } from './environments.js';

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: varchar('name', {
      length: 100,
    }).notNull(),

    organization_id: uuid('organization_id').notNull(),

    user_id: uuid('user_id').notNull(),

    project_id: uuid('project_id'),

    environment_id: uuid('environment_id'),

    key_hash: varchar('key_hash', {
      length: 255,
    }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),

    expiresAt: timestamp('expires_at'),

    rateLimit: integer('rate_limit').default(60),

    requestCount: integer('request_count').default(0),

    lastUsedAt: timestamp('last_used_at'),

    scope: varchar('scope', {
      length: 50,
    })
      .default('full')
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organization_id],
      name: 'fk_api_keys_organization_id',
      foreignColumns: [organizations.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.user_id],
      name: 'fk_api_keys_user_id',
      foreignColumns: [users.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.project_id],
      name: 'fk_api_keys_project_id',
      foreignColumns: [projects.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.environment_id],
      name: 'fk_api_keys_environment_id',
      foreignColumns: [environments.id],
    }).onDelete('cascade'),
  ],
);
