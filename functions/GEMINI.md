# GEMINI.md - Firebase Functions

This directory contains the serverless background tasks and transactional email logic for iNNkie.com.

## Architecture & Responsibilities

- **Runtime:** Node.js 22 (as defined in `package.json` and `engines`).
- **Framework:** Firebase Functions v2 (using `firebase-functions/v2`).
- **Core Responsibility:** 
  - Automated transactional emails triggered by Firestore events.
  - On-demand email sending via Callable functions.
  - Background database maintenance (where applicable).

## Key Components

### 1. Triggers (`src/index.ts`)
- **`onUserCreatedSendEmail`:** Triggered when a new document is created in `users/{userId}`. Sends a welcome email.
- **`onUrlCreatedSendEmail`:** Triggered when a new document is created in `shortUrls/{shortCode}`. Notifies the user that their link is ready.
- **Callables:** `sendShortenedEmail` and `sendWelcomeEmail` for direct invocation from the frontend or API.

### 2. Email Service (`src/email/`)
- **Transporter:** Uses `nodemailer` with a dedicated Gmail service configuration.
- **Handlers:** Logic is decoupled into handlers (e.g., `on-user-created-send-email.ts`) to keep the main entry point clean.
- **Templates:** Inline HTML templates are used for email bodies, styled with `Inter/Roboto` fonts and brand colors.

### 3. Secrets & Config (`src/config/`)
- **Secrets:** Gmail credentials (`gmailUser`, `gmailPass`) are managed via Firebase Secrets (`defineSecret`).
- **Admin SDK:** Initialized as a singleton in `firebaseAdmin.ts` to prevent multiple initialization errors during hot reloads or high concurrency.

### 4. Structured Logging (`src/utils/logger.ts`)
- Implements a custom JSON-based logger.
- **Format:** `{ level, message, functionName, meta, timestamp }`.
- **Usage:** Always provide the `functionName` as the second argument to ensure logs are easily filterable in the Google Cloud Console.

## Development & Deployment

### Local Development
1. **Build:** `npm run build` (transpiles TS to `lib/`).
2. **Emulate:** `npm run serve` (starts the Firebase Functions emulator).
3. **Secrets:** For local testing, ensure secrets are available in `.secret.local` or provided via the emulator UI.

### Deployment
- **Command:** `npm run deploy` (or `firebase deploy --only functions`).
- **Environment:** Deployments are managed via GitHub Actions (`prod-deploy-firebase.yml`).

## Standards
- **Strict Typing:** Always use interfaces for event data (e.g., `UserData`).
- **Error Handling:** Wrap all email sending logic in try-catch blocks and log errors with full metadata.
- **Performance:** Keep cold starts low by minimizing heavy imports outside the function scope.
