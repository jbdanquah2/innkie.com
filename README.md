# iNNkie.com - Premium Link Management Platform

iNNkie is a professional-grade, multi-tenant URL shortening and analytics SaaS platform built for modern marketing teams and developers.

## 🚀 Key Features

*   **Command Center:** High-level workspace analytics with real-time click trajectory charts.
*   **Links Hub:** Advanced management with custom aliases, password protection, expiration rules, and tagging.
*   **Multi-Tenancy:** Robust Teams & Workspaces support with Role-Based Access Control (RBAC).
*   **Developer API:** Workspace-specific API keys for programmatic link creation.
*   **QR Studio:** Advanced QR code generation with brand customization and templates.
*   **Blazing Fast Redirects:** Powered by a Redis caching layer for near-zero latency.

## 🛠 Tech Stack

### Frontend (Angular 19)
- **Framework:** Angular 19 (Standalone Components).
- **Styling:** Tailwind CSS (Optimized for performance).
- **Charts:** Chart.js with `ng2-charts`.
- **Maps:** Leaflet for geographic visitor data.

### Backend (NestJS 11)
- **Framework:** NestJS.
- **Cache:** Redis (`ioredis`) for high-performance redirection.
- **Database:** Firestore (Server-side admin SDK).
- **Analytics:** Geolocation mapping and User-Agent parsing.

### Infrastructure & Monorepo
- **Shared Library:** `@innkie/shared-models` (NPM workspace) for DRY architecture.
- **Serverless:** Firebase Functions for transactional emails.
- **CI/CD:** GitHub Actions for automated deployment to Firebase Hosting and Cloud Run.

## 📂 Project Structure

- `/`: Angular 19 Frontend.
- `/rest-api/`: NestJS REST API.
- `/functions/`: Firebase Functions (Transactional Emails).
- `/shared-models/`: Shared TypeScript models and interfaces.

## 🚦 Getting Started

1.  **Install Dependencies:** `npm install --legacy-peer-deps`
2.  **Start Shared Library:** `cd shared-models && npm run build`
3.  **Start Backend:** `cd rest-api && npm run start:dev`
4.  **Start Frontend:** `npm run start`
