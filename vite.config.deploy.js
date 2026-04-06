import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Auto-discover all index-*.html files
const inputs = { main: resolve(__dirname, 'index.html') };
readdirSync('.').filter(f => f.match(/^index-\d+-\d+\.html$/)).forEach(f => {
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
