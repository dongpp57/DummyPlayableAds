#!/usr/bin/env bash
# Build all scenarios × 4 bet levels = 36+ single-file HTMLs.
#
# Approach A: sed replace Background1.webp → BackgroundN.webp before each build,
# then restore afterwards. A trap ensures restoration even on Ctrl+C.
#
# Output: dist/index-<id>-v<N>.html for every scenario and bet level.
#
# Bet level mapping:
#   v1 = Background1.webp (low bet)
#   v2 = Background2.webp (mid bet)
#   v3 = Background3.webp (high bet)
#   v4 = Background4.webp (VIP bet)

set -euo pipefail

export PATH="/opt/homebrew/Cellar/node/25.7.0/bin:$PATH"

cd "$(dirname "$0")"

# Base scenarios — each has main-<id>-v1.js as source.
# For v2/v3/v4 we reuse the same source with a different background.
SCENARIOS=(s1 s2a s2b s3 s4 s5a s6 s7 s8 s9)
BG_NUMBERS=(1 2 3 4)

# Restore helper: put Background1.webp back in all main files if any were modified
restore_backgrounds() {
  echo "→ Restoring Background1.webp in all main files..."
  for main_file in src/main-s*-v1.js; do
    # Replace any BackgroundN.webp (N=2,3,4) back to Background1.webp
    sed -i '' -E 's/Background[234]\.webp/Background1.webp/g' "$main_file"
  done
}

# Ensure restore runs on Ctrl+C or error
trap restore_backgrounds EXIT INT TERM

echo "================================================================"
echo "Building ${#SCENARIOS[@]} scenarios × ${#BG_NUMBERS[@]} bet levels"
echo "================================================================"

total=0
failed=0

for scenario in "${SCENARIOS[@]}"; do
  src_file="src/main-${scenario}-v1.js"
  if [[ ! -f "$src_file" ]]; then
    echo "⚠ Skipping ${scenario}: ${src_file} not found"
    continue
  fi

  for bg in "${BG_NUMBERS[@]}"; do
    variant="v${bg}"
    echo ""
    echo "─── Building ${scenario}-${variant} (Background${bg}.webp)"

    # Step 1: Swap background in main file (only if bg != 1)
    if [[ "$bg" != "1" ]]; then
      sed -i '' -E "s/Background1\.webp/Background${bg}.webp/g" "$src_file"
    fi

    # Step 2: Ensure an index-<scenario>-v<bg>.html exists.
    # v1 already exists; for v2/v3/v4 we copy from v1 and rewrite the script src.
    base_index="index-${scenario}-v1.html"
    target_index="index-${scenario}-${variant}.html"
    if [[ ! -f "$base_index" ]]; then
      echo "  ⚠ ${base_index} missing, skipping"
      if [[ "$bg" != "1" ]]; then
        sed -i '' -E "s/Background${bg}\.webp/Background1.webp/g" "$src_file"
      fi
      continue
    fi
    if [[ "$variant" != "v1" ]]; then
      # Copy index-<scenario>-v1.html to index-<scenario>-v<bg>.html
      # The entry script stays the same (main-<scenario>-v1.js) — we just rename the HTML wrapper
      cp "$base_index" "$target_index"
    fi

    # Step 3: Build this variant
    if SCENARIO="${scenario}-${variant}" ./node_modules/.bin/vite build > /tmp/s8build.log 2>&1; then
      size=$(ls -la "dist/${target_index}" 2>/dev/null | awk '{print $5}')
      echo "  ✓ dist/${target_index} (${size} bytes)"
      total=$((total + 1))
    else
      echo "  ✗ Build failed:"
      tail -10 /tmp/s8build.log | sed 's/^/    /'
      failed=$((failed + 1))
    fi

    # Step 4: Restore bg in source file for next iteration
    if [[ "$bg" != "1" ]]; then
      sed -i '' -E "s/Background${bg}\.webp/Background1.webp/g" "$src_file"
    fi

    # Step 5: Clean up the temp index-*-v2/3/4.html (we don't want them in source tree)
    if [[ "$variant" != "v1" ]]; then
      rm -f "$target_index"
    fi
  done
done

echo ""
echo "================================================================"
echo "Summary: ${total} built, ${failed} failed"
echo "================================================================"
ls -la dist/index-*.html 2>/dev/null | wc -l | xargs -I {} echo "Total files in dist/: {}"
