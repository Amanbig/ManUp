# ManUp Backend Server ⚙️

This directory contains the REST API server code for **ManUp**. Built using Express and TypeScript, it handles authorization, role enforcement, secret encryption/decryption, API key generation, and organization/project memberships.

---

## 🛠️ Tech Stack

- **Server Framework**: Express.js (v5)
- **Database**: PostgreSQL (supports external instance via `pg` or embedded node database via `@electric-sql/pglite`)
- **ORM / Query Builder**: Drizzle ORM
- **Migration Engine**: Drizzle Kit
- **Logging**: Pino & Morgan
- **Security**: Helmet, CORS, and Cookie-Parser

---

## ⚙️ Environment Variables

For local server development, configure a `.env` file containing:

```env
PORT=8000
DB_TYPE=PGLITE
DB_DIR=./manup_dev
MASTER_KEY=9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p
JWT_SECRET=super_secret_jwt_sign_key_manup_2026
```

- **`MASTER_KEY`**: A cryptographically secure, 32-character hexadecimal key. It is used to securely encrypt secrets on insert/update and decrypt them on retrieve.
- **`JWT_SECRET`**: Signature key for securing sessions and issuing `httpOnly` secure authorization cookies.

---

## 🗄️ Database Management & Migrations

Drizzle ORM is used to manage database schema updates.

1. **Generate Migrations**:
   When updating database schemas inside `src/db/schema.ts`, generate SQL migrations using:
   ```bash
   npm run db:generate
   ```

2. **Run Migrations**:
   Apply pending SQL migration scripts to the database:
   ```bash
   npm run db:migrate
   ```

3. **Open Database Studio**:
   Open a local graphical database management console via Drizzle Studio:
   ```bash
   npm run db:studio
   ```

---

## ⚡ Development Setup

To run the server locally during development:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The backend API will start listening on port `8000`.

---

## 🏗️ Production Build

To compile the TypeScript server into Javascript:

```bash
npm run build
```

The output compiles into the `dist/` directory, which is run via `node dist/index.js` in production environments.
