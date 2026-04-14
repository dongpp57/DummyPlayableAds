/**
 * Main entry — Dummy Playable Ad Scenario S8 V1
 * Pillar: Sắp xếp bài | Mode: Free Drag → Auto-detect 2 valid melds → Instant Win
 * Canvas: 640x1136
 * Hand 7 lá lộn xộn. User tự kéo-thả để hoán đổi vị trí. Khi hand có 2 nhóm
 * liền nhau tạo thành run/set hợp lệ (3+ lá mỗi nhóm) → auto fly meld down +
 * RUMMY banner + chip rain → INSTANT WIN.
 */
import { Application, Sprite, NineSliceSprite, Assets, Container, Graphics, Text } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import bgImageUrl from '../res/DummyAsset/Background1.webp?url';
import iconDummyUrl from '../Logo/iconDummy.webp?url';
import imgHandUrl from '../res/style-1/img_hand.webp?url';
import imgHeaderUrl from '../res/style-1/img_header.webp?url';
import slotWhiteUrl from '../res/style-1/slot_white.webp?url';
import rummyBannerUrl from '../res/DummyAsset/Rummy.webp?url';
import rummyBgUrl from '../res/DummyAsset/bgRummy.webp?url';

import { getInitialHand, getBotHand } from './card-data-s8-v1.js';
import { computeHandSlots, computeBotSlots, CARD_SCALE, BOT_CARD_SCALE, SCALED_W, SCALED_H, RUN_COLOR, SET_COLOR } from './game-board-s8-v1.js';
import { validateHand, findBestHighlightGroups } from './s8-validator.js';
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
import { loadSounds, play, playBgm, stopBgm, setMuted, isMuted, unlock as unlockAudio } from './sound.js';
import sfxCardUrl from '../res/sound/s_card.mp3?url';
import sfxCoinUrl from '../res/sound/s_coin_falling.mp3?url';
import sfxProcessUrl from '../res/sound/s_process.mp3?url';
import bgmUrl from '../res/sound/music_ingame_20s.mp3?url';

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

  await loadSounds({ card: sfxCardUrl, coin: sfxCoinUrl, process: sfxProcessUrl, bgm: bgmUrl });

  const muteBtn = new Container();
  const muteBg = new Graphics();
  muteBg.circle(0, 0, 22);
  muteBg.fill({ color: 0x000000, alpha: 0.55 });
  muteBg.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
  muteBtn.addChild(muteBg);
  const muteIcon = new Text({
    text: '\uD83D\uDD0A',
    style: { fontFamily: 'Arial', fontSize: 22, fill: '#ffffff' },
  });
  muteIcon.anchor.set(0.5);
  muteBtn.addChild(muteIcon);
  muteBtn.x = GAME_WIDTH - 35;
  muteBtn.y = 110;
  muteBtn.eventMode = 'static';
  muteBtn.cursor = 'pointer';
  muteBtn.on('pointerdown', (ev) => {
    ev.stopPropagation?.();
    unlockAudio();
    const newState = !isMuted();
    setMuted(newState);
    muteIcon.text = newState ? '\uD83D\uDD07' : '\uD83D\uDD0A';
  });
  app.stage.addChild(muteBtn);

  // --- Title ---
  const title = createTitle(GAME_WIDTH, 140);
  title.text = 'Drag to form 2 melds!';
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
  // handOrder[slotIdx] = card sprite currently in that slot (mutable by drag)
  const cards = [];
  const handOrder = []; // reorderable: handOrder[i] = card at slot i
  for (let i = 0; i < handData.length; i++) {
    const card = createCardSprite(handData[i]);
    card.scale.set(CARD_SCALE);
    card.x = handSlots[i].x;
    card.y = handSlots[i].y;
    card._origIdx = i;
    card._data = handData[i];
    card._slotIdx = i;
    card.eventMode = 'static';
    card.cursor = 'grab';
    app.stage.addChild(card);
    cards.push(card);
    handOrder.push(card);
  }

  /** Re-stack cards so left cards render BEHIND right cards (overlap visual). */
  function restackBySlot() {
    const sorted = [...cards].sort((a, b) => a.x - b.x);
    sorted.forEach((c) => app.stage.addChild(c));
  }
  restackBySlot();

  // --- Timer ---
  const timer = await createTimer(GAME_WIDTH - 75, 600);
  app.stage.addChild(timer);

  let timerInterval;
  let sorted = false;
  let pointerSprite = null;

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

  // Dynamic group highlights drawn on the fly after validation
  let groupHighlights = [];
  function drawGroupHighlight(group, color) {
    const first = handSlots[group.start];
    const last = handSlots[group.end];
    const pad = 10;
    const x = first.x - pad;
    const y = first.y - pad;
    const w = last.x + SCALED_W - first.x + pad * 2;
    const h = SCALED_H + pad * 2;
    const g = new Graphics();
    g.roundRect(x - 3, y - 3, w + 6, h + 6, 18);
    g.stroke({ color, width: 6, alpha: 0.35 });
    g.roundRect(x, y, w, h, 14);
    g.fill({ color, alpha: 0.5 });
    g.roundRect(x, y, w, h, 14);
    g.stroke({ color, width: 4, alpha: 1 });
    app.stage.addChild(g);
    // Cards must render above highlight
    restackBySlot();
    groupHighlights.push(g);
    return g;
  }
  function clearGroupHighlights() {
    groupHighlights.forEach((g) => g.parent?.removeChild(g));
    groupHighlights = [];
  }

  /**
   * Redraw highlights based on current hand order. Called after every drop.
   * Highlights any valid run/set (1 or 2 groups) so the user sees realtime
   * feedback as they build their melds.
   */
  function refreshHighlights() {
    clearGroupHighlights();
    const handDataNow = handOrder.map((c) => c._data);
    const groups = findBestHighlightGroups(handDataNow);
    groups.forEach((g) => {
      drawGroupHighlight(g, g.type === 'run' ? RUN_COLOR : SET_COLOR);
    });
  }

  async function triggerWin(groupA, groupB) {
    if (sorted) return;
    sorted = true;
    play('process');
    clearPointer();
    // Disable further drag
    cards.forEach((c) => { c.eventMode = 'none'; c.cursor = 'default'; });

    // Phase A: Show highlights based on actual detected groups (clear any realtime ones first)
    clearGroupHighlights();
    drawGroupHighlight(groupA, groupA.type === 'run' ? RUN_COLOR : SET_COLOR);
    drawGroupHighlight(groupB, groupB.type === 'run' ? RUN_COLOR : SET_COLOR);
    title.text = 'PERFECT HAND!';
    updateIQ(progressSection, 110);
    animateProgress(0.2, 1.0, 600);

    // Phase B: Meld down — fly the 2 groups to table center
    setTimeout(() => {
      clearGroupHighlights();
      meldDownToTable(groupA, groupB);
    }, 900);

    // Phase C: RUMMY banner pops in
    setTimeout(() => {
      showRummyBanner();
    }, 2100);

    // Phase D: Reveal bot hand + chip rain
    setTimeout(() => {
      revealBotHand(botCards, getBotHand());
      play('coin', { concurrent: true });
      createChipRain(app, GAME_WIDTH, GAME_HEIGHT);
    }, 2700);

    // Stop timer
    setTimeout(() => clearInterval(timerInterval), 2700);

    // Open store
    setTimeout(() => { stopBgm(); openUrl(STORE_URL); }, 4500);
  }

  // --- Meld zone (table center) — fly both groups down here ---
  const MELD_ZONE_Y = 500;
  const MELD_CARD_SCALE = 0.7;
  const MELD_W = CARD_WIDTH * MELD_CARD_SCALE;

  function meldDownToTable(groupA, groupB) {
    // Each group uses slots [start..end] from handOrder
    const groupACards = [];
    for (let i = groupA.start; i <= groupA.end; i++) groupACards.push(handOrder[i]);
    const groupBCards = [];
    for (let i = groupB.start; i <= groupB.end; i++) groupBCards.push(handOrder[i]);

    const overlap = 24;
    const eff = MELD_W - overlap;
    const groupAW = eff * (groupACards.length - 1) + MELD_W;
    const groupBW = eff * (groupBCards.length - 1) + MELD_W;
    const gap = 40;
    const totalW = groupAW + gap + groupBW;
    const startX = (GAME_WIDTH - totalW) / 2;

    groupACards.forEach((card, i) => {
      const tx = startX + i * eff;
      tweenScale(card, MELD_CARD_SCALE, 600);
      tweenTo(card, tx, MELD_ZONE_Y, 600);
    });
    groupBCards.forEach((card, i) => {
      const tx = startX + groupAW + gap + i * eff;
      tweenScale(card, MELD_CARD_SCALE, 600);
      tweenTo(card, tx, MELD_ZONE_Y, 600);
    });

    // Dim any remaining deadwood card(s)
    const meldedSet = new Set([...groupACards, ...groupBCards]);
    cards.forEach((c) => {
      if (!meldedSet.has(c)) setTimeout(() => fadeAlpha(c, 0.35, 400), 200);
    });

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
      // 1. Full-screen dark backdrop (bgRummy) — fade in first
      const bgTex = await Assets.load(rummyBgUrl);
      const backdrop = new Sprite(bgTex);
      backdrop.width = GAME_WIDTH;
      backdrop.height = GAME_HEIGHT;
      backdrop.x = 0;
      backdrop.y = 0;
      backdrop.alpha = 0;
      app.stage.addChild(backdrop);
      // Fade in the backdrop to 0.75
      const bdStart = Date.now();
      const bdFadeIn = () => {
        const t = Math.min((Date.now() - bdStart) / 300, 1);
        backdrop.alpha = t * 0.75;
        if (t < 1) requestAnimationFrame(bdFadeIn);
      };
      requestAnimationFrame(bdFadeIn);

      // 2. Rummy banner pops on top of the backdrop
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

  // --- Drag setup: user can drag any card to reorder the hand ---
  // Stage must be interactive for global pointermove/pointerup to fire
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  // Shared drag state (only 1 card can be dragged at a time)
  let draggingCard = null;
  let dragOffset = { x: 0, y: 0 };
  let dragOriginalSlot = 0;

  function setupCardDrag(card) {
    card.on('pointerdown', (ev) => {
      if (sorted || draggingCard) return;
      unlockAudio();
      playBgm('bgm', 0.8);
      play('card');
      draggingCard = card;
      dragOriginalSlot = card._slotIdx;
      const pos = ev.global;
      dragOffset.x = card.x - pos.x;
      dragOffset.y = card.y - pos.y;
      card.cursor = 'grabbing';
      // Bring this card to front while dragging
      app.stage.removeChild(card);
      app.stage.addChild(card);
      card.alpha = 0.9;
      clearPointer(); // hide tutorial pointer once user starts interacting
    });
  }

  app.stage.on('pointermove', (ev) => {
    if (!draggingCard) return;
    draggingCard.x = ev.global.x + dragOffset.x;
    draggingCard.y = ev.global.y + dragOffset.y;
  });

  function endDrag() {
    if (!draggingCard) return;
    const card = draggingCard;
    draggingCard = null;
    card.alpha = 1;
    card.cursor = 'grab';

    // Find nearest slot based on current card center X
    const cardCenterX = card.x + SCALED_W / 2;
    let nearestSlot = 0;
    let nearestDist = Infinity;
    handSlots.forEach((slot, i) => {
      const slotCenterX = slot.x + SCALED_W / 2;
      const d = Math.abs(cardCenterX - slotCenterX);
      if (d < nearestDist) {
        nearestDist = d;
        nearestSlot = i;
      }
    });

    // Reorder handOrder: remove card from originalSlot, insert at nearestSlot
    if (nearestSlot !== dragOriginalSlot) {
      handOrder.splice(dragOriginalSlot, 1);
      handOrder.splice(nearestSlot, 0, card);
      handOrder.forEach((c, i) => {
        c._slotIdx = i;
        tweenTo(c, handSlots[i].x, handSlots[i].y, 250);
      });
    } else {
      tweenTo(card, handSlots[dragOriginalSlot].x, handSlots[dragOriginalSlot].y, 200);
    }

    // Re-stack z-order after tween settles, refresh highlights, then check win
    setTimeout(() => {
      restackBySlot();
      refreshHighlights();
      const handDataNow = handOrder.map((c) => c._data);
      const result = validateHand(handDataNow);
      if (result) triggerWin(result.groupA, result.groupB);
    }, 280);
  }

  app.stage.on('pointerup', endDrag);
  app.stage.on('pointerupoutside', endDrag);

  cards.forEach(setupCardDrag);

  // --- Tutorial hand pointer: sweep across player hand to hint dragging ---
  async function createHandSweepPointer() {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

    const firstCard = handOrder[0];
    const lastCard = handOrder[handOrder.length - 1];
    const fromEnd = { x: firstCard.x + SCALED_W / 2 + 20, y: firstCard.y + SCALED_H + 60 };
    const toEnd   = { x: lastCard.x  + SCALED_W / 2 + 20, y: lastCard.y  + SCALED_H + 60 };
    const spawn = { x: fromEnd.x + 70, y: fromEnd.y + 70 };

    hand.x = spawn.x;
    hand.y = spawn.y;
    hand.alpha = 0;
    hand.eventMode = 'none';
    app.stage.addChild(hand);

    const fadeIn  = 350;
    const sweep   = 1400;
    const fadeOut = 300;
    const pause   = 300;
    const totalCycle = fadeIn + sweep + fadeOut + pause;

    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      if (elapsed < fadeIn) {
        const t = elapsed / fadeIn;
        const e = t * t * (3 - 2 * t);
        hand.x = spawn.x + (fromEnd.x - spawn.x) * e;
        hand.y = spawn.y + (fromEnd.y - spawn.y) * e;
        hand.alpha = e;
      } else if (elapsed < fadeIn + sweep) {
        const t = (elapsed - fadeIn) / sweep;
        const e = t * t * (3 - 2 * t);
        hand.x = fromEnd.x + (toEnd.x - fromEnd.x) * e;
        hand.y = fromEnd.y + (toEnd.y - fromEnd.y) * e;
        hand.alpha = 1;
      } else if (elapsed < fadeIn + sweep + fadeOut) {
        const t = (elapsed - fadeIn - sweep) / fadeOut;
        hand.x = toEnd.x;
        hand.y = toEnd.y + t * 6;
        hand.alpha = 1 - t;
      } else {
        hand.alpha = 0;
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;
  }
  createHandSweepPointer();

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
      stopBgm();
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
