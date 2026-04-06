import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

const scenarios = [
  '1-1', '1-2', '1-3', '1-4', '1-5',
  '2-1', '2-2', '2-3', '2-4', '2-5',
  '3-1', '3-2', '3-3', '3-4', '3-5',
  '4-1', '4-2', '4-3', '4-4', '4-5',
  '5-1', '5-2', '5-3', '5-4', '5-5',
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
