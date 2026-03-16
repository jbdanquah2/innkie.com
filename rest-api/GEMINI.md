# GEMINI.md - NestJS REST API

This is the core backend service for iNNkie.com, responsible for URL shortening logic, high-performance redirection, analytics collection, and metadata scraping.

## Architecture & Responsibilities

- **Framework:** NestJS 11.x
- **Primary Database:** Firestore (via `firebase-admin` and `@google-cloud/firestore`).
- **Caching:** Redis (`ioredis`) is configured for URL preview and redirect caching (currently partially implemented).
- **Key Modules:**
  - **Auth:** Manages custom Firebase claims and JWT creation.
  - **URL:** Handles shortening, redirection logic (with password protection), and long URL previews.
  - **Models:** Shared interfaces for `ShortUrl`, `ClickEvent`, and `AppUser`.

## Technical Integration Details

### 1. Firebase Service (`src/services/firebase.service.ts`)
- Automatically switches between local service account file (`service-account/*.json`) for development and **Application Default Credentials (Workload Identity)** for production (Cloud Run).
- Provides convenience wrappers for Firestore operations.

### 2. Redirection & Analytics (`src/url/redirect-to-long-url.controller.ts`)
- **Geolocation:** Uses `ipapi.co` for IP-to-location mapping.
- **User Agent:** Uses `ua-parser-js` to extract browser and device information.
- **Uniqueness:** Tracks `uniqueVisitors` by IP and short code to provide accurate analytics.
- **Security:** Supports password-protected URLs using SHA-256 hashing.

### 3. URL Preview (`src/services/long-url-preview.service.ts`)
- Scrapes metadata (OpenGraph tags) using `cheerio` and `node-fetch`.
- Includes favicon discovery logic.

## Environment Configuration

Managed via `@nestjs/config` with Joi validation. Key variables:
- `SERVICE_ACCOUNT_FILE_NAME`: Name of the JSON key for local dev.
- `GOOGLE_CLOUD_PROJECT`: Firebase project ID.
- `PORT`: Server port (default: 5000, Cloud Run uses 8080).
- `PRODUCTION`: Boolean flag to toggle URL generation behavior.
- `BASE_URL`: The root domain for shortened links.

## Development & Standards

### Coding Style
- **Controllers:** Keep thin; delegate logic to Services.
- **Logging:** Use `loglevel`. Prefer `log.debug` for trace-level info and `log.info`/`log.error` for system status.
- **Validation:** Use Joi schemas in `AppModule` and class-validator (where applicable) for DTOs.

### Testing
- **Unit Tests:** `npm run test` (runs `*.spec.ts` files).
- **E2E Tests:** `npm run test:e2e` (runs `test/*.e2e-spec.ts` using Supertest).
- **Validation:** Always verify the redirection logic and analytics incrementing when modifying the `RedirectToLongUrlController`.

## Deployment
- **Docker:** A `Dockerfile` is provided for containerization.
- **Cloud Run:** Optimized for deployment on Google Cloud Run (binds to `0.0.0.0`).
- **CI/CD:** Triggered via `.github/workflows/prod-deploy-rest-api.yml` in the project root.
