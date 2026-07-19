import {
    pgTable,
    varchar,
    text,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { organizations } from "./organizations.js";

export const environments = pgTable("environments", {
    id: uuid("id").defaultRandom().primaryKey(),

    organization_id: uuid("organization_id").notNull(),

    project_id: uuid("project_id").notNull(),

    encrypted_dek: text("encrypted_dek").notNull(),
    
    name: varchar("name", {
        length: 100,
    }).notNull(),

    description: varchar("description", {
        length: 255,
    }).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
},
(table) => [
      foreignKey({
          columns: [table.organization_id],
          name: "fk_environments_organization_id",
          foreignColumns: [organizations.id]
      }),
      foreignKey({
          columns: [table.project_id],
          name: "fk_environments_project_id",
          foreignColumns: [projects.id]
      })
    ])