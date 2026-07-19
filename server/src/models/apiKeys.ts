import {
    pgTable,
    varchar,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const apiKeys = pgTable("api_keys", {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
        length: 100,
    }).notNull(),

    organization_id: uuid("organization_id").notNull(),

    user_id: uuid("user_id").notNull(),

    key_hash: varchar("key_hash", {
        length: 255,
    }).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    expiresAt: timestamp("expires_at")
},
(table) => [
      foreignKey({
          columns: [table.organization_id],
          name: "fk_api_keys_organization_id",
          foreignColumns: [organizations.id]
      }).onDelete("cascade"),
      foreignKey({
          columns: [table.user_id],
          name: "fk_api_keys_user_id",
          foreignColumns: [users.id]
      }).onDelete("cascade")
])
