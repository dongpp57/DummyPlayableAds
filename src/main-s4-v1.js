/**
 * Main entry — Dummy Playable Ad Scenario S4 V1
 * Pillar: Đa dạng action | Win: Ăn + Lay off + Knock combo
 * Canvas: 640x1136 | 1v1 layout
 *
 * Pre-game:
 *   Player meld [3♠ 4♠ 5♠], Opponent meld [9♥ 10♥ J♥]
 *   Player hand: 5♣ 6♣ Q♥ 8♣
 *   Opponent discarded 7♣
 *
 * Flow:
 *   S1: Tap 7♣ → meld [5♣ 6♣ 7♣]
 *   S2: Drag Q♥ → opponent meld → [9♥ 10♥ J♥ Q♥]
 *   S3: Drag 8♣ → own clubs meld → [5♣ 6♣ 7♣ 8♣]
 *   S4: Tap KNOCK → WIN
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
  getPlayerHand, getPlayerExistingMeld, getOpponentMeld, getOpponentDiscard, getOpenCard,
  TAP_CARDS_STEP1, LAYOFF_Q_INDEX, DISCARD_INDEX,
} from './card-data-s4-v1.js';
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

// S4 cards: 5♣ 6♣ Q♥ 8♣ (hand) + 3♠ 4♠ 5♠ (player meld) + 9♥ 10♥ J♥ (opp meld) + 7♣ (discard) + A♦ (open) = 12
import card5clubs from '../res/common/composed/5_clubs.webp?url';
import card6clubs from '../res/common/composed/6_clubs.webp?url';
import cardQhearts from '../res/common/composed/Q_hearts.webp?url';
import card8spades from '../res/common/composed/8_spades.webp?url';
import card3spades from '../res/common/composed/3_spades.webp?url';
import card4spades from '../res/common/composed/4_spades.webp?url';
import card5spades from '../res/common/composed/5_spades.webp?url';
import card9hearts from '../res/common/composed/9_hearts.webp?url';
import card10hearts from '../res/common/composed/10_hearts.webp?url';
import cardJhearts from '../res/common/composed/J_hearts.webp?url';
import card7clubs from '../res/common/composed/7_clubs.webp?url';
import cardAdiamonds from '../res/common/composed/A_diamonds.webp?url';
registerCardTexture('5_clubs',    card5clubs);
registerCardTexture('6_clubs',    card6clubs);
registerCardTexture('Q_hearts',   cardQhearts);
registerCardTexture('8_spades',   card8spades);
registerCardTexture('3_spades',   card3spades);
registerCardTexture('4_spades',   card4spades);
registerCardTexture('5_spades',   card5spades);
registerCardTexture('9_hearts',   card9hearts);
registerCardTexture('10_hearts',  card10hearts);
registerCardTexture('J_hearts',   cardJhearts);
registerCardTexture('7_clubs',    card7clubs);
registerCardTexture('A_diamonds', cardAdiamonds);

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

  const title = createTitle(GAME_WIDTH, 140);
  title.text = 'Grab 7♣ and knock!';
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

  const discardData = getOpponentDiscard();
  const discardCard = createCardSprite(discardData);
  discardCard.scale.set(DECK_SCALE);
  discardCard.x = centerZone.discard.x;
  discardCard.y = centerZone.discard.y;
  discardCard.eventMode = 'static';
  discardCard.cursor = 'pointer';
  app.stage.addChild(discardCard);

  const discardGlow = new Graphics();
  discardGlow.roundRect(
    centerZone.discard.x - 6, centerZone.discard.y - 6,
    DECK_SCALED_W + 12, CARD_HEIGHT * DECK_SCALE + 12, 12,
  );
  discardGlow.stroke({ color: 0xFFD700, width: 4, alpha: 1 });
  app.stage.addChildAt(discardGlow, app.stage.getChildIndex(discardCard));
  let glowAlpha = 1, glowDir = -1;
  app.ticker.add(() => {
    glowAlpha += glowDir * 0.02;
    if (glowAlpha < 0.4) glowDir = 1;
    if (glowAlpha > 1) glowDir = -1;
    discardGlow.alpha = glowAlpha;
  });

  // --- Player's pre-existing meld on table (left of PLAYER_MELD_Y row) ---
  const playerMeldData = getPlayerExistingMeld();
  const playerMeldY = PLAYER_MELD_Y;
  const playerMeldStartX = 40;
  const playerMeldCards = [];
  for (let i = 0; i < playerMeldData.length; i++) {
    const card = createCardSprite(playerMeldData[i]);
    card.scale.set(MELD_SCALE);
    card.x = playerMeldStartX + i * (MELD_SCALED_W - 12);
    card.y = playerMeldY;
    app.stage.addChild(card);
    playerMeldCards.push(card);
  }
  const yourMeldLabel = new Text({
    text: 'YOUR MELD',
    style: { fontFamily: 'Arial Black', fontSize: 10, fill: '#FFD700', stroke: { color: '#000', width: 2 } },
  });
  yourMeldLabel.anchor.set(0, 1);
  yourMeldLabel.x = playerMeldStartX;
  yourMeldLabel.y = playerMeldY - 2;
  app.stage.addChild(yourMeldLabel);

  // Right side of row: reserved for new clubs meld [5♣ 6♣ 7♣]
  const newMeldStartX = 340;

  // --- Player hand (4 cards) ---
  // Tag each card by role BEFORE shuffling so we can track them after visual shuffle
  const origHand = getPlayerHand();
  const meldKeys = new Set(TAP_CARDS_STEP1.map((i) => `${origHand[i].value}_${origHand[i].suit}`));
  const layoffKey = `${origHand[LAYOFF_Q_INDEX].value}_${origHand[LAYOFF_Q_INDEX].suit}`;
  const discardKey = `${origHand[DISCARD_INDEX].value}_${origHand[DISCARD_INDEX].suit}`;

  // Fisher-Yates shuffle
  const handData = getPlayerHand();
  for (let i = handData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [handData[i], handData[j]] = [handData[j], handData[i]];
  }

  const handSlots = computeHandSlots(GAME_WIDTH, handData.length);
  const cards = [];
  const homePos = handSlots.map(s => ({ x: s.x, y: s.y }));
  for (let i = 0; i < handData.length; i++) {
    const card = createCardSprite(handData[i]);
    card.scale.set(HAND_SCALE);
    card.x = homePos[i].x;
    card.y = homePos[i].y;
    card._origIdx = i;
    const key = `${handData[i].value}_${handData[i].suit}`;
    card._isMeldCard = meldKeys.has(key);
    card._isLayoff = key === layoffKey;
    card._isDiscard = key === discardKey;
    card.eventMode = 'none';
    // Start dimmed; brighten when user taps 7♣ (Phase 1 → Phase 1.5)
    card.tint = 0x888888;
    app.stage.addChild(card);
    cards.push(card);
  }
  // Helper lookups for post-shuffle references
  const getLayoffCard = () => cards.find((c) => c._isLayoff);
  const getDiscardHandCard = () => cards.find((c) => c._isDiscard);
  const getMeldCards = () => cards.filter((c) => c._isMeldCard);

  // --- State ---
  // Phase 1: tap discard 7♣
  // Phase 1.25: all hand cards lit, pointer sweeps, Meld button disabled — user picks meld cards
  // Phase 2: Meld button tapped → meld [5♣ 6♣ 7♣] forms, move to Step 2 (drag Q♥)
  // Phase 3: Q♥ layoff done → KNOCK
  let phase = 1;
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

  async function createDragHintPointer(sourceCard, targetX, targetY) {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);
    const startX = sourceCard.x + HAND_SCALED_W / 2 + 20;
    const startY = sourceCard.y + HAND_SCALED_H + 40;
    const endX = targetX;
    const endY = targetY + 40;
    hand.x = startX; hand.y = startY; hand.alpha = 0;
    hand.eventMode = 'none'; // let clicks pass through to the card below
    app.stage.addChild(hand);
    const pause = 200, move = 900, fadeOut = 200, restPause = 300;
    const totalCycle = pause + move + fadeOut + restPause;
    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      if (elapsed < pause) {
        hand.x = startX; hand.y = startY; hand.alpha = 1;
      } else if (elapsed < pause + move) {
        const t = (elapsed - pause) / move;
        const e = t * t * (3 - 2 * t);
        hand.x = startX + (endX - startX) * e;
        hand.y = startY + (endY - startY) * e;
        hand.alpha = 1;
      } else if (elapsed < pause + move + fadeOut) {
        const t = (elapsed - pause - move) / fadeOut;
        hand.x = endX; hand.y = endY; hand.alpha = 1 - t;
      } else {
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
  async function createMeldButton() {
    const tex = await Assets.load(btnMeldUrl);
    const sprite = new Sprite(tex);
    const targetW = 240;
    const ratio = targetW / tex.width;
    sprite.width = targetW;
    sprite.height = tex.height * ratio;
    sprite.anchor.set(0.5);
    sprite.x = GAME_WIDTH / 2;
    sprite.y = 770;
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

  // ===================== STEP 1a: Tap 7♣ — brighten all hand cards, show Meld button =====================
  function onDiscardTap() {
    if (resolved || phase !== 1) return;
    phase = 1.25; // user must pick meld cards
    discardCard.eventMode = 'none';
    discardGlow.parent?.removeChild(discardGlow);

    title.text = 'Pick cards to meld with 7♣';

    // Brighten ALL hand cards + enable tap on all
    cards.forEach((card) => {
      card.tint = 0xffffff;
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
    phase = 2;
    clearPointer();
    setMeldButtonEnabled(meldButton, false);
    meldButton.visible = false;

    // Disable meld cards + clear highlight
    getMeldCards().forEach((c) => {
      c.eventMode = 'none';
      highlightCard(c, false);
    });

    // Find meld cards sorted by value (5♣ left, 6♣ right)
    const meldCards = getMeldCards();
    const card5 = meldCards.find((c) => handData[c._origIdx].value === '5');
    const card6 = meldCards.find((c) => handData[c._origIdx].value === '6');

    const newMeldSlots = [
      { x: newMeldStartX,                            y: PLAYER_MELD_Y },
      { x: newMeldStartX + (MELD_SCALED_W - 12),     y: PLAYER_MELD_Y },
      { x: newMeldStartX + (MELD_SCALED_W - 12) * 2, y: PLAYER_MELD_Y },
    ];

    // Re-stack for z-order
    app.stage.addChild(card5);
    app.stage.addChild(card6);
    app.stage.addChild(discardCard);

    tweenTo(card5, newMeldSlots[0].x, newMeldSlots[0].y, 500);
    tweenScale(card5, MELD_SCALE, 500);
    tweenTo(card6, newMeldSlots[1].x, newMeldSlots[1].y, 500);
    tweenScale(card6, MELD_SCALE, 500);
    tweenTo(discardCard, newMeldSlots[2].x, newMeldSlots[2].y, 500);
    tweenScale(discardCard, MELD_SCALE, 500);

    newMeldCards.push(card5, card6, discardCard);
    newMeldEndX = newMeldSlots[2].x + MELD_SCALED_W;

    setTimeout(() => {
      title.text = 'Drag Q♥ to opponent meld!';
      startStep2();
    }, 700);
  }

  // ===================== STEP 2: Drag Q♥ =====================
  function startStep2() {
    const qHeart = getLayoffCard();
    qHeart.tint = 0xffffff;
    highlightCard(qHeart, true);
    enableCardDrag(qHeart, qHeart._origIdx);

    const lastOpp = oppMeldCards[oppMeldCards.length - 1];
    const oppTargetX = lastOpp.x + MELD_SCALED_W + 10;
    const oppTargetY = oppMeldY + MELD_SCALED_H / 2;
    createDragHintPointer(qHeart, oppTargetX, oppTargetY);
  }


  function enableCardDrag(card, origIdx) {
    card.eventMode = 'static';
    card.cursor = 'pointer';
    // Avoid double-register
    if (card._dragEnabled) return;
    card._dragEnabled = true;

    let dragging = false;
    let offset = { x: 0, y: 0 };

    card.on('pointerdown', (ev) => {
      if (resolved) return;
      dragging = true;
      offset.x = card.x - ev.global.x;
      offset.y = card.y - ev.global.y;
      app.stage.removeChild(card);
      app.stage.addChild(card);
      clearPointer();
    });

    // Pixi v8: use globalpointermove on the card so it fires regardless of
    // whether the cursor is still over the card during fast drags.
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

      if (card._isLayoff) {
        if (isInsideRect(cx, cy, getOppMeldBounds())) {
          handleQHeartDrop(card);
        } else {
          tweenTo(card, homePos[origIdx].x, homePos[origIdx].y, 250);
          setTimeout(() => { if (!resolved && phase === 2) startStep2(); }, 280);
        }
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

  function handleQHeartDrop(card) {
    phase = 3;
    clearPointer();
    card.eventMode = 'none';
    highlightCard(card, false);
    const last = oppMeldCards[oppMeldCards.length - 1];
    const targetX = last.x + (MELD_SCALED_W - 12);
    const targetY = last.y;
    tweenTo(card, targetX, targetY, 400);
    tweenScale(card, MELD_SCALE, 400);
    oppMeldCards.push(card);

    setTimeout(() => {
      title.text = 'Tap KNOCK to win!';
      showKnockButton();
    }, 500);
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

    title.text = 'KNOCK!';

    // 8♠ flies down to discard pile (right side of open card A♦)
    const eightSpades = getDiscardHandCard();
    eightSpades.eventMode = 'none';
    highlightCard(eightSpades, false);
    const discardTargetX = centerZone.discard.x;
    const discardTargetY = centerZone.discard.y;
    tweenTo(eightSpades, discardTargetX, discardTargetY, 500);
    tweenScale(eightSpades, DECK_SCALE, 500);

    // +600ms: KNOCK banner pop-in
    setTimeout(() => showKnockBanner(app), 600);

    // +1200ms: chip rain (gold falling)
    setTimeout(() => createChipRain(app, GAME_WIDTH, GAME_HEIGHT), 1200);

    // +3 seconds after knock banner → open store (CTA)
    setTimeout(() => openUrl(STORE_URL), 3600);
  }

  // --- Phase 1 entry ---
  discardCard.on('pointerdown', onDiscardTap);
  cards.forEach((card) => {
    card.on('pointerdown', () => onHandCardTap(card));
  });
  createSmoothTapPointer({
    x: centerZone.discard.x + DECK_SCALED_W / 2,
    y: centerZone.discard.y + CARD_HEIGHT * DECK_SCALE,
  });

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
