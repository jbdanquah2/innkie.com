# GEMINI.md - iNNkie.com (Premium Link Management)

This foundational mandate covers the architectural principles and engineering standards for the iNNkie platform.

## 🏛 Project Architecture

iNNkie is a monorepo consisting of:
1.  **Frontend (`/`):** Angular 19 standalone application using Tailwind CSS.
2.  **REST API (`/rest-api/`):** NestJS application managing core logic, optional Redis caching, and workspace-aware analytics.
3.  **Shared Library (`/shared-models/`):** The single source of truth for all data interfaces (`ShortUrl`, `AppUser`, `Workspace`, etc.).
4.  **Firebase Functions (`/functions/`):** Background tasks and high-fidelity transactional emails.

## 🛠 Engineering Mandates

### 1. UI/UX & Styling
- **Dynamic Theming:** All UI components must use the `primary` color family (e.g., `bg-primary-600`). The `ThemeService` dynamically injects CSS variables based on the active workspace's brand color.
- **Tailwind Only:** No heavy UI libraries. Utilize Tailwind utility classes for all styling.
- **Immersive Design:** Authenticated routes use the `LayoutComponent` shell with a unified sidebar.
- **Toast Notifications:** Never use standard browser `alert()`. Always use `ToastService` for user feedback.

### 2. Workspace & Data Consistency
- **First-Class Personal Workspaces:** Every user has an explicit `personal_{userId}` workspace document. There are no "null" or "virtual" workspaces.
- **DRY Models:** Always import models from `@innkie/shared-models`.
- **Workspace Awareness:** Every operation must be scoped to the `activeWorkspace`. Use `isPersonalWorkspace()` utilities to handle legacy fallback logic where necessary.

### 3. Redirection & Performance
- **Optional Redis:** rediction flow checks Redis only if `REDIS_URL` is configured. The system must fail gracefully to Firestore if Redis is unavailable.
- **Automatic Invalidation:** Any update to a `ShortUrl` document must invalidate its corresponding Redis cache entry.

### 4. Communication
- **High-Fidelity Emails:** All transactional emails use the unified inline-styled template system in `/functions/src/email/templates`.
- **In-App Feedback:** Complex decisions use the `ConfirmDialogComponent`; simple notifications use `ToastService`.

## 📂 Deployment
- **Frontend:** Deployed to Firebase Hosting.
- **REST API:** Deployed to Google Cloud Run (Containerized, binding to port 8080).
- **Functions:** Deployed to Firebase Functions (Node 22).
