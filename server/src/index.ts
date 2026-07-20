import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { sql } from 'drizzle-orm';
import { db } from "./db/index.js";
import { pg_db } from "./db/type/postgres.js";
import config from "./config/config.js";
import router from './routers/index.js';

const PORT = process.env.PORT || 7780;

// --- Security guard: refuse to start with placeholder secrets ---
if (
    process.env.NODE_ENV === "production" &&
    (config.JWT_SECRET === "development" || config.MASTER_KEY === "development")
) {
    console.error(
        "FATAL: JWT_SECRET and MASTER_KEY must be set to non-default values in production. Exiting."
    );
    process.exit(1);
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Strict CORS — same-origin by default; extend via ALLOWED_ORIGINS env var
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : [`http://localhost:${PORT}`, `http://localhost:5173`];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // required for httpOnly cookies
}));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
        },
    },
}));

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

app.use("/api", router);

// Serve client frontend static files
import path from 'path';
const clientDistPath = fs.existsSync(path.resolve(process.cwd(), '../client/dist'))
    ? path.resolve(process.cwd(), '../client/dist')
    : path.resolve(process.cwd(), './client-dist');

if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get(/(.*)/, (req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
            return next();
        }
        res.sendFile(path.join(clientDistPath, "index.html"));
    });
}

const startServer = async () => {
    if (config.DB_TYPE === "POSTGRES" || config.DB_TYPE === "PGLITE") {
        try {
            console.log("Applying database migrations...");
            const migrationsFolder = fs.existsSync("./dist/migrations")
                ? "./dist/migrations"
                : "./src/migrations";

            if (config.DB_TYPE === "POSTGRES") {
                const { migrate: pgMigrate } = await import("drizzle-orm/node-postgres/migrator");
                await pgMigrate(pg_db, { migrationsFolder });
            } else if (config.DB_TYPE === "PGLITE") {
                const { migrate: pgliteMigrate } = await import("drizzle-orm/pglite/migrator");
                const { pglite_db } = await import("./db/type/pglite.js");
                await pgliteMigrate(pglite_db, { migrationsFolder });
            }
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