import { pgTable, varchar, timestamp, uuid, foreignKey } from 'drizzle-orm/pg-core';
import { environments } from './environments.js';
import { users } from './users.js';

export const environmentMembers = pgTable(
  'environment_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    environment_id: uuid('environment_id').notNull(),

    user_id: uuid('user_id').notNull(),

    role: varchar('role', {
      length: 50,
    })
      .default('member')
      .notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),

    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.environment_id],
      name: 'fk_environment_members_environment_id',
      foreignColumns: [environments.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.user_id],
      name: 'fk_environment_members_user_id',
      foreignColumns: [users.id],
    }).onDelete('cascade'),
  ],
);
