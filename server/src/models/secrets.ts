import {
    pgTable,
    varchar,
    text,
    timestamp,
    uuid,
    foreignKey,
    unique
} from "drizzle-orm/pg-core";
import { environments } from "./environments.js";
import { organizations } from "./organizations.js";

export const secrets = pgTable("secrets", {
    id: uuid("id").defaultRandom().primaryKey(),

    organization_id: uuid("organization_id").notNull(),

    environment_id: uuid("environment_id").notNull(),
    
    name: varchar("name", {
        length: 100,
    }).notNull(),

    value: text("value").notNull(),

    key: varchar("key", {
        length: 255,
    }).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
},
(table) => [
      unique("unique_env_secret_key").on(table.environment_id, table.key),
      foreignKey({
          columns: [table.organization_id],
          name: "fk_secrets_organization_id",
          foreignColumns: [organizations.id]
      }).onDelete("cascade"),
      foreignKey({
          columns: [table.environment_id],
          name: "fk_secrets_environment_id",
          foreignColumns: [environments.id]
      }).onDelete("cascade")
])