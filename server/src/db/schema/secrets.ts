import {
    pgTable,
    varchar,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { environments } from "./environments.js";
import { organizations } from "./organizations.js";

export const secrets = pgTable("secrets", {
    id: uuid().defaultRandom(),

    organization_id: varchar("organization_id", {
        length: 255,
    }).notNull(),

    environment_id: varchar("environment_id", {
        length: 255,
    }).notNull(),
    
    name: varchar("name", {
        length: 100,
    }).notNull(),

    value: varchar("value", {
        length: 255,
    }).unique().notNull(),

    key: varchar("key", {
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
          columns: [table.environment_id],
          name: "custom_fk",
          foreignColumns: [environments.id]
      })
    ])