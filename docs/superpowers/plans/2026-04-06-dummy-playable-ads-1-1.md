# Dummy Playable Ads Scenario 1-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file playable ad HTML for game Dummy (Rummy) — 10 lá 1 hàng ngang, user swap 3 lần để tạo Set + Run, output ~880KB self-contained HTML.

**Architecture:** Reuse shared components từ existing Dummy project (card-renderer, drag-and-drop-handler, ui-header, cta-overlay). Tạo mới 3 files: card-data-1-1.js (data), game-board-1-1.js (group highlight logic), main-1-1.js (orchestration). Build với Vite + vite-plugin-singlefile.

**Tech Stack:** PixiJS v8, Vite 6, vite-plugin-singlefile, WebP assets (52 composed card images đã có sẵn)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/card-renderer.js` | **Modify** | Đổi card key format từ `{value}_{suit}` (Pusoy) — file đã đúng format, verify only |
| `src/card-data-1-1.js` | **Create** | 10 lá ban đầu + swap steps definition |
| `src/game-board-1-1.js` | **Create** | Group config + vẽ highlight background |
| `src/main-1-1.js` | **Create** | Game logic: layout, swap flow, timer, CTA |
| `index-1-1.html` | **Create** | Entry HTML |
| `docs/kich-ban-playable-ad-1-1.md` | **Create** | Kịch bản doc |
| `CLAUDE.md` | **Create** | Project instructions |

---

## Task 1: Verify card-renderer.js key format

**Files:**
- Verify: `src/card-renderer.js`

- [ ] **Step 1: Check card key format**

Mở `src/card-renderer.js` và xác nhận dòng build lookup:

```js
const filename = path.split('/').pop().replace('.webp', '');
cardImageUrls[filename] = url;
```

Glob pattern `../res/common/composed/*.webp` sẽ match `7_hearts.webp` → key = `7_hearts`.
`createCardSprite` dùng: `const key = \`${cardData.value}_${cardData.suit}\`` → phải là `7_hearts`.

Kiểm tra file `res/common/composed/` có đủ 52 lá: `ls res/common/composed/*.webp | wc -l` → expected: 52.

- [ ] **Step 2: Verify 52 cards exist**

```bash
cd /Users/lap60812_local/Documents/AI/Analyst/Dummy/PlayableAds/DummyPlayableAds
ls res/common/composed/*.webp | wc -l
```

Expected output: `52`

- [ ] **Step 3: Spot-check face card filenames**

```bash
ls res/common/composed/ | grep -E "^(J|Q|K|A)_"
```

Expected: `J_clubs.webp`, `J_diamonds.webp`, `J_hearts.webp`, `J_spades.webp`, `Q_*`, `K_*`, `A_*` — 16 files.

Nếu format đúng: không cần thay đổi `card-renderer.js`. Nếu sai format: update key build logic cho phù hợp.

---

## Task 2: Tạo card-data-1-1.js

**Files:**
- Create: `src/card-data-1-1.js`

- [ ] **Step 1: Tạo file**

```js
/**
 * Card data for scenario 1-1
 * 10 cards in a single row, user swaps 3 times to form Set + Run
 *
 * Initial order:
 * [0] 7♥  [1] 7♣  [2] Q♠  [3] 8♥  [4] J♥
 * [5] Q♥  [6] 10♥ [7] 9♥  [8] 7♦  [9] K♠
 *
 * After 3 swaps:
 * Set  (idx 0-2): 7♥ 7♣ 7♦   — Three of a Kind
 * Run  (idx 3-7): 8♥ J♥ 10♥ Q♥ 9♥  — Run hearts 8-9-10-J-Q (unordered display)
 * Dead (idx 8-9): Q♠ K♠
 */

export function getInitialHand() {
  return [
    { value: '7', suit: 'hearts' },   // 0
    { value: '7', suit: 'clubs' },    // 1
    { value: 'Q', suit: 'spades' },   // 2
    { value: '8', suit: 'hearts' },   // 3
    { value: 'J', suit: 'hearts' },   // 4
    { value: 'Q', suit: 'hearts' },   // 5
    { value: '10', suit: 'hearts' },  // 6
    { value: '9', suit: 'hearts' },   // 7
    { value: '7', suit: 'diamonds' }, // 8
    { value: 'K', suit: 'spades' },   // 9
  ];
}

