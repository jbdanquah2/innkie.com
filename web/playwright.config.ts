import { defineConfig, devices } from '@playwright/test';

// Tests run against the static export (`npm run build` first) served the way Firebase Hosting serves it.
// Uses the machine's installed Chrome, so no browser download is needed (GitHub's ubuntu runners ship Chrome).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://localhost:4310', channel: 'chrome', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: { command: 'python3 scripts/serve-out.py out 4310', url: 'http://localhost:4310/', reuseExistingServer: !process.env.CI, timeout: 30_000, stdout: 'ignore', stderr: 'ignore' },
});
