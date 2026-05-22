import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When deploying to GitHub Pages at https://<user>.github.io/speed-reader/
// set BASE_PATH=/speed-reader/ (the deploy workflow does this automatically).
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const base = env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true
  }
});
