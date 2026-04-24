# GEMINI.md - Firebase Functions

This directory contains the serverless background tasks and modernized transactional email logic for iNNkie.com.

## Architecture & Responsibilities

- **Runtime:** Node.js 22.
- **Framework:** Firebase Functions v2.
- **Core Responsibility:** 
  - Automated transactional emails triggered by Firestore events.
  - On-demand email sending via Callable functions.
  - High-fidelity communication with workspace-aware branding.

## Key Components

### 1. Template System (`src/email/templates/`)
- **Unified Logic:** All HTML generation is centralized in shared template functions (e.g., `getShortenedLinkTemplate`).
- **Compatibility:** Templates use simplified `div` wrappers and extensive inline styles to ensure perfect rendering across all major email clients.
- **Workspace Aware:** Templates accept `brandColor` and `brandName` parameters to automatically white-label notifications.

### 2. Triggers (`src/index.ts`)
- **`onUrlShortenedSendEmail`:** Automatically triggers when a user shortens a link, sending a branded confirmation with analytics links.
- **`onUserCreatedSendEmail`:** Sends a modernized welcome email upon new user registration.

### 3. Email Handlers (`src/email/handlers/`)
- Decoupled logic ensures that data fetching (Firestore lookups for branding) is separated from transport logic (`nodemailer`).

## Development & Deployment

### Local Development
1. **Build:** `npm run build` (transpiles TS to `lib/`).
2. **Standardization:** Ensure `skipLibCheck: true` is set in `tsconfig.json` to prevent conflicts between Jest and Jasmine type definitions.

### Standards
- **Strict User Preference:** Always check `userData.notificationDisabled` before sending transactional emails.
- **Performance:** Keep cold starts low by minimizing heavy imports outside the function scope.
