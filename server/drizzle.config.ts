import { defineConfig } from "drizzle-kit";
import config from "./src/config/config.js";

export default defineConfig({
    dialect: "postgresql",

    schema: "./src/models",

    out: "./src/migrations",

    dbCredentials: {
        url: config.DATABASE_URL,
    },
});