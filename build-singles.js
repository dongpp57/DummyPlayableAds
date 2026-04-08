import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { mkdirSync, readdirSync } from 'fs';

// Auto-discover all index-*.html scenarios (legacy numeric + sX-vN pattern)
const scenarios = readdirSync('.')
  .filter((f) => /^index-[\w-]+\.html$/.test(f) && f !== 'index.html')
  .map((f) => f.replace(/^index-/, '').replace(/\.html$/, ''));

console.log(`Found ${scenarios.length} scenarios:`, scenarios.join(', '));

// Output to dist-deploy/dist/ so hub links (href="dist/index-*.html") work on Vercel
const outDir = resolve(process.cwd(), 'dist-deploy/dist');
mkdirSync(outDir, { recursive: true });

for (const id of scenarios) {
  const inputFile = `index-${id}.html`;
  console.log(`Building single-file: ${inputFile}`);
  await build({
    plugins: [viteSingleFile()],
    build: {
      outDir,
      emptyOutDir: false,
      assetsInlineLimit: 100000,
      rollupOptions: {
        input: resolve(process.cwd(), inputFile),
      },
    },
    logLevel: 'warn',
  });
}

console.log(`All ${scenarios.length} single-file builds complete!`);
