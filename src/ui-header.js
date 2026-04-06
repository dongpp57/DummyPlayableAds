/**
 * UI Header - top bar, title, IQ badge, progress bar, timer
 * Sized for 640x1136 canvas, styled per preview_2.png
 */
import { Container, Graphics, Text, Sprite, NineSliceSprite, Assets } from 'pixi.js';
import imgProcess0Url from '../res/common/img_process_0.webp?url';
import imgProcess1Url from '../res/common/img_process_1.webp?url';
import imgProcess2Url from '../res/common/img_process_2.webp?url';
import imgBrainUrl from '../res/common/img_brain.webp?url';
import imgBtnOrangeUrl from '../res/style-1/img_btn_orange_s9s.webp?url';
import imgClockUrl from '../res/style-1/img_clock.webp?url';

/**
 * Create top bar: "INCREASE YOUR IQ!" + "Download Now" button
 */
export async function createTopBar(width) {
  const container = new Container();

  // "INCREASE YOUR IQ!" - lime/yellow-green with dark stroke
  const title = new Text({
    text: 'INCREASE YOUR IQ!',
    style: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#ffffff',
    },
  });
  title.x = 20;
  title.y = 0;
  container.addChild(title);

  // "Download Now" button using img_btn_orange_s9s
  const btnTex = await Assets.load(imgBtnOrangeUrl);
  const btnW = 200;
  const btnH = 48;
  const btnX = width - btnW - 20;
  const btnYInitial = -5;
  const btnYFinal = 14;
  let btnY = btnYInitial;

  const btn = new NineSliceSprite({
    texture: btnTex,
    leftWidth: 28,
    rightWidth: 28,
    topHeight: 20,
    bottomHeight: 20,
  });
  const actualBtnW = 220;
  const actualBtnH = 58;
  btn.x = width - actualBtnW - 16;
  btn.y = btnYInitial;
  btn.width = actualBtnW;
  btn.height = actualBtnH;
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.on('pointerdown', () => {
    window.open(container._storeUrl || '#', '_blank');
  });
  container.addChild(btn);

  const btnText = new Text({
    text: 'Download Now',
    style: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 22,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#E94C00', width: 3 },
    },
  });
  btnText.anchor.set(0.5);
  btnText.x = btn.x + actualBtnW / 2;
  btnText.y = btn.y + actualBtnH / 2 - 2;
  btnText.eventMode = 'static';
  btnText.cursor = 'pointer';
  btnText.on('pointerdown', () => {
    window.open(container._storeUrl || '#', '_blank');
  });
  container.addChild(btnText);

  // "Skip Ads" button (top-right, above Download Now)
  const skipText = new Text({
    text: 'Skip Ads >>',
    style: {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#cccccc',
    },
  });
  skipText.anchor.set(1, 1);
  skipText.x = width - 20;
  skipText.y = btnYFinal - 10;
  skipText.visible = false;
  skipText.eventMode = 'none';
  skipText.cursor = 'pointer';
  skipText.on('pointerdown', () => {
    if (typeof mraid !== 'undefined' && mraid.close) {
      mraid.close();
    } else {
      window.close();
    }
  });
  container.addChild(skipText);

  // After 15s: show skip ads, move download button down
  setTimeout(() => {
    skipText.visible = true;
    skipText.eventMode = 'static';
    btn.y = btnYFinal;
    btnText.y = btnYFinal + 58 / 2 - 2;
  }, 15000);

  return container;
}

/**
 * Create title: "Drag cards to arrange" - cyan/turquoise with dark stroke
 */
export function createTitle(width, y) {
  const title = new Text({
    text: 'Drag cards to arrange',
    style: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 38,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#FF5000', width: 6 },
      dropShadow: {
        color: '#940031',
        blur: 4,
        angle: Math.PI / 4,
        distance: 3,
      },
    },
  });
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = y;
  return title;
}

/**
 * Create IQ badge + progress bar using img_process sprites (NineSlice)
 */
export async function createProgressSection(width, y) {
  const container = new Container();

  // Progress bar
  const barX = 0;
  const barW = (width - 40) * 0.8;
  const barH = 36;

  // Background track (img_process_2) - NineSlice
  const tex2 = await Assets.load(imgProcess2Url);
  const sliceEdge2 = 18;
  const track = new NineSliceSprite({
    texture: tex2,
    leftWidth: sliceEdge2,
    rightWidth: sliceEdge2,
    topHeight: 0,
    bottomHeight: 0,
  });
  track.x = barX;
  track.y = 0;
  track.width = barW;
  track.height = barH;
  container.addChild(track);

  // Middle layer (img_process_1 = blue/dark) - NineSlice
  const tex1 = await Assets.load(imgProcess1Url);
  const sliceEdge1 = 14;
  const mid = new NineSliceSprite({
    texture: tex1,
    leftWidth: sliceEdge1,
    rightWidth: sliceEdge1,
    topHeight: 0,
    bottomHeight: 0,
  });
  mid.x = barX + 4;
  mid.y = 4;
  mid.width = barW - 8;
  mid.height = barH - 8;
  container.addChild(mid);

  // Filled portion (img_process_0 = green) - NineSlice
  const tex0 = await Assets.load(imgProcess0Url);
  const sliceEdge0 = 14;
  const fill = new NineSliceSprite({
    texture: tex0,
    leftWidth: sliceEdge0,
    rightWidth: sliceEdge0,
    topHeight: 0,
    bottomHeight: 0,
  });
  fill.x = barX + 4;
  fill.y = 4;
  fill.width = (barW - 8) * 0.2;
  fill.height = barH - 8;
  container.addChild(fill);

  // Brain icon (on top of progress bar)
  const brainTex = await Assets.load(imgBrainUrl);
  const brain = new Sprite(brainTex);
  brain.width = 95;
  brain.height = 72;
  brain.x = -20;
  brain.y = -21;
  container.addChild(brain);

  // IQ Text - white with purple outline, on top of brain
  const iqText = new Text({
    text: '10 IQ',
    style: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 26,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#82059B', width: 6 },
    },
  });
  iqText.anchor.set(0.5);
  iqText.x = 22;
  iqText.y = 16;
  container.addChild(iqText);

  const totalW = barW;
  container.x = (width - totalW) / 2;
  container.y = y;

  // Store refs for updates
  container._fill = fill;
  container._fillMaxW = barW - 8;
  container._iqText = iqText;

  return container;
}

/**
 * Update progress bar fill
 */
export function updateIQ(progressSection, value) {
  progressSection._iqText.text = `${value} IQ`;
}

export function updateProgressFill(progressSection, ratio) {
  const fill = progressSection._fill;
  fill.width = Math.max(progressSection._fillMaxW * ratio, 28);
}

/**
 * Create timer display (orange stopwatch style)
 */
export async function createTimer(x, y) {
  const container = new Container();

  // Clock image
  const clockTex = await Assets.load(imgClockUrl);
  const clock = new Sprite(clockTex);
  clock.anchor.set(0.5);
  clock.width = 108;
  clock.height = 108;
  container.addChild(clock);

  // Timer number - white with dark stroke
  const timerText = new Text({
    text: '30',
    style: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 46,
      fontWeight: 'bold',
      fill: '#E13D58',
      stroke: { color: '#ffffff', width: 4 },
      dropShadow: {
        color: '#000000',
        blur: 2,
        distance: 1,
      },
    },
  });
  timerText.anchor.set(0.5);
  timerText.y = 5;
  container.addChild(timerText);

  container.x = x;
  container.y = y;
  container._timerText = timerText;

  return container;
}

/**
 * Update timer display
 */
export function updateTimerText(timerContainer, seconds) {
  timerContainer._timerText.text = String(seconds);
}
