/**
 * Main entry — Dummy Playable Ad Scenario S9 V1
 * Pillar: Sắp xếp bài | Mode: Free Drag — Eureka (2 outcomes)
 * Canvas: 640x1136
 *
 * Hand: 4♥ 5♥ 6♥ 5♦ 5♣ 5♠ 7♥
 * Bot meld on table: 8♥ 9♥ 10♥
 *
 * Drag 5♥ → RUN (correct) → chain combo → KNOCK
 * Drag 5♥ → SET  (wrong)  → 3 leftover → REPLAY
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

import {
  getInitialHand, getBotMeld,
  AMBIGUOUS_CARD_INDEX,
  RUN_HEARTS_ORIGS, SET_5S_ORIGS, DISCARD_ORIG,
  WRONG_SET_ORIGS, WRONG_LEFTOVER,
  HAND_DISPLAY_ORDER,
} from './card-data-s9-v1.js';
import {
  computeHandSlots, computeTargetBoxes, createTargetBoxes, computeBotMeldSlots,
  CARD_SCALE, SCALED_W, SCALED_H,
  BOT_MELD_SCALE, TARGET_SLOT_SCALE, TARGET_SLOT_W, TARGET_SLOT_H,
} from './game-board-s9-v1.js';
import { createCardSprite, preloadCardTextures, registerCardTexture, highlightCard, CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

// S9: hand 7 cards + player meld 3 cards
import card3hearts from '../res/common/composed/3_hearts.webp?url';
import card5hearts from '../res/common/composed/5_hearts.webp?url';
import card4hearts from '../res/common/composed/4_hearts.webp?url';
import card5diamonds from '../res/common/composed/5_diamonds.webp?url';
import card5clubs from '../res/common/composed/5_clubs.webp?url';
import card5spades from '../res/common/composed/5_spades.webp?url';
import card7hearts from '../res/common/composed/7_hearts.webp?url';
import card6clubs from '../res/common/composed/6_clubs.webp?url';
import card7clubs from '../res/common/composed/7_clubs.webp?url';
import card8clubs from '../res/common/composed/8_clubs.webp?url';
registerCardTexture('3_hearts',   card3hearts);
registerCardTexture('5_hearts',   card5hearts);
registerCardTexture('4_hearts',   card4hearts);
registerCardTexture('5_diamonds', card5diamonds);
registerCardTexture('5_clubs',    card5clubs);
registerCardTexture('5_spades',   card5spades);
registerCardTexture('7_hearts',   card7hearts);
registerCardTexture('6_clubs',    card6clubs);
registerCardTexture('7_clubs',    card7clubs);
registerCardTexture('8_clubs',    card8clubs);
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
  title.text = 'Where does 5♥ belong?';
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

  // --- Timer ---
  const timer = await createTimer(GAME_WIDTH - 75, 300);
  app.stage.addChild(timer);

  // --- Bot meld on table (3 face-up cards) ---
  const botMeldSlots = computeBotMeldSlots(GAME_WIDTH);
  const botMeldData = getBotMeld();
  const botMeldCards = [];
  for (let i = 0; i < botMeldData.length; i++) {
    const card = createCardSprite(botMeldData[i]);
    card.scale.set(BOT_MELD_SCALE);
    card.x = botMeldSlots[i].x;
    card.y = botMeldSlots[i].y;
    card.eventMode = 'none';
    app.stage.addChild(card);
    botMeldCards.push(card);
  }
  // Small label above player meld
  const botLabel = new Text({
    text: 'PLAYER MELD',
    style: { fontFamily: 'Arial Black', fontSize: 12, fill: '#ffffff', stroke: { color: '#000', width: 3 } },
  });
  botLabel.anchor.set(0.5, 1);
  botLabel.x = GAME_WIDTH / 2;
  botLabel.y = botMeldSlots[0].y - 4;
  app.stage.addChild(botLabel);

  // --- Target boxes ---
  const targetBoxes = computeTargetBoxes(GAME_WIDTH);
  const boxesGfx = createTargetBoxes(targetBoxes);
  app.stage.addChild(boxesGfx);

  // --- Hand cards ---
  // HAND_DISPLAY_ORDER[slotIdx] = origCardIdx → shuffle display positions
  // `cards[origIdx]` is still indexed by orig for animation lookups,
  // but its initial `x, y` is set from its slot.
  const handSlots = computeHandSlots(GAME_WIDTH);
  const handData = getInitialHand();
  const cards = new Array(handData.length);
  // homePos[origIdx] = where the card lives when in hand
  const homePos = new Array(handData.length);
  for (let slotIdx = 0; slotIdx < HAND_DISPLAY_ORDER.length; slotIdx++) {
    const origIdx = HAND_DISPLAY_ORDER[slotIdx];
    const card = createCardSprite(handData[origIdx]);
    card.scale.set(CARD_SCALE);
    card.x = handSlots[slotIdx].x;
    card.y = handSlots[slotIdx].y;
    card._origIdx = origIdx;
    card.eventMode = 'none';
    card.tint = 0x888888;
    app.stage.addChild(card);
    cards[origIdx] = card;
    homePos[origIdx] = { x: handSlots[slotIdx].x, y: handSlots[slotIdx].y };
  }
  // Highlight 5♥ glow
  const fiveHearts = cards[AMBIGUOUS_CARD_INDEX];
  fiveHearts.tint = 0xffffff;
  highlightCard(fiveHearts, true);

  let attemptCount = 0;
  let resolved = false;
  let timerInterval;
  let pointerSprite = null;
  let questionMark = null;

  function clearPointer() {
    if (pointerSprite) {
      if (pointerSprite._tickFn) app.ticker.remove(pointerSprite._tickFn);
      pointerSprite.parent?.removeChild(pointerSprite);
      pointerSprite = null;
    }
    if (questionMark) {
      if (questionMark._tickFn) app.ticker.remove(questionMark._tickFn);
      questionMark.parent?.removeChild(questionMark);
      questionMark = null;
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function tweenTo(obj, tx, ty, duration = 400) {
    const sx = obj.x, sy = obj.y;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const e = t * t * (3 - 2 * t);
      obj.x = sx + (tx - sx) * e;
      obj.y = sy + (ty - sy) * e;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function tweenScale(obj, targetScale, duration = 300) {
    const startScale = obj.scale.x;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const e = t * t * (3 - 2 * t);
      obj.scale.set(startScale + (targetScale - startScale) * e);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function fadeAlpha(obj, target, duration = 300) {
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

  function shakeCard(card) {
    const ox = card.x;
    const start = Date.now();
    const tick = () => {
      const t = (Date.now() - start) / 500;
      if (t >= 1) { card.x = ox; return; }
      card.x = ox + Math.sin(t * Math.PI * 8) * 6;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function isInsideBox(gx, gy, box) {
    return gx >= box.x && gx <= box.x + box.w && gy >= box.y && gy <= box.y + box.h;
  }

  // --- Hand pointer alternates between RUN and SET box ---
  async function createDragHintPointer() {
    clearPointer();
    const texture = await Assets.load(imgHandUrl);
    const hand = new Sprite(texture);
    hand.anchor.set(0.3, 0);
    hand.scale.x = -1;
    hand.rotation = Math.PI / 2 + (60 * Math.PI / 180);

    const ax = fiveHearts.x + SCALED_W / 2 + 20;
    const ay = fiveHearts.y + SCALED_H / 2 + 120;
    // Alternate between RUN and SET box center
    const runTx = targetBoxes.run.x + targetBoxes.run.w / 2 + 20;
    const runTy = targetBoxes.run.y + targetBoxes.run.h / 2 + 120;
    const setTx = targetBoxes.set.x + targetBoxes.set.w / 2 + 20;
    const setTy = targetBoxes.set.y + targetBoxes.set.h / 2 + 120;

    hand.x = ax;
    hand.y = ay;
    hand.eventMode = 'none';
    app.stage.addChild(hand);

    // Cycle: pause → move to RUN → fade out → delay → fade in → pause → move to SET → fade out → delay → fade in
    const pauseAtStart = 250;
    const moveDur = 700;
    const fadeOutDur = 180;
    const delayAfterFade = 300;
    const fadeInDur = 180;
    const halfCycle = pauseAtStart + moveDur + fadeOutDur + delayAfterFade + fadeInDur;
    const totalCycle = halfCycle * 2;

    const startTime = Date.now();
    const tickFn = () => {
      const elapsed = (Date.now() - startTime) % totalCycle;
      // Half 0 → RUN, half 1 → SET
      const inSecondHalf = elapsed >= halfCycle;
      const localTime = inSecondHalf ? elapsed - halfCycle : elapsed;
      const bx = inSecondHalf ? setTx : runTx;
      const by = inSecondHalf ? setTy : runTy;

      if (localTime < pauseAtStart) {
        hand.visible = true; hand.alpha = 1;
        hand.x = ax; hand.y = ay;
      } else if (localTime < pauseAtStart + moveDur) {
        const t = (localTime - pauseAtStart) / moveDur;
        const e = t * t * (3 - 2 * t);
        hand.visible = true; hand.alpha = 1;
        hand.x = ax + (bx - ax) * e;
        hand.y = ay + (by - ay) * e;
      } else if (localTime < pauseAtStart + moveDur + fadeOutDur) {
        const t = (localTime - pauseAtStart - moveDur) / fadeOutDur;
        hand.x = bx; hand.y = by;
        hand.alpha = 1 - t;
      } else if (localTime < pauseAtStart + moveDur + fadeOutDur + delayAfterFade) {
        hand.visible = false;
      } else {
        hand.visible = true;
        const t = (localTime - pauseAtStart - moveDur - fadeOutDur - delayAfterFade) / fadeInDur;
        hand.x = ax; hand.y = ay;
        hand.alpha = Math.min(t, 1);
      }
    };
    app.ticker.add(tickFn);
    hand._tickFn = tickFn;
    pointerSprite = hand;

    // Add "?" above 5♥ (above hand) to indicate user decision needed
    const qMark = new Text({
      text: '?',
      style: {
        fontFamily: 'Arial Black',
        fontSize: 56,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#CC0000', width: 6 },
        dropShadow: { color: '#000', blur: 4, distance: 3, alpha: 0.6 },
      },
    });
    qMark.anchor.set(0.5, 1);
    qMark.x = fiveHearts.x + SCALED_W / 2;
    const qMarkBaseY = fiveHearts.y - 8;
    qMark.y = qMarkBaseY;
    app.stage.addChild(qMark);

    // Bounce animation for "?"
    const qStart = Date.now();
    const qTickFn = () => {
      const t = (Date.now() - qStart) / 1000;
      qMark.y = qMarkBaseY - Math.abs(Math.sin(t * Math.PI * 2)) * 8;
      const s = 1 + Math.sin(t * Math.PI * 3) * 0.08;
      qMark.scale.set(s);
    };
    app.ticker.add(qTickFn);
    qMark._tickFn = qTickFn;
    questionMark = qMark;
  }

  // --- Drag handler for 5♥ only ---
  function enableDrag() {
    fiveHearts.eventMode = 'static';
    fiveHearts.cursor = 'pointer';
    fiveHearts.tint = 0xffffff;
    highlightCard(fiveHearts, true);
  }

  function disableDrag() {
    fiveHearts.eventMode = 'none';
    highlightCard(fiveHearts, false);
  }

  let dragging = false;
  let dragOffset = { x: 0, y: 0 };

  fiveHearts.on('pointerdown', (ev) => {
    if (resolved) return;
    dragging = true;
    dragOffset.x = fiveHearts.x - ev.global.x;
    dragOffset.y = fiveHearts.y - ev.global.y;
    app.stage.removeChild(fiveHearts);
    app.stage.addChild(fiveHearts);
    clearPointer();
  });

  app.stage.eventMode = 'static';
  app.stage.on('pointermove', (ev) => {
    if (!dragging) return;
    fiveHearts.x = ev.global.x + dragOffset.x;
    fiveHearts.y = ev.global.y + dragOffset.y;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    const cx = fiveHearts.x + SCALED_W / 2;
    const cy = fiveHearts.y + SCALED_H / 2;

    if (isInsideBox(cx, cy, targetBoxes.run)) {
      handleCorrectChoice();
    } else if (isInsideBox(cx, cy, targetBoxes.set)) {
      handleWrongChoice();
    } else {
      // back to home, then restack so 5♥ ends up above its left neighbours
      tweenTo(fiveHearts, homePos[AMBIGUOUS_CARD_INDEX].x, homePos[AMBIGUOUS_CARD_INDEX].y, 220);
      setTimeout(() => {
        if (resolved) return;
        restackHandBySlot();
        createDragHintPointer();
      }, 250);
    }
  };

  /** Re-add in-hand cards to stage sorted by x so overlap order is correct */
  function restackHandBySlot() {
    const inHand = cards.filter(c => !c._placed);
    const sorted = [...inHand].sort((a, b) => a.x - b.x);
    sorted.forEach(c => app.stage.addChild(c));
  }
  app.stage.on('pointerup', endDrag);
  app.stage.on('pointerupoutside', endDrag);

  // --- Correct choice: chain combo to KNOCK ---
  async function handleCorrectChoice() {
    resolved = true;
    disableDrag();
    clearPointer();
    stopTimer();

    // RUN box has 4 slots — fill slots 0,1,2 with 3♥,4♥,5♥ (display order); slot 3 stays empty
    // 3♥ = orig 0, 4♥ = orig 2, 5♥ = orig 1
    const runSlots = targetBoxes.run.slots;
    const setSlots = targetBoxes.set.slots;

    // 5♥ snaps to RUN slot 2 (rightmost of the 3 cards = value 5)
    tweenTo(fiveHearts, runSlots[2].x, runSlots[2].y, 300);
    tweenScale(fiveHearts, TARGET_SLOT_SCALE, 300);

    // +300ms: 3♥ flies to slot 0, 4♥ flies to slot 1
    setTimeout(() => {
      tweenTo(cards[0], runSlots[0].x, runSlots[0].y, 400); // 3♥
      tweenScale(cards[0], TARGET_SLOT_SCALE, 400);
      cards[0].tint = 0xffffff;
      tweenTo(cards[2], runSlots[1].x, runSlots[1].y, 400); // 4♥
      tweenScale(cards[2], TARGET_SLOT_SCALE, 400);
      cards[2].tint = 0xffffff;
    }, 300);

    // +800ms: RUN complete — glow
    setTimeout(() => {
      boxesGfx.completeFns.run();
      updateIQ(progressSection, 40);
      animateProgress(0.2, 0.4);
    }, 800);

    // +1100ms: 5♦ 5♣ 5♠ auto-fly into SET slots 0,1,2
    setTimeout(() => {
      [3, 4, 5].forEach((origIdx, i) => {
        const c = cards[origIdx];
        tweenTo(c, setSlots[i].x, setSlots[i].y, 450);
        tweenScale(c, TARGET_SLOT_SCALE, 450);
        c.tint = 0xffffff;
      });
    }, 1100);

    // +1600ms: SET complete
    setTimeout(() => {
      boxesGfx.completeFns.set();
      updateIQ(progressSection, 70);
      animateProgress(0.4, 0.7);
    }, 1600);

    // +2000ms: 7♥ discarded (fly off screen to the right)
    setTimeout(() => {
      const seven = cards[DISCARD_ORIG];
      seven.tint = 0xffffff;
      tweenTo(seven, GAME_WIDTH + 100, seven.y - 40, 500);
      fadeAlpha(seven, 0, 500);
    }, 2000);

    // +2700ms: IQ full, KNOCK banner
    setTimeout(() => {
      updateIQ(progressSection, 110);
      animateProgress(0.7, 1.0);
      title.text = 'PERFECT! RUMMY!';
      showRummyBanner();
    }, 2700);

    // +3500ms: chip rain
    setTimeout(() => createChipRain(app, GAME_WIDTH, GAME_HEIGHT), 3500);

    // Open store
    setTimeout(() => openUrl(STORE_URL), 5000);
  }

  // --- Wrong choice: SET with 4 fives, leftover 4♥ 6♥ 7♥ ---
  async function handleWrongChoice() {
    attemptCount++;
    disableDrag();
    clearPointer();

    // SET box has 4 slots — fill all 4 with 5♥, 5♦, 5♣, 5♠
    const setSlots = targetBoxes.set.slots;
    const wrongOrder = [1, 3, 4, 5]; // 5♥, 5♦, 5♣, 5♠

    // 5♥ flies to slot 0 immediately (user just dropped it)
    tweenTo(fiveHearts, setSlots[0].x, setSlots[0].y, 250);
    tweenScale(fiveHearts, TARGET_SLOT_SCALE, 250);

    // 5♦ 5♣ 5♠ fly into slots 1,2,3
    setTimeout(() => {
      [3, 4, 5].forEach((origIdx, i) => {
        const c = cards[origIdx];
        tweenTo(c, setSlots[i + 1].x, setSlots[i + 1].y, 400);
        tweenScale(c, TARGET_SLOT_SCALE, 400);
        c.tint = 0xffffff;
      });
    }, 300);

    // +800ms: shake leftover cards 4♥ 6♥ 7♥ red
    setTimeout(() => {
      [0, 2, 6].forEach((origIdx) => {
        const c = cards[origIdx];
        c.tint = 0xff4444;
        shakeCard(c);
      });
      title.text = 'Leftover cards!';
      updateIQ(progressSection, 50);
      animateProgress(0.2, 0.5);
    }, 800);

    // +1800ms: show replay button OR give up
    setTimeout(() => {
      if (attemptCount === 1) {
        showReplayButton();
      } else {
        // 2nd wrong attempt: wait for timer, do nothing
      }
    }, 1800);
  }

  function showReplayButton() {
    const btn = new Container();
    const w = 180, h = 52;
    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2, w, h, 26);
    bg.fill({ color: 0xFFD700 });
    bg.stroke({ color: 0xffffff, width: 3 });
    btn.addChild(bg);
    const label = new Text({
      text: '↻ TRY AGAIN',
      style: { fontFamily: 'Arial Black', fontSize: 20, fontWeight: 'bold', fill: '#1a1a2e' },
    });
    label.anchor.set(0.5);
    btn.addChild(label);
    btn.x = GAME_WIDTH / 2;
    btn.y = 720;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    app.stage.addChild(btn);

    // Pulse
    let s = 1, grow = true;
    const tick = () => {
      if (!btn.parent) return;
      grow ? s += 0.005 : s -= 0.005;
      if (s > 1.08) grow = false;
      if (s < 0.95) grow = true;
      btn.scale.set(s);
    };
    app.ticker.add(tick);

    btn.on('pointerdown', () => {
      app.ticker.remove(tick);
      btn.parent.removeChild(btn);
      resetState();
    });
  }

  function resetState() {
    resolved = false;
    title.text = 'Where does 5♥ belong?';
    // Reset all 7 cards to home positions + original tint/scale
    cards.forEach((c, i) => {
      tweenTo(c, homePos[i].x, homePos[i].y, 300);
      tweenScale(c, CARD_SCALE, 300);
      c.tint = (i === AMBIGUOUS_CARD_INDEX) ? 0xffffff : 0x888888;
      c.alpha = 1;
    });
    // Reset box labels
    boxesGfx.labels.run.text = 'RUN';
    boxesGfx.labels.set.text = 'SET';
    // Re-enable drag + restack after tween finishes
    setTimeout(() => {
      restackHandBySlot();
      enableDrag();
      createDragHintPointer();
    }, 350);
    updateIQ(progressSection, 10);
    animateProgress(0.5, 0.2);
  }

  // If the user runs out of attempts or time in wrong branch, finalize wrong
  // (Wrong path keeps timer running so user can still click replay or wait)

  async function showRummyBanner() {
    try {
      // Dark backdrop behind the banner so it pops out
      const bgTex = await Assets.load(rummyBgUrl);
      const backdrop = new Sprite(bgTex);
      backdrop.width = GAME_WIDTH;
      backdrop.height = GAME_HEIGHT;
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
      banner.width = GAME_WIDTH * 0.85;
      banner.height = banner.width * (tex.height / tex.width);
      banner.x = GAME_WIDTH / 2;
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
      console.warn('Knock banner load failed', e);
    }
  }

  // --- Enable initial drag + hint ---
  enableDrag();
  createDragHintPointer();

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
      title.text = "Time's Up!";
      clearPointer();
      disableDrag();
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