/**
 * Swap steps definition.
 * Each step: indices of the two cards to highlight and guide user to swap.
 * isCorrectSwap(currentOrder) returns true when this step's swap has been made.
 */
export const SWAP_STEPS = [
  {
    // Step 1: swap 7♦ (idx 8) ↔ Q♠ (idx 2)
    highlightA: 8,
    highlightB: 2,
    // After swap: card at idx 2 should be 7♦ (diamonds)
    isComplete: (order) => order[2].value === '7' && order[2].suit === 'diamonds',
    iqAfter: 40,
    progressAfter: 0.4,
  },
  {
    // Step 2: swap 9♥ (idx 7) ↔ Q♥ (idx 5)
    highlightA: 7,
    highlightB: 5,
    // After swap: card at idx 5 should be 9♥
    isComplete: (order) => order[5].value === '9' && order[5].suit === 'hearts',
    iqAfter: 70,
    progressAfter: 0.7,
  },
  {
    // Step 3: swap J♥ (idx 4) ↔ 9♥ (idx 5)
    highlightA: 4,
    highlightB: 5,
    // After swap: card at idx 4 should be 9♥, card at idx 5 should be J♥
    isComplete: (order) => order[4].value === '9' && order[5].value === 'J',
    iqAfter: 110,
    progressAfter: 1.0,
  },
];
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lap60812_local/Documents/AI/Analyst/Dummy/PlayableAds/DummyPlayableAds
git add src/card-data-1-1.js
git commit -m "feat: add card data for scenario 1-1"
```

---

## Task 3: Tạo game-board-1-1.js

**Files:**
- Create: `src/game-board-1-1.js`

- [ ] **Step 1: Tạo file**

```js
/**
 * Game board for scenario 1-1
 * 10 cards in a single row with overlap, group highlight backgrounds
 */
