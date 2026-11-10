import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  integer,
  foreignKey,
  unique,
} from 'drizzle-orm/pg-core';
import { environments } from './environments.js';
import { secrets } from './secrets.js';
import { users } from './users.js';

export const secretVersions = pgTable(
  'secret_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    secret_id: uuid('secret_id').notNull(),

    environment_id: uuid('environment_id').notNull(),

    version: integer('version').notNull(),

    name: varchar('name', {
      length: 100,
    }).notNull(),

    key: varchar('key', {
      length: 255,
    }).notNull(),

    value: text('value').notNull(),

    created_by: uuid('created_by'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_secret_version').on(table.secret_id, table.version),
    foreignKey({
      columns: [table.secret_id],
      name: 'fk_secret_versions_secret_id',
      foreignColumns: [secrets.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.environment_id],
      name: 'fk_secret_versions_environment_id',
      foreignColumns: [environments.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.created_by],
      name: 'fk_secret_versions_created_by',
      foreignColumns: [users.id],
    }).onDelete('set null'),
  ],
);
