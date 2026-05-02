# GEMINI.md - Frontend (Angular)

This directory contains the Angular 19 standalone application for iNNkie.com.

## 🏛 Frontend Architecture

- **Framework:** Angular 19 (Standalone Components).
- **Styling:** Tailwind CSS 4.x.
- **State Management:** RxJS BehaviorSubjects in singleton services.
- **Architecture:** SSG (Static Site Generation / Prerendering) + CSR (Client-Side Rendering). We do not use dynamic runtime SSR.

## 🛠 Engineering Mandates

### 1. SSG (Prerendering) & Firebase Stability
- **Injection Context:** ALWAYS wrap Firebase API calls (e.g., `getDoc`, `onSnapshot`) in `runInInjectionContext(this.injector, ...)` if they are called inside asynchronous blocks or outside the constructor/init lifecycle. This is critical for the prerendering engine to complete successfully.
- **Zone Awareness during Prerendering:** On the "server" (during build-time prerendering), run long-running or potentially slow Firebase calls (like initial stats fetching) inside `this.ngZone.runOutsideAngular(() => ...)` to prevent blocking the build process and causing timeouts.
- **Hydration:** Utilize `provideClientHydration(withEventReplay())`. Since we use SSG, ensure the prerendered HTML matches the initial client state to avoid "flickering" or layout shifts during hydration.

### 2. Auth & Zone Management
- **Firebase Callbacks:** Firebase Auth callbacks (`authState`, `onAuthStateChanged`) often run outside the Angular Zone. ALWAYS wrap state updates (e.g., `this._user$.next(...)`) in `this.ngZone.run(() => ...)` to ensure change detection is triggered correctly.
- **Auth Flickering:** Use a `userReady$` BehaviorSubject to track when the initial auth state has been determined. Hide auth-dependent UI (like Login/Sign up buttons in the top menu) using `*ngIf="userReady$ | async"` to avoid flickering guest UI for authenticated users.

### 3. UI & Components
- **Favicons & PWA:** The project uses a professional favicon set from RealFaviconGenerator. The `src/site.webmanifest` is the source of truth for PWA icons (`web-app-manifest-*.png`).
- **Logo Usage:** Use the `LogoComponent` for all branding. It uses the optimized `src/assets/logos/logo.png` asset.
- **Toasts:** Use `ToastService` for all user notifications. Never use `alert()`.

### 4. SEO & Meta Tags
- **SeoService:** Centralize all meta tag updates in `SeoService`. It handles Open Graph, Twitter, and JSON-LD Schema.
- **Canonical URLs:** Ensure every page has a canonical URL set via `SeoService`.

## 📂 Directory Structure
- `app/shared/services/`: Core business logic and Firebase integration.
- `app/shared/guards/`: Auth and workspace access control.
- `app/shared/utils/`: Pure utility functions (URL parsing, QR generation).
- `assets/`: Static assets, logos, and geo-data.