import { Container, Graphics } from 'pixi.js';
import { CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

const OVERLAP = 30;           // px each card overlaps the previous
const CARD_SCALE = 0.9;       // scale down slightly to fit 640px width
const SCALED_W = CARD_WIDTH * CARD_SCALE;
const SCALED_H = CARD_HEIGHT * CARD_SCALE;
const EFFECTIVE_W = SCALED_W - OVERLAP; // width consumed per card (except last)
const TOTAL_W = EFFECTIVE_W * 9 + SCALED_W; // 9 gaps + 1 full last card

/**
 * Group definitions: which card indices belong to each group and their highlight color.
 * Colors: Set = green, Run = blue. Deadwood has no highlight.
 */
export const GROUPS = [
  { name: 'Set',      indices: [0, 1, 2], color: 0x2ECC40, alpha: 0.35 },
  { name: 'Run',      indices: [3, 4, 5, 6, 7], color: 0x0074D9, alpha: 0.35 },
  { name: 'Deadwood', indices: [8, 9], color: null, alpha: 0 },
];

/**
 * Compute slot positions for 10 cards in a single overlapping row.
 * Returns array of {x, y} — top-left of each card after scaling.
 * @param {number} boardWidth  canvas width (640)
 * @param {number} startY      top Y of the card row
 */
export function computeSlots(boardWidth, startY) {
  const startX = (boardWidth - TOTAL_W) / 2;
  return Array.from({ length: 10 }, (_, i) => ({
    x: startX + i * EFFECTIVE_W,
    y: startY,
  }));
}

/**
 * Create group highlight background containers (hidden initially).
 * Returns array of Graphics, one per group (index matches GROUPS).
 * @param {Array<{x,y}>} slots  slot positions from computeSlots
 */
export function createGroupHighlights(slots) {
  return GROUPS.map((group) => {
    const g = new Graphics();
    g.visible = false;

    if (group.color !== null) {
      const firstSlot = slots[group.indices[0]];
      const lastSlot = slots[group.indices[group.indices.length - 1]];
      const x = firstSlot.x - 6;
      const y = firstSlot.y - 6;
      const w = lastSlot.x + SCALED_W - firstSlot.x + 12;
      const h = SCALED_H + 12;
      g.roundRect(x, y, w, h, 14);
      g.fill({ color: group.color, alpha: group.alpha });
    }

    return g;
  });
}

export { CARD_SCALE, SCALED_W, SCALED_H };
```

- [ ] **Step 2: Commit**

```bash
git add src/game-board-1-1.js
git commit -m "feat: add game board layout for scenario 1-1"
```

---

## Task 4: Tạo index-1-1.html

**Files:**
- Create: `index-1-1.html`

- [ ] **Step 1: Tạo file**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dummy - Playable Ad</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background: #1a1a2e;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        overflow: hidden;
      }
      #game-canvas canvas {
        display: block;
        margin: auto;
      }
    </style>
  </head>
  <body>
    <div id="game-canvas"></div>
    <script type="module" src="/src/main-1-1.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Update vite.config.js để nhận SCENARIO=1-1**

Mở `vite.config.js`, đổi dòng default scenario:

```js
// Before:
const inputFile = scenario ? `index-${scenario}.html` : 'index-2-1.html';

// After:
const inputFile = scenario ? `index-${scenario}.html` : 'index-1-1.html';
```

- [ ] **Step 3: Commit**

```bash
git add index-1-1.html vite.config.js
git commit -m "feat: add entry HTML for scenario 1-1"
```

---

## Task 5: Tạo main-1-1.js — Setup & Layout

**Files:**
- Create: `src/main-1-1.js`

- [ ] **Step 1: Tạo file với app init + background + preload**

```js
/**
 * Main entry — Dummy Playable Ad Scenario 1-1
 * Canvas: 640x1136
 */
import { Application, Sprite, Assets } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import bgImageUrl from '../res/common/img_bg.webp?url';
import linkImageUrl from '../res/common/img_link.webp?url';
import imgHandUrl from '../res/style-1/img_hand.webp?url';
import imgHeaderUrl from '../res/style-1/img_header.webp?url';
import slotWhiteUrl from '../res/style-1/slot_white.webp?url';
import sCardUrl from '../res/sound/s_card.mp3?url';

import { getInitialHand, SWAP_STEPS } from './card-data-1-1.js';
import { computeSlots, createGroupHighlights, GROUPS, CARD_SCALE, SCALED_W, SCALED_H } from './game-board-1-1.js';
import { createCardSprite, preloadCardTextures, highlightCard, CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';
import { createTopBar, createTitle, createProgressSection, createTimer, updateTimerText, updateProgressFill, updateIQ } from './ui-header.js';
import { initDragAndDrop } from './drag-and-drop-handler.js';
import { createCTAOverlay } from './cta-overlay.js';

const GAME_WIDTH = 640;
const GAME_HEIGHT = 1136;
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.zingplay.dummy';
const IOS_URL = 'https://apps.apple.com/app/dummy-zingplay/id0000000000'; // TODO: confirm iOS link
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
export const STORE_URL = isIOS ? IOS_URL : ANDROID_URL;

async function startGame() {
  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: Math.max(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  const gameContainer = document.getElementById('game-canvas');
  gameContainer.appendChild(app.canvas);

  if (import.meta.env.DEV) {
    globalThis.__PIXI_APP__ = app;
    initDevtools({ app });
  }

  await preloadCardTextures();
  fitToScreen(app, gameContainer);
  window.addEventListener('resize', () => fitToScreen(app, gameContainer));

  // Background
  const bgTex = await Assets.load(bgImageUrl);
  const bg = new Sprite(bgTex);
  bg.width = GAME_WIDTH;
  bg.height = GAME_HEIGHT;
  app.stage.addChild(bg);

  // Header image
  const headerTex = await Assets.load(imgHeaderUrl);
  const header = new Sprite(headerTex);
  header.width = GAME_WIDTH;
  header.height = (headerTex.height / headerTex.width) * GAME_WIDTH;
  app.stage.addChild(header);

  // Top bar
  const topBar = await createTopBar(GAME_WIDTH);
  topBar._storeUrl = STORE_URL;
  topBar.y = 40;
  app.stage.addChild(topBar);

  // Title
  const title = createTitle(GAME_WIDTH, 140);
  app.stage.addChild(title);
  let titleScale = 1, titleGrowing = true;
  app.ticker.add(() => {
    titleGrowing ? (titleScale += 0.003) : (titleScale -= 0.003);
    if (titleScale >= 1.08) titleGrowing = false;
    if (titleScale <= 1.0) titleGrowing = true;
    title.scale.set(titleScale);
  });

  // IQ + Progress
  const progressSection = await createProgressSection(GAME_WIDTH, 230);
  progressSection.scale.set(1.1);
  progressSection.x -= 10;
  app.stage.addChild(progressSection);

  // Timer
  const timer = await createTimer(GAME_WIDTH - 80, 460);
  app.stage.addChild(timer);

  // --- Card board ---
  const BOARD_Y = 530;
  const slots = computeSlots(GAME_WIDTH, BOARD_Y);

  // Group highlight backgrounds (behind cards)
  const highlights = createGroupHighlights(slots);
  highlights.forEach(h => app.stage.addChild(h));

  // Cards
  const hand = getInitialHand();
  const cards = [];
  for (const cardData of hand) {
    const card = createCardSprite(cardData);
    card.scale.set(CARD_SCALE);
    app.stage.addChild(card);
    cards.push(card);
  }

  // Position cards at slots
  cards.forEach((card, i) => {
    card.x = slots[i].x;
    card.y = slots[i].y;
  });

  // Current logical order (tracks which cardData is at which slot after swaps)
  const currentOrder = [...hand];

  // --- Drag & Drop ---
  // Build flat slot list for drag-and-drop-handler (expects {x, y} objects)
  initDragAndDrop(cards, slots, onSwap);

  // --- Swap logic ---
  let swapCount = 0;
  let handSprite = null;

  function clearHand() {
    if (handSprite) {
      if (handSprite._tickFn) app.ticker.remove(handSprite._tickFn);
      handSprite.parent?.removeChild(handSprite);
      handSprite = null;
    }
  }

  function animateProgress(from, to) {
    const duration = 400;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      updateProgressFill(progressSection, from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function onSwap() {
    // Sync currentOrder from card positions
    const slotToCard = new Map();
    cards.forEach((card, i) => {
      // drag-and-drop-handler exposes getCardSlotIndex
      const slotIdx = getCardSlotIndex(card);
      slotToCard.set(slotIdx, i);
    });
    for (let i = 0; i < 10; i++) {
      const cardIdx = slotToCard.get(i);
      currentOrder[i] = hand[cardIdx];
    }

    const step = SWAP_STEPS[swapCount];
    if (step && step.isComplete(currentOrder)) {
      swapCount++;
      // Unhighlight previous pair
      cards.forEach(c => highlightCard(c, false));
      clearHand();

      // Show group highlight if newly complete
      if (swapCount === 1) highlights[0].visible = true; // Set complete
      if (swapCount === 3) highlights[1].visible = true; // Run complete

      setTimeout(() => {
        updateIQ(progressSection, step.iqAfter);
        animateProgress(
          swapCount === 1 ? 0.2 : swapCount === 2 ? 0.4 : 0.7,
          step.progressAfter
        );

        if (swapCount < 3) {
          const nextStep = SWAP_STEPS[swapCount];
          cards[nextStep.highlightA].eventMode = 'static';
          cards[nextStep.highlightB].eventMode = 'static';
          highlightCard(cards[nextStep.highlightA], true);
          highlightCard(cards[nextStep.highlightB], true);
          dimCards([nextStep.highlightA, nextStep.highlightB]);
          createHandAnimation(app, cards[nextStep.highlightA], cards[nextStep.highlightB])
            .then(h => { handSprite = h; });
        } else {
          // All done
          clearInterval(timerInterval);
          cards.forEach(c => { c.tint = 0xffffff; c.eventMode = 'none'; });
          setTimeout(() => window.open(STORE_URL, '_blank'), 1000);
        }
      }, 300);
    }
  }

  function dimCards(activeIndices) {
    cards.forEach((c, i) => {
      c.tint = activeIndices.includes(i) ? 0xffffff : 0x888888;
      c.eventMode = activeIndices.includes(i) ? 'static' : 'none';
    });
  }

  // --- Initial highlight: step 0 ---
  const firstStep = SWAP_STEPS[0];
  cards.forEach(c => { c.eventMode = 'none'; });
  cards[firstStep.highlightA].eventMode = 'static';
  cards[firstStep.highlightB].eventMode = 'static';
  highlightCard(cards[firstStep.highlightA], true);
  highlightCard(cards[firstStep.highlightB], true);
  dimCards([firstStep.highlightA, firstStep.highlightB]);
  handSprite = await createHandAnimation(app, cards[firstStep.highlightA], cards[firstStep.highlightB]);

  // --- Bottom bar ---
  await createBottomBar(app, slotWhiteUrl);

  // --- Store link ---
  await createStoreLink(app, linkImageUrl);

  // --- CTA Overlay ---
  const ctaOverlay = createCTAOverlay(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(ctaOverlay);

  // --- Timer countdown ---
  let timeLeft = 30;
  const timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerText(timer, timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      title.text = "Time's Up!";
      clearHand();
      cards.forEach(c => { highlightCard(c, false); c.eventMode = 'none'; });
      ctaOverlay.visible = true;
    }
  }, 1000);

  // CTA pulse animation
  app.ticker.add(() => {
    if (ctaOverlay.visible && ctaOverlay._animateCTA) ctaOverlay._animateCTA();
  });
}

async function createHandAnimation(app, cardA, cardB) {
  const texture = await Assets.load(imgHandUrl);
  const hand = new Sprite(texture);
  hand.anchor.set(0.3, 0);
  hand.scale.x = -1;
  hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

  const ax = cardA.x + SCALED_W / 2 + 20;
  const ay = cardA.y + SCALED_H / 2 + 120;
  const bx = cardB.x + SCALED_W / 2 + 20;
  const by = cardB.y + SCALED_H / 2 + 120;

  hand.x = ax;
  hand.y = ay;
  app.stage.addChild(hand);

  const moveDuration = 800, fadeOutDuration = 200;
  const delayAfterFade = 1000, fadeInDuration = 200, pauseAtStart = 300;
  const totalCycle = pauseAtStart + moveDuration + fadeOutDuration + delayAfterFade + fadeInDuration;
  let startTime = Date.now();

  const tickFn = () => {
    const elapsed = (Date.now() - startTime) % totalCycle;
    if (elapsed < pauseAtStart) {
      hand.visible = true; hand.alpha = 1; hand.x = ax; hand.y = ay;
    } else if (elapsed < pauseAtStart + moveDuration) {
      const t = (elapsed - pauseAtStart) / moveDuration;
      const ease = t * t * (3 - 2 * t);
      hand.visible = true; hand.alpha = 1;
      hand.x = ax + (bx - ax) * ease;
      hand.y = ay + (by - ay) * ease;
    } else if (elapsed < pauseAtStart + moveDuration + fadeOutDuration) {
      const t = (elapsed - pauseAtStart - moveDuration) / fadeOutDuration;
      hand.x = bx; hand.y = by; hand.alpha = 1 - t;
    } else if (elapsed < pauseAtStart + moveDuration + fadeOutDuration + delayAfterFade) {
      hand.visible = false;
    } else {
      hand.visible = true;
      const t = (elapsed - pauseAtStart - moveDuration - fadeOutDuration - delayAfterFade) / fadeInDuration;
      hand.x = ax; hand.y = ay; hand.alpha = t;
    }
  };
  app.ticker.add(tickFn);
  hand._tickFn = tickFn;
  return hand;
}

async function createBottomBar(app, slotWhiteUrl) {
  const { NineSliceSprite, Assets } = await import('pixi.js');
  const tex = await Assets.load(slotWhiteUrl);
  const bar = new NineSliceSprite({ texture: tex, leftWidth: 20, rightWidth: 20, topHeight: 0, bottomHeight: 0 });
  bar.width = GAME_WIDTH + 20; bar.height = 140;
  bar.x = -10; bar.y = GAME_HEIGHT - bar.height;
  bar.tint = 0x000000; bar.alpha = 0.4;
  app.stage.addChild(bar);
}

async function createStoreLink(app, linkImageUrl) {
  const { Sprite, Assets } = await import('pixi.js');
  const texture = await Assets.load(linkImageUrl);
  const link = new Sprite(texture);
  const scale = (GAME_WIDTH * 0.6) / texture.width;
  link.width = texture.width * scale; link.height = texture.height * scale;
  link.x = (GAME_WIDTH - link.width) / 2;
  link.y = GAME_HEIGHT - link.height - 16;
  link.eventMode = 'static'; link.cursor = 'pointer';
  link.on('pointerdown', () => window.open(STORE_URL, '_blank'));
  app.stage.addChild(link);
}

function fitToScreen(app, container) {
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  app.canvas.style.width = `${GAME_WIDTH * scale}px`;
  app.canvas.style.height = `${GAME_HEIGHT * scale}px`;
  app.canvas.style.margin = 'auto';
  app.canvas.style.display = 'block';
}

startGame().catch(console.error);
```

> **Note:** `getCardSlotIndex` cần import từ `drag-and-drop-handler.js`. Thêm vào import line:
> ```js
> import { initDragAndDrop, getCardSlotIndex } from './drag-and-drop-handler.js';
> ```

- [ ] **Step 2: Commit**

```bash
git add src/main-1-1.js
git commit -m "feat: add main game logic for scenario 1-1"
```

---

## Task 6: Setup style-1 assets

**Files:**
- Check/Create: `res/style-1/` directory

- [ ] **Step 1: Kiểm tra assets cần thiết**

`main-1-1.js` import từ `res/style-1/`:
- `img_hand.webp` — tutorial hand animation
- `img_header.webp` — header gradient
- `slot_white.webp` — bottom bar background

```bash
ls /Users/lap60812_local/Documents/AI/Analyst/Dummy/PlayableAds/DummyPlayableAds/res/
```

- [ ] **Step 2: Tạo style-1 từ style-2 assets (nếu chưa có)**

Nếu `res/style-1/` chưa tồn tại, copy từ style-2 làm placeholder:

```bash
cd /Users/lap60812_local/Documents/AI/Analyst/Dummy/PlayableAds/DummyPlayableAds
mkdir -p res/style-1
cp res/style-2/img_hand.webp res/style-1/img_hand.webp
cp res/style-2/img_header.webp res/style-1/img_header.webp
cp res/style-2/slot_white.webp res/style-1/slot_white.webp
```

> Đây là placeholder — có thể thay bằng assets riêng cho Dummy sau khi game chạy được.

- [ ] **Step 3: Kiểm tra sound assets**

```bash
ls res/sound/
```

Expected: `s_card.mp3`, `s_process.mp3`. Nếu thiếu, copy từ Pusoy:

```bash
mkdir -p res/sound
cp /Users/lap60812_local/Documents/AI/Analyst/Dummy/PlayableAds/PusoyResource/pusoy-playable-ads-master/res/sound/*.mp3 res/sound/
```

- [ ] **Step 4: Commit**

```bash
git add res/style-1/ res/sound/
git commit -m "feat: add style-1 and sound assets for Dummy"
```

---

## Task 7: Dev server test

**Files:**
- Verify: `index-1-1.html`, `src/main-1-1.js`

- [ ] **Step 1: Install dependencies nếu chưa có**

```bash
cd /Users/lap60812_local/Documents/AI/Analyst/Dummy/PlayableAds/DummyPlayableAds
npm install
```

Expected: no errors.

- [ ] **Step 2: Chạy dev server**

```bash
npx vite
```

Expected: server chạy tại `http://localhost:3000`, tự động mở browser.

- [ ] **Step 3: Kiểm tra visual checklist**

Verify trong browser:
- [ ] Background hiển thị
- [ ] 10 lá bài xếp 1 hàng ngang, overlap nhẹ
- [ ] 2 lá được highlight (7♦ index 8 và Q♠ index 2) có border vàng
- [ ] Tay animation kéo từ 7♦ → Q♠ loop
- [ ] IQ badge hiển thị "10 IQ"
- [ ] Progress bar 20%
- [ ] Timer đếm ngược từ 30

- [ ] **Step 4: Test swap flow**

- Drag 7♦ vào Q♠ → Set group (7♥ 7♣ 7♦) highlight xanh lá, IQ → 40, progress → 40%
- Tiếp theo highlight 9♥ và Q♥ → drag 9♥ vào Q♥ → IQ → 70, progress → 70%
- Cuối drag J♥ ↔ 9♥ → Run group highlight xanh dương, IQ → 110, progress → 100%
- Sau 1 giây: cửa sổ store mở (hoặc tab mới)

- [ ] **Step 5: Test time's up**

Reload, đợi 30 giây → title đổi "Time's Up!", CTA overlay hiện.

---

## Task 8: Build production HTML

**Files:**
- Output: `dist/index-1-1.html`

- [ ] **Step 1: Build**

```bash
cd /Users/lap60812_local/Documents/AI/Analyst/Dummy/PlayableAds/DummyPlayableAds
SCENARIO=1-1 npx vite build
```

Expected: `dist/index-1-1.html` created, khoảng 800KB–1MB.

- [ ] **Step 2: Verify output size**

```bash
ls -lh dist/index-1-1.html
```

Expected: < 2MB (lý tưởng ~880KB).

- [ ] **Step 3: Test file locally**

```bash
npx vite preview
```

Mở `dist/index-1-1.html` trực tiếp trong browser, verify toàn bộ flow như Task 7 Step 4.

- [ ] **Step 4: Commit**

```bash
git add dist/index-1-1.html
git commit -m "build: scenario 1-1 production HTML"
```

---

## Task 9: Tạo CLAUDE.md và kịch bản doc

**Files:**
- Create: `CLAUDE.md`
- Create: `docs/kich-ban-playable-ad-1-1.md`

- [ ] **Step 1: Tạo CLAUDE.md**

```markdown
# Dummy Playable Ads

## Project Overview
Playable ads for Dummy (Rummy) card game built with PixiJS v8 + Vite.
Each scenario is a single-file HTML (~880KB) with all assets inlined as WebP.

## Tech Stack
- **Engine**: PixiJS v8
- **Build**: Vite + vite-plugin-singlefile
- **Assets**: WebP images, MP3 sounds
- **Output**: Single HTML file per scenario (no external dependencies)

## Project Structure
- `index-1-{N}.html` — entry HTML for scenario N
- `src/main-1-{N}.js` — game logic for scenario N
- `src/card-data-1-{N}.js` — card data + swap steps for scenario N
- `src/game-board-1-{N}.js` — group config (Set/Run/Deadwood) for scenario N
- `src/card-renderer.js` — shared card rendering (WebP sprites)
- `src/drag-and-drop-handler.js` — shared drag & swap logic
- `src/ui-header.js` — shared UI (title, progress, timer)
- `src/cta-overlay.js` — shared CTA overlay
- `docs/kich-ban-playable-ad-1-{N}.md` — scenario script/docs
- `res/common/composed/*.webp` — 52 card images ({value}_{suit}.webp)
- `res/style-1/` — UI assets for Dummy style

## Build Commands
```bash
npx vite                      # dev server (default: index-1-1.html)
SCENARIO=1-1 npx vite build   # build index-1-1.html
```

## Card Key Format
Cards use `{value}_{suit}` format: `7_hearts`, `10_clubs`, `J_spades`, `Q_diamonds`, `K_hearts`, `A_clubs`

## Conventions
- IQ/progress animates after 300ms delay post-swap
- All assets use WebP format
- Group highlight: Set = #2ECC40, Run = #0074D9
- Cards overlap 30px in single-row layout, scaled 0.9×

## Superpowers Skills
- `superpowers:brainstorming` — designing new scenarios
- `superpowers:systematic-debugging` — debugging UI/swap/render issues
- `superpowers:verification-before-completion` — before delivering builds
```

- [ ] **Step 2: Tạo kich-ban-playable-ad-1-1.md**

```markdown
# Kịch Bản Playable Ad - Dummy (Style 1) - Scenario 1-1

## Thông tin chung
- **Canvas**: 640x1136 (portrait)
- **Thời gian chơi**: 30 giây
- **Link Android**: https://play.google.com/store/apps/details?id=com.zingplay.dummy
- **Link iOS**: (TODO: xác nhận)

## Bố cục màn hình

| Vị trí | Thành phần |
|--------|-----------|
| y=0 | Header gradient |
| y=40 | Top Bar: "INCREASE YOUR IQ!" + nút "Download Now" |
| y=140 | Title: "Drag cards to arrange" (pulse, đổi "Time's Up!" khi hết giờ) |
| y=230 | IQ Badge + Progress Bar |
| y=460 | Timer đồng hồ đếm ngược 30s |
| y=530 | 10 lá bài 1 hàng ngang (overlap 30px, scale 0.9×) |
| y=980+ | Bottom bar đen mờ + Store Link |

## Bài trên tay (10 lá, thứ tự ban đầu)

| Index | Lá | Trạng thái ban đầu |
|-------|-----|-------------------|
| 0 | 7♥ | Set (chưa hoàn chỉnh) |
| 1 | 7♣ | Set (chưa hoàn chỉnh) |
| 2 | Q♠ | Deadwood |
| 3 | 8♥ | Run (chưa hoàn chỉnh) |
| 4 | J♥ | Run (chưa hoàn chỉnh) |
| 5 | Q♥ | Run (chưa hoàn chỉnh) |
| 6 | 10♥ | Run (chưa hoàn chỉnh) |
| 7 | 9♥ | Run (chưa hoàn chỉnh) |
| 8 | 7♦ | Set (chưa hoàn chỉnh) |
| 9 | K♠ | Deadwood |

## Kịch bản tương tác

### Bước 1: Swap 7♦ ↔ Q♠
- Highlight: 7♦ (index 8) và Q♠ (index 2)
- Sau swap: Set (7♥ 7♣ 7♦) highlight xanh lá
- IQ: 10 → 40 | Progress: 20% → 40%

### Bước 2: Swap 9♥ ↔ Q♥
- Highlight: 9♥ (index 7) và Q♥ (index 5)
- Sau swap: Run dần hình thành
- IQ: 40 → 70 | Progress: 40% → 70%

### Bước 3: Swap J♥ ↔ 9♥
- Highlight: J♥ (index 4) và 9♥ (index 5, sau swap 2)
- Sau swap: Run (8♥ 9♥ J♥ 10♥ Q♥) highlight xanh dương
- IQ: 70 → 110 | Progress: 70% → 100%

### Sau bước 3
- Dừng timer, disable bài, mở store link sau 1 giây

## Khi hết giờ
- Title → "Time's Up!", ẩn highlight, disable bài, hiện CTA overlay
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/kich-ban-playable-ad-1-1.md
git commit -m "docs: add CLAUDE.md and scenario 1-1 kịch bản doc"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Card data 10 lá: Task 2
- ✅ Group highlight (Set/Run/Deadwood): Task 3
- ✅ 1 hàng ngang overlap 0.9× scale: Task 3 + Task 5
- ✅ 3 swap steps với isComplete logic: Task 2 + Task 5
- ✅ IQ/progress animate 300ms delay: Task 5
- ✅ Tutorial hand animation: Task 5
- ✅ Timer 30s + CTA overlay: Task 5
- ✅ Build production HTML: Task 8
- ✅ style-1 assets: Task 6
- ✅ CLAUDE.md + kịch bản doc: Task 9

**Known gaps / follow-up:**
- iOS App Store link cho Dummy Thailand chưa confirm — placeholder `id0000000000` trong code
- `res/style-1/` dùng copy từ style-2 làm placeholder — cần designer provide assets Dummy riêng
- Sound `s_card.mp3` import trong main nhưng chưa play — có thể thêm sau nếu cần

**Type consistency:**
- `computeSlots` → `slots: Array<{x, y}>` ✅ dùng trong `createGroupHighlights` và card positioning
- `GROUPS[].indices` ✅ dùng trong `createGroupHighlights`
- `SWAP_STEPS[].highlightA/B` ✅ dùng trong `onSwap` và initial highlight
- `getCardSlotIndex` ✅ imported từ `drag-and-drop-handler.js`
- `CARD_SCALE, SCALED_W, SCALED_H` ✅ exported từ `game-board-1-1.js`, dùng trong hand animation
