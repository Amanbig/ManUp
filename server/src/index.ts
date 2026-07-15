import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { sql } from 'drizzle-orm';
import { db } from "./db/index.js"

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

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});