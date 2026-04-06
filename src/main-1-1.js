/**
 * Main entry — Dummy Playable Ad Scenario 1-1
 * Canvas: 640x1136
 * 10 cards single row, 3 swaps to form Set (7♥7♣7♦) + Run (8-Q hearts)
 */
import { Application, Sprite, NineSliceSprite, Assets, Container, Graphics, Text } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import bgImageUrl from '../res/common/img_bg.webp?url';
import imgHandUrl from '../res/style-1/img_hand.webp?url';
import imgHeaderUrl from '../res/style-1/img_header.webp?url';
import slotWhiteUrl from '../res/style-1/slot_white.webp?url';

import { getInitialHand, SWAP_STEPS } from './card-data-1-1.js';
import { computeSlots, createGroupHighlights, CARD_SCALE, SCALED_W, SCALED_H } from './game-board-1-1.js';
import { createCardSprite, preloadCardTextures, highlightCard } from './card-renderer.js';
import { createTopBar, createTitle, createProgressSection, createTimer, updateTimerText, updateProgressFill, updateIQ } from './ui-header.js';
import { initDragAndDrop, getCardSlotIndex } from './drag-and-drop-handler.js';
import { createCTAOverlay } from './cta-overlay.js';

const GAME_WIDTH = 640;
const GAME_HEIGHT = 1136;
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=th.dm.card.casino';
const IOS_URL = 'https://apps.apple.com/app/dummy-zingplay/id6737778971';
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const STORE_URL = isIOS ? IOS_URL : ANDROID_URL;

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

  // --- Background ---
  const bgTex = await Assets.load(bgImageUrl);
  const bg = new Sprite(bgTex);
  bg.width = GAME_WIDTH;
  bg.height = GAME_HEIGHT;
  app.stage.addChild(bg);

  // --- Header image ---
  const headerTex = await Assets.load(imgHeaderUrl);
  const header = new Sprite(headerTex);
  header.width = GAME_WIDTH;
  header.height = (headerTex.height / headerTex.width) * GAME_WIDTH;
  header.x = 0;
  header.y = 0;
  app.stage.addChild(header);

  // --- Top bar ---
  const topBar = await createTopBar(GAME_WIDTH);
  topBar._storeUrl = STORE_URL;
  topBar.y = 40;
  app.stage.addChild(topBar);

  // --- Title ---
  const title = createTitle(GAME_WIDTH, 140);
  app.stage.addChild(title);
  let titleScale = 1, titleGrowing = true;
  app.ticker.add(() => {
    titleGrowing ? (titleScale += 0.003) : (titleScale -= 0.003);
    if (titleScale >= 1.08) titleGrowing = false;
    if (titleScale <= 1.0) titleGrowing = true;
    title.scale.set(titleScale);
  });

  // --- IQ + Progress ---
  const progressSection = await createProgressSection(GAME_WIDTH, 230);
  progressSection.scale.set(1.1);
  progressSection.x -= 10;
  app.stage.addChild(progressSection);

  // --- Card board ---
  const BOARD_Y = 530;
  const slots = computeSlots(GAME_WIDTH, BOARD_Y);

  // Group highlight backgrounds (added BEFORE cards so they render behind)
  const highlights = createGroupHighlights(slots);
  highlights.forEach(h => app.stage.addChild(h));

  // --- Cards ---
  const hand = getInitialHand();
  const cards = [];
  for (const cardData of hand) {
    const card = createCardSprite(cardData);
    card.scale.set(CARD_SCALE);
    card.x = slots[cards.length].x;
    card.y = slots[cards.length].y;
    app.stage.addChild(card);
    cards.push(card);
  }

  // --- Timer (positioned right side, above board) ---
  const timer = await createTimer(GAME_WIDTH - 75, 460);
  app.stage.addChild(timer);

  // Debug: log card positions
  cards.forEach((c, i) => console.log(`[card ${i}] x=${c.x.toFixed(1)} y=${c.y.toFixed(1)} scale=${c.scale.x}`));

  // --- Drag & Drop ---
  initDragAndDrop(cards, slots, onSwap);

  // --- Swap state ---
  let swapCount = 0;
  let handSprite = null;
  let timerInterval;

  /** Build slotToOriginal map: slot index → original card index */
  function buildSlotToOriginal() {
    const map = new Map();
    cards.forEach((card, origIdx) => {
      const slotIdx = getCardSlotIndex(card);
      map.set(slotIdx, origIdx);
    });
    return map;
  }

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

  function dimCards(activeOriginalIndices) {
    cards.forEach((c, origIdx) => {
      const isActive = activeOriginalIndices.includes(origIdx);
      c.tint = isActive ? 0xffffff : 0x888888;
      c.eventMode = isActive ? 'static' : 'none';
    });
  }

  function snapAllCardsToSlots() {
    cards.forEach((card, origIdx) => {
      const slotIdx = getCardSlotIndex(card);
      if (slotIdx >= 0 && slotIdx < slots.length) {
        const slot = slots[slotIdx];
        console.log(`[snap] card${origIdx} slotIdx=${slotIdx} before=(${card.x.toFixed(1)},${card.y.toFixed(1)}) slot=(${slot.x.toFixed(1)},${slot.y})`);
        card.x = slot.x;
        card.y = slot.y;
        card.scale.set(CARD_SCALE);
        card.rotation = 0;
      }
    });
  }

  function onSwap() {
    const step = SWAP_STEPS[swapCount];
    if (!step) return;

    const slotToOriginal = buildSlotToOriginal();
    if (!step.isComplete(slotToOriginal)) return;

    swapCount++;
    cards.forEach(c => highlightCard(c, false));
    clearHand();
    // Force all cards to correct slot positions (fixes any animation glitches)
    setTimeout(snapAllCardsToSlots, 220);

    // Show group highlight for completed groups
    if (swapCount === 1) highlights[0].visible = true; // Set complete
    if (swapCount === 3) highlights[1].visible = true; // Run complete

    setTimeout(() => {
      updateIQ(progressSection, step.iqAfter);
      animateProgress(step.progressFrom, step.progressAfter);

      if (swapCount < 3) {
        const nextStep = SWAP_STEPS[swapCount];
        // Find current card positions for next highlight pair
        const nextA = cards[nextStep.highlightA];
        const nextB = cards[nextStep.highlightB];
        dimCards([nextStep.highlightA, nextStep.highlightB]);
        highlightCard(nextA, true);
        highlightCard(nextB, true);
        createHandAnimation(app, nextA, nextB).then(h => { handSprite = h; });
      } else {
        // All 3 swaps done
        clearInterval(timerInterval);
        cards.forEach(c => { c.tint = 0xffffff; c.eventMode = 'none'; });
        setTimeout(() => window.open(STORE_URL, '_blank'), 1000);
      }
    }, 300);
  }

  // --- Initial highlight: step 0 ---
  const firstStep = SWAP_STEPS[0];
  cards.forEach(c => { c.eventMode = 'none'; });
  dimCards([firstStep.highlightA, firstStep.highlightB]);
  highlightCard(cards[firstStep.highlightA], true);
  highlightCard(cards[firstStep.highlightB], true);
  handSprite = await createHandAnimation(app, cards[firstStep.highlightA], cards[firstStep.highlightB]);

  // --- Bottom bar ---
  const slotTex = await Assets.load(slotWhiteUrl);
  const bar = new NineSliceSprite({ texture: slotTex, leftWidth: 20, rightWidth: 20, topHeight: 0, bottomHeight: 0 });
  bar.width = GAME_WIDTH + 20;
  bar.height = 140;
  bar.x = -10;
  bar.y = GAME_HEIGHT - bar.height;
  bar.tint = 0x000000;
  bar.alpha = 0.4;
  app.stage.addChild(bar);

  // --- Store buttons footer (App Store + Google Play) ---
  const footerBtns = createFooterButtons(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(footerBtns);

  // --- CTA Overlay ---
  const ctaOverlay = createCTAOverlay(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(ctaOverlay);

  // --- Timer countdown ---
  let timeLeft = 30;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerText(timer, timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      title.text = "Time's Up!";
      clearHand();
      cards.forEach(c => { highlightCard(c, false); c.eventMode = 'none'; });
      // Re-add to stage to ensure top z-order
      app.stage.removeChild(ctaOverlay);
      app.stage.addChild(ctaOverlay);
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

  const moveDuration = 800;
  const fadeOutDuration = 200;
  const delayAfterFade = 1000;
  const fadeInDuration = 200;
  const pauseAtStart = 300;
  const totalCycle = pauseAtStart + moveDuration + fadeOutDuration + delayAfterFade + fadeInDuration;

  const startTime = Date.now();
  const stableTickFn = () => {
    const elapsed = (Date.now() - startTime) % totalCycle;

    if (elapsed < pauseAtStart) {
      hand.visible = true;
      hand.alpha = 1;
      hand.x = ax;
      hand.y = ay;
    } else if (elapsed < pauseAtStart + moveDuration) {
      const t = (elapsed - pauseAtStart) / moveDuration;
      const ease = t * t * (3 - 2 * t);
      hand.visible = true;
      hand.alpha = 1;
      hand.x = ax + (bx - ax) * ease;
      hand.y = ay + (by - ay) * ease;
    } else if (elapsed < pauseAtStart + moveDuration + fadeOutDuration) {
      const t = (elapsed - pauseAtStart - moveDuration) / fadeOutDuration;
      hand.x = bx;
      hand.y = by;
      hand.alpha = 1 - t;
    } else if (elapsed < pauseAtStart + moveDuration + fadeOutDuration + delayAfterFade) {
      hand.visible = false;
    } else {
      hand.visible = true;
      const t = (elapsed - pauseAtStart - moveDuration - fadeOutDuration - delayAfterFade) / fadeInDuration;
      hand.x = ax;
      hand.y = ay;
      hand.alpha = Math.min(t, 1);
    }
  };

  app.ticker.add(stableTickFn);
  hand._tickFn = stableTickFn;
  return hand;
}

function createFooterButtons(gameWidth, gameHeight) {
  const container = new Container();
  const btnW = gameWidth * 0.42;
  const btnH = 52;
  const gap = gameWidth * 0.04;
  const totalW = btnW * 2 + gap;
  const startX = (gameWidth - totalW) / 2;
  const btnY = gameHeight - btnH - 18;

  function makeBtn(x, label1, label2, color, url) {
    const bg = new Graphics();
    bg.roundRect(x, btnY, btnW, btnH, 10);
    bg.fill({ color });
    bg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 });
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    bg.on('pointerdown', () => window.open(url, '_blank'));
    container.addChild(bg);

    const t1 = new Text({
      text: label1,
      style: { fontFamily: 'Arial', fontSize: 11, fill: '#dddddd' },
    });
    t1.anchor.set(0.5, 1);
    t1.x = x + btnW / 2;
    t1.y = btnY + btnH / 2 + 1;
    container.addChild(t1);

    const t2 = new Text({
      text: label2,
      style: { fontFamily: 'Arial Black, Arial', fontSize: 17, fontWeight: 'bold', fill: '#ffffff' },
    });
    t2.anchor.set(0.5, 0);
    t2.x = x + btnW / 2;
    t2.y = btnY + btnH / 2 + 3;
    container.addChild(t2);
  }

  makeBtn(startX, 'Download on the', 'App Store', 0x111111,
    'https://apps.apple.com/app/dummy-zingplay/id6737778971');
  makeBtn(startX + btnW + gap, 'Get it on', 'Google Play', 0x1a6b1a,
    'https://play.google.com/store/apps/details?id=th.dm.card.casino');

  return container;
}

function fitToScreen(app, container) {
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  app.canvas.style.width = `${GAME_WIDTH * scale}px`;
  app.canvas.style.height = `${GAME_HEIGHT * scale}px`;
  app.canvas.style.margin = 'auto';
  app.canvas.style.display = 'block';
}

startGame().catch(console.error);
