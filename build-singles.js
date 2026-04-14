import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from 'fs';

// Base scenarios — each one is main-<id>-v1.js. We build 4 variants (v1..v4)
// for each base by swapping the background image before each build.
const BASE_SCENARIOS = readdirSync('src')
  .filter((f) => /^main-[\w-]+-v1\.js$/.test(f))
  .map((f) => f.replace(/^main-/, '').replace(/-v1\.js$/, ''))
  .filter((id) => id !== '1-1'); // exclude legacy

// Also build the legacy 1-1 as a single variant (no bet level)
const LEGACY = ['1-1'];

console.log(`Found ${BASE_SCENARIOS.length} base scenarios:`, BASE_SCENARIOS.join(', '));
console.log(`+ ${LEGACY.length} legacy scenarios:`, LEGACY.join(', '));

// Output to dist-deploy/dist/ so hub links (href='dist/index-*.html') work on Vercel
const outDir = resolve(process.cwd(), 'dist-deploy/dist');
mkdirSync(outDir, { recursive: true });

/** Replace every Background1.webp reference in a file with BackgroundN.webp */
function swapBg(srcPath, fromNum, toNum) {
  const content = readFileSync(srcPath, 'utf8');
  const re = new RegExp(`Background${fromNum}\\.webp`, 'g');
  writeFileSync(srcPath, content.replace(re, `Background${toNum}.webp`));
}

async function buildSingle(inputFile, variantLabel) {
  console.log(`Building single-file: ${inputFile} → ${variantLabel}`);
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

// ========== Build base scenarios × 4 bet variants ==========
for (const id of BASE_SCENARIOS) {
  const mainFile = `src/main-${id}-v1.js`;
  const baseIndex = `index-${id}-v1.html`;

  if (!existsSync(baseIndex)) {
    console.warn(`  ⚠ Skipping ${id}: ${baseIndex} not found`);
    continue;
  }

  for (const bg of [1, 2, 3, 4]) {
    const variant = `v${bg}`;
    const targetIndex = `index-${id}-${variant}.html`;

    // Step 1: Swap bg in source (skip when bg=1, already correct)
    if (bg !== 1) {
      swapBg(mainFile, 1, bg);
    }

    // Step 2: Create wrapper index for v2/v3/v4 if needed
    const createdWrapper = variant !== 'v1' && !existsSync(targetIndex);
    if (createdWrapper) {
      copyFileSync(baseIndex, targetIndex);
    }

    // Step 3: Build
    try {
      await buildSingle(targetIndex, `${id}-${variant}`);
    } catch (e) {
      console.error(`  ✗ Build failed for ${id}-${variant}:`, e.message);
    }

    // Step 4: Restore bg
    if (bg !== 1) {
      swapBg(mainFile, bg, 1);
    }

    // Step 5: Clean up wrapper index
    if (createdWrapper) {
      unlinkSync(targetIndex);
    }
  }
}

// ========== Build legacy scenarios (1 variant each) ==========
for (const id of LEGACY) {
  const indexFile = `index-${id}.html`;
  if (!existsSync(indexFile)) {
    console.warn(`  ⚠ Skipping legacy ${id}: ${indexFile} not found`);
    continue;
  }
  await buildSingle(indexFile, id);
}

// ========== Build music variants (v1-music for each base scenario) ==========
const MUSIC_SCENARIOS = readdirSync('.')
  .filter((f) => /^index-[\w-]+-v1-music\.html$/.test(f))
  .map((f) => f.replace(/^index-/, '').replace(/\.html$/, ''));

console.log(`\nFound ${MUSIC_SCENARIOS.length} music variants:`, MUSIC_SCENARIOS.join(', '));

for (const id of MUSIC_SCENARIOS) {
  const indexFile = `index-${id}.html`;
  if (!existsSync(indexFile)) {
    console.warn(`  ⚠ Skipping music ${id}: ${indexFile} not found`);
    continue;
  }
  await buildSingle(indexFile, id);
}

const totalFiles = readdirSync(outDir).filter((f) => f.endsWith('.html')).length;
console.log(`\nAll single-file builds complete! ${totalFiles} files in ${outDir}`);
