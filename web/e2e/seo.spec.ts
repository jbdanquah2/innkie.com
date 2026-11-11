import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const routes = readFileSync('scripts/expected-routes.txt', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('/') && l !== '/404');

for (const route of routes) {
  test(`SEO contract: ${route}`, async ({ page }) => {
    const res = await page.goto(route === '/' ? '/' : `${route}/`);
    expect(res?.status()).toBe(200);

    await expect(page).toHaveTitle(/iNNkie/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect((desc ?? '').length, 'meta description').toBeGreaterThan(50);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(route === '/' ? 'https://innkie.com/' : `https://innkie.com${route}/`);

    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count(), 'public pages must be indexable').toBe(0);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, 'JSON-LD present').toBeGreaterThan(0);
    const types = blocks.flatMap((b) => { const j = JSON.parse(b); return (j['@graph'] ?? [j]).map((n: any) => n['@type']); });
    if (route.startsWith('/tools/') || route.startsWith('/guides/')) expect(types).toContain('BreadcrumbList');
    if (route.startsWith('/tools/')) expect(types).toContain('SoftwareApplication');
  });
}

test('app pages are noindex and gated behind sign-in', async ({ page }) => {
  await page.goto('/dashboard/');
  await page.waitForURL(/\/login\/\?returnUrl=/);
  expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
});

test('unknown paths show the 404 page', async ({ page }) => {
  const res = await page.goto('/definitely/not/a/page/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('body')).toContainText(/not found/i);
});

test('the short-link password shell loads for any code', async ({ page }) => {
  const res = await page.goto('/r/anything/?pw=true');
  expect(res?.status()).toBe(200);
  await expect(page.locator('body')).toContainText(/password|iNNkie/i);
});
