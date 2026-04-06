# Dummy Playable Ads

## Project Overview
Playable ads cho game Dummy (Rummy) ZingPlay Thailand, build bằng PixiJS v8 + Vite.
Mỗi scenario là 1 file HTML single-file (~900KB) với toàn bộ assets inline base64.

## Tech Stack
- **Engine**: PixiJS v8
- **Build**: Vite 6 + vite-plugin-singlefile
- **Assets**: WebP cards (extracted từ Dummy CardsV2 sprite sheet), MP3 sounds
- **Output**: Single HTML file per scenario, no external dependencies

## Project Structure
```
DummyPlayableAds/
├── index-1-{N}.html             # entry HTML cho scenario N
├── src/
│   ├── main-1-{N}.js            # game logic per scenario
│   ├── card-data-1-{N}.js       # card data + swap steps per scenario
│   ├── game-board-1-{N}.js      # group config per scenario
│   ├── card-renderer.js         # shared card sprite rendering
│   ├── drag-and-drop-handler.js # shared drag/swap logic
│   ├── ui-header.js             # shared top bar / title / IQ / progress / timer
│   ├── cta-overlay.js           # shared "Time's Up!" CTA overlay
│   └── open-store.js            # MRAID-aware store URL opener
├── docs/
│   └── kich-ban-playable-ad-1-{N}.md  # kịch bản tiếng Việt
├── res/
│   ├── common/composed/*.webp   # 52 card images (value_suit.webp)
│   └── style-1/*.webp           # UI assets (hand, header, button, clock, slot)
├── dummyCard/cardsV2/           # Dummy CardsV2 sprite sheet source
├── extract-dummyv2.cjs          # script extract cards từ CardsV2
└── vite.config.js
```

## Build Commands
```bash
npx vite                          # dev server (default: index-1-1.html)
SCENARIO=1-1 npx vite build       # build dist/index-1-1.html (single file)
```

## Card Key Format
Cards dùng `{value}_{suit}.webp`:
- Values: `2,3,4,5,6,7,8,9,10,J,Q,K,A`
- Suits: `clubs, diamonds, hearts, spades`

Ví dụ: `7_hearts.webp`, `J_spades.webp`, `A_clubs.webp`.

## CardsV2 Sprite Mapping
Sprite sheet `dummyCard/cardsV2/CardsV2.png` dùng layout **value-major**:
- spriteNum 1 = 2♣, 2 = 2♦, 3 = 2♥, 4 = 2♠
- spriteNum 5 = 3♣, 6 = 3♦, ...
- spriteNum 49 = A♣, 50 = A♦, 51 = A♥, 52 = A♠

Special background:
- `2_clubs` và `Q_spades` có nền **vàng** (special wildcards)
- Còn lại nền **trắng**

Re-extract: `bash run-extract.sh`

## Game Conventions
- Canvas: 640×1136 portrait
- Timer: 30 giây
- Bài 1 hàng ngang, overlap 30px, scale 0.9×
- Group highlight: Set = `#2ECC40`, Run = `#0074D9`
- IQ/progress animate sau 300ms delay post-swap
- Tutorial hand animation loop từ lá A → lá B

## MRAID Compliance
Code đã handle:
- `mraid.addEventListener('ready')` boot — start game khi ad container ready
- `mraid.open(url)` cho tất cả store CTA buttons
- `mraid.close()` cho Skip Ads button
- Fallback `window.open` → `location.href` khi không có MRAID (dev/web preview)

## Store Links
- **Android**: `https://play.google.com/store/apps/details?id=th.dm.card.casino`
- **iOS**: `https://apps.apple.com/app/dummy-zingplay/id6737778971`

## Deployment
- **GitLab**: `https://gitlab.zingplay.com/dummy1-mplay/dummy1-playable-ads`
- **GitHub**: `https://github.com/dongpp57/DummyPlayableAds`
- **Vercel**: auto-deploy từ GitLab main branch

## Superpowers Skills (recommended for this project)
- `superpowers:brainstorming` — designing new scenarios
- `superpowers:writing-plans` — planning new scenarios/refactors
- `superpowers:executing-plans` — implementing planned tasks
- `superpowers:systematic-debugging` — debugging swap/render issues
- `superpowers:verification-before-completion` — verify build trước khi deliver
