// Parity gate: every route the Angular app prerendered (scripts/expected-routes.txt) must exist as a real HTML file in out/,
// and every sitemap URL must resolve to one. Run after `next build`:  npm run check:routes
// A missing file is dangerous on Firebase Hosting: the path would fall through to the
// /:shortCode redirect service instead of serving a page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'out');
const routesFile = path.join(here, 'expected-routes.txt'); // copied from the Angular src/prerender-routes.txt

const fileFor = (route) => {
  if (route === '/') return path.join(out, 'index.html');
  if (route === '/404') return path.join(out, '404.html');
  return path.join(out, route.replace(/^\//, ''), 'index.html');
};

const expected = fs.readFileSync(routesFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const missing = expected.filter((r) => !fs.existsSync(fileFor(r)));

const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
const sitemapRoutes = [...sitemap.matchAll(/<loc>https:\/\/innkie\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
const sitemapMissing = sitemapRoutes.map((r) => (r.length > 1 ? r.replace(/\/$/, '') : r)).filter((r) => !fs.existsSync(fileFor(r)));

console.log(`prerender routes: ${expected.length - missing.length}/${expected.length} present`);
console.log(`sitemap urls:     ${sitemapRoutes.length - sitemapMissing.length}/${sitemapRoutes.length} resolve to a file`);
if (missing.length) console.log('\nMissing prerender routes:\n  ' + missing.join('\n  '));
if (sitemapMissing.length) console.log('\nSitemap URLs without a page:\n  ' + sitemapMissing.join('\n  '));
process.exit(missing.length || sitemapMissing.length ? 1 : 0);
