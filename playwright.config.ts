import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const CONTAINER_TESTS = /container\.spec\.ts/

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  // A test tagged @mobile is about the phone layout and @desktop about the wide one, so each runs only in
  // its own project instead of showing as skipped in the other.
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grepInvert: /@mobile/,
      testIgnore: CONTAINER_TESTS,
    },
    { name: 'mobile', use: { ...devices['Pixel 5'] }, grepInvert: /@desktop/, testIgnore: CONTAINER_TESTS },
    // The production container is checked only when there is one to check: set CONTAINER_URL, and run
    // `npx playwright test --project=container`. Without it the project does not exist, so a plain run
    // neither fails nor reports these tests as skipped.
    ...(process.env.CONTAINER_URL
      ? [
          {
            name: 'container',
            testMatch: CONTAINER_TESTS,
            use: { ...devices['Desktop Chrome'], baseURL: process.env.CONTAINER_URL },
          },
        ]
      : []),
  ],
  // Test the production build, which is what would be deployed, not the dev server.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
