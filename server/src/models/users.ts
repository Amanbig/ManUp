import {
    pgTable,
    varchar,
    text,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),

    organization_id: uuid("organization_id").notNull(),

    username: varchar("username", {
        length: 100,
    }).notNull(),
    
    name: varchar("name", {
        length: 100,
    }).notNull(),

    email: varchar("email", {
        length: 255,
    }).unique().notNull(),

    password_hash: text("password_hash").notNull(),

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
      }).onDelete("cascade")
    ])