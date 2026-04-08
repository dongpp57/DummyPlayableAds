/**
 * Main entry — Dummy Playable Ad Scenario S7 V1
 * Pillar: Sắp xếp bài | Mode: Guided Drag (free order)
 * Canvas: 640x1136
 * 7 lá hand → drag vào 2 khung target (Phỏm + Bộ), K♦ giữ nguyên.
 */
import { Application, Sprite, NineSliceSprite, Assets, Container, Graphics, Text } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import bgImageUrl from '../res/DummyAsset/Background1.webp?url';
import iconDummyUrl from '../Logo/iconDummy.webp?url';
import imgHandUrl from '../res/style-1/img_hand.webp?url';
import rummyBannerUrl from '../res/DummyAsset/Rummy.webp?url';
import imgHeaderUrl from '../res/style-1/img_header.webp?url';
import slotWhiteUrl from '../res/style-1/slot_white.webp?url';

import { getInitialHand, CARD_TARGETS, HINT_ORDER, PROGRESS_STEPS, TOTAL_TARGET_CARDS } from './card-data-s7-v1.js';
import { computeHandSlots, computeTargetBoxes, createTargetBoxes, CARD_SCALE, SCALED_W, SCALED_H, TARGET_GROUPS, TARGET_SLOT_SCALE } from './game-board-s7-v1.js';
import { createCardSprite, preloadCardTextures, registerCardTexture, highlightCard } from './card-renderer.js';

// S7 uses 7 cards — static imports for Vite tree-shake
import card7hearts from '../res/common/composed/7_hearts.webp?url';
import card3spades from '../res/common/composed/3_spades.webp?url';
import card7clubs from '../res/common/composed/7_clubs.webp?url';
import cardKdiamonds from '../res/common/composed/K_diamonds.webp?url';
import card5spades from '../res/common/composed/5_spades.webp?url';
import card7diamonds from '../res/common/composed/7_diamonds.webp?url';
import card4spades from '../res/common/composed/4_spades.webp?url';
registerCardTexture('7_hearts',   card7hearts);
registerCardTexture('3_spades',   card3spades);
registerCardTexture('7_clubs',    card7clubs);
registerCardTexture('K_diamonds', cardKdiamonds);
registerCardTexture('5_spades',   card5spades);
registerCardTexture('7_diamonds', card7diamonds);
registerCardTexture('4_spades',   card4spades);
import { createTopBar, createTitle, createProgressSection, createTimer, updateTimerText, updateProgressFill, updateIQ } from './ui-header.js';
import { createCTAOverlay } from './cta-overlay.js';
import { openUrl } from './open-store.js';

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
  app.stage.addChild(header);

  // --- Top bar ---
  const topBar = await createTopBar(GAME_WIDTH);
  topBar._storeUrl = STORE_URL;
  topBar.y = 40;
  app.stage.addChild(topBar);

  // --- Title ---
  const title = createTitle(GAME_WIDTH, 140);
  title.text = 'Drag cards into groups';
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

  // --- Target boxes ---
  const targetBoxes = computeTargetBoxes(GAME_WIDTH);
  const boxesGfx = createTargetBoxes(targetBoxes);
  app.stage.addChild(boxesGfx);

  // --- Hand cards ---
  const handSlots = computeHandSlots(GAME_WIDTH);
  const handData = getInitialHand();
  const cards = [];
  // home positions per card (where it returns on bad drop)
  const homePos = handSlots.map(s => ({ x: s.x, y: s.y }));

  for (let i = 0; i < handData.length; i++) {
    const card = createCardSprite(handData[i]);
    card.scale.set(CARD_SCALE);
    card.x = homePos[i].x;
    card.y = homePos[i].y;
    card._origIdx = i;
    card._target = CARD_TARGETS[i];
    card._placed = false;
    app.stage.addChild(card);
    cards.push(card);
  }

  // --- Timer ---
  const timer = await createTimer(GAME_WIDTH - 75, 370);
  app.stage.addChild(timer);

  // --- State ---
  let correctCount = 0;
  let handSprite = null;
  let timerInterval;
  // track which inner slot of each box is filled
  const boxFilled = { phom: 0, bo: 0 };

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

  function tweenTo(card, tx, ty, duration = 220) {
    const sx = card.x, sy = card.y;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const e = t * t * (3 - 2 * t);
      card.x = sx + (tx - sx) * e;
      card.y = sy + (ty - sy) * e;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function getNextHintCard() {
    for (const idx of HINT_ORDER) {
      const c = cards[idx];
      if (!c._placed) return c;
    }
    return null;
  }

  function showHintForNextCard() {
    clearHand();
    const next = getNextHintCard();
    if (!next) return;

    // Dim all cards except the next hint and K♦ (locked anyway)
    cards.forEach((c) => {
      if (c._placed) return;
      const isHint = (c === next);
      const isLeftover = (c._target === 'leftover');
      c.tint = isHint ? 0xffffff : (isLeftover ? 0x666666 : 0xaaaaaa);
    });
    highlightCard(next, true);

    // Hand pointer animates from card → target box center
    const targetBox = targetBoxes[next._target];
    const tx = targetBox.x + targetBox.w / 2 - SCALED_W / 2;
    const ty = targetBox.y + targetBox.h / 2 - SCALED_H / 2;
    createHandAnimation(app, next, { x: tx, y: ty }).then(h => { handSprite = h; });
  }

  function placeCardInBox(card, boxKey) {
    const box = targetBoxes[boxKey];
    const slotIdx = boxFilled[boxKey];
    const slot = box.slots[slotIdx];
    boxFilled[boxKey]++;
    card._placed = true;
    card.eventMode = 'none';
    highlightCard(card, false);
    tweenTo(card, slot.x, slot.y, 200);
    // Scale card down to fit target slot
    const startScale = card.scale.x;
    const scaleStart = Date.now();
    const scaleTick = () => {
      const t = Math.min((Date.now() - scaleStart) / 200, 1);
      const e = t * t * (3 - 2 * t);
      const s = startScale + (TARGET_SLOT_SCALE - startScale) * e;
      card.scale.set(s);
      if (t < 1) requestAnimationFrame(scaleTick);
    };
    requestAnimationFrame(scaleTick);

    correctCount++;
    setTimeout(() => {
      const step = PROGRESS_STEPS[correctCount];
      const prev = PROGRESS_STEPS[correctCount - 1];
      updateIQ(progressSection, step.iq);
      animateProgress(prev.progress, step.progress);

      // Check group completion
      if (boxFilled[boxKey] === TARGET_GROUPS[boxKey].capacity) {
        boxesGfx.completeFns[boxKey]();
      }

      if (correctCount >= TOTAL_TARGET_CARDS) {
        showRummyBanner(app);
        // All done!
        clearInterval(timerInterval);
        clearHand();
        title.text = 'RUMMY!';
        cards.forEach(c => { c.tint = 0xffffff; c.eventMode = 'none'; });
        setTimeout(() => openUrl(STORE_URL), 1200);
      } else {
        showHintForNextCard();
      }
    }, 250);
  }

  function rejectDrop(card) {
    tweenTo(card, homePos[card._origIdx].x, homePos[card._origIdx].y, 220);
  }

  function isInsideBox(globalX, globalY, box) {
    return globalX >= box.x && globalX <= box.x + box.w
        && globalY >= box.y && globalY <= box.y + box.h;
  }

  // --- Drag handler ---
  function setupCardDrag(card) {
    if (card._target === 'leftover') {
      card.eventMode = 'none';
      card.alpha = 0.85;
      return;
    }
    card.eventMode = 'static';
    card.cursor = 'pointer';

    let dragging = false;
    let offset = { x: 0, y: 0 };

    card.on('pointerdown', (ev) => {
      if (card._placed) return;
      dragging = true;
      const pos = ev.global;
      offset.x = card.x - pos.x;
      offset.y = card.y - pos.y;
      // bring to top
      app.stage.removeChild(card);
      app.stage.addChild(card);
      clearHand();
    });

    app.stage.eventMode = 'static';
    app.stage.on('pointermove', (ev) => {
      if (!dragging) return;
      card.x = ev.global.x + offset.x;
      card.y = ev.global.y + offset.y;
    });

    const endDrag = (ev) => {
      if (!dragging) return;
      dragging = false;
      const cx = card.x + SCALED_W / 2;
      const cy = card.y + SCALED_H / 2;

      // Check correct box
      const correctBox = targetBoxes[card._target];
      if (isInsideBox(cx, cy, correctBox)) {
        placeCardInBox(card, card._target);
      } else {
        rejectDrop(card);
        // restore hint after a moment
        setTimeout(showHintForNextCard, 250);
      }
    };
    app.stage.on('pointerup', endDrag);
    app.stage.on('pointerupoutside', endDrag);
  }

  cards.forEach(setupCardDrag);

  // --- Initial state ---
  updateIQ(progressSection, PROGRESS_STEPS[0].iq);
  updateProgressFill(progressSection, PROGRESS_STEPS[0].progress);
  showHintForNextCard();

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

  // --- Footer ---
  const footerBtns = await createFooterButtons(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(footerBtns);

  // --- CTA Overlay ---
  const ctaOverlay = createCTAOverlay(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(ctaOverlay);

  // --- Timer countdown ---
  let timeLeft = 20;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerText(timer, timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      title.text = "Time's Up!";
      clearHand();
      cards.forEach(c => { highlightCard(c, false); c.eventMode = 'none'; });
      app.stage.removeChild(ctaOverlay);
      app.stage.addChild(ctaOverlay);
      ctaOverlay.visible = true;
    }
  }, 1000);

  app.ticker.add(() => {
    if (ctaOverlay.visible && ctaOverlay._animateCTA) ctaOverlay._animateCTA();
  });
}

async function showRummyBanner(app) {
  try {
    const tex = await Assets.load(rummyBannerUrl);
    const banner = new Sprite(tex);
    banner.anchor.set(0.5);
    banner.width = 640 * 0.85;
    banner.height = banner.width * (tex.height / tex.width);
    banner.x = 320;
    banner.y = 780;
    banner.scale.set(0);
    app.stage.addChild(banner);
    const start = Date.now();
    const pop = () => {
      const el = Date.now() - start;
      if (el < 250) {
        const t = el / 250;
        banner.scale.set(1.15 * (t * t * (3 - 2 * t)));
        requestAnimationFrame(pop);
      } else if (el < 400) {
        const t = (el - 250) / 150;
        banner.scale.set(1.15 - 0.15 * t);
        requestAnimationFrame(pop);
      } else {
        banner.scale.set(1);
      }
    };
    pop();
  } catch (e) {
    console.warn('Rummy banner load failed', e);
  }
}

async function createHandAnimation(app, cardA, cardBPos) {
  const texture = await Assets.load(imgHandUrl);
  const hand = new Sprite(texture);
  hand.anchor.set(0.3, 0);
  hand.scale.x = -1;
  hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

  const ax = cardA.x + SCALED_W / 2 + 20;
  const ay = cardA.y + SCALED_H / 2 + 120;
  const bx = cardBPos.x + SCALED_W / 2 + 20;
  const by = cardBPos.y + SCALED_H / 2 + 120;

  hand.x = ax;
  hand.y = ay;
  hand.eventMode = 'none';
  app.stage.addChild(hand);

  const moveDuration = 800;
  const fadeOutDuration = 200;
  const delayAfterFade = 800;
  const fadeInDuration = 200;
  const pauseAtStart = 300;
  const totalCycle = pauseAtStart + moveDuration + fadeOutDuration + delayAfterFade + fadeInDuration;

  const startTime = Date.now();
  const stableTickFn = () => {
    const elapsed = (Date.now() - startTime) % totalCycle;
    if (elapsed < pauseAtStart) {
      hand.visible = true; hand.alpha = 1;
      hand.x = ax; hand.y = ay;
    } else if (elapsed < pauseAtStart + moveDuration) {
      const t = (elapsed - pauseAtStart) / moveDuration;
      const ease = t * t * (3 - 2 * t);
      hand.visible = true; hand.alpha = 1;
      hand.x = ax + (bx - ax) * ease;
      hand.y = ay + (by - ay) * ease;
    } else if (elapsed < pauseAtStart + moveDuration + fadeOutDuration) {
      const t = (elapsed - pauseAtStart - moveDuration) / fadeOutDuration;
      hand.x = bx; hand.y = by;
      hand.alpha = 1 - t;
    } else if (elapsed < pauseAtStart + moveDuration + fadeOutDuration + delayAfterFade) {
      hand.visible = false;
    } else {
      hand.visible = true;
      const t = (elapsed - pauseAtStart - moveDuration - fadeOutDuration - delayAfterFade) / fadeInDuration;
      hand.x = ax; hand.y = ay;
      hand.alpha = Math.min(t, 1);
    }
  };

  app.ticker.add(stableTickFn);
  hand._tickFn = stableTickFn;
  return hand;
}

async function createFooterButtons(gameWidth, gameHeight) {
  const container = new Container();
  const iconSize = 92;
  const btnH = 50;
  const btnGap = 10;
  const btnW = 145;
  const totalRightW = btnW * 2 + btnGap;
  const iconGap = 12;
  const totalContentW = iconSize + iconGap + totalRightW;
  const startX = (gameWidth - totalContentW) / 2;
  const pillH = 36;
  const innerGap = 8;
  const blockH = btnH + innerGap + pillH;
  const blockY = gameHeight - blockH - 18;
  const iconX = startX;
  const iconY = blockY + (blockH - iconSize) / 2;

  try {
    const iconTex = await Assets.load(iconDummyUrl);
    const icon = new Sprite(iconTex);
    icon.width = iconSize; icon.height = iconSize;
    icon.x = iconX; icon.y = iconY;
    container.addChild(icon);
  } catch (_) {}

  const rightStartX = iconX + iconSize + iconGap;
  const btnY = blockY;

  function makeBtn(x, label1, label2, color, url) {
    const bg = new Graphics();
    bg.roundRect(x, btnY, btnW, btnH, 10);
    bg.fill({ color });
    bg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 });
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    bg.on('pointerdown', () => openUrl(url));
    container.addChild(bg);

    const t1 = new Text({ text: label1, style: { fontFamily: 'Arial', fontSize: 11, fill: '#dddddd' } });
    t1.anchor.set(0.5, 1);
    t1.x = x + btnW / 2; t1.y = btnY + btnH / 2 + 1;
    container.addChild(t1);

    const t2 = new Text({ text: label2, style: { fontFamily: 'Arial Black, Arial', fontSize: 17, fontWeight: 'bold', fill: '#ffffff' } });
    t2.anchor.set(0.5, 0);
    t2.x = x + btnW / 2; t2.y = btnY + btnH / 2 + 2;
    container.addChild(t2);
  }

  makeBtn(rightStartX, 'Download on the', 'App Store', 0x111111, IOS_URL);
  makeBtn(rightStartX + btnW + btnGap, 'Get it on', 'Google Play', 0x1a6b1a, ANDROID_URL);

  const pillY = btnY + btnH + innerGap;
  const pillW = totalRightW;
  const pillBg = new Graphics();
  pillBg.roundRect(rightStartX, pillY, pillW, pillH, pillH / 2);
  pillBg.fill({ color: 0xffffff });
  pillBg.stroke({ color: 0xCC1010, width: 2 });
  pillBg.eventMode = 'static';
  pillBg.cursor = 'pointer';
  pillBg.on('pointerdown', () => openUrl(STORE_URL));
  container.addChild(pillBg);

  const nameText = new Text({
    text: 'Dummy ZingPlay',
    style: { fontFamily: 'Arial Black, Arial', fontSize: 16, fontWeight: 'bold', fill: '#CC1010' },
  });
  nameText.anchor.set(0, 0.5);
  nameText.x = rightStartX + 16;
  nameText.y = pillY + pillH / 2;
  container.addChild(nameText);

  const searchR = pillH / 2;
  const searchCx = rightStartX + pillW - searchR;
  const searchCy = pillY + pillH / 2;
  const searchBg = new Graphics();
  searchBg.circle(searchCx, searchCy, searchR);
  searchBg.fill({ color: 0xCC1010 });
  searchBg.eventMode = 'static';
  searchBg.cursor = 'pointer';
  searchBg.on('pointerdown', () => openUrl(STORE_URL));
  container.addChild(searchBg);

  const glass = new Graphics();
  const cx = searchCx - 2;
  const cy = searchCy - 2;
  glass.circle(cx, cy, 6);
  glass.stroke({ color: 0xffffff, width: 2 });
  glass.moveTo(cx + 4, cy + 4);
  glass.lineTo(cx + 9, cy + 9);
  glass.stroke({ color: 0xffffff, width: 2.5, cap: 'round' });
  container.addChild(glass);

  return container;
}

function fitToScreen(app, container) {
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const scale = Math.min(vw / GAME_WIDTH, vh / GAME_HEIGHT);
  const w = Math.floor(GAME_WIDTH * scale);
  const h = Math.floor(GAME_HEIGHT * scale);
  app.canvas.style.width = `${w}px`;
  app.canvas.style.height = `${h}px`;
  app.canvas.style.display = 'block';
}

function bootWhenReady() {
  if (typeof mraid === 'undefined') {
    startGame().catch(console.error);
    return;
  }
  if (mraid.getState && mraid.getState() === 'loading') {
    mraid.addEventListener('ready', () => startGame().catch(console.error));
  } else {
    startGame().catch(console.error);
  }
}
bootWhenReady();
