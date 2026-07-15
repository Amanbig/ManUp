import "dotenv/config";

class Config{
    DATABASE_URL:string = process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/manup"
    JWT_SECRET: string = process.env.JWT_SECRET || "development"
    MASTER_KEY: string = process.env.MASTER_KEY || "development"
    DB_TYPE: string = process.env.DB_TYPE || "PGLITE"
    DB_DIR: string = process.env.DB_DIR || "./manup"
}

const config = new Config()

export default config;