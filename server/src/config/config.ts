import 'dotenv/config';

class Config {
  DATABASE_URL: string =
    process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/manup';
  JWT_SECRET: string = process.env.JWT_SECRET || 'development';
  /** Separate secret for refresh tokens — must differ from JWT_SECRET */
  REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET || 'development-refresh';
  MASTER_KEY: string = process.env.MASTER_KEY || 'development';
  DB_TYPE: string = process.env.DB_TYPE || 'PGLITE';
  DB_DIR: string = process.env.DB_DIR || './manup';
  SMTP_HOST: string = process.env.SMTP_HOST || '';
  SMTP_PORT: number = parseInt(process.env.SMTP_PORT || '587');
  SMTP_USER: string = process.env.SMTP_USER || '';
  SMTP_PASS: string = process.env.SMTP_PASS || '';
  SMTP_FROM: string = process.env.SMTP_FROM || 'ManUp Secure Vault <no-reply@manup.io>';
}

const config = new Config();

export default config;
