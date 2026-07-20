# ManUp 🔒

ManUp is an open-source, self-hosted Secrets Management platform designed to securely store, manage, and orchestrate environment secrets across your projects, teams, and environments. Built with a modern, responsive user experience and robust Role-Based Access Control (RBAC), ManUp provides a lightweight, developer-friendly alternative to Infisical and HashiCorp Vault.

---

## 🚀 Features

- **Centralized Secrets Vault**: Create, update, and manage encrypted secrets with a secure dashboard.
- **Granular RBAC**: Assign roles (`Owner`, `Admin`, `Viewer`) to restrict access. Ensure only authorized users perform destructive actions (editing environments, managing API keys, deleting secrets).
- **Project & Environment Isolation**: Group configuration variables by projects and isolated environments (e.g., Development, Staging, Production).
- **Programmatic API Keys**: Provision secure access keys for applications and CI/CD pipelines.
- **Easy Self-Hosting**: Deploy instantly using Docker and Docker Compose, powered by an embedded PostgreSQL database (`PGLITE`).
- **Secure Authentication**: Built-in cookie-based authentication with `httpOnly` secure cookies to mitigate token interception/XSS vulnerabilities.

---

## 🏗️ Architecture

ManUp is structured as a monorepo consisting of two primary packages:

1. **Frontend (`/client`)**: A premium Single-Page Application (SPA) built with **React 19**, **TypeScript**, **TailwindCSS v4**, and **Vite**. Features a modern, collapsible icon-only sidebar and responsive data tables.
2. **Backend (`/server`)**: A robust REST API server built with **Node.js**, **Express**, and **TypeScript**. Relies on **Drizzle ORM** for database interaction and uses **PGLite** (embedded PostgreSQL in Node.js) for simple, serverless-like data persistence.

When packaged for production, the client SPA is compiled and served directly by the Express backend server as a single lightweight container.

---

## ⚡ Quick Start with Docker Compose

Ensure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Amanbig/ManUp.git
   cd ManUp
   ```

2. **Configure Environment Variables**:
   Create a `.env` file or configure values directly in your container orchestration setup.
   Key environment variables inside `docker-compose.yml`:
   * `MASTER_KEY`: A 32-character hexadecimal key used to encrypt/decrypt secrets.
   * `JWT_SECRET`: Secret token signature key.
   * `PORT`: Server port (default: `8000`).

3. **Start the Platform**:
   ```bash
   docker compose up --build -d
   ```

4. **Access the Web Dashboard**:
   Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## ⚙️ Configuration Parameters

| Variable | Description | Default Value | Required |
| :--- | :--- | :--- | :--- |
| `PORT` | Port the backend server listens on. | `8000` | No |
| `DB_TYPE` | Type of Postgres DB. Choose `PGLITE` or leave blank for external DB. | `PGLITE` | Yes |
| `DB_DIR` | Path to persist SQLite-like files when using `PGLITE`. | `/app/manup` | Only for `PGLITE` |
| `DATABASE_URL` | Connection string to external Postgres instance. | — | Only if `DB_TYPE` !== `PGLITE` |
| `MASTER_KEY` | 32-character hex key for secret encryption. | — | Yes |
| `JWT_SECRET` | Secret key for signing Auth cookies. | — | Yes |

---

## 🛠️ Local Development Setup

To run both client and server locally without Docker:

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Steps

1. **Install Dependencies**:
   From the root directory, install all client and server dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Setup Server Config**:
   Create `server/.env` with the following variables:
   ```env
   PORT=8000
   DB_TYPE=PGLITE
   DB_DIR=./manup_dev
   MASTER_KEY=9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p
   JWT_SECRET=super_secret_jwt_sign_key_manup_2026
   ```

3. **Run Services**:
   - **Start Backend API** (Terminal 1):
     ```bash
     cd server
     npm run dev
     ```
   - **Start Frontend Dev Server** (Terminal 2):
     ```bash
     cd client
     npm run dev
     ```

---

## 📄 License

ManUp is released under the [MIT License](LICENSE). Contributions, bug reports, and pull requests are welcome!
