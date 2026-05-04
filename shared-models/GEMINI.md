# GEMINI.md - Shared Models Library

This library is the single source of truth for all data structures and shared utilities used across the iNNkie platform (Frontend, REST API, and Functions).

## 🏛 Architecture

- **Role:** Centralized type definitions and business logic utilities.
- **Consumption:** Every other module in the monorepo must import models from `@innkie/shared-models`.

## 🛠 Engineering Mandates

### 1. Model Integrity
- **No Direct Imports:** Avoid importing models from other workspace directories into `shared-models`. This is a leaf node in the dependency graph.
- **Index Exports:** All public interfaces and utilities must be exported via `src/index.ts`.
- **Typing:** Use strict TypeScript interfaces. Utilize `Firebase-safe` types (like `Timestamp` or serialized dates) to ensure compatibility between Frontend (Angular) and Backend (NestJS/Functions).

### 2. Workspace Utilities (`src/workspace.utils.ts`)
- **`isPersonalWorkspace(id)`**: Critical for identifying individual user accounts. Handles legacy `null`, `'personal'`, or `personal_{userId}` formats.
- **`isTeamWorkspace(id)`**: Identifies if a workspace is a collaborative team environment.
- **`isLinkInWorkspace(link, workspace)`**: The authoritative logic for determining if a link should be visible in the current workspace context, including legacy fallback for personal links.
- **Consistent Logic**: Any logic determining workspace membership or role calculation MUST live here to ensure identical behavior across the API and Frontend.

### 3. Short URL Constants
- **Source Types:** The `ShortUrl` model defines `source: 'ui' | 'api'`. This must be strictly adhered to for accurate analytics.
- **Short Code Regex:** Centralize any regex used for validating shortcodes or custom aliases here.

## 📂 Development
- **Build:** Run `npm run build` in this directory to generate the `dist/` folder consumed by other modules.
- **Publishing:** This is a private local workspace package. It is linked via `package.json` workspaces.
