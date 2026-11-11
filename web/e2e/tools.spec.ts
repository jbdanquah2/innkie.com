import { expect, test } from '@playwright/test';

test('URL encoder encodes, decodes and flags malformed input', async ({ page }) => {
  await page.goto('/tools/url-encoder/');
  await page.getByLabel(/text or url to encode/i).fill('a b&c=é');
  await expect(page.getByLabel('Result')).toHaveValue('a%20b%26c%3D%C3%A9');
  await page.getByRole('button', { name: 'Decode' }).click();
  await page.getByLabel(/encoded text to decode/i).fill('100%');
  await expect(page.getByText(/malformed input/i)).toBeVisible();
});

test('UUID generator produces valid, unique v4 UUIDs in the chosen format', async ({ page }) => {
  await page.goto('/tools/uuid-generator/');
  const items = page.locator('ul code');
  await expect(items).toHaveCount(5);
  const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  for (const t of await items.allTextContents()) expect(t).toMatch(v4);
  await page.getByLabel(/how many/i).fill('20');
  await page.getByRole('button', { name: /generate/i }).click();
  await expect(items).toHaveCount(20);
  expect(new Set(await items.allTextContents()).size).toBe(20);
  await page.getByLabel('Uppercase').check();
  await page.getByLabel('Hyphens').uncheck();
  expect(await items.first().textContent()).toMatch(/^[0-9A-F]{32}$/);
});

test('word counter counts live', async ({ page }) => {
  await page.goto('/tools/word-counter/');
  await page.getByLabel('Your text').fill('One two three. Four five!');
  await expect(page.getByText('Words', { exact: true }).locator('xpath=preceding-sibling::div')).toHaveText('5');
  await expect(page.getByText('Sentences', { exact: true }).locator('xpath=preceding-sibling::div')).toHaveText('2');
});

test('timestamp converter converts both ways', async ({ page }) => {
  await page.goto('/tools/timestamp-converter/');
  await page.getByLabel(/epoch → date/i).fill('1767225600');
  await expect(page.getByText('2026-01-01T00:00:00.000Z').first()).toBeVisible();
  await page.getByLabel(/date → epoch/i).fill('2038-01-19T03:14:07Z');
  await expect(page.getByText('2147483647').first()).toBeVisible();
  await page.getByLabel(/epoch → date/i).fill('not a number');
  await expect(page.getByText(/enter a number of seconds/i)).toBeVisible();
});

test('JSON formatter formats valid JSON', async ({ page }) => {
  await page.goto('/tools/json-formatter/');
  const box = page.locator('textarea').first();
  await box.fill('{"a":1,"b":[1,2]}');
  await expect(page.locator('body')).toContainText('"a": 1');
});

test('tools hub lists the new tools and a guide links back to its tool', async ({ page }) => {
  await page.goto('/tools/');
  for (const name of [/URL Encoder/i, /UUID Generator/i, /Word.*Counter/i, /Timestamp Converter/i]) {
    await expect(page.getByRole('link', { name }).first()).toBeVisible();
  }
  await page.goto('/guides/url-encoding-explained/');
  await page.locator('a[href="/tools/url-encoder/"]:visible').first().click();
  await expect(page).toHaveURL(/\/tools\/url-encoder\/$/);
});
