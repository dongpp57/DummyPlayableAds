/**
 * Main entry — Dummy Playable Ad Scenario S2a V1 (Pain / free-tap lose)
 * Pillar: Moment điểm thưởng phạt | LOSE: 2 lá lẻ cuối, đánh lá nào cũng bị ăn cây mở (-50)
 * Canvas: 640x1136 | 1v1 layout (player + 1 bot)
 *
 * Player đã hạ meld [2♣,3♣,4♣]. Tay còn 5♥, 9♥. Cây mở 7♥.
 * Bot có sẵn CẢ 6♥ và 8♥ trong tay (ẩn — face-down toàn bộ).
 * Free tap: tap lá nào → bot ăn bằng lurk tương ứng → meld 3 lá reveal → -50 YOU LOSE.
 */
import { Application, Sprite, NineSliceSprite, Assets, Container, Graphics, Text } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import bgImageUrl from '../res/DummyAsset/Background1.webp?url';
import iconDummyUrl from '../Logo/iconDummy.webp?url';
import imgHandUrl from '../res/style-1/img_hand.webp?url';
import imgHeaderUrl from '../res/style-1/img_header.webp?url';
import slotWhiteUrl from '../res/style-1/slot_white.webp?url';
import potDoiThuUrl from '../res/DummyAsset/Pot doi thu.webp?url';
import btnDiscardUrl from '../res/DummyAsset/Btn Discard E.webp?url';
import {
  getPlayerHand, getPlayerExistingMeld, getCayMo, getBotLurk5, getBotLurk9,
} from './card-data-s2a-v1.js';
import {
  computeMeldSlots, computeCenterZone,
  createCardBack, createDeckPile, createBotAvatar,
  HAND_SCALE, MELD_SCALE, DECK_SCALE,
  HAND_SCALED_W, HAND_SCALED_H, MELD_SCALED_W, MELD_SCALED_H, DECK_SCALED_W,
  PLAYER_MELD_Y, PLAYER_HAND_Y,
} from './table-layout.js';
import { createCardSprite, preloadCardTextures, registerCardTexture, highlightCard, CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';
import { createTopBar, createTitle, createTimer, updateTimerText } from './ui-header.js';
import { createCTAOverlay } from './cta-overlay.js';
import { openUrl } from './open-store.js';
import { loadSounds, play, playBgm, stopBgm, setMuted, isMuted, unlock as unlockAudio } from './sound.js';
import sfxCardUrl from '../res/sound/s_card.mp3?url';
import sfxCoinUrl from '../res/sound/s_coin_falling.mp3?url';
import sfxProcessUrl from '../res/sound/s_process.mp3?url';
import bgmUrl from '../res/sound/music_ingame_20s.mp3?url';

// S2a cards: 2 hand + 3 player meld + 1 cay_mo + 2 bot lurk = 8 unique
import card5hearts from '../res/common/composed/5_hearts.webp?url';
import card9hearts from '../res/common/composed/9_hearts.webp?url';
import card2clubs from '../res/common/composed/2_clubs.webp?url';
import card3clubs from '../res/common/composed/3_clubs.webp?url';
import card4clubs from '../res/common/composed/4_clubs.webp?url';
import card7hearts from '../res/common/composed/7_hearts.webp?url';
import card6hearts from '../res/common/composed/6_hearts.webp?url';
import card8hearts from '../res/common/composed/8_hearts.webp?url';
registerCardTexture('5_hearts', card5hearts);
registerCardTexture('9_hearts', card9hearts);
registerCardTexture('2_clubs',  card2clubs);
registerCardTexture('3_clubs',  card3clubs);
registerCardTexture('4_clubs',  card4clubs);
registerCardTexture('7_hearts', card7hearts);
registerCardTexture('6_hearts', card6hearts);
registerCardTexture('8_hearts', card8hearts);

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
  title.text = 'Drop a card!';
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

  // --- Single bot avatar + 7 face-down cards (ALL hidden — no lurk peek) ---
  const botAvatar = createBotAvatar(50, 290, 'OPPONENT');
  app.stage.addChild(botAvatar);

  const botCardScale = 0.4;
  const botCardW = CARD_WIDTH * botCardScale;
  const botOverlap = 26;
  const botEff = botCardW - botOverlap;
  const botStartX = 100;
  const botY = 270;
  const botBacks = [];
  for (let i = 0; i < 7; i++) {
    const back = createCardBack(botCardScale);
    back.x = botStartX + i * botEff;
    back.y = botY;
    app.stage.addChild(back);
    botBacks.push(back);
  }

  // --- Center zone: deck + cay_mo (left side) ---
  const centerZone = computeCenterZone(GAME_WIDTH);
  const deckPile = createDeckPile(centerZone.deck.x, centerZone.deck.y);
  app.stage.addChild(deckPile);

  // --- Cay mo card (open card 7♥ at center) — DECK_SCALE so it fits inside the discard frame ---
  const CAYMO_SCALE = DECK_SCALE;
  const CAYMO_W = CARD_WIDTH * CAYMO_SCALE;
  const CAYMO_H = CARD_HEIGHT * CAYMO_SCALE;
  const cayMoData = getCayMo();
  const cayMoCard = createCardSprite(cayMoData);
  cayMoCard.scale.set(CAYMO_SCALE);
  cayMoCard.x = centerZone.cayMo.x;
  cayMoCard.y = centerZone.cayMo.y;
  app.stage.addChild(cayMoCard);

  // Yellow glow ring around cay_mo
  const cayMoGlow = new Graphics();
  cayMoGlow.roundRect(centerZone.cayMo.x - 6, centerZone.cayMo.y - 6, CAYMO_W + 12, CAYMO_H + 12, 12);
  cayMoGlow.stroke({ color: 0xFFD700, width: 4, alpha: 1 });
  app.stage.addChildAt(cayMoGlow, app.stage.getChildIndex(cayMoCard));
  let glowAlpha = 1, glowDir = -1;
  app.ticker.add(() => {
    glowAlpha += glowDir * 0.02;
    if (glowAlpha < 0.4) glowDir = 1;
    if (glowAlpha > 1) glowDir = -1;
    cayMoGlow.alpha = glowAlpha;
  });

  // "OPEN" label above cay_mo
  const openLabel = new Text({
    text: 'OPEN CARD',
    style: { fontFamily: 'Arial Black', fontSize: 11, fill: '#FFD700', stroke: { color: '#000', width: 3 } },
  });
  openLabel.anchor.set(0.5, 1);
  openLabel.x = centerZone.cayMo.x + CAYMO_W / 2;
  openLabel.y = centerZone.cayMo.y - 4;
  app.stage.addChild(openLabel);

  // --- Player existing meld [2♣,3♣,4♣] — same size as opponent meld, anchored LEFT ---
  const existingMeldData = getPlayerExistingMeld();
  const emScale = MELD_SCALE; // 0.55 — same as future opponent meld
  const emCardW = CARD_WIDTH * emScale;
  const emCardH = CARD_HEIGHT * emScale;
  const emOverlap = 25;
  const emEff = emCardW - emOverlap;
  const emTotalW = emEff * 2 + emCardW;
  const emStartX = 30; // left edge of screen
  const emY = 660;
  const existingMeldCards = [];
  for (let i = 0; i < existingMeldData.length; i++) {
    const c = createCardSprite(existingMeldData[i]);
    c.scale.set(emScale);
    c.x = emStartX + i * emEff;
    c.y = emY;
    app.stage.addChild(c);
    existingMeldCards.push(c);
  }
  // Subtle green frame around existing meld
  const existingMeldGlow = new Graphics();
  const emPad = 5;
  existingMeldGlow.roundRect(emStartX - emPad, emY - emPad, emTotalW + emPad * 2, emCardH + emPad * 2, 8);
  existingMeldGlow.stroke({ color: 0x2ECC40, width: 2, alpha: 0.7 });
  app.stage.addChildAt(existingMeldGlow, app.stage.getChildIndex(existingMeldCards[0]));

  const meldedLabel = new Text({
    text: 'YOUR MELD',
    style: { fontFamily: 'Arial Black', fontSize: 10, fill: '#2ECC40', stroke: { color: '#000', width: 3 } },
  });
  meldedLabel.anchor.set(0.5, 1);
  meldedLabel.x = emStartX + emTotalW / 2;
  meldedLabel.y = emY - 6;
  app.stage.addChild(meldedLabel);

  // --- Player hand: 2 cards centered ---
  const handData = getPlayerHand();
  // Random which side is which
  if (Math.random() < 0.5) handData.reverse();
  const handGap = 20;
  const handTotalW = HAND_SCALED_W * 2 + handGap;
  const handStartX = (GAME_WIDTH - handTotalW) / 2;
  const cards = [];
  for (let i = 0; i < handData.length; i++) {
    const card = createCardSprite(handData[i]);
    card.scale.set(HAND_SCALE);
    card.x = handStartX + i * (HAND_SCALED_W + handGap);
    card.y = PLAYER_HAND_Y;
    card._data = handData[i];
    card.eventMode = 'static';
    card.cursor = 'pointer';
    app.stage.addChild(card);
    cards.push(card);
  }

  // --- State ---
  // phase 0 = picking which card to discard (free tap)
  // phase 1 = card lifted, discard button visible, can re-pick
  // resolved = discard committed, animation playing
  let phase = 0;
  let selectedCard = null;
  let resolved = false;
  let timerInterval;
  let pointerSprite = null;

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

  // --- Discard button (sprite from Btn Discard E.webp) ---
  async function createDiscardButton() {
    const tex = await Assets.load(btnDiscardUrl);
    const sprite = new Sprite(tex);
    const targetW = 180;
    const ratio = targetW / tex.width;
    sprite.width = targetW;
    sprite.height = tex.height * ratio;
    sprite.anchor.set(0.5);
    sprite.x = GAME_WIDTH / 2;
    sprite.y = 770;
    sprite.visible = false;
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    sprite._baseScaleX = sprite.scale.x;
    sprite._baseScaleY = sprite.scale.y;
    // Pulse animation
    let s = 1, dir = 1;
    const pulse = () => {
      if (!sprite.visible) return;
      s += dir * 0.006;
      if (s > 1.08) dir = -1;
      if (s < 1.0) dir = 1;
      sprite.scale.x = sprite._baseScaleX * s;
      sprite.scale.y = sprite._baseScaleY * s;
    };
    app.ticker.add(pulse);
    return sprite;
  }

  // --- Pointer cycles between two hand cards (free tap hint) ---
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

  // --- Tap handler PHASE 0/1: select card to discard (lift) ---
  function onCardTap(card) {
    if (resolved) return;
    unlockAudio();
    playBgm('bgm', 0.8);
    play('card');

    // Re-pick: if user taps the OTHER card while one is already lifted, swap selection
    if (selectedCard && selectedCard !== card) {
      // Lower the previously selected card back
      tweenTo(selectedCard, selectedCard._origX, selectedCard._origY, 180);
      highlightCard(selectedCard, false);
      selectedCard = null;
    }

    // Same card already lifted → no-op (user must tap Discard button)
    if (selectedCard === card) return;

    // Lift this card
    selectedCard = card;
    phase = 1;
    clearPointer();
    if (card._origX === undefined) {
      card._origX = card.x;
      card._origY = card.y;
    }
    highlightCard(card, true);
    tweenTo(card, card._origX, card._origY - 28, 200);

    // Show discard button
    discardButton.visible = true;
    title.text = 'Tap DISCARD';
  }

  // --- Commit discard: card → discard zone, bot reveals lurk → meld → -50 ---
  function commitDiscard() {
    if (resolved || !selectedCard) return;
    resolved = true;
    stopTimer();
    clearPointer();
    discardButton.visible = false;
    cards.forEach((c) => { c.eventMode = 'none'; highlightCard(c, false); });

    const card = selectedCard;
    // Which lurk card does opponent use?
    // Player thả 5♥ → opponent ăn bằng 6♥ → meld [5♥,6♥,7♥]
    // Player thả 9♥ → opponent ăn bằng 8♥ → meld [7♥,8♥,9♥]
    const isLowCard = card._data.value === '5';
    const lurkData = isLowCard ? getBotLurk5() : getBotLurk9();

    title.text = 'Discarded...';

    // Step 1: discarded card flies to center discard zone (next to cay_mo), same size as cay_mo
    const discardX = centerZone.cayMo.x + CAYMO_W + 20;
    const discardY = centerZone.cayMo.y;
    tweenTo(card, discardX, discardY, 450);
    tweenScale(card, CAYMO_SCALE, 450);

    // Step 2: WAIT 2s after discard, THEN opponent reveals lurk + forms meld
    setTimeout(() => {
      title.text = 'Opponent thinking...';
    }, 600);
    setTimeout(() => {
      title.text = 'OPPONENT GRABS IT!';
      play('process');

      // Spawn the lurk card (face-up) FROM the bot hand area — reveal moment
      const lurkCard = createCardSprite(lurkData);
      lurkCard.scale.set(botCardScale);
      // Start position: center of bot hand row
      lurkCard.x = botStartX + 3 * botEff;
      lurkCard.y = botY;
      lurkCard.alpha = 0;
      app.stage.addChild(lurkCard);
      // Fade-in reveal
      const revealStart = Date.now();
      const revealTick = () => {
        const t = Math.min((Date.now() - revealStart) / 220, 1);
        lurkCard.alpha = t;
        if (t < 1) requestAnimationFrame(revealTick);
      };
      requestAnimationFrame(revealTick);

      // Dim the bot's face-down hand (they're "going into the meld")
      botBacks.forEach((b) => { b.alpha = 0.4; });

      // Bot meld row below bot avatar
      const botMeldY = 380;
      const botMeldSlots = computeMeldSlots(GAME_WIDTH, 3, botMeldY);

      // Order left→right:
      // low card: [card(5♥), lurkCard(6♥), cayMoCard(7♥)]
      // high card: [cayMoCard(7♥), lurkCard(8♥), card(9♥)]
      const meldOrder = isLowCard
        ? [card, lurkCard, cayMoCard]
        : [cayMoCard, lurkCard, card];

      // Re-add to stage so z-order matches visual left→right
      meldOrder.forEach((c) => app.stage.addChild(c));

      // Tween each into its slot
      meldOrder.forEach((c, idx) => {
        tweenTo(c, botMeldSlots[idx].x, botMeldSlots[idx].y, 550);
        tweenScale(c, MELD_SCALE, 550);
      });

      // Remove cay_mo glow + open label
      cayMoGlow.alpha = 0;
      openLabel.alpha = 0;

      // After 700ms: red glow box around bot meld + -50 banner
      setTimeout(() => {
        const meldGlow = new Graphics();
        const pad = 8;
        const w = botMeldSlots[2].x - botMeldSlots[0].x + MELD_SCALED_W + pad * 2;
        const h = MELD_SCALED_H + pad * 2;
        meldGlow.roundRect(botMeldSlots[0].x - pad, botMeldSlots[0].y - pad, w, h, 10);
        meldGlow.stroke({ color: 0xFF2A2A, width: 4, alpha: 1 });
        meldGlow.fill({ color: 0xFF2A2A, alpha: 0.18 });
        app.stage.addChild(meldGlow);

        // Floating -50 text
        const minus50 = new Text({
          text: '-50',
          style: {
            fontFamily: 'Arial Black',
            fontSize: 80,
            fontWeight: 'bold',
            fill: '#FF3030',
            stroke: { color: '#FFFFFF', width: 8 },
            dropShadow: { color: '#000', blur: 8, distance: 4, alpha: 0.85 },
          },
        });
        minus50.anchor.set(0.5);
        minus50.x = GAME_WIDTH / 2;
        minus50.y = GAME_HEIGHT / 2;
        minus50.scale.set(0);
        app.stage.addChild(minus50);

        // Pop + shake
        const popStart = Date.now();
        const popDur = 350;
        const shakeDur = 600;
        const shakeTick = () => {
          const el = Date.now() - popStart;
          if (el < popDur) {
            const t = el / popDur;
            const e = t * t * (3 - 2 * t);
            minus50.scale.set(e * 1.2);
          } else if (el < popDur + shakeDur) {
            minus50.scale.set(1.2 - Math.sin((el - popDur) / 30) * 0.05);
            minus50.x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 10;
            minus50.y = GAME_HEIGHT / 2 + (Math.random() - 0.5) * 10;
          } else {
            minus50.x = GAME_WIDTH / 2;
            minus50.y = GAME_HEIGHT / 2;
            minus50.scale.set(1.15);
            return;
          }
          requestAnimationFrame(shakeTick);
        };
        requestAnimationFrame(shakeTick);

        title.text = '-50 YOU LOSE';

        // After 1100ms: show "Pot doi thu" (opponent winning pot) banner near top
        setTimeout(async () => {
          try {
            const potTex = await Assets.load(potDoiThuUrl);
            const potBanner = new Sprite(potTex);
            const targetW = 260;
            const ratio = targetW / potTex.width;
            potBanner.width = targetW;
            potBanner.height = potTex.height * ratio;
            potBanner.anchor.set(0.5);
            potBanner.x = 140;
            potBanner.y = 430;
            potBanner.scale.set(0);
            app.stage.addChild(potBanner);

            const bs = Date.now();
            const bDur = 350;
            const bTick = () => {
              const el = Date.now() - bs;
              if (el < bDur) {
                const t = el / bDur;
                const e = t * t * (3 - 2 * t);
                const baseScale = potBanner.scale.x === 0 ? 1 : 1;
                potBanner.scale.set(e * 1.1 * (targetW / potTex.width));
                requestAnimationFrame(bTick);
              } else {
                potBanner.scale.set(targetW / potTex.width);
              }
            };
            // simple pop using width tween
            potBanner.scale.set(0);
            const popBanner = () => {
              const t = (Date.now() - bs) / bDur;
              if (t < 1) {
                const e = t * t * (3 - 2 * t);
                potBanner.scale.set(e * 1.05);
                requestAnimationFrame(popBanner);
              } else {
                potBanner.scale.set(1);
              }
            };
            popBanner();
          } catch (_) {}

          title.text = 'Play now!';
        }, 1100);

      }, 700);

      // After 4500ms: open store
      setTimeout(() => { stopBgm(); openUrl(STORE_URL); }, 4500);
    }, 2000);
  }

  cards.forEach((card) => {
    card.on('pointerdown', () => onCardTap(card));
  });

  // --- Discard button (hidden until a card is selected) ---
  const discardButton = await createDiscardButton();
  discardButton.on('pointerdown', () => commitDiscard());
  app.stage.addChild(discardButton);

  // --- Initial pointer cycles between the 2 hand cards ---
  setTimeout(() => createPointerCycleBetween(cards[0], cards[1]), 200);

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

  // --- Timer countdown 20s ---
  let timeLeft = 20;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerText(timer, timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      stopBgm();
      title.text = "Time's Up!";
      clearPointer();
      cards.forEach((c) => { highlightCard(c, false); c.eventMode = 'none'; });
      app.stage.removeChild(ctaOverlay);
      app.stage.addChild(ctaOverlay);
      ctaOverlay.visible = true;
    }
  }, 1000);

  app.ticker.add(() => {
    if (ctaOverlay.visible && ctaOverlay._animateCTA) ctaOverlay._animateCTA();
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
