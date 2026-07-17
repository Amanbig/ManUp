import {
    pgTable,
    varchar,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { organizations } from "./organizations.js";

export const environments = pgTable("environments", {
    id: uuid().defaultRandom(),

    organization_id: varchar("organization_id", {
        length: 255,
    }).notNull(),

    project_id: varchar("project_id", {
        length: 255,
    }).notNull(),
    
    name: varchar("name", {
        length: 100,
    }).notNull(),

    description: varchar("description", {
        length: 255,
    }).unique().notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
},
(table) => [
      foreignKey({
          columns: [table.organization_id],
          name: "custom_fk",
          foreignColumns: [organizations.id]
      }),
      foreignKey({
          columns: [table.project_id],
          name: "custom_fk",
          foreignColumns: [projects.id]
      })
    ])