import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  // Where the app is served from. It is the root everywhere (the dev server, the Docker image) except on
  // GitHub Pages, which serves a project at /<repository>/; the deploy job in CI sets BASE_PATH for that.
  // Every file the build produces, and the data address (see branchesApi.ts), follows it.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), imagetools()],
  resolve: {
    // "@/features/..." means src/features/..., the same as `paths` in tsconfig.app.json.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // MapLibre is about 1 MB (280 KB gzipped) and is loaded on its own after the page, so the
    // default 500 KB warning does not apply to it.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Unit tests only. The end-to-end specs in e2e/ are run by Playwright, not Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Starting one jsdom worker per core on a many-core machine can time out; a few is plenty.
    maxWorkers: 4,
    // Threads start faster and more reliably than forked processes on Windows.
    pool: 'threads',
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses @import and global Sass functions.
        // Silence only its deprecation warnings; our own files use clean syntax.
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
})
