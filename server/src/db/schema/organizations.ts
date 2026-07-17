import {
    pgTable,
    varchar,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
    id: uuid().defaultRandom(),
    
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
})