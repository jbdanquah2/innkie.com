# GEMINI.md - iNNkie.com (Premium Link Management)

This foundational mandate covers the architectural principles and engineering standards for the iNNkie platform.

## 🏛 Project Architecture

iNNkie is a monorepo consisting of:
1.  **Frontend (`/`):** Angular 19 standalone application using Tailwind CSS. It uses an immersive, header-less dashboard shell for authenticated users.
2.  **REST API (`/rest-api/`):** NestJS application managing core logic, Redis caching, and workspace-aware analytics.
3.  **Shared Library (`/shared-models/`):** The single source of truth for all data interfaces (`ShortUrl`, `AppUser`, `Workspace`, etc.).
4.  **Firebase Functions (`/functions/`):** Background tasks and transactional emails.

## 🛠 Engineering Mandates

### 1. UI/UX & Styling
- **Tailwind Only:** Do not use heavy UI libraries like Angular Material. Utilize Tailwind CSS utility classes for all styling.
- **Immersive Design:** Authenticated routes must use the `LayoutComponent` shell, which features a unified sidebar and no top header.
- **Performance:** **Avoid heavy CSS utilities** such as `blur`, `backdrop-blur`, or excessive large shadows that degrade browser performance.

### 2. Data Consistency
- **DRY Models:** Always import models from `@innkie/shared-models`. Never duplicate interfaces across projects.
- **Workspace Awareness:** Every data operation in the dashboard must be scoped to the `activeWorkspace` provided by the `WorkspaceService`.

### 3. Redirection & Performance
- **Redis First:** The redirection flow must always check Redis before falling back to Firestore.
- **Automatic Invalidation:** Any update or delete to a `ShortUrl` document in `FirebaseService` must automatically invalidate its corresponding Redis cache entry.

### 4. Testing
- **Frontend:** New components require Tailwind-specific responsiveness tests.
- **Backend:** Every new API endpoint (especially those in `WorkspaceController` or `PublicApiController`) must have unit and e2e tests.

## 📂 Deployment
- Deployments are managed via GitHub Actions.
- **Frontend:** Deployed to Firebase Hosting.
- **REST API:** Deployed to Google Cloud Run (Containerized).
- **Functions:** Deployed to Firebase Functions (Node 22).
