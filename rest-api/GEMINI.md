# GEMINI.md - NestJS REST API

This is the core backend service for iNNkie.com, responsible for URL shortening logic, workspace management, and high-performance redirection.

## Architecture & Responsibilities

- **Framework:** NestJS 11.x
- **Primary Database:** Firestore.
- **Caching:** Optional Redis (`ioredis`). If `REDIS_URL` is not provided, the system operates in "Disabled Caching" mode without crashing.
- **Key Modules:**
  - **Workspace Management:** Handles RBAC, member invites, and branding.
  - **Lazy Initialization:** The `WorkspaceService` automatically creates a user's Personal Workspace (`personal_{userId}`) upon their first request if it doesn't exist.
  - **Auth:** Manages custom Firebase claims and JWT creation.
  - **URL:** Handles shortening with source tracking (`ui` vs `api`) and password protection.

## Technical Integration Details

### 1. Workspace Utility (`src/utils/workspace.utils.ts`)
- Always use `isPersonalWorkspace()` to identify individual accounts.
- The system supports legacy fallback for links with `workspaceId: null` or `'personal'`.

### 2. API Versioning
- Core workspace management is located under `/api/v1/workspaces`.
- Public API endpoints are located under `/api/v1/links`.

### 3. Redirection & Analytics
- **Source Tracking:** Every link now stores its creation origin (`source`) for developer analytics.
- **Resilience:** Redirection logic must attempt Redis lookup but immediately fallback to Firestore on any network error or if Redis is disabled.

## Environment Configuration
- `SERVICE_ACCOUNT_FILE_NAME`: Optional in production (Cloud Run uses ADC).
- `PORT`: Server port (Production uses 8080).
- `REDIS_URL`: If missing, caching is disabled gracefully.

## Development & Standards

### Coding Style
- **Namespace Imports:** When using shared models in controllers with decorators, use `import * as Models from '@innkie/shared-models'` to avoid `TS1272` metadata issues.
- **Logging:** Use `console.log` or `loglevel`. Ensure critical path operations (link creation, workspace init) are well-logged.

### Deployment
- **Docker:** Optimized multi-stage build. The entry point is `dist/src/main.js`.
- **Cloud Run:** Securely configured to use Workload Identity (ADC) for Firebase access.
