# GEMINI.md - iNNkie.com (All-in-One Utility Platform)

This foundational mandate covers the architectural principles and engineering standards for the iNNkie platform.

## 🏛 Project Architecture

iNNkie is a monorepo consisting of:
1.  **Frontend (`/`):** Angular 19 standalone application using SSG (Prerendering) and Tailwind CSS.
2.  **REST API (`/rest-api/`):** NestJS application managing utility logic (URL shortening, image optimization), optional Redis caching, and workspace-aware analytics.
3.  **Shared Library (`/shared-models/`):** The single source of truth for all data interfaces (`ShortUrl`, `AppUser`, `Workspace`, etc.).
4.  **Firebase Functions (`/functions/`):** Background tasks, usage aggregation, and high-fidelity transactional emails.

## 🛠 Engineering Mandates

### 1. UI/UX & Styling
- **Dynamic Theming:** All UI components must use the `primary` color family (e.g., `bg-primary-600`). The `ThemeService` dynamically injects CSS variables based on the active workspace's brand color.
- **Tailwind Only:** No heavy UI libraries. Utilize Tailwind utility classes for all styling.
- **Immersive Design:** Authenticated routes use the `LayoutComponent` shell with a unified sidebar.
- **Toast Notifications:** Never use standard browser `alert()`. Always use `ToastService` for user feedback.
- **Favicon & Web Manifest:** Utilize the RealFaviconGenerator assets in `src/`. The `site.webmanifest` and corresponding `web-app-manifest-*.png` files are the source of truth for PWA and mobile touch icons.

### 2. Workspace & Data Consistency
- **First-Class Personal Workspaces:** Every user has an explicit `personal_{userId}` workspace document. There are no "null" or "virtual" workspaces.
- **DRY Models:** Always import models from `@innkie/shared-models`.
- **Workspace Awareness:** Every operation must be scoped to the `activeWorkspace`. Use `isPersonalWorkspace()` utilities to handle legacy fallback logic where necessary.

### 3. Redirection & Performance
- **Optional Redis:** The redirection flow checks Redis only if `REDIS_URL` is configured. If the variable is missing or the connection fails, the system fails gracefully and transparently to Firestore.
- **Cache Invalidation:** When enabled, any update or deletion of a `ShortUrl` document must invalidate its corresponding Redis cache entry.

### 4. Communication
- **High-Fidelity Emails:** All transactional emails use the unified inline-styled template system in `/functions/src/email/templates`.
- **In-App Feedback:** Complex decisions use the `ConfirmDialogComponent`; simple notifications use `ToastService`.

## 🛠 Developer Standards

### 1. Link Creation & Tracking
- **Source Attribute:** Every `ShortUrl` document must include a `source` field (`'ui' | 'api'`).
- **Centralized Logic:** Always use `ShortenUrlService.createShortUrl()` to ensure consistent preview generation, QR code setup, and analytics initialization.

### 2. Workspace Utilities
- **Identification:** Use `isPersonalWorkspace(id)` from `@innkie/shared-models` (or the API utility) to distinguish between personal accounts and team workspaces.
- **Lazy Initialization:** Expect that a personal workspace might not exist on a user's first interaction; the `WorkspaceService` handles this transparently.

## 📂 Subdirectory Instructions
For detailed guidance on specific modules, refer to:
- **Frontend:** [`src/GEMINI.md`](src/GEMINI.md)
- **REST API:** [`rest-api/GEMINI.md`](rest-api/GEMINI.md)
- **Firebase Functions:** [`functions/GEMINI.md`](functions/GEMINI.md)
- **Shared Models:** [`shared-models/GEMINI.md`](shared-models/GEMINI.md)

## 📂 Deployment & Infrastructure
- **Frontend:** Deployed to Firebase Hosting via GitHub Actions (`prod-deploy-frontend.yml`).
- **REST API:** Containerized NestJS app deployed to Google Cloud Run (`prod-deploy-rest-api.yml`).
- **Functions:** Node.js 22 functions deployed to Firebase Functions (`prod-deploy-firebase.yml`).
- **IAM & Permissions:** Use `scripts/gcp-permission-grant.sh` to initialize necessary service account roles for local development and CI/CD.
- **Analytics Pipeline:** Event-driven architecture where the API/Frontend logs to Firestore, and Cloud Functions aggregate those logs into daily summaries.
