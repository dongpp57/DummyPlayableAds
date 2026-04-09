/**
 * Main entry — Dummy Playable Ad Scenario S3 V1
 * Pillar: Moment điểm thưởng phạt | Win: Ăn Spe-to (+50)
 * Canvas: 640x1136 | 1v1 layout
 *
 * Spe-to Q♠ (lá vàng đặc biệt) ở center. Player tap J♠ + K♠ → meld [J♠,Q♠,K♠] → +50!
 */
import { Application, Sprite, NineSliceSprite, Assets, Container, Graphics, Text } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import bgImageUrl from '../res/DummyAsset/Background1.webp?url';
import iconDummyUrl from '../Logo/iconDummy.webp?url';
import imgHandUrl from '../res/style-1/img_hand.webp?url';
import imgHeaderUrl from '../res/style-1/img_header.webp?url';
import slotWhiteUrl from '../res/style-1/slot_white.webp?url';
import btnMeldUrl from '../res/DummyAsset/Btn Meld.png?url';
import { getInitialHand, getOpenCard, getSpeToCard, MELD_CARD_INDICES } from './card-data-s3-v1.js';
import {
  computeHandSlots, computeMeldSlots, computeCenterZone,
  createCardBack, createDeckPile, createDiscardPile, createBotAvatar,
  HAND_SCALE, MELD_SCALE, DECK_SCALE,
  HAND_SCALED_W, HAND_SCALED_H, MELD_SCALED_W, MELD_SCALED_H, DECK_SCALED_W,
  BOT_MELD_Y, CENTER_ZONE_Y, PLAYER_MELD_Y, PLAYER_HAND_Y,
} from './table-layout.js';
import { createCardSprite, preloadCardTextures, registerCardTexture, highlightCard, CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';
import { createTopBar, createTitle, createProgressSection, createTimer, updateTimerText, updateProgressFill, updateIQ } from './ui-header.js';
import { createCTAOverlay } from './cta-overlay.js';
import { createChipRain } from './chip-rain.js';
import { openUrl } from './open-store.js';

// S3 cards: J♠ 5♥ 8♦ K♠ 4♣ 9♥ 3♠ (hand) + Q♠ (Spe-to) + 7♦ (open card) = 9 unique
import cardJspades   from '../res/common/composed/J_spades.webp?url';
import card5hearts   from '../res/common/composed/5_hearts.webp?url';
import card8diamonds from '../res/common/composed/8_diamonds.webp?url';
import cardKspades   from '../res/common/composed/K_spades.webp?url';
import card4clubs    from '../res/common/composed/4_clubs.webp?url';
import card9hearts   from '../res/common/composed/9_hearts.webp?url';
import card3spades   from '../res/common/composed/3_spades.webp?url';
import cardQspades   from '../res/common/composed/Q_spades.webp?url';
import card7diamonds from '../res/common/composed/7_diamonds.webp?url';
registerCardTexture('J_spades',    cardJspades);
registerCardTexture('5_hearts',    card5hearts);
registerCardTexture('8_diamonds',  card8diamonds);
registerCardTexture('K_spades',    cardKspades);
registerCardTexture('4_clubs',     card4clubs);
registerCardTexture('9_hearts',    card9hearts);
registerCardTexture('3_spades',    card3spades);
registerCardTexture('Q_spades',    cardQspades);
registerCardTexture('7_diamonds',  card7diamonds);

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

  // --- Header ---
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
  title.text = 'Spe-to is gold! +50 bonus!';
  app.stage.addChild(title);
  let titleScale = 1, titleGrowing = true;
  app.ticker.add(() => {
    titleGrowing ? (titleScale += 0.003) : (titleScale -= 0.003);
    if (titleScale >= 1.08) titleGrowing = false;
    if (titleScale <= 1.0) titleGrowing = true;
    title.scale.set(titleScale);
  });

  // --- Timer (no IQ bar for opponent scenarios) ---
  const timer = await createTimer(GAME_WIDTH - 75, 230);
  app.stage.addChild(timer);

  // --- Bot avatar (top-left corner) + compact bot hand fan ---
  const botAvatar = createBotAvatar(50, 290, 'OPPONENT');
  app.stage.addChild(botAvatar);

  // Bot hand: 7 face-down cards in a compact horizontal stack next to avatar
  const botCardScale = 0.4;
  const botCardW = CARD_WIDTH * botCardScale;
  const botOverlap = 26;
  const botEff = botCardW - botOverlap;
  const botStartX = 100;
  const botY = 270;
  for (let i = 0; i < 7; i++) {
    const back = createCardBack(botCardScale);
    back.x = botStartX + i * botEff;
    back.y = botY;
    app.stage.addChild(back);
  }

  // --- Center zone: deck + open card + Spe-to Q♠ (opponent just discarded, yellow-bg special card) ---
  const centerZone = computeCenterZone(GAME_WIDTH);
  const deckPile = createDeckPile(centerZone.deck.x, centerZone.deck.y);
  app.stage.addChild(deckPile);

  // Open card K♦ (cây mở, neutral, not interactive)
  const openCardData = getOpenCard();
  const openCardSprite = createCardSprite(openCardData);
  openCardSprite.scale.set(DECK_SCALE);
  openCardSprite.x = centerZone.cayMo.x;
  openCardSprite.y = centerZone.cayMo.y;
  openCardSprite.eventMode = 'none';
  app.stage.addChild(openCardSprite);

  // Spe-to 2♣ (opponent just discarded — interactive)
  const speToData = getSpeToCard();
  const cayMoCard = createCardSprite(speToData); // keep var name for reuse below
  cayMoCard.scale.set(DECK_SCALE);
  cayMoCard.x = centerZone.discard.x;
  cayMoCard.y = centerZone.cayMo.y;
  cayMoCard.eventMode = 'static';
  cayMoCard.cursor = 'pointer';
  app.stage.addChild(cayMoCard);

  // Glow ring around Spe-to
  const cayMoGlow = new Graphics();
  cayMoGlow.roundRect(centerZone.discard.x - 6, centerZone.cayMo.y - 6, DECK_SCALED_W + 12, CARD_HEIGHT * DECK_SCALE + 12, 12);
  cayMoGlow.stroke({ color: 0xFFD700, width: 4, alpha: 1 });
  app.stage.addChildAt(cayMoGlow, app.stage.getChildIndex(cayMoCard));
  let glowAlpha = 1, glowDir = -1;
  app.ticker.add(() => {
    glowAlpha += glowDir * 0.02;
    if (glowAlpha < 0.4) glowDir = 1;
    if (glowAlpha > 1) glowDir = -1;
    cayMoGlow.alpha = glowAlpha;
  });

  // "SPE-TO" label above Spe-to (golden special card)
  const openLabel = new Text({
    text: 'SPE-TO',
    style: { fontFamily: 'Arial Black', fontSize: 13, fill: '#FFD700', stroke: { color: '#CC0000', width: 4 } },
  });
  openLabel.anchor.set(0.5, 1);
  openLabel.x = centerZone.discard.x + DECK_SCALED_W / 2;
  openLabel.y = centerZone.cayMo.y - 4;
  app.stage.addChild(openLabel);

  // --- Player hand cards ---
  // Remember which cards are meld cards (by value+suit) BEFORE shuffling
  const meldCardKeys = new Set(MELD_CARD_INDICES.map((i) => {
    const c = getInitialHand()[i];
    return `${c.value}_${c.suit}`;
  }));
  // Shuffle hand visually (Fisher-Yates)
  const handData = getInitialHand();
  for (let i = handData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [handData[i], handData[j]] = [handData[j], handData[i]];
  }
  const handSlots = computeHandSlots(GAME_WIDTH, handData.length);
  const cards = [];
  for (let i = 0; i < handData.length; i++) {
    const card = createCardSprite(handData[i]);
    card.scale.set(HAND_SCALE);
    card.x = handSlots[i].x;
    card.y = handSlots[i].y;
    card._origIdx = i;
    card._isMeldCard = meldCardKeys.has(`${handData[i].value}_${handData[i].suit}`);
    card.eventMode = 'none';
    card.tint = 0x888888;
    app.stage.addChild(card);
    cards.push(card);
  }

  // --- State ---
  // Phase 0: hint user to tap Spe-to first
  // Phase 1: Spe-to tapped → all hand cards light up, pointer sweeps across hand, Meld button shown disabled
  // Phase 2: user picks meld cards (J♠, K♠). Valid picks lift up. When both picked → Meld button enabled
  // Phase 3: user taps Meld button → meld animation, +50, chip rain, 5s → CTA
  let phase = 0;
  let resolved = false;
  let timerInterval;
  let pointerSprite = null;
  const pickedIdx = new Set();

  function clearPointer() {
    if (pointerSprite) {
      if (pointerSprite._tickFn) app.ticker.remove(pointerSprite._tickFn);
      pointerSprite.parent?.removeChild(pointerSprite);
      pointerSprite = null;
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
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

  function animateProgress(from, to, duration = 600) {
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      updateProgressFill(progressSection, from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // --- Tutorial hand pointer ---
  // Reusable smooth-tap animation: pointer flies in from offset → reaches target → fade out → respawn
  async function createSmoothTapPointer(targetCenter) {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

    // Final fingertip position: bottom-right of the target card so hand body doesn't cover it
    const endX = targetCenter.x + 20;
    const endY = targetCenter.y + 60;
    // Start position: further bottom-right (slide-in from corner)
    const startX = endX + 70;
    const startY = endY + 70;

    hand.x = startX;
    hand.y = startY;
    hand.alpha = 0;
    hand.eventMode = 'none';
    app.stage.addChild(hand);

    const slideIn   = 500;
    const hold      = 250;
    const fadeOut   = 250;
    const pause     = 350;
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
        hand.x = endX;
        hand.y = endY;
        hand.alpha = 1;
      } else if (elapsed < slideIn + hold + fadeOut) {
        const t = (elapsed - slideIn - hold) / fadeOut;
        // Tiny tap-down motion + fade
        hand.x = endX;
        hand.y = endY + t * 6;
        hand.alpha = 1 - t;
      } else {
        hand.x = startX;
        hand.y = startY;
        hand.alpha = 0;
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;
  }

  async function createPointerOnTarget(target, isCayMo = false) {
    const tw = isCayMo ? DECK_SCALED_W : HAND_SCALED_W;
    const th = isCayMo ? CARD_HEIGHT * DECK_SCALE : HAND_SCALED_H;
    return createSmoothTapPointer({ x: target.x + tw / 2, y: target.y + th });
  }

  // Pointer cycles between two targets with a single sprite, smooth slide-in/fade per cycle
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

    const slideIn = 500;
    const hold = 280;
    const fadeOut = 220;
    const pause = 200;
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
        hand.x = end.x;
        hand.y = end.y;
        hand.alpha = 1;
      } else if (local < slideIn + hold + fadeOut) {
        const t = (local - slideIn - hold) / fadeOut;
        hand.x = end.x;
        hand.y = end.y + t * 6;
        hand.alpha = 1 - t;
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
    // Start offset: come in from bottom-right of the first card
    const spawn = { x: firstEnd.x + 70, y: firstEnd.y + 70 };

    hand.x = spawn.x;
    hand.y = spawn.y;
    hand.alpha = 0;
    hand.eventMode = 'none';
    app.stage.addChild(hand);

    const fadeIn  = 350;   // slide-in + fade-in on first card
    const sweep   = 1400;  // travel across hand
    const fadeOut = 300;   // fade out at end
    const pause   = 300;   // wait before next loop
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

  // --- Toast (bottom-center) ---
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
    container.y = 780;
    container.alpha = 0;
    app.stage.addChild(container);

    const start = Date.now();
    const fadeDur = 180;
    const tick = () => {
      const el = Date.now() - start;
      if (el < fadeDur) {
        container.alpha = el / fadeDur;
      } else if (el < fadeDur + duration) {
        container.alpha = 1;
      } else if (el < fadeDur + duration + fadeDur) {
        container.alpha = 1 - (el - fadeDur - duration) / fadeDur;
      } else {
        container.parent?.removeChild(container);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // --- Meld button (above hand area, uses Btn Meld E.png asset) ---
  async function createMeldButton() {
    const tex = await Assets.load(btnMeldUrl);
    const sprite = new Sprite(tex);
    // Target visual width ~240px, preserve aspect
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

  // --- Phase 0 setup: Spe-to glows + tappable, hand cards all dim ---
  cards.forEach(c => {
    c.tint = 0x888888;
    c.eventMode = 'none';
  });

  function onCayMoTap() {
    if (resolved) return;
    if (phase !== 0) return;
    phase = 1;
    cayMoCard.eventMode = 'none';
    title.text = 'Pick cards to meld with Q♠';

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

  const totalMeldCards = cards.filter((c) => c._isMeldCard).length;
  function onHandCardTap(card) {
    if (resolved) return;
    if (phase !== 1) return;
    const idx = card._origIdx;
    if (pickedIdx.has(idx)) return; // already picked, ignore

    if (!card._isMeldCard) {
      // Invalid pick → toast, no state change
      showToast("Can't meld with this card");
      return;
    }

    // Valid pick → lift up + highlight, clear pointer on first valid pick
    pickedIdx.add(idx);
    if (pickedIdx.size === 1) clearPointer();
    highlightCard(card, true);
    tweenTo(card, card.x, card.y - 24, 220);

    // All required meld cards picked → enable Meld button
    if (pickedIdx.size === totalMeldCards) {
      setMeldButtonEnabled(meldButton, true);
      title.text = 'Tap MELD!';
    }
  }

  cayMoCard.on('pointerdown', onCayMoTap);
  cards.forEach((card) => {
    card.on('pointerdown', () => onHandCardTap(card));
  });

  // --- Meld animation: J♠ + Q♠ + K♠ fly to player meld zone ---
  function triggerMeld() {
    resolved = true;
    stopTimer();
    clearPointer();
    cayMoCard.eventMode = 'none';
    cards.forEach((c) => { c.eventMode = 'none'; highlightCard(c, false); });
    setMeldButtonEnabled(meldButton, false);
    meldButton.visible = false;
    openLabel.parent?.removeChild(openLabel);
    cayMoGlow.parent?.removeChild(cayMoGlow);

    // Player meld zone: center, 3 cards
    const meldSlots = computeMeldSlots(GAME_WIDTH, 3, PLAYER_MELD_Y);

    // Find the picked meld cards by data (J♠ = left, K♠ = right)
    const meldCards = cards.filter((c) => c._isMeldCard);
    const cardJ = meldCards.find((c) => handData[c._origIdx].value === 'J');
    const cardK = meldCards.find((c) => handData[c._origIdx].value === 'K');

    // Re-add to stage in left→right order so overlap z-order is correct
    app.stage.addChild(cardJ);       // J♠ left (back)
    app.stage.addChild(cayMoCard);   // Q♠ middle
    app.stage.addChild(cardK);       // K♠ right (front)

    // J♠ → slot 0
    tweenTo(cardJ, meldSlots[0].x, meldSlots[0].y, 500);
    tweenScale(cardJ, MELD_SCALE, 500);

    // Q♠ (Spe-to) → slot 1
    tweenTo(cayMoCard, meldSlots[1].x, meldSlots[1].y, 500);
    tweenScale(cayMoCard, MELD_SCALE, 500);

    // K♠ → slot 2
    tweenTo(cardK, meldSlots[2].x, meldSlots[2].y, 500);
    tweenScale(cardK, MELD_SCALE, 500);

    // After 600ms: highlight meld + spawn floating +50 text at meld location
    setTimeout(() => {
      // Glow box around meld
      const meldGlow = new Graphics();
      const pad = 8;
      const w = meldSlots[2].x - meldSlots[0].x + MELD_SCALED_W + pad * 2;
      const h = MELD_SCALED_H + pad * 2;
      meldGlow.roundRect(meldSlots[0].x - pad, meldSlots[0].y - pad, w, h, 10);
      meldGlow.stroke({ color: 0x2ECC40, width: 4, alpha: 1 });
      meldGlow.fill({ color: 0x2ECC40, alpha: 0.2 });
      app.stage.addChild(meldGlow);

      // Spawn +50 (player gain) at meld zone, AND -50 (opponent loss) near opponent avatar
      spawnFloatingScore(app, '+50', meldSlots[1].x + MELD_SCALED_W / 2, meldSlots[0].y - 10, 0xFFD700, 0xCC0000);
      spawnFloatingScore(app, '-50', 100, 360, 0xFF4444, 0x000000);

      title.text = 'SPE-TO! Gold bonus!';
    }, 600);

    // After 1700ms: chip rain
    setTimeout(() => createChipRain(app, GAME_WIDTH, GAME_HEIGHT), 1700);

    // After 5000ms: open store (CTA)
    setTimeout(() => openUrl(STORE_URL), 5000);
  }

  // --- Meld button (hidden until Phase 1) ---
  const meldButton = await createMeldButton();
  meldButton.visible = false;
  meldButton.on('pointerdown', () => {
    if (!meldButton._enabled || resolved) return;
    triggerMeld();
  });

  // --- Initial pointer: hint Spe-to ---
  title.text = 'Tap the Spe-to!';
  createPointerOnTarget(cayMoCard, true);

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

  // Meld button sits above the bottom bar so it's visible during Phase 1+
  app.stage.addChild(meldButton);

  // --- Footer ---
  const footerBtns = await createFooterButtons(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(footerBtns);

  // --- CTA Overlay ---
  const ctaOverlay = createCTAOverlay(GAME_WIDTH, GAME_HEIGHT);
  app.stage.addChild(ctaOverlay);

  // --- Timer countdown 20s ---
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
  t.x = x;
  t.y = startY;
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
