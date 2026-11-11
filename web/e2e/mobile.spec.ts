import { devices, expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.use({ ...devices['Pixel 7'], channel: 'chrome' });

const routes = readFileSync('scripts/expected-routes.txt', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('/') && l !== '/404');

for (const route of routes) {
  test(`no horizontal overflow on mobile: ${route}`, async ({ page }) => {
    await page.goto(route === '/' ? '/' : `${route}/`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(600); // let client components hydrate
    const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
    expect(sw, `scrollWidth ${sw} > viewport ${vw}`).toBeLessThanOrEqual(vw);
  });
}
