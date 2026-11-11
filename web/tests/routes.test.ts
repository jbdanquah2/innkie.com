import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'src/app');

/** Top-level URL segments the static site serves. */
function topLevelSegments(): string[] {
  const out = new Set<string>();
  const walk = (dir: string, groupParent = true) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (!statSync(full).isDirectory()) continue;
      if (name.startsWith('(')) walk(full); // route group: transparent in the URL
      else if (!name.startsWith('_') && !name.startsWith('[') && !name.startsWith('@')) out.add(name);
    }
  };
  walk(appDir);
  return [...out];
}

function reservedWords(): string[] {
  const src = readFileSync(path.resolve(root, '../rest-api/src/utils/url.utils.ts'), 'utf8');
  const body = src.match(/RESERVED_WORDS\s*=\s*\[([\s\S]*?)\]/)![1];
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('routing contract with the redirect service', () => {
  it('every top-level page is a reserved word, so no short alias can be shadowed by a static page', () => {
    const reserved = new Set(reservedWords());
    const missing = topLevelSegments().filter((s) => !reserved.has(s));
    expect(missing).toEqual([]);
  });

  it('every expected route has a page in the app', () => {
    const routes = readFileSync(path.join(root, 'scripts/expected-routes.txt'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('/'));
    expect(routes.length).toBeGreaterThan(20);
    for (const r of routes) {
      if (r === '/' || r === '/404') continue; // 404 is a file, not a route folder
      expect(topLevelSegments(), r).toContain(r.split('/')[1]);
    }
  });

  it('firebase.json rewrites keep /:shortCode last and /api/** first', () => {
    const rewrites = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8')).hosting.rewrites;
    expect(rewrites[0].source).toBe('/api/**');
    expect(rewrites[rewrites.length - 1].source).toBe('/:shortCode');
  });

  it('root firebase.json serves the same build as web/firebase.json', () => {
    const a = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8')).hosting;
    const b = JSON.parse(readFileSync(path.resolve(root, '../firebase.json'), 'utf8')).hosting;
    expect(b.public).toBe('web/out');
    expect(b.rewrites).toEqual(a.rewrites);
    expect(existsSync(path.join(root, 'scripts/check-routes.mjs'))).toBe(true);
  });
});
