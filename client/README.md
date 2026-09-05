# ManUp Client Dashboard 🖥️

This directory houses the frontend code for **ManUp**, a premium self-hosted secrets management dashboard. It is a React Single-Page Application (SPA) compiled using Vite and styled with TailwindCSS v4.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (Functional Components, Hooks)
- **Tooling**: Vite (with Hot Module Replacement)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4 (modern utility-first styling with premium color palettes)
- **Icons**: Lucide React
- **Selects / Popovers**: Radix UI Select

---

## 📂 Project Structure

- `src/App.tsx`: Central coordinator managing application state, authentication state, and routing.
- `src/components/layout/`: Reusable global layout elements like `Sidebar.tsx` and `Header.tsx`.
- `src/components/views/`: Isolated dashboard panel views:
  - `ProjectsDashboardView.tsx`: Project cards overview, environment counts, member status, and quick-action modals.
  - `ProjectWorkspaceView.tsx`: Project workspace with tabbed environments, secrets editor, and bulk .env actions.
  - `MembersView.tsx`: Members list and RBAC memberships across organization, projects, and environments.
  - `ApiKeysView.tsx`: Project-scoped and organization-wide API keys management and revocation.
  - `SettingsView.tsx`: Organization and user profile configurations with theme preferences.
- `src/components/modals/`: Decoupled modal dialogs for member invites, project creation, environment configuration, etc.
- `src/index.css`: Global styles, custom scrollbars, typography configurations, and Tailwind directives.
- `public/`: Static assets (logos, images).

---

## ⚡ Development Setup

To run the client locally during development:

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   By default, this spins up the web interface at [http://localhost:5173](http://localhost:5173). The API requests are proxied/targeted at the backend API running at `http://localhost:7780`.

---

## 🏗️ Production Build

To compile static assets for production:

```bash
npm run build
```

This compiles React and TypeScript into optimized CSS and JavaScript inside the `dist/` directory.

_Note: In the final production Docker image, these files are copied into the backend server's environment and served statically at the root path `/`._

---

## 🧪 Linting

To run static linting checks:

```bash
npm run lint
```
