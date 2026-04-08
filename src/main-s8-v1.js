/**
 * Main entry — Dummy Playable Ad Scenario S8 V1
 * Pillar: Sắp xếp bài | Mode: Single-Tap SORT → Instant Win Reveal
 * Canvas: 640x1136
 * Hand 7 lá lộn xộn, tap SORT → fly animation → Run + Set + 1 deadwood K♥ → INSTANT WIN.
 */
import { Application, Sprite, NineSliceSprite, Assets, Container, Graphics, Text } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import bgImageUrl from '../res/DummyAsset/Background1.webp?url';
import iconDummyUrl from '../Logo/iconDummy.webp?url';
import imgHandUrl from '../res/style-1/img_hand.webp?url';
import imgHeaderUrl from '../res/style-1/img_header.webp?url';
import slotWhiteUrl from '../res/style-1/slot_white.webp?url';
import rummyBannerUrl from '../res/DummyAsset/Rummy.webp?url';

import { getInitialHand, getBotHand, SORT_TARGET_SLOTS, RUN_SLOTS, SET_SLOTS, DEADWOOD_SLOT } from './card-data-s8-v1.js';
import { computeHandSlots, computeBotSlots, createGroupHighlights, CARD_SCALE, BOT_CARD_SCALE, SCALED_W, SCALED_H } from './game-board-s8-v1.js';
import { createCardSprite, preloadCardTextures, registerCardTexture, highlightCard, CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

// S8: player hand 7 cards + bot hand 7 cards = 14 unique cards
import cardKhearts from '../res/common/composed/K_hearts.webp?url';
import card7diamonds from '../res/common/composed/7_diamonds.webp?url';
import card3hearts from '../res/common/composed/3_hearts.webp?url';
import card7clubs from '../res/common/composed/7_clubs.webp?url';
import card5hearts from '../res/common/composed/5_hearts.webp?url';
import card7spades from '../res/common/composed/7_spades.webp?url';
import card4hearts from '../res/common/composed/4_hearts.webp?url';
import card2diamonds from '../res/common/composed/2_diamonds.webp?url';
import card6clubs from '../res/common/composed/6_clubs.webp?url';
import card9spades from '../res/common/composed/9_spades.webp?url';
import cardJdiamonds from '../res/common/composed/J_diamonds.webp?url';
import cardQspades from '../res/common/composed/Q_spades.webp?url';
import cardKclubs from '../res/common/composed/K_clubs.webp?url';
import cardAhearts from '../res/common/composed/A_hearts.webp?url';
registerCardTexture('K_hearts',   cardKhearts);
registerCardTexture('7_diamonds', card7diamonds);
registerCardTexture('3_hearts',   card3hearts);
registerCardTexture('7_clubs',    card7clubs);
registerCardTexture('5_hearts',   card5hearts);
registerCardTexture('7_spades',   card7spades);
registerCardTexture('4_hearts',   card4hearts);
registerCardTexture('2_diamonds', card2diamonds);
registerCardTexture('6_clubs',    card6clubs);
registerCardTexture('9_spades',   card9spades);
registerCardTexture('J_diamonds', cardJdiamonds);
registerCardTexture('Q_spades',   cardQspades);
registerCardTexture('K_clubs',    cardKclubs);
registerCardTexture('A_hearts',   cardAhearts);
import { createTopBar, createTitle, createProgressSection, createTimer, updateTimerText, updateProgressFill, updateIQ } from './ui-header.js';
import { createCTAOverlay } from './cta-overlay.js';
import { createChipRain } from './chip-rain.js';
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
  title.text = "Tap SORT to win!";
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
  updateIQ(progressSection, 10);
  updateProgressFill(progressSection, 0.2);

  // --- Bot hand (face-down) ---
  const botSlots = computeBotSlots(GAME_WIDTH);
  const botCards = createBotHandFaceDown(botSlots);
  botCards.forEach(c => app.stage.addChild(c));

  // --- Player hand cards (unsorted initial order) ---
  const handSlots = computeHandSlots(GAME_WIDTH);
  const handData = getInitialHand();
  // homePos[orig] = initial slot position by orig index
  const cards = [];
  for (let i = 0; i < handData.length; i++) {
    const card = createCardSprite(handData[i]);
    card.scale.set(CARD_SCALE);
    card.x = handSlots[i].x;
    card.y = handSlots[i].y;
    card._origIdx = i;
    card.eventMode = 'none';
    app.stage.addChild(card);
    cards.push(card);
  }

  // --- Group highlights (hidden initially) ---
  // Add highlights BEFORE re-adding cards on top, so cards always render above highlights.
  const [runHl, setHl] = createGroupHighlights(handSlots);
  app.stage.addChild(runHl);
  app.stage.addChild(setHl);
  // Re-add cards in INITIAL slot order (left→right) so left cards render under right cards.
  // Initial order: cards[0..6] are already in slot 0..6 left-to-right at this point.
  cards.forEach(c => app.stage.addChild(c));

  /**
   * Re-stack all cards so left cards render BEHIND right cards (overlap visual).
   * Call this after every position change so K♥ (which moves to slot 6 = rightmost)
   * always appears on top of its left neighbours, and 5♥ (slot 2) appears above 4♥ (slot 1), etc.
   */
  function restackBySlot() {
    const sorted = [...cards].sort((a, b) => a.x - b.x);
    sorted.forEach(c => app.stage.addChild(c));
  }

  // --- Timer ---
  const timer = await createTimer(GAME_WIDTH - 75, 600);
  app.stage.addChild(timer);

  // --- SORT button ---
  const sortBtn = createSortButton(GAME_WIDTH / 2, 600);
  app.stage.addChild(sortBtn);

  // --- Tutorial hand pointer on SORT button ---
  let pointerSprite = await createPointerOnButton(app, sortBtn);

  let timerInterval;
  let sorted = false;

  function clearPointer() {
    if (pointerSprite) {
      if (pointerSprite._tickFn) app.ticker.remove(pointerSprite._tickFn);
      pointerSprite.parent?.removeChild(pointerSprite);
      pointerSprite = null;
    }
  }

  function tweenTo(obj, tx, ty, duration = 600, onDone) {
    const sx = obj.x, sy = obj.y;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const e = t * t * (3 - 2 * t);
      obj.x = sx + (tx - sx) * e;
      obj.y = sy + (ty - sy) * e;
      if (t < 1) requestAnimationFrame(tick);
      else if (onDone) onDone();
    };
    requestAnimationFrame(tick);
  }

  function fadeAlpha(obj, target, duration = 400) {
    const start = Date.now();
    const startAlpha = obj.alpha;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      obj.alpha = startAlpha + (target - startAlpha) * t;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function animateProgress(from, to, duration = 600) {
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      updateProgressFill(progressSection, from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async function doSort() {
    if (sorted) return;
    sorted = true;
    clearPointer();
    sortBtn.eventMode = 'none';
    fadeAlpha(sortBtn, 0, 250);
    setTimeout(() => sortBtn.parent?.removeChild(sortBtn), 280);

    // Build map: origIdx → target slot index
    const origToSlot = new Map();
    SORT_TARGET_SLOTS.forEach((origIdx, slotIdx) => {
      origToSlot.set(origIdx, slotIdx);
    });

    // Tween each card to its target slot
    cards.forEach((card) => {
      const slotIdx = origToSlot.get(card._origIdx);
      const slot = handSlots[slotIdx];
      // Stagger slightly
      setTimeout(() => tweenTo(card, slot.x, slot.y, 700), slotIdx * 60);
      // Fade K♥ to 0.5 alpha (deadwood)
      if (card._origIdx === 0) {
        setTimeout(() => fadeAlpha(card, 0.5, 600), 700 + slotIdx * 60);
      }
    });

    // Phase A: After fly animation → show highlights + restack
    setTimeout(() => {
      runHl.visible = true;
      setHl.visible = true;
      restackBySlot();
      title.text = 'PERFECT HAND!';
      updateIQ(progressSection, 110);
      animateProgress(0.2, 1.0, 600);
    }, 1100);

    // Phase B: Meld down — fly Run + Set cards from hand → table center meld zone
    // Background1 has a horizontal meld zone strip around y=480-570 (middle of canvas).
    setTimeout(() => {
      runHl.visible = false;
      setHl.visible = false;
      meldDownToTable();
    }, 2000);

    // Phase C: RUMMY banner pops in
    setTimeout(() => {
      showRummyBanner();
    }, 3200);

    // Phase D: Reveal bot hand + chip rain
    setTimeout(() => {
      revealBotHand(botCards, getBotHand());
      createChipRain(app, GAME_WIDTH, GAME_HEIGHT);
    }, 3800);

    // Stop timer
    setTimeout(() => clearInterval(timerInterval), 3800);

    // Open store
    setTimeout(() => openUrl(STORE_URL), 5500);
  }

  // --- Meld zone (table center) — fly Run + Set down here ---
  const MELD_ZONE_Y = 500;
  const MELD_CARD_SCALE = 0.7;
  const MELD_W = CARD_WIDTH * MELD_CARD_SCALE;

  function meldDownToTable() {
    // Run group: orig 2 (3♥), 6 (4♥), 4 (5♥) — left cluster
    // Set group: orig 3 (7♣), 1 (7♦), 5 (7♠) — right cluster
    const runOrigs = [2, 6, 4]; // already in display order 3-4-5
    const setOrigs = [3, 1, 5]; // 7♣ 7♦ 7♠

    const overlap = 24;
    const eff = MELD_W - overlap;
    const runTotalW = eff * 2 + MELD_W;
    const setTotalW = eff * 2 + MELD_W;
    const gap = 40;
    const totalW = runTotalW + gap + setTotalW;
    const startX = (GAME_WIDTH - totalW) / 2;

    runOrigs.forEach((origIdx, i) => {
      const card = cards[origIdx];
      const tx = startX + i * eff;
      const ty = MELD_ZONE_Y;
      tweenScale(card, MELD_CARD_SCALE, 600);
      tweenTo(card, tx, ty, 600);
    });

    setOrigs.forEach((origIdx, i) => {
      const card = cards[origIdx];
      const tx = startX + runTotalW + gap + i * eff;
      const ty = MELD_ZONE_Y;
      tweenScale(card, MELD_CARD_SCALE, 600);
      tweenTo(card, tx, ty, 600);
    });

    // K♥ stays in hand, but shake/dim it to indicate it's leftover
    const kHeart = cards[0];
    setTimeout(() => fadeAlpha(kHeart, 0.35, 400), 200);

    // After fly: re-stack meld cards left-to-right
    setTimeout(restackBySlot, 700);
  }

  function tweenScale(obj, targetScale, duration = 400) {
    const startScale = obj.scale.x;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const e = t * t * (3 - 2 * t);
      const s = startScale + (targetScale - startScale) * e;
      obj.scale.set(s);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async function showRummyBanner() {
    try {
      const tex = await Assets.load(rummyBannerUrl);
      const banner = new Sprite(tex);
      banner.anchor.set(0.5);
      const targetW = GAME_WIDTH * 0.85;
      const ratio = tex.height / tex.width;
      banner.width = targetW;
      banner.height = targetW * ratio;
      banner.x = GAME_WIDTH / 2;
      banner.y = 780; // over the player hand area
      banner.scale.set(0); // start zero, animate pop-in
      app.stage.addChild(banner);

      // Pop-in animation: 0 → 1.15 → 1
      const start = Date.now();
      const popIn = () => {
        const elapsed = Date.now() - start;
        if (elapsed < 250) {
          const t = elapsed / 250;
          const s = 1.15 * (t * t * (3 - 2 * t));
          banner.scale.set(s);
          requestAnimationFrame(popIn);
        } else if (elapsed < 400) {
          const t = (elapsed - 250) / 150;
          const s = 1.15 - 0.15 * t;
          banner.scale.set(s);
          requestAnimationFrame(popIn);
        } else {
          banner.scale.set(1);
        }
      };
      popIn();
    } catch (e) {
      console.warn('Knock banner load failed', e);
    }
  }

  // SORT button click
  sortBtn.on('pointerdown', doSort);

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
      clearPointer();
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

/** Create a face-down card (purple back) */
function createCardBack(width, height) {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(0, 0, width, height, 8);
  g.fill({ color: 0x2a2a6e });
  g.stroke({ color: 0xffffff, width: 2 });
  // Diagonal pattern
  g.roundRect(6, 6, width - 12, height - 12, 6);
  g.stroke({ color: 0x6464d6, width: 1.5 });
  g.moveTo(width / 2 - 12, height / 2 - 12);
  g.lineTo(width / 2 + 12, height / 2 + 12);
  g.moveTo(width / 2 + 12, height / 2 - 12);
  g.lineTo(width / 2 - 12, height / 2 + 12);
  g.stroke({ color: 0xffd700, width: 2 });
  c.addChild(g);
  return c;
}

function createBotHandFaceDown(botSlots) {
  const w = CARD_WIDTH * BOT_CARD_SCALE;
  const h = CARD_HEIGHT * BOT_CARD_SCALE;
  return botSlots.map((slot) => {
    const back = createCardBack(w, h);
    back.x = slot.x;
    back.y = slot.y;
    back._isBotCard = true;
    return back;
  });
}

function revealBotHand(botCards, botHandData) {
  const w = CARD_WIDTH * BOT_CARD_SCALE;
  const h = CARD_HEIGHT * BOT_CARD_SCALE;
  botCards.forEach((back, i) => {
    setTimeout(() => {
      // Replace the back graphics with actual card sprite
      back.removeChildren();
      const data = botHandData[i];
      const key = `${data.value}_${data.suit}`;
      const tex = Assets.get(`card_${key}`);
      if (tex) {
        const sprite = new Sprite(tex);
        sprite.width = w;
        sprite.height = h;
        back.addChild(sprite);
      }
    }, i * 80);
  });
}

function createSortButton(centerX, y) {
  const btn = new Container();
  const w = 180, h = 60;
  const bg = new Graphics();
  bg.roundRect(-w / 2, -h / 2, w, h, 30);
  bg.fill({ color: 0xFFD700 });
  bg.stroke({ color: 0xffffff, width: 3 });
  btn.addChild(bg);

  const label = new Text({
    text: 'SORT',
    style: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#1a1a2e',
      stroke: { color: '#ffffff', width: 2 },
    },
  });
  label.anchor.set(0.5);
  btn.addChild(label);

  btn.x = centerX;
  btn.y = y;
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  return btn;
}

async function createPointerOnButton(app, btn) {
  const texture = await Assets.load(imgHandUrl);
  const hand = new Sprite(texture);
  // Rotate 180° so fingertip points UP (sprite default points down-left)
  hand.anchor.set(0.5, 0.5);
  hand.rotation = Math.PI;
  hand.scale.x = -1; // flip horizontal → right-hand pointer

  // Place fingertip just BELOW the button (pointing up at SORT label)
  const ax = btn.x;
  const ay = btn.y + 80;
  hand.x = ax;
  hand.y = ay;
  hand.eventMode = 'none';
  app.stage.addChild(hand);

  // Pulse / wiggle animation
  const startTime = Date.now();
  const tickFn = () => {
    const elapsed = Date.now() - startTime;
    const phase = (elapsed % 1000) / 1000;
    const offset = Math.sin(phase * Math.PI * 2) * 6;
    hand.y = ay + offset;
  };
  app.ticker.add(tickFn);
  hand._tickFn = tickFn;
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
