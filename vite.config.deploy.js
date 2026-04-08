import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Auto-discover all index-*.html files (including s1-v1, s2a-v1, etc.)
const inputs = { main: resolve(__dirname, 'index.html') };
readdirSync('.')
  .filter((f) => /^index-[\w-]+\.html$/.test(f))
  .forEach((f) => {
    const name = f.replace('.html', '');
    inputs[name] = resolve(__dirname, f);
  });

export default defineConfig({
  build: {
    outDir: 'dist-deploy',
    rollupOptions: {
      input: inputs,
    },
  },
});
