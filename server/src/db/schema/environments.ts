import {
    pgTable,
    varchar,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { projects } from "./projects.js";

export const environments = pgTable("environments", {
    id: uuid().defaultRandom(),

    user_id: varchar("user_id", {
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
          columns: [table.user_id],
          name: "custom_fk",
          foreignColumns: [users.id]
      }),
      foreignKey({
          columns: [table.project_id],
          name: "custom_fk",
          foreignColumns: [projects.id]
      })
    ])