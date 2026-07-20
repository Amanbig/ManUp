import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import config from '../../config/config.js';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

export const pg_db = drizzle({ client: pool });
