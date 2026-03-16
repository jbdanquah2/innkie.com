# GEMINI.md - iNNkie.com (URL Shortener)

This project is a full-stack URL shortening and analytics platform built with Angular, NestJS, and Firebase.

## Project Architecture

The project is organized as a monorepo with three primary components:

### 1. Frontend (`/`)
- **Framework:** Angular 19.2.x (Standalone Components).
- **UI Library:** Angular Material 19.2.x.
- **State/Data:** Firebase SDK (`@angular/fire`).
- **Features:**
  - Short URL creation and management dashboard.
  - Analytics visualization using Leaflet (maps) and FontAwesome icons.
  - User authentication and settings.
  - QR code generation.
  - Long URL preview.

### 2. NestJS API (`/rest-api/`)
- **Framework:** NestJS 11.x.
- **Core Responsibility:** Heavy logic, URL shortening, redirection processing, and advanced analytics collection.
- **Database:** Firestore (using `@google-cloud/firestore` and `firebase-admin`).
- **Cache:** Redis (`ioredis`).
- **Logic:**
  - User agent parsing (`ua-parser-js`) for analytics.
  - QR code generation (`qrcode`).
  - Web scraping for URL metadata/previews (`cheerio`).
  - Emailing via `nodemailer`.

### 3. Firebase Functions (`/functions/`)
- **Runtime:** Node.js 22.
- **Core Responsibility:** Background tasks, triggers, and transactional emails.
- **Key Tasks:**
  - Welcome emails on user sign-up.
  - Shortened URL notifications.
  - Database cleanup or complex cross-collection operations.

## Engineering Mandates

### 1. Coding Standards
- **Angular:** Use **Standalone Components** only. Follow strict typing (`strict: true` in `tsconfig.json`). Adhere to Angular's official style guide.
- **NestJS:** Use standard NestJS patterns (Controllers, Services, Modules). Ensure proper dependency injection and DTO validation.
- **Firebase:** Respect `firestore.rules` and `storage.rules`. Use `firebase-admin` for privileged server-side operations.
- **Environment Variables:** Strictly manage configuration via `environment.ts` (Frontend), Firebase Secrets (Functions), and `@nestjs/config` (API).

### 2. Testing Requirements
- **Frontend:** Add unit tests for every new component/service using Jasmine/Karma.
- **API:** Add unit tests for controllers/services and E2E tests for core endpoints using Jest.
- **Functions:** Use `firebase-functions-test` for critical trigger logic.

### 3. CI/CD & Deployment
- GitHub Actions workflows are located in `.github/workflows/`.
- Deployments are split: `prod-deploy-frontend.yml`, `prod-deploy-rest-api.yml`, and `prod-deploy-firebase.yml`.

### 4. Git & Commits
- Use descriptive, concise commit messages (e.g., `feat(api): add redis caching to redirect endpoint`).
- Never commit secrets or service account keys (`rest-api/service-account/` is sensitive).

## Common Workflows

### Adding a Feature
1. **Research:** Identify which layer(s) need changes (Frontend UI, API endpoint, or Function trigger).
2. **Implementation:** Start with the backend (API/Functions) and verify with tests. Then update the Frontend.
3. **Validation:** Run `ng test` (root) and `npm run test` (`/rest-api/`).

### Fixing a Bug
1. **Reproduce:** Create a test case that fails.
2. **Fix:** Apply the fix in the relevant component.
3. **Validate:** Run the regression test and verify the fix manually.

## Tech Stack Overview
- **Languages:** TypeScript (Strict mode).
- **Frontend:** Angular 19, Angular Material, Leaflet, FontAwesome.
- **Backend:** NestJS, Firebase Admin, Redis, Cheerio, UA-Parser.
- **Serverless:** Firebase Functions (Node 22).
- **Database/Auth/Hosting:** Firebase (Firestore, Auth, Storage, Hosting).
