import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

// Usage: SCENARIO=2-2 npx vite build
const scenario = process.env.SCENARIO || '';
const inputFile = scenario ? `index-${scenario}.html` : 'index-1-1.html';

export default defineConfig({
  plugins: [viteSingleFile()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: !scenario,
    assetsInlineLimit: 100000,
    rollupOptions: {
      input: resolve(__dirname, inputFile),
    },
  },
});
