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
- **Browser-Only Libraries:** Libraries like `qr-code-styling` and `jszip` often depend on browser APIs (`window`, `document`). ALWAYS wrap their initialization and usage in `if (isPlatformBrowser(this.platformId))` to prevent ReferenceErrors during SSG/prerendering.
- **Monetization:** Use `AdSlotComponent` to place ads. It automatically handles the `adsbygoogle` push logic and respects the `AdService.showAds$` state.

### 4. Tools Hub & Platform Metrics
- **Integrated Pro Utilities**: The `/tools` route provides access to a professional suite:
    - **QR Studio**: Advanced branded QR generation using `qr-code-styling`.
    - **Image Optimizer**: Batch compression and resizing with `jszip` for bulk exports.
    - **JSON Formatter**: Interactive tree exploration and TypeScript interface generation.
    - **Converters**: Standalone high-performance converters (SVG to PNG, PNG to JPEG, CSV to JSON).
    - **Document Tools**: PDF to Image and Image to PDF extraction and merging.
- **Navigation Flow**: Tools utilize a "context-aware" header. If a user is logged in, the navigation should point back to the **Dashboard**; if a guest, it points back to the **Generator** or **Tools Hub**.
- **Event Logging**: Every interaction with these tools must be logged via `AnalyticsService.logPlatformEvent()` or `PlatformMetricsService.logToolUsage()`. Ensure new tools are added to the `PlatformToolType` in `shared-models`.

### 5. SEO & Meta Tags
- **SeoService:** Centralize all meta tag updates in `SeoService`. It handles Open Graph, Twitter, and JSON-LD Schema.
- **Structured Data (JSON-LD):** Components must define a local `schema` array and pass it to `seo.updateSeo()`. Use `SoftwareApplication` for individual tools and `CollectionPage` for the Tools Hub. Use `seo.getBreadcrumbSchema()` to generate consistent breadcrumb structured data.
- **Canonical URLs:** Ensure every page has a canonical URL set via `SeoService`.

## 📂 Directory Structure
- `app/shared/services/`: Core business logic and Firebase integration.
- `app/shared/guards/`: Auth and workspace access control.
- `app/shared/utils/`: Pure utility functions (URL parsing, QR generation).
- `assets/`: Static assets, logos, and geo-data.
