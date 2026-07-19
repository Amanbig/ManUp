import {
    pgTable,
    varchar,
    timestamp,
    uuid,
    foreignKey
} from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { users } from "./users.js";

export const projectMembers = pgTable("project_members", {
    id: uuid("id").defaultRandom().primaryKey(),

    project_id: uuid("project_id").notNull(),

    user_id: uuid("user_id").notNull(),

    role: varchar("role", {
        length: 50,
    }).default("member").notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
},
(table) => [
    foreignKey({
        columns: [table.project_id],
        name: "fk_project_members_project_id",
        foreignColumns: [projects.id]
    }).onDelete("cascade"),
    foreignKey({
        columns: [table.user_id],
        name: "fk_project_members_user_id",
        foreignColumns: [users.id]
    }).onDelete("cascade")
]);
