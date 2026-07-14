import { pgTable } from "drizzle-orm/pg-core";

export const userTable = pgTable("users",(t)=>({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    name: t.varchar().notNull(),
    age: t.integer().notNull(),
    email: t.varchar().notNull().unique(),
    
}))