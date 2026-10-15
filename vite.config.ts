import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // MapLibre is about 1 MB (280 KB gzipped) and is loaded on its own after the page, so the
    // default 500 KB warning does not apply to it.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    environment: 'jsdom',
    globals: true,
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
