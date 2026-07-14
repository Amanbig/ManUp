class Config{
    DATABASE_URL:string = process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/manup"
    DATABASE_URL_ASYNC: string = process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/manup"
    JWT_SECRET: string = process.env.JWT_SECRET || "development"
}

const config = new Config()

export default config;