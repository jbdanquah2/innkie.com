# iNNkie web (Next.js, static export)

Replaces the Angular app in `../src`. Static export (`output: 'export'`, `trailingSlash: true`) served by Firebase Hosting;
the NestJS API, Cloud Functions and `shared-models` are unchanged.

## Commands
| | |
|---|---|
| `npm run dev` | dev server on :4300 (`/r/<code>` and `/dashboard/details/<code>` need `?code=<code>` here, see below) |
| `npm run build` | static export to `out/` |
| `npm run check:routes` | every route in `scripts/expected-routes.txt` + every sitemap URL must exist as a file in `out/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run serve` | serve `out/` locally with the same rewrites as `firebase.json` (`/r/**`, `/dashboard/details/**`) |

Config lives in `.env.development` / `.env.production` (public Firebase web config, API/app URLs; nothing secret).
**Never test write actions against a production build you don't control**: tool-usage events and link creation hit `api.innkie.com`.

## Why some routes are one shell page
Short links live at `/:shortCode` (served by Cloud Run), so every real page must be a real file. Codes are not known at build time,
so `/r/<code>/` and `/dashboard/details/<code>/` are single pre-rendered shells that read the code from the URL
(`firebase.json` rewrites `/r/**` and `/dashboard/details/**` to them).

## Deploying
`web/firebase.json` is a complete hosting config for `out/` (it does **not** change the root `firebase.json`, which still serves Angular).

1. **Preview first** (no change to the live site):
   `cd web && npm run build && firebase hosting:channel:deploy preview --expires 7d`
   or run the **Deploy Web (Next.js)** workflow (channel defaults to `preview`).
2. **Cutover** (when the preview is signed off):
   - replace the root `firebase.json` `hosting` block with `web/firebase.json`'s (public `web/out`),
   - point `prod-deploy-frontend.yml` at `web/` (or just use `deploy-web.yml` with channel `live`),
   - delete the Angular app (`src/`, `angular.json`, `tsconfig.*.json`, Angular deps, `scripts/generate-sitemap.js`),
   - `git rm --cached` `.firebase/` and `firebase-debug.log` and add them to `.gitignore`.
3. **Rollback**: Firebase console -> Hosting -> release history -> roll back to the Angular release (or `firebase hosting:rollback`).

## Backend prerequisites (found while testing against production)
- **Deploy the pending `rest-api` changes**: the live API ignores `password` / `expiration` / `campaign` on `POST /shorten-url`.
  `lib/links.ts` has a compatibility fallback (follow-up `PUT` with a legacy client-side hash) that can be deleted once the new API is live.
- **Deploy the new Firestore index** (`shortUrls: workspaceId ASC, createdAt DESC`, already added to `firestore.indexes.json`):
  without it `GET /v1/links/workspace/<team workspace>` returns 500 and team workspaces show no links.
- `PUT /v1/links/:code` should hash passwords server-side and allow-list editable fields; then remove `legacyHashPassword`.
- Firestore rules let owners write any field on `users/{uid}` (e.g. `role`, `maxUrls`) and any field on their `shortUrls`.

## Not yet verified end to end
Member invite / role change / removal, linking a password or Google account in Settings, and Google sign-in popup on `auth.innkie.com`.
