/**
 * Main entry — Dummy Playable Ad Scenario S6 V1
 * Pillar: Đa dạng action | Win: Combo ăn + lay off x2 + knock (clear hand)
 * Canvas: 640x1136 | 1v1 layout
 *
 * Pre-game:
 *   Player melds on table: [2♣ 3♣ 4♣], [7♦ 8♦ 9♦]
 *   Opponent meld: [9♥ 10♥ J♥]
 *   Player hand (5 cards): 4♠ 5♠ 8♥ Q♥ Q♠
 *
 * Flow:
 *   Phase 0 (auto ~6s): bot discard 3♦ → player draw/discard 4♦ → bot discard J♣
 *   Phase 1 (interactive): bot discards 6♠ → timer starts → tap 6♠
 *   Step 1: pick 4♠+5♠ → Meld button → meld [4♠ 5♠ 6♠]
 *   Step 2: drag 8♥ → opp meld → [8♥ 9♥ 10♥ J♥]
 *   Step 3: drag Q♥ → opp meld → [8♥ 9♥ 10♥ J♥ Q♥]
 *   Step 4: tap KNOCK → Q♠ flies to discard → WIN (clear hand)
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
import knockBannerUrl from '../res/DummyAsset/Knock eng.webp?url';
import knockBtnUrl from '../res/DummyAsset/Btn Knock Idle E.webp?url';
import btnMeldUrl from '../res/DummyAsset/Btn Meld.png?url';

import {
  getPlayerHand, getPlayerExistingMelds, getOpponentMeld,
  getFinalDiscard, getOpenCard,
  MELD_KEYS, LAYOFF_8H, LAYOFF_QH, KNOCK_KEY,
} from './card-data-s6-v1.js';
import {
  computeHandSlots, computeMeldSlots, computeCenterZone,
  createCardBack, createDeckPile, createBotAvatar,
  HAND_SCALE, MELD_SCALE, DECK_SCALE,
  HAND_SCALED_W, HAND_SCALED_H, MELD_SCALED_W, MELD_SCALED_H, DECK_SCALED_W,
  CENTER_ZONE_Y, PLAYER_MELD_Y, PLAYER_HAND_Y,
} from './table-layout.js';
import { createCardSprite, preloadCardTextures, registerCardTexture, highlightCard, CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';
import { createTopBar, createTitle, createProgressSection, createTimer, updateTimerText, updateProgressFill, updateIQ } from './ui-header.js';
import { createCTAOverlay } from './cta-overlay.js';
import { createChipRain } from './chip-rain.js';
import { openUrl } from './open-store.js';
import { loadSounds, play, playBgm, stopBgm, setMuted, isMuted, unlock as unlockAudio } from './sound.js';
import sfxCardUrl from '../res/sound/s_card.mp3?url';
import sfxCoinUrl from '../res/sound/s_coin_falling.mp3?url';
import sfxProcessUrl from '../res/sound/s_process.mp3?url';
import bgmUrl from '../res/sound/music_ingame_20s.mp3?url';

// S6 cards: 4♠ 5♠ 8♥ Q♥ Q♠ (hand) + 2♣ 3♣ 4♣ + 7♦ 8♦ 9♦ (player melds) + 9♥ 10♥ J♥ (opp meld) + 3♦ 4♦ J♣ 6♠ (discards) + 5♣ (open) = 17
import card4spades   from '../res/common/composed/4_spades.webp?url';
import card5spades   from '../res/common/composed/5_spades.webp?url';
import card8hearts   from '../res/common/composed/8_hearts.webp?url';
import cardQhearts   from '../res/common/composed/Q_hearts.webp?url';
import cardQspades   from '../res/common/composed/Q_spades.webp?url';
import card2clubs    from '../res/common/composed/2_clubs.webp?url';
import card3clubs    from '../res/common/composed/3_clubs.webp?url';
import card4clubs    from '../res/common/composed/4_clubs.webp?url';
import card7diamonds from '../res/common/composed/7_diamonds.webp?url';
import card8diamonds from '../res/common/composed/8_diamonds.webp?url';
import card9diamonds from '../res/common/composed/9_diamonds.webp?url';
import card9hearts   from '../res/common/composed/9_hearts.webp?url';
import card10hearts  from '../res/common/composed/10_hearts.webp?url';
import cardJhearts   from '../res/common/composed/J_hearts.webp?url';
import card6spades   from '../res/common/composed/6_spades.webp?url';
import card5clubs    from '../res/common/composed/5_clubs.webp?url';
registerCardTexture('4_spades',   card4spades);
registerCardTexture('5_spades',   card5spades);
registerCardTexture('8_hearts',   card8hearts);
registerCardTexture('Q_hearts',   cardQhearts);
registerCardTexture('Q_spades',   cardQspades);
registerCardTexture('2_clubs',    card2clubs);
registerCardTexture('3_clubs',    card3clubs);
registerCardTexture('4_clubs',    card4clubs);
registerCardTexture('7_diamonds', card7diamonds);
registerCardTexture('8_diamonds', card8diamonds);
registerCardTexture('9_diamonds', card9diamonds);
registerCardTexture('9_hearts',   card9hearts);
registerCardTexture('10_hearts',  card10hearts);
registerCardTexture('J_hearts',   cardJhearts);
registerCardTexture('6_spades',   card6spades);
registerCardTexture('5_clubs',    card5clubs);

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

  // Enable global move events for drag handling
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  // --- Background + header + top bar + title + IQ/timer ---
  const bgTex = await Assets.load(bgImageUrl);
  const bg = new Sprite(bgTex);
  bg.width = GAME_WIDTH;
  bg.height = GAME_HEIGHT;
  app.stage.addChild(bg);

  const headerTex = await Assets.load(imgHeaderUrl);
  const header = new Sprite(headerTex);
  header.width = GAME_WIDTH;
  header.height = (headerTex.height / headerTex.width) * GAME_WIDTH;
  app.stage.addChild(header);

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

  const title = createTitle(GAME_WIDTH, 140);
  title.text = 'Clear your hand to win!';
  app.stage.addChild(title);
  let titleScale = 1, titleGrowing = true;
  app.ticker.add(() => {
    titleGrowing ? (titleScale += 0.003) : (titleScale -= 0.003);
    if (titleScale >= 1.08) titleGrowing = false;
    if (titleScale <= 1.0) titleGrowing = true;
    title.scale.set(titleScale);
  });

  // No IQ bar for opponent scenarios — keep UI clean
  const timer = await createTimer(GAME_WIDTH - 75, 230);
  timer.visible = false; // hidden during auto intro, shown when interactive phase begins
  app.stage.addChild(timer);

  // --- Opponent avatar top-left + face-down hand + meld ---
  const botAvatar = createBotAvatar(50, 220, 'OPPONENT');
  app.stage.addChild(botAvatar);

  // Opponent face-down hand (4 remaining cards — they just discarded 7♣, assume they have more)
  const oppHandScale = 0.4;
  const oppHandW = CARD_WIDTH * oppHandScale;
  const oppHandOverlap = 24;
  const oppHandEff = oppHandW - oppHandOverlap;
  const oppHandCount = 4;
  const oppHandStartX = 100;
  const oppHandY = 200;
  for (let i = 0; i < oppHandCount; i++) {
    const back = createCardBack(oppHandScale);
    back.x = oppHandStartX + i * oppHandEff;
    back.y = oppHandY;
    app.stage.addChild(back);
  }

  const oppMeldData = getOpponentMeld();
  const oppMeldY = 295;
  const oppMeldStartX = 130;
  const oppMeldCards = [];
  for (let i = 0; i < oppMeldData.length; i++) {
    const card = createCardSprite(oppMeldData[i]);
    card.scale.set(MELD_SCALE);
    card.x = oppMeldStartX + i * (MELD_SCALED_W - 12);
    card.y = oppMeldY;
    app.stage.addChild(card);
    oppMeldCards.push(card);
  }
  const oppMeldLabel = new Text({
    text: "OPPONENT'S MELD",
    style: { fontFamily: 'Arial Black', fontSize: 10, fill: '#ffffff', stroke: { color: '#000', width: 2 } },
  });
  oppMeldLabel.anchor.set(0, 1);
  oppMeldLabel.x = oppMeldStartX;
  oppMeldLabel.y = oppMeldY - 2;
  app.stage.addChild(oppMeldLabel);

  // --- Center zone: deck + open card + discard (7♣) ---
  const centerZone = computeCenterZone(GAME_WIDTH);
  const deckPile = createDeckPile(centerZone.deck.x, centerZone.deck.y);
  app.stage.addChild(deckPile);

  const openCardData = getOpenCard();
  const openCardSprite = createCardSprite(openCardData);
  openCardSprite.scale.set(DECK_SCALE);
  openCardSprite.x = centerZone.cayMo.x;
  openCardSprite.y = centerZone.cayMo.y;
  openCardSprite.eventMode = 'none';
  app.stage.addChild(openCardSprite);

  // Discard card starts empty; auto-intro will populate it, then Phase 1 swaps to 6♠
  let discardCard = null;
  let discardGlow = null;
  let discardGlowTickFn = null;

  function createDiscardGlow() {
    const g = new Graphics();
    g.roundRect(
      centerZone.discard.x - 6, centerZone.discard.y - 6,
      DECK_SCALED_W + 12, CARD_HEIGHT * DECK_SCALE + 12, 12,
    );
    g.stroke({ color: 0xFFD700, width: 4, alpha: 1 });
    return g;
  }
  function removeDiscardGlow() {
    if (discardGlowTickFn) { app.ticker.remove(discardGlowTickFn); discardGlowTickFn = null; }
    if (discardGlow) { discardGlow.parent?.removeChild(discardGlow); discardGlow = null; }
  }
  function addDiscardGlowPulse() {
    removeDiscardGlow();
    discardGlow = createDiscardGlow();
    app.stage.addChildAt(discardGlow, app.stage.getChildIndex(discardCard));
    let glowAlpha = 1, glowDir = -1;
    discardGlowTickFn = () => {
      glowAlpha += glowDir * 0.02;
      if (glowAlpha < 0.4) glowDir = 1;
      if (glowAlpha > 1) glowDir = -1;
      discardGlow.alpha = glowAlpha;
    };
    app.ticker.add(discardGlowTickFn);
  }

  // --- Player's pre-existing melds on table (2 melds + reserve slot for new meld — all same row) ---
  // Layout matches s2a-v1: meld row at y=660, hand at PLAYER_HAND_Y (default 830)
  const playerMeldDataList = getPlayerExistingMelds();
  const playerMeldY = 660;
  const MELD_COMPACT_STEP = MELD_SCALED_W - 24; // overlap within a meld
  const meldBlockW = MELD_COMPACT_STEP * 2 + MELD_SCALED_W; // width of one 3-card meld
  const meldGap = 10;
  // 3 meld slots: [existing meld 1] [existing meld 2] [new meld slot]
  const totalW = meldBlockW * 3 + meldGap * 2;
  const meldRowStartX = Math.max(10, (GAME_WIDTH - totalW) / 2);
  const meldSlotX = [
    meldRowStartX,
    meldRowStartX + meldBlockW + meldGap,
    meldRowStartX + (meldBlockW + meldGap) * 2,
  ];
  const playerMeldCards = [];
  for (let m = 0; m < playerMeldDataList.length; m++) {
    const meldData = playerMeldDataList[m];
    for (let i = 0; i < meldData.length; i++) {
      const card = createCardSprite(meldData[i]);
      card.scale.set(MELD_SCALE);
      card.x = meldSlotX[m] + i * MELD_COMPACT_STEP;
      card.y = playerMeldY;
      app.stage.addChild(card);
      playerMeldCards.push(card);
    }
  }
  const yourMeldLabel = new Text({
    text: 'YOUR MELDS',
    style: { fontFamily: 'Arial Black', fontSize: 10, fill: '#FFD700', stroke: { color: '#000', width: 2 } },
  });
  yourMeldLabel.anchor.set(0, 1);
  yourMeldLabel.x = meldSlotX[0];
  yourMeldLabel.y = playerMeldY - 2;
  app.stage.addChild(yourMeldLabel);

  // New meld [4♠ 5♠ 6♠] appears in the 3rd slot on the SAME row
  const newMeldRowY = playerMeldY;
  const newMeldStartX = meldSlotX[2];
  const NEW_MELD_STEP = MELD_COMPACT_STEP;

  // --- Player hand (5 cards) ---
  // Tag each card by role (by value_suit) so we can track after visual shuffle
  const meldKeys = new Set(MELD_KEYS);

  // Fisher-Yates shuffle
  const handData = getPlayerHand();
  for (let i = handData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [handData[i], handData[j]] = [handData[j], handData[i]];
  }

  // Hand at default PLAYER_HAND_Y (matches s2a-v1)
  const HAND_Y_S6 = PLAYER_HAND_Y;
  const handSlots = computeHandSlots(GAME_WIDTH, handData.length, HAND_Y_S6);
  const cards = [];
  const homePos = handSlots.map(s => ({ x: s.x, y: s.y }));
  for (let i = 0; i < handData.length; i++) {
    const card = createCardSprite(handData[i]);
    card.scale.set(HAND_SCALE);
    card.x = homePos[i].x;
    card.y = homePos[i].y;
    card._origIdx = i;
    const key = `${handData[i].value}_${handData[i].suit}`;
    card._key = key;
    card._isMeldCard = meldKeys.has(key);
    card._isLayoff8H = key === LAYOFF_8H;
    card._isLayoffQH = key === LAYOFF_QH;
    card._isKnock = key === KNOCK_KEY;
    card.eventMode = 'none';
    // Bright from the start so player can see hand during auto intro
    card.tint = 0xffffff;
    app.stage.addChild(card);
    cards.push(card);
  }
  // Helper lookups
  const getLayoff8HCard = () => cards.find((c) => c._isLayoff8H);
  const getLayoffQHCard = () => cards.find((c) => c._isLayoffQH);
  const getKnockCard    = () => cards.find((c) => c._isKnock);
  const getMeldCards    = () => cards.filter((c) => c._isMeldCard);

  // --- State ---
  // Phase 0: auto intro (bot/player discards)
  // Phase 1: tap discard 6♠
  // Phase 1.25: hand cards tappable, Meld button disabled — user picks meld cards
  // Phase 2: Meld button tapped → meld [4♠ 5♠ 6♠] forms, move to Step 2 (drag 8♥)
  // Phase 3: 8♥ dropped → Step 3 (drag Q♥)
  // Phase 4: Q♥ dropped → Knock button → Q♠ knock
  let phase = 0;
  let resolved = false;
  let timerInterval;
  let pointerSprite = null;
  const newMeldCards = [];
  let newMeldEndX = 0;
  const pickedIdx = new Set();

  function clearPointer() {
    if (pointerSprite) {
      if (pointerSprite._tickFn) app.ticker.remove(pointerSprite._tickFn);
      pointerSprite.parent?.removeChild(pointerSprite);
      pointerSprite = null;
    }
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function tweenTo(obj, tx, ty, duration = 400, onDone) {
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

  function tweenScale(obj, target, duration = 300) {
    const startScale = obj.scale.x;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const e = t * t * (3 - 2 * t);
      obj.scale.set(startScale + (target - startScale) * e);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function animateProgress(from, to, duration = 500) {
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      updateProgressFill(progressSection, from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /**
   * Smooth tap pointer where the FINGERTIP (not sprite origin) ends at (tipX, tipY).
   * The sprite uses anchor(0.3, 0) + rotation + scale.x=-1, so the fingertip is offset
   * from the sprite's (x, y) position. We pre-compensate so the tip lands exactly
   * at the target.
   */
  async function createSmoothTapPointerAtFingertip(tipX, tipY) {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

    // Fixed empirical offsets for this hand sprite (anchor 0.3,0 + rot 150° + flipX)
    // Fingertip sits ABOVE the sprite origin by ~40px (negative Y = up in Pixi)
    const FINGER_OFFSET_X = -8;
    const FINGER_OFFSET_Y = -40;

    // So set sprite position = tipX - offset, tipY - offset → sprite's fingertip lands at (tipX, tipY)
    const endX = tipX - FINGER_OFFSET_X;
    const endY = tipY - FINGER_OFFSET_Y;
    const startX = endX + 70;
    const startY = endY + 70;
    hand.x = startX; hand.y = startY; hand.alpha = 0;
    hand.eventMode = 'none'; // let clicks pass through to the card below
    app.stage.addChild(hand);

    const slideIn = 500, hold = 250, fadeOut = 250, pause = 350;
    const totalCycle = slideIn + hold + fadeOut + pause;
    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      if (elapsed < slideIn) {
        const t = elapsed / slideIn;
        const e = t * t * (3 - 2 * t);
        hand.x = startX + (endX - startX) * e;
        hand.y = startY + (endY - startY) * e;
        hand.alpha = e;
      } else if (elapsed < slideIn + hold) {
        hand.x = endX; hand.y = endY; hand.alpha = 1;
      } else if (elapsed < slideIn + hold + fadeOut) {
        const t = (elapsed - slideIn - hold) / fadeOut;
        hand.x = endX; hand.y = endY + t * 6; hand.alpha = 1 - t;
      } else {
        hand.x = startX; hand.y = startY; hand.alpha = 0;
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;
  }

  async function createSmoothTapPointer(targetCenter) {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);
    const endX = targetCenter.x + 20;
    const endY = targetCenter.y + 60;
    const startX = endX + 70;
    const startY = endY + 70;
    hand.x = startX; hand.y = startY; hand.alpha = 0;
    hand.eventMode = 'none'; // let clicks pass through to the card below
    app.stage.addChild(hand);
    const slideIn = 500, hold = 250, fadeOut = 250, pause = 350;
    const totalCycle = slideIn + hold + fadeOut + pause;
    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      if (elapsed < slideIn) {
        const t = elapsed / slideIn;
        const e = t * t * (3 - 2 * t);
        hand.x = startX + (endX - startX) * e;
        hand.y = startY + (endY - startY) * e;
        hand.alpha = e;
      } else if (elapsed < slideIn + hold) {
        hand.x = endX; hand.y = endY; hand.alpha = 1;
      } else if (elapsed < slideIn + hold + fadeOut) {
        const t = (elapsed - slideIn - hold) / fadeOut;
        hand.x = endX; hand.y = endY + t * 6; hand.alpha = 1 - t;
      } else {
        hand.x = startX; hand.y = startY; hand.alpha = 0;
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;
  }

  // Drag hint: pointer slides from `from` → `to` (card → meld target), fade, repeat.
  // Used when the user is expected to DRAG a card to a drop zone.
  async function createDragHintPointer(from, to) {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

    // Match the convention used by createSmoothTapPointer elsewhere:
    // sprite position = (target.x + 20, target.y + 60) makes the fingertip
    // land roughly ON the target (same rotation/anchor as other pointers).
    const fromEnd = { x: from.x + 20, y: from.y + 60 };
    const toEnd   = { x: to.x   + 20, y: to.y   + 60 };
    // Spawn from below-right of source
    const spawn = { x: fromEnd.x + 70, y: fromEnd.y + 70 };

    hand.x = spawn.x;
    hand.y = spawn.y;
    hand.alpha = 0;
    hand.eventMode = 'none';
    app.stage.addChild(hand);

    const fadeIn  = 280;
    const pickHold = 200; // hold on the card briefly (simulate pick up)
    const drag    = 900; // slide from card → meld
    const dropHold = 250; // hold on the meld target
    const fadeOut = 250;
    const pause   = 300;
    const totalCycle = fadeIn + pickHold + drag + dropHold + fadeOut + pause;

    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      if (elapsed < fadeIn) {
        // Slide in from spawn → fromEnd + fade up
        const t = elapsed / fadeIn;
        const e = t * t * (3 - 2 * t);
        hand.x = spawn.x + (fromEnd.x - spawn.x) * e;
        hand.y = spawn.y + (fromEnd.y - spawn.y) * e;
        hand.alpha = e;
      } else if (elapsed < fadeIn + pickHold) {
        // Sit on the source card
        hand.x = fromEnd.x;
        hand.y = fromEnd.y;
        hand.alpha = 1;
      } else if (elapsed < fadeIn + pickHold + drag) {
        // Drag the pointer from source to destination (ease-in-out)
        const t = (elapsed - fadeIn - pickHold) / drag;
        const e = t * t * (3 - 2 * t);
        hand.x = fromEnd.x + (toEnd.x - fromEnd.x) * e;
        hand.y = fromEnd.y + (toEnd.y - fromEnd.y) * e;
        hand.alpha = 1;
      } else if (elapsed < fadeIn + pickHold + drag + dropHold) {
        // Sit on the drop target
        hand.x = toEnd.x;
        hand.y = toEnd.y;
        hand.alpha = 1;
      } else if (elapsed < fadeIn + pickHold + drag + dropHold + fadeOut) {
        // Fade out at the destination
        const t = (elapsed - fadeIn - pickHold - drag - dropHold) / fadeOut;
        hand.x = toEnd.x;
        hand.y = toEnd.y + t * 6;
        hand.alpha = 1 - t;
      } else {
        // Pause (invisible) before next cycle
        hand.alpha = 0;
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;
  }

  // Pointer sweeps horizontally across the whole hand (left → right, loop)
  async function createPointerSweepAcross(handCards) {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

    function endPosFor(card) {
      return {
        x: card.x + HAND_SCALED_W / 2 + 20,
        y: card.y + HAND_SCALED_H + 60,
      };
    }
    const firstEnd = endPosFor(handCards[0]);
    const lastEnd = endPosFor(handCards[handCards.length - 1]);
    const spawn = { x: firstEnd.x + 70, y: firstEnd.y + 70 };

    hand.x = spawn.x;
    hand.y = spawn.y;
    hand.alpha = 0;
    hand.eventMode = 'none';
    app.stage.addChild(hand);

    const fadeIn = 350, sweep = 1400, fadeOut = 300, pause = 300;
    const totalCycle = fadeIn + sweep + fadeOut + pause;
    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      if (elapsed < fadeIn) {
        const t = elapsed / fadeIn;
        const e = t * t * (3 - 2 * t);
        hand.x = spawn.x + (firstEnd.x - spawn.x) * e;
        hand.y = spawn.y + (firstEnd.y - spawn.y) * e;
        hand.alpha = e;
      } else if (elapsed < fadeIn + sweep) {
        const t = (elapsed - fadeIn) / sweep;
        const e = t * t * (3 - 2 * t);
        hand.x = firstEnd.x + (lastEnd.x - firstEnd.x) * e;
        hand.y = firstEnd.y + (lastEnd.y - firstEnd.y) * e;
        hand.alpha = 1;
      } else if (elapsed < fadeIn + sweep + fadeOut) {
        const t = (elapsed - fadeIn - sweep) / fadeOut;
        hand.x = lastEnd.x;
        hand.y = lastEnd.y + t * 6;
        hand.alpha = 1 - t;
      } else {
        hand.alpha = 0;
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;
  }

  // --- Toast ---
  function showToast(message, duration = 1500) {
    const text = new Text({
      text: message,
      style: {
        fontFamily: 'Arial Black, Arial',
        fontSize: 22,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 4 },
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    const pad = 18;
    const bg = new Graphics();
    const w = text.width + pad * 2;
    const h = text.height + pad;
    bg.roundRect(-w / 2, -h / 2, w, h, 14);
    bg.fill({ color: 0x000000, alpha: 0.82 });
    bg.stroke({ color: 0xFFD700, width: 2, alpha: 0.9 });

    const container = new Container();
    container.addChild(bg);
    container.addChild(text);
    container.x = GAME_WIDTH / 2;
    container.y = 880;
    container.alpha = 0;
    app.stage.addChild(container);

    const start = Date.now();
    const fadeDur = 180;
    const tick = () => {
      const el = Date.now() - start;
      if (el < fadeDur) container.alpha = el / fadeDur;
      else if (el < fadeDur + duration) container.alpha = 1;
      else if (el < fadeDur + duration + fadeDur) container.alpha = 1 - (el - fadeDur - duration) / fadeDur;
      else { container.parent?.removeChild(container); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // --- Meld button ---
  // Centered between player meld row (top) and hand row (bottom)
  async function createMeldButton() {
    const tex = await Assets.load(btnMeldUrl);
    const sprite = new Sprite(tex);
    const targetW = 220;
    const ratio = targetW / tex.width;
    sprite.width = targetW;
    sprite.height = tex.height * ratio;
    sprite.anchor.set(0.5);
    sprite.x = GAME_WIDTH / 2;
    sprite.y = (playerMeldY + MELD_SCALED_H + HAND_Y_S6) / 2;
    sprite.alpha = 0.5;
    sprite.tint = 0x888888;
    sprite.eventMode = 'none';
    sprite.cursor = 'default';
    sprite._enabled = false;
    sprite._baseScaleX = sprite.scale.x;
    sprite._baseScaleY = sprite.scale.y;
    return sprite;
  }

  function setMeldButtonEnabled(btn, enabled) {
    btn._enabled = enabled;
    btn.alpha = enabled ? 1 : 0.5;
    btn.tint = enabled ? 0xffffff : 0x888888;
    btn.eventMode = enabled ? 'static' : 'none';
    btn.cursor = enabled ? 'pointer' : 'default';
    if (enabled && !btn._pulseActive) {
      btn._pulseActive = true;
      let s = 1, dir = 1;
      const pulse = () => {
        s += dir * 0.006;
        if (s > 1.08) dir = -1;
        if (s < 1.0) dir = 1;
        btn.scale.x = btn._baseScaleX * s;
        btn.scale.y = btn._baseScaleY * s;
      };
      app.ticker.add(pulse);
      btn._pulseFn = pulse;
    }
  }

  const meldButton = await createMeldButton();
  meldButton.visible = false;
  meldButton.on('pointerdown', () => {
    if (!meldButton._enabled || resolved) return;
    runMeldFormation();
  });

  // ===================== STEP 1a: Tap 6♠ — brighten all hand cards, show Meld button =====================
  function onDiscardTap() {
    if (resolved || phase !== 1) return;
    unlockAudio();
    playBgm('bgm', 0.8);
    play('card');
    phase = 1.25; // user must pick meld cards
    if (discardCard) discardCard.eventMode = 'none';
    removeDiscardGlow();

    title.text = 'Pick cards to meld with 6♠';

    // Enable tap on all hand cards (all already bright)
    cards.forEach((card) => {
      card.eventMode = 'static';
      card.cursor = 'pointer';
    });

    // Show Meld button (disabled)
    setMeldButtonEnabled(meldButton, false);
    meldButton.visible = true;

    // Pointer sweeps across the whole hand
    setTimeout(() => createPointerSweepAcross(cards), 180);
  }

  // Pointer cycles between two targets (tap-style animation, mirrors S1/S3 flow)
  async function createPointerCycleBetween(targetA, targetB) {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

    function endPosFor(target) {
      return {
        x: target.x + HAND_SCALED_W / 2 + 20,
        y: target.y + HAND_SCALED_H + 60,
      };
    }
    const targets = [endPosFor(targetA), endPosFor(targetB)];
    hand.alpha = 0;
    hand.eventMode = 'none';
    app.stage.addChild(hand);

    const slideIn = 500, hold = 280, fadeOut = 220, pause = 200;
    const oneTap = slideIn + hold + fadeOut + pause;
    const totalCycle = oneTap * 2;
    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      const tapIdx = elapsed < oneTap ? 0 : 1;
      const local = elapsed - tapIdx * oneTap;
      const end = targets[tapIdx];
      const start = { x: end.x + 70, y: end.y + 70 };

      if (local < slideIn) {
        const t = local / slideIn;
        const e = t * t * (3 - 2 * t);
        hand.x = start.x + (end.x - start.x) * e;
        hand.y = start.y + (end.y - start.y) * e;
        hand.alpha = e;
      } else if (local < slideIn + hold) {
        hand.x = end.x; hand.y = end.y; hand.alpha = 1;
      } else if (local < slideIn + hold + fadeOut) {
        const t = (local - slideIn - hold) / fadeOut;
        hand.x = end.x; hand.y = end.y + t * 6; hand.alpha = 1 - t;
      } else {
        hand.alpha = 0;
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;
  }

  // ===================== STEP 1b: Pick meld cards =====================
  function onHandCardTap(card) {
    if (resolved || phase !== 1.25) return;
    const idx = card._origIdx;
    if (pickedIdx.has(idx)) return;

    if (!card._isMeldCard) {
      showToast("Can't meld with this card");
      return;
    }

    play('card');
    pickedIdx.add(idx);
    if (pickedIdx.size === 1) clearPointer();
    highlightCard(card, true);
    tweenTo(card, card.x, card.y - 24, 220);

    const totalMeldCards = getMeldCards().length;
    if (pickedIdx.size === totalMeldCards) {
      setMeldButtonEnabled(meldButton, true);
      title.text = 'Tap MELD!';
    }
  }

  // ===================== STEP 1c: Meld button tapped → form meld =====================
  function runMeldFormation() {
    if (resolved || phase !== 1.25) return;
    play('process');
    phase = 2;
    clearPointer();
    setMeldButtonEnabled(meldButton, false);
    meldButton.visible = false;

    // Disable meld cards + clear highlight
    getMeldCards().forEach((c) => {
      c.eventMode = 'none';
      highlightCard(c, false);
    });

    // Find meld cards sorted by value (4♠ left, 5♠ right, 6♠ = discardCard)
    const meldCardsArr = getMeldCards();
    const card4 = meldCardsArr.find((c) => handData[c._origIdx].value === '4');
    const card5 = meldCardsArr.find((c) => handData[c._origIdx].value === '5');

    const newMeldSlots = [
      { x: newMeldStartX,                      y: newMeldRowY },
      { x: newMeldStartX + NEW_MELD_STEP,      y: newMeldRowY },
      { x: newMeldStartX + NEW_MELD_STEP * 2,  y: newMeldRowY },
    ];

    // Re-stack for z-order
    app.stage.addChild(card4);
    app.stage.addChild(card5);
    app.stage.addChild(discardCard);

    tweenTo(card4, newMeldSlots[0].x, newMeldSlots[0].y, 500);
    tweenScale(card4, MELD_SCALE, 500);
    tweenTo(card5, newMeldSlots[1].x, newMeldSlots[1].y, 500);
    tweenScale(card5, MELD_SCALE, 500);
    tweenTo(discardCard, newMeldSlots[2].x, newMeldSlots[2].y, 500);
    tweenScale(discardCard, MELD_SCALE, 500);

    newMeldCards.push(card4, card5, discardCard);
    newMeldEndX = newMeldSlots[2].x + MELD_SCALED_W;

    // Re-layout remaining hand cards (8♥, Q♥, Q♠) to center
    setTimeout(() => relayoutRemainingHand(), 400);

    setTimeout(() => {
      title.text = 'Drag 8♥ to opponent meld!';
      startStep2();
    }, 850);
  }

  // ===================== STEP 2: Drag 8♥ → opponent meld (left side) =====================
  function startStep2() {
    const eightHearts = getLayoff8HCard();
    highlightCard(eightHearts, true);
    enableCardDrag(eightHearts, eightHearts._origIdx, 'step2');
    // Drag hint: pointer slides from source card UP to OPPONENT MELD (left side).
    // Target Y is the BOTTOM of the meld so the fingertip lands directly on the meld.
    const firstOpp = oppMeldCards[0];
    createDragHintPointer(
      {
        x: eightHearts.x + HAND_SCALED_W / 2,
        y: eightHearts.y + HAND_SCALED_H,
      },
      {
        x: firstOpp.x + MELD_SCALED_W / 2,
        y: firstOpp.y + MELD_SCALED_H,
      }
    );
  }

  // ===================== STEP 3: Drag Q♥ → opponent meld (right side) =====================
  function startStep3() {
    const qHeart = getLayoffQHCard();
    highlightCard(qHeart, true);
    enableCardDrag(qHeart, qHeart._origIdx, 'step3');
    // Drag hint: pointer slides from source card UP to OPPONENT MELD (right side).
    // Target Y is the BOTTOM of the meld so the fingertip lands directly on the meld.
    const lastOpp = oppMeldCards[oppMeldCards.length - 1];
    createDragHintPointer(
      {
        x: qHeart.x + HAND_SCALED_W / 2,
        y: qHeart.y + HAND_SCALED_H,
      },
      {
        x: lastOpp.x + MELD_SCALED_W / 2,
        y: lastOpp.y + MELD_SCALED_H,
      }
    );
  }

  function enableCardDrag(card, origIdx, step) {
    card.eventMode = 'static';
    card.cursor = 'pointer';
    if (card._dragEnabled) return;
    card._dragEnabled = true;

    let dragging = false;
    let offset = { x: 0, y: 0 };

    card.on('pointerdown', (ev) => {
      if (resolved) return;
      unlockAudio();
      play('card');
      dragging = true;
      offset.x = card.x - ev.global.x;
      offset.y = card.y - ev.global.y;
      app.stage.removeChild(card);
      app.stage.addChild(card);
      clearPointer();
    });

    card.on('globalpointermove', (ev) => {
      if (!dragging) return;
      card.x = ev.global.x + offset.x;
      card.y = ev.global.y + offset.y;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      const cx = card.x + HAND_SCALED_W / 2;
      const cy = card.y + HAND_SCALED_H / 2;

      if (isInsideRect(cx, cy, getOppMeldBounds())) {
        if (step === 'step2') handleEightHeartsDrop(card);
        else if (step === 'step3') handleQHeartsDrop(card);
      } else {
        const hx = card._homeX ?? homePos[origIdx].x;
        const hy = card._homeY ?? homePos[origIdx].y;
        tweenTo(card, hx, hy, 250);
        // Re-insert card into stage at the position that preserves hand z-order
        // (cards in hand should share the same z-layer, sorted by original index)
        setTimeout(() => {
          restoreHandZOrder();
          if (resolved) return;
          if (step === 'step2' && phase === 2) startStep2();
          else if (step === 'step3' && phase === 3) startStep3();
        }, 280);
      }
    };
    card.on('pointerup', endDrag);
    card.on('pointerupoutside', endDrag);
  }

  function getOppMeldBounds() {
    const first = oppMeldCards[0];
    const last = oppMeldCards[oppMeldCards.length - 1];
    return {
      x: first.x - 20,
      y: first.y - 20,
      w: (last.x + MELD_SCALED_W) - first.x + 80,
      h: MELD_SCALED_H + 40,
    };
  }

  function getNewMeldBounds() {
    if (newMeldCards.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const first = newMeldCards[0];
    const last = newMeldCards[newMeldCards.length - 1];
    return {
      x: first.x - 20,
      y: first.y - 20,
      w: (last.x + MELD_SCALED_W) - first.x + 80,
      h: MELD_SCALED_H + 40,
    };
  }

  function isInsideRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // Drop 8♥ on the LEFT of opponent meld — shift existing meld right to make space
  function handleEightHeartsDrop(card) {
    play('process');
    phase = 3;
    clearPointer();
    card.eventMode = 'none';
    highlightCard(card, false);

    card._laidOff = true;

    // Shift existing opp meld cards to the right by one card-slot
    const shift = (MELD_SCALED_W - 12);
    const firstOpp = oppMeldCards[0];
    const targetX = firstOpp.x;
    const targetY = firstOpp.y;
    oppMeldCards.forEach((c) => tweenTo(c, c.x + shift, c.y, 400));

    // 8♥ flies to the old position of the first opp card (before shift)
    tweenTo(card, targetX, targetY, 400);
    tweenScale(card, MELD_SCALE, 400);
    // Z-order: 8♥ must be BELOW all existing opp cards (left-most = bottom of overlap stack)
    // Remove 8♥ from stage and re-insert BEFORE the first opp card
    card.parent?.removeChild(card);
    app.stage.addChildAt(card, app.stage.getChildIndex(firstOpp));
    oppMeldCards.unshift(card);

    // Re-layout remaining hand (Q♥, Q♠)
    setTimeout(() => relayoutRemainingHand(), 420);

    setTimeout(() => {
      title.text = 'Drag Q♥ to opponent meld!';
      startStep3();
    }, 700);
  }

  // Re-insert hand cards into stage ordered left→right so right card overlaps left (natural stack)
  function restoreHandZOrder() {
    const remaining = cards
      .filter((c) => !c._isMeldCard && !c._laidOff && c.parent)
      .sort((a, b) => a.x - b.x);
    remaining.forEach((c) => {
      app.stage.removeChild(c);
      app.stage.addChild(c);
    });
    // Keep Meld button (if visible) and footer on top
    if (meldButton && meldButton.parent) {
      app.stage.removeChild(meldButton);
      app.stage.addChild(meldButton);
    }
  }

  // Re-layout only cards still physically in hand (not melded, not laid off)
  function relayoutRemainingHand() {
    const remaining = cards.filter((c) => !c._isMeldCard && !c._laidOff);
    if (remaining.length === 0) return;
    const slots = computeHandSlots(GAME_WIDTH, remaining.length, HAND_Y_S6);
    remaining.forEach((c, i) => {
      c._homeX = slots[i].x;
      c._homeY = slots[i].y;
      tweenTo(c, slots[i].x, slots[i].y, 350);
    });
  }

  // Drop Q♥ on the RIGHT of opponent meld
  function handleQHeartsDrop(card) {
    play('process');
    phase = 4;
    clearPointer();
    card.eventMode = 'none';
    highlightCard(card, false);
    card._laidOff = true;
    const last = oppMeldCards[oppMeldCards.length - 1];
    const targetX = last.x + (MELD_SCALED_W - 12);
    const targetY = last.y;
    tweenTo(card, targetX, targetY, 400);
    tweenScale(card, MELD_SCALE, 400);
    oppMeldCards.push(card);

    // Re-layout remaining hand (just Q♠)
    setTimeout(() => relayoutRemainingHand(), 420);

    setTimeout(() => {
      title.text = 'Tap KNOCK to win!';
      showKnockButton();
    }, 700);
  }

  async function showKnockButton() {
    const tex = await Assets.load(knockBtnUrl);
    const btn = new Sprite(tex);
    btn.anchor.set(0.5);
    const targetW = 220;
    btn.width = targetW;
    btn.height = targetW * (tex.height / tex.width);
    // Position above the hand row to avoid overlapping 8♠
    btn.x = GAME_WIDTH / 2;
    btn.y = PLAYER_HAND_Y - 70;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    app.stage.addChild(btn);

    let s = 1, grow = true;
    const tick = () => {
      if (!btn.parent) return;
      grow ? s += 0.006 : s -= 0.006;
      if (s > 1.1) grow = false;
      if (s < 0.95) grow = true;
      btn.scale.set(s);
    };
    app.ticker.add(tick);

    btn.on('pointerdown', () => {
      play('card');
      app.ticker.remove(tick);
      btn.parent.removeChild(btn);
      triggerKnock();
    });

    // Fingertip should reach the BOTTOM edge of the KNOCK button at its highest point
    createSmoothTapPointerAtFingertip(btn.x, btn.y + btn.height / 2 + 45);
  }

  function triggerKnock() {
    resolved = true;
    stopTimer();
    clearPointer();

    title.text = 'KNOCK! CLEAR HAND!';

    // Q♠ flies down to discard pile (replacing the 6♠ we melded away)
    const knockCard = getKnockCard();
    knockCard.eventMode = 'none';
    highlightCard(knockCard, false);
    // Remove old discard card if still on stage
    if (discardCard && discardCard.parent && discardCard !== knockCard) {
      // discardCard (6♠) was moved into the new meld already — leave it there
    }
    const discardTargetX = centerZone.discard.x;
    const discardTargetY = centerZone.discard.y;
    tweenTo(knockCard, discardTargetX, discardTargetY, 500);
    tweenScale(knockCard, DECK_SCALE, 500);

    // +600ms: KNOCK banner pop-in
    setTimeout(() => showKnockBanner(app), 600);

    // +1200ms: chip rain (gold falling)
    setTimeout(() => { createChipRain(app, GAME_WIDTH, GAME_HEIGHT); play('coin', { concurrent: true }); }, 1200);

    // +5 seconds after knock banner → open store (CTA)
    stopBgm();
    setTimeout(() => openUrl(STORE_URL), 5000);
  }

  // Register pointerdown handlers on all hand cards (they activate in Phase 1.25)
  cards.forEach((card) => {
    card.on('pointerdown', () => onHandCardTap(card));
  });

  // ===================== AUTO INTRO (Phase 0, ~3s) =====================
  // Bot draws from deck → bot discards 6♠ → interactive phase
  async function runAutoIntro() {
    const finalData = getFinalDiscard(); // 6♠
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    // --- Step A: Bot draws from deck (card back flies from deck to bot hand area) ---
    title.text = "Opponent's turn…";
    const deckX = centerZone.deck.x;
    const deckY = centerZone.deck.y;
    const botTargetX = oppHandStartX + oppHandCount * oppHandEff;
    const botTargetY = oppHandY;

    await new Promise((resolve) => {
      const back = createCardBack(oppHandScale);
      back.x = deckX;
      back.y = deckY;
      back.alpha = 0;
      app.stage.addChild(back);
      const startTime = Date.now();
      const duration = 600;
      const tick = () => {
        const t = Math.min((Date.now() - startTime) / duration, 1);
        const e = t * t * (3 - 2 * t);
        back.x = deckX + (botTargetX - deckX) * e;
        back.y = deckY + (botTargetY - deckY) * e;
        back.alpha = Math.min(1, t * 2);
        if (t < 1) requestAnimationFrame(tick);
        else {
          // Fade the drawn card back into the bot hand (merge visually)
          setTimeout(() => {
            back.parent?.removeChild(back);
            resolve();
          }, 150);
        }
      };
      requestAnimationFrame(tick);
    });

    await wait(200);

    // --- Step B: Bot discards 6♠ (fly from bot hand area to discard pile) ---
    title.text = 'Opponent discards 6♠!';
    await new Promise((resolve) => {
      const sprite = createCardSprite(finalData);
      const fromX = oppHandStartX + 60;
      const fromY = oppHandY + 20;
      sprite.scale.set(oppHandScale);
      sprite.x = fromX;
      sprite.y = fromY;
      sprite.alpha = 0;
      app.stage.addChild(sprite);
      const startTime = Date.now();
      const duration = 700;
      const tx = centerZone.discard.x;
      const ty = centerZone.discard.y;
      const startScale = oppHandScale;
      const tick = () => {
        const t = Math.min((Date.now() - startTime) / duration, 1);
        const e = t * t * (3 - 2 * t);
        sprite.x = fromX + (tx - fromX) * e;
        sprite.y = fromY + (ty - fromY) * e;
        sprite.alpha = Math.min(1, t * 2);
        const sc = startScale + (DECK_SCALE - startScale) * e;
        sprite.scale.set(sc);
        if (t < 1) requestAnimationFrame(tick);
        else {
          discardCard = sprite;
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });

    await wait(200);

    // Start interactive phase
    startInteractivePhase();
  }

  function startInteractivePhase() {
    if (resolved) return;
    phase = 1;
    title.text = 'Tap 6♠ to grab it!';
    // Make the new 6♠ discard interactive
    if (discardCard) {
      discardCard.eventMode = 'static';
      discardCard.cursor = 'pointer';
      discardCard.on('pointerdown', onDiscardTap);
    }
    addDiscardGlowPulse();
    // Hint pointer on discard
    createSmoothTapPointer({
      x: centerZone.discard.x + DECK_SCALED_W / 2,
      y: centerZone.discard.y + CARD_HEIGHT * DECK_SCALE,
    });
    // Show timer and start countdown
    timer.visible = true;
    startTimerCountdown();
  }

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

  // Meld button sits above the bottom bar so it's visible during Phase 1.25
  app.stage.addChild(meldButton);

  const footerBtns = await createFooterButtons(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(footerBtns);

  const ctaOverlay = createCTAOverlay(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(ctaOverlay);

  function startTimerCountdown() {
    let timeLeft = 20;
    updateTimerText(timer, timeLeft);
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
  }

  app.ticker.add(() => {
    if (ctaOverlay.visible && ctaOverlay._animateCTA) ctaOverlay._animateCTA();
  });

  // Kick off the auto intro
  runAutoIntro();
}

function spawnFloatingScore(app, text, x, y, fillColor, strokeColor) {
  const t = new Text({
    text,
    style: {
      fontFamily: 'Arial Black',
      fontSize: 64,
      fontWeight: 'bold',
      fill: fillColor,
      stroke: { color: strokeColor, width: 8 },
      dropShadow: { color: '#000', blur: 6, distance: 4, alpha: 0.7 },
    },
  });
  t.anchor.set(0.5, 1);
  const startY = y;
  t.x = x; t.y = startY;
  t.scale.set(0);
  app.stage.addChild(t);
  const animStart = Date.now();
  const popDur = 300;
  const floatDur = 1500;
  const tick = () => {
    const el = Date.now() - animStart;
    if (el < popDur) {
      const k = el / popDur;
      const e = k * k * (3 - 2 * k);
      t.scale.set(e * 1.2);
    } else if (el < popDur + 100) {
      t.scale.set(1.2 - (el - popDur) / 100 * 0.2);
    } else if (el < popDur + 100 + floatDur) {
      t.scale.set(1);
      const k = (el - popDur - 100) / floatDur;
      t.y = startY - k * 80;
      t.alpha = 1 - k;
    } else {
      t.parent?.removeChild(t);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function showKnockBanner(app) {
  try {
    // Dark backdrop behind the banner so it pops out
    const bgTex = await Assets.load(rummyBgUrl);
    const backdrop = new Sprite(bgTex);
    backdrop.width = 640;
    backdrop.height = 1136;
    backdrop.alpha = 0;
    app.stage.addChild(backdrop);
    const bdStart = Date.now();
    const bdFadeIn = () => {
      const t = Math.min((Date.now() - bdStart) / 300, 1);
      backdrop.alpha = t * 0.75;
      if (t < 1) requestAnimationFrame(bdFadeIn);
    };
    requestAnimationFrame(bdFadeIn);

    const tex = await Assets.load(knockBannerUrl);
    const banner = new Sprite(tex);
    banner.anchor.set(0.5);
    banner.width = 640 * 0.85;
    banner.height = banner.width * (tex.height / tex.width);
    banner.x = 320;
    banner.y = 850; // appear over the empty player hand area
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
  } catch (e) { console.warn('Knock banner failed', e); }
}

async function showRummyBanner(app) {
  try {
    // Dark backdrop behind the banner so it pops out
    const bgTex = await Assets.load(rummyBgUrl);
    const backdrop = new Sprite(bgTex);
    backdrop.width = 640;
    backdrop.height = 1136;
    backdrop.alpha = 0;
    app.stage.addChild(backdrop);
    const bdStart = Date.now();
    const bdFadeIn = () => {
      const t = Math.min((Date.now() - bdStart) / 300, 1);
      backdrop.alpha = t * 0.75;
      if (t < 1) requestAnimationFrame(bdFadeIn);
    };
    requestAnimationFrame(bdFadeIn);

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
  } catch (e) { console.warn('Rummy banner failed', e); }
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
    t1.anchor.set(0.5, 1); t1.x = x + btnW / 2; t1.y = btnY + btnH / 2 + 1;
    container.addChild(t1);
    const t2 = new Text({ text: label2, style: { fontFamily: 'Arial Black, Arial', fontSize: 17, fontWeight: 'bold', fill: '#ffffff' } });
    t2.anchor.set(0.5, 0); t2.x = x + btnW / 2; t2.y = btnY + btnH / 2 + 2;
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
