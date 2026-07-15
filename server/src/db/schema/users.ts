import {
    pgTable,
    varchar,
    timestamp,
    uuid
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid().defaultRandom(),

    username: varchar("username", {
        length: 100,
    }).notNull(),
    
    name: varchar("name", {
        length: 100,
    }).notNull(),

    email: varchar("email", {
        length: 255,
    }).unique().notNull(),

    type: varchar("type", {
        length:100,
    }).notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
});