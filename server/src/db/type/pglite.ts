import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import config from "../../config/config.js"

// In-memory Postgres
const client = new PGlite(config.DB_DIR);

export const pglite_db = drizzle({ client });
