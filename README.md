# iNNkie.com - All-in-One Utility Platform

iNNkie is a professional-grade, multi-tenant utility and productivity SaaS platform built for modern digital creators, marketing teams, and developers.

## 🚀 Key Features

*   **Free Utilities Hub:** A growing suite of 100% private, browser-side tools for modern digital teams.
    *   **Media & Image:** Image Compressor, Resizer & Cropper, SVG to PNG, PNG to JPEG.
    *   **Document Utilities:** PDF to Image, Image to PDF.
    *   **Links & Web:** High-performance URL Shortener, Branded QR Studio, QR Generator, UTM Builder.
    *   **Developer Utilities:** JSON Formatter, JWT Decoder, CSV <> JSON Converter, Base64 Encoder/Decoder.
*   **Command Center:** High-level workspace analytics with real-time usage metrics, click trajectory charts, and geographic heatmaps.
*   **Dynamic Theming:** Full-scale workspace white-labeling. Every tool and dashboard element automatically adopts your workspace's brand color.
*   **Link Management:** Advanced shortening with custom aliases, password protection, expiration rules, source tracking (`ui` vs `api`), and tagging.
*   **Multi-Tenancy:** Robust Teams & Workspaces support with full Member Management UI and Role-Based Access Control (RBAC).
*   **Developer Studio:** Programmatic API access via workspace-specific keys, and real-time Webhook integrations.
*   **Unified Notifications:** High-fidelity, workspace-branded transactional emails and an integrated in-app toast notification system.
*   **Blazing Fast Performance:** Optimized engine with optional Redis caching and immediate Firestore failover.

## 🛠 Tech Stack

### Frontend (Angular 19)
- **Framework:** Angular 19 (Standalone Components).
- **Architecture:** SSG (Prerendering) + CSR.
- **Theming:** Custom dynamic palette engine injected via CSS variables.
- **Styling:** Tailwind CSS 4.x.
- **SEO:** Robust JSON-LD @graph schema integration for all tools.

### Backend (NestJS 11)
- **Framework:** NestJS 11.x.
- **Cache:** Optional Redis (`ioredis`) with graceful degradation.
- **Database:** Firestore (Server-side admin SDK) with lazy-initialization logic.
- **API:** Versioned REST endpoints (`/api/v1`).

### Infrastructure & Monorepo
- **Shared Library:** `@innkie/shared-models` (NPM workspace) for type safety across all layers.
- **Serverless:** Firebase Functions (Node 22) with a unified high-fidelity email template system.
- **CI/CD:** Automated deployment via GitHub Actions to Google Cloud Run (REST API) and Firebase Hosting (Frontend).

## 📂 Project Structure

- `/`: Angular 19 Frontend.
- `/rest-api/`: NestJS REST API.
- `/functions/`: Firebase Functions (Transactional Emails & Aggregators).
- `/shared-models/`: Shared TypeScript models and interfaces.
- `/scripts/`: Data migration and maintenance utilities.

## 🚦 Getting Started

1.  **Install Dependencies:** `npm install --legacy-peer-deps`
2.  **Start Shared Library:** `cd shared-models && npm run build`
3.  **Configure Environment:** 
    - Create a `.env` file in `/rest-api/` with `BASE_URL`, `FIREBASE_PROJECT_ID`, and optionally `REDIS_URL`.
    - Ensure a Firebase Service Account key is present (or use ADC if running locally with `gcloud`).
4.  **Start Backend:** `cd rest-api && npm run start:dev`
5.  **Start Frontend:** `npm run start`
