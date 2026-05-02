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
- **`isPersonalWorkspace(id)`:** This utility is critical for identifying individual user accounts. It handles legacy cases where a workspace might be `null`, `'personal'`, or the modern `personal_{userId}` format.
- **Consistent Logic:** Any logic that determines workspace membership or role calculation should live here to ensure identical behavior across the API and Frontend.

### 3. Short URL Constants
- **Source Types:** The `ShortUrl` model defines `source: 'ui' | 'api'`. This must be strictly adhered to for accurate analytics.
- **Short Code Regex:** Centralize any regex used for validating shortcodes or custom aliases here.

## 📂 Development
- **Build:** Run `npm run build` in this directory to generate the `dist/` folder consumed by other modules.
- **Publishing:** This is a private local workspace package. It is linked via `package.json` workspaces.
