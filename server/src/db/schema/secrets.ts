import {
    pgTable,
    varchar,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { environments } from "./environments.js";

export const secrets = pgTable("secrets", {
    id: uuid().defaultRandom(),

    user_id: varchar("user_id", {
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
          columns: [table.user_id],
          name: "custom_fk",
          foreignColumns: [users.id]
      }),
      foreignKey({
          columns: [table.environment_id],
          name: "custom_fk",
          foreignColumns: [environments.id]
      })
    ])