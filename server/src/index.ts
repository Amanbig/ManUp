import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import fs from 'fs';
import { sql } from 'drizzle-orm';
import { db } from "./db/index.js";
import { pg_db } from "./db/type/postgres.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import config from "./config/config.js";
import router from './routers/index.js';

const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());

app.get("/health", async (req, res) => {
    try {
        const database = db();

        if (!database) {
            return res.status(503).json({ detail: "database not configured" });
        }

        await database.execute(sql`select 1`);

        return res.json({ detail: "database connected" });
    } catch (error) {
        return res.status(503).json({ detail: "database not connected" });
    }
});

app.use("/",router);

const startServer = async () => {
    if (config.DB_TYPE === "POSTGRES") {
        try {
            console.log("Applying database migrations...");
            const migrationsFolder = fs.existsSync("./dist/migrations")
                ? "./dist/migrations"
                : "./src/migrations";
            await migrate(pg_db, { migrationsFolder });
            console.log("Migrations applied successfully.");
        } catch (error) {
            console.error("Failed to apply migrations:", error);
        }
    }

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}/`);
    });
};

startServer();