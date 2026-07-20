import { pgTable, varchar, timestamp, uuid, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organization_id: uuid('organization_id').notNull(),

    name: varchar('name', {
      length: 100,
    }).notNull(),

    description: varchar('description', {
      length: 255,
    }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),

    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.organization_id],
      name: 'fk_projects_organization_id',
      foreignColumns: [organizations.id],
    }).onDelete('cascade'),
  ],
);
