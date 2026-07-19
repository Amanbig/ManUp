import {
    pgTable,
    varchar,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";

export const users = pgTable("users", {
    id: uuid().defaultRandom(),

    organization_id: varchar("organization_id", {
        length: 255,
    }).notNull(),

    username: varchar("username", {
        length: 100,
    }).notNull(),
    
    name: varchar("name", {
        length: 100,
    }).notNull(),

    email: varchar("email", {
        length: 255,
    }).unique().notNull(),

    password_hash: varchar("password_hash", {
        length: 500,
    }).notNull(),

    type: varchar("type", {
        length:100,
    }).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
},
(table) => [
      foreignKey({
          columns: [table.organization_id],
          name: "fk_users_organization_id",
          foreignColumns: [organizations.id]
      })
    ])