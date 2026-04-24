# iNNkie.com - Premium Link Management Platform

iNNkie is a professional-grade, multi-tenant URL shortening and analytics SaaS platform built for modern marketing teams and developers.

## 🚀 Key Features

*   **Command Center:** High-level workspace analytics with real-time click trajectory charts and geographic heatmaps.
*   **Dynamic Theming:** Full-scale workspace white-labeling. Every button and highlight automatically adopts your workspace's brand color.
*   **Links Hub:** Advanced management with custom aliases, password protection, expiration rules, source tracking (`ui` vs `api`), and tagging.
*   **Multi-Tenancy:** Robust Teams & Workspaces support with full Member Management UI and Role-Based Access Control (RBAC).
*   **Developer Studio:** Self-hosted documentation portal (`/docs`), programmatic API access via workspace-specific keys, and real-time Webhook integrations.
*   **QR Studio:** Professional QR code generation with brand customization, custom logos, and reusable templates.
*   **Unified Notifications:** High-fidelity, workspace-branded transactional emails and an integrated in-app toast notification system.
*   **Blazing Fast Redirects:** High-performance redirection engine with optional Redis caching and immediate Firestore failover.

## 🛠 Tech Stack

### Frontend (Angular 19)
- **Framework:** Angular 19 (Standalone Components).
- **Theming:** Custom dynamic palette engine injected via CSS variables.
- **Styling:** Tailwind CSS.
- **Feedback:** Custom Toast and Modal infrastructure (replacing browser defaults).

### Backend (NestJS 11)
- **Framework:** NestJS.
- **Cache:** Optional Redis (`ioredis`) with graceful degradation.
- **Database:** Firestore (Server-side admin SDK) with lazy-initialization logic.
- **API:** Versioned REST endpoints (`/api/v1`).

### Infrastructure & Monorepo
- **Shared Library:** `@innkie/shared-models` (NPM workspace) for type safety across all layers.
- **Serverless:** Firebase Functions (Node 22) with a unified high-fidelity email template system.
- **CI/CD:** Automated deployment to Google Cloud Run (REST API) and Firebase Hosting (Frontend).

## 📂 Project Structure

- `/`: Angular 19 Frontend.
- `/rest-api/`: NestJS REST API.
- `/functions/`: Firebase Functions (Transactional Emails).
- `/shared-models/`: Shared TypeScript models and interfaces.
- `/scripts/`: Data migration and maintenance utilities.

## 🚦 Getting Started

1.  **Install Dependencies:** `npm install --legacy-peer-deps`
2.  **Start Shared Library:** `cd shared-models && npm run build`
3.  **Start Backend:** `cd rest-api && npm run start:dev`
4.  **Start Frontend:** `npm run start`
