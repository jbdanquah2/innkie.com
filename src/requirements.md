# 📋 Frontend Requirements – URL Shortener

## Always, for each component, create .ts, .html, .scss files.

## All components should be standalone.

## 1. General
- Built with **Angular** (latest stable).
- Use **standalone components**.
- Integrate with **AngularFire** for Firebase Authentication + Firestore.
- Ensure **responsive design** (desktop, tablet, mobile).
- Provide **good UX**: minimal clicks, clear feedback, and error handling.

---

## 2. Core Features

### 🔗 URL Shortening
- Input field to enter a **long URL**.
- Button to generate a **short URL**.
- Display generated short URL with options:
  - Copy to clipboard
  - Open in new tab
  - Share (social/email)

### 📊 Dashboard (authenticated users)
- List of user’s shortened URLs.
- Show:
  - Original URL
  - Short URL
  - Click count
  - Date created
- Actions:
  - Copy short URL
  - Delete URL
  - View analytics (optional MVP+)

### 📈 Analytics (optional)
- Click trends over time.
- Top countries (from backend logs).
- Devices/browsers.

---

## 3. Authentication & User Management
- **Firebase Authentication** integration.
- Supported login methods:
  - Email + Password
  - Google OAuth (optional)
- Routes:
  - `/login` → login/register
  - `/dashboard` → requires auth
  - `/` → public homepage

---

## 4. Navigation & Layout
- **Top Menu (shared)**:
  - Logo / App name
  - Links: Home, Dashboard, Login/Logout
- **Side Menu (dashboard)**:
  - Links: My URLs, Analytics, Settings
- **Footer (shared)**:
  - Copyright
  - About / Privacy Policy links

---

## 5. UI/UX
- Use a **UI library** (Angular Material or Tailwind).
- Provide **loading indicators** for API calls.
- Provide **snackbar/toast messages** for success/errors.
- Responsive design:
  - Mobile: Collapse menus into hamburger
  - Desktop: Persistent side menu for dashboard

---

## 6. Security
- Validate input URLs (must start with `http://` or `https://`).
- Reject suspicious inputs (e.g., `javascript:`).
- Guard protected routes (`/dashboard`).
- Sanitize displayed data (prevent XSS).

---

## 7. Performance
- Use **lazy-loaded routes** for dashboard/analytics.
- Use **onPush change detection** for shared components.
- Cache user data locally where possible.

---

## 8. Integration
- Communicate with backend NestJS API:
  - `POST /shorten` → shorten URL
  - `GET /user/urls` → get user’s URLs
  - `DELETE /url/:id` → delete a short URL
  - `GET /analytics/:shortCode` → analytics data
- Serve Angular frontend via **Firebase Hosting**.

---

## 9. Nice-to-Haves
- Dark mode toggle.
- QR code generation per short URL.
- Custom aliases (`/my-link`).
- Expiry dates for links.
- Bulk import.

---

# 🏠 Home Page Requirements

## 1. Purpose
- Quick, public-facing interface for shortening URLs.
- Communicate the **value proposition**.
- Encourage users to sign up/login for advanced features.

---

## 2. Layout & Structure

### Hero Section
- App name + tagline (e.g., *“Shorten your links. Share them smarter.”*).
- Input field + button for URL shortening.
- Validation: must be valid URL.
- Result display:
  - Short URL
  - Copy button
  - Open button
  - Share (optional MVP+)

### Features Section
- 2–3 highlights with icons:
  - “Fast and reliable link shortening”
  - “Track clicks with a free account”
  - “Custom links and QR codes (coming soon)”

### Call-to-Action
- Prominent **Sign Up / Log In** buttons.
- Note: *“Get a dashboard to manage and track your links.”*

### Footer
- About / Privacy / Terms / Contact
- Copyright

---

## 3. UI/UX Behavior
- **Responsive**:
  - Desktop: Centered input box with prominent button
  - Mobile: Stacked input/button
- **Feedback**:
  - Spinner while shortening
  - Snackbar/toast for success/error
- **Copy-to-clipboard** support
- **Error messages** for invalid or failed shortening

---

## 4. Navigation
- Top menu:
  - Logo → `/`
  - Features → scroll
  - Login → `/login`
  - Sign Up → `/signup`
- If logged in:
  - Replace login/signup with **Dashboard**

---

## 5. Security
- Sanitize inputs (URLs only).
- Prevent abuse:
  - Optional: rate limiting
  - Optional: CAPTCHA

---

## 6. Future Enhancements
- Attractive illustrations/animations.
- Showcase popular integrations/domains.
- “Try without account” mode.
- Multi-language support.

---

# 🔐 Login Page Requirements

## 1. Purpose
- Allow users to **sign in** or **register**.
- Provide a smooth, secure login flow with Firebase Authentication.

---

## 2. Layout & Structure
- **Form fields**:
  - Email
  - Password
- **Buttons**:
  - Login
  - Register (toggle or link)
  - “Continue with Google” (optional)
- **Links**:
  - Forgot Password → reset flow
- **Error/success feedback**:
  - Invalid credentials
  - Account created successfully

---

## 3. UX Behavior
- **Responsive** design for all devices.
- Show **spinner/loader** on submit.
- **Snackbar/toast** for errors (e.g., “Invalid password”) and success.
- Autofocus on email input for convenience.
- Redirect user to **Dashboard** after successful login.

---

## 4. Security
- Use **Firebase Auth SDK** (AngularFire).
- Enforce **strong passwords** on signup.
- Hide/show password toggle.
- Prevent brute force (Firebase rules handle rate limits).
- Sanitize all inputs.

---

## 5. Navigation
- If authenticated → redirect to `/dashboard`.
- If not → stay on `/login`.
- Provide **back to Home** link.
- After registration/login → persist session with Firebase.

---

## 6. Future Enhancements
- Support more providers (Facebook, GitHub, Apple).
- Two-factor authentication (2FA).
- Passwordless login via email link.
