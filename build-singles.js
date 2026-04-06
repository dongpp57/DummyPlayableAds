import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

const scenarios = [
  '1-1',
];

const outDir = resolve(process.cwd(), 'dist-deploy/downloads');
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

console.log('All single-file builds complete!');
