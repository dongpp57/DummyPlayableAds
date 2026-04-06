/**
 * CTA (Call to Action) overlay - shown when timer ends
 * "Time's Up!" with App Store + Google Play download buttons
 */
import { Container, Graphics, Text } from 'pixi.js';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=th.dm.card.casino';
const IOS_URL = 'https://apps.apple.com/app/dummy-zingplay/id6737778971';

/**
 * Create CTA overlay that covers the screen
 */
export function createCTAOverlay(width, height) {
  const container = new Container();
  container.visible = false;

  // Semi-transparent dark background
  const overlay = new Graphics();
  overlay.rect(0, 0, width, height);
  overlay.fill({ color: 0x000000, alpha: 0.75 });
  overlay.eventMode = 'static';
  container.addChild(overlay);

  // CTA card
  const cardW = width * 0.82;
  const cardH = 240;
  const cardX = (width - cardW) / 2;
  const cardY = (height - cardH) / 2 - 30;

  const card = new Graphics();
  card.roundRect(cardX, cardY, cardW, cardH, 20);
  card.fill({ color: 0x1a5c2a });
  card.stroke({ color: 0xffcc00, width: 3 });
  container.addChild(card);

  // Title
  const title = new Text({
    text: "Time's Up!",
    style: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#FFD700',
      dropShadow: { color: '#000000', blur: 4, distance: 2 },
    },
  });
  title.anchor.set(0.5);
  title.x = width / 2;
  title.y = cardY + 44;
  container.addChild(title);

  // Subtitle
  const sub = new Text({
    text: 'Think you can do better?',
    style: {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: '#ffffff',
    },
  });
  sub.anchor.set(0.5);
  sub.x = width / 2;
  sub.y = cardY + 82;
  container.addChild(sub);

  // --- App Store button ---
  const btnW = cardW * 0.44;
  const btnH = 52;
  const btnY = cardY + 110;
  const iosX = cardX + cardW * 0.03;
  const androidX = cardX + cardW * 0.53;

  function makeStoreBtn(x, y, label, sublabel, color, url) {
    const btn = new Graphics();
    btn.roundRect(x, y, btnW, btnH, 12);
    btn.fill({ color });
    btn.stroke({ color: 0xffffff, width: 1.5, alpha: 0.4 });
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => window.open(url, '_blank'));
    container.addChild(btn);

    const lbl = new Text({
      text: label,
      style: {
        fontFamily: 'Arial Black, Arial',
        fontSize: 11,
        fill: '#cccccc',
      },
    });
    lbl.anchor.set(0.5, 1);
    lbl.x = x + btnW / 2;
    lbl.y = y + btnH / 2 + 2;
    container.addChild(lbl);

    const sub2 = new Text({
      text: sublabel,
      style: {
        fontFamily: 'Arial Black, Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#ffffff',
      },
    });
    sub2.anchor.set(0.5, 0);
    sub2.x = x + btnW / 2;
    sub2.y = y + btnH / 2 + 4;
    container.addChild(sub2);

    return btn;
  }

  const iosBtn = makeStoreBtn(iosX, btnY, 'Download on the', 'App Store', 0x111111, IOS_URL);
  const androidBtn = makeStoreBtn(androidX, btnY, 'Get it on', 'Google Play', 0x1a6b1a, ANDROID_URL);

  // Pulsing animation for both buttons
  let scale = 1;
  let growing = true;
  container._animateCTA = () => {
    if (growing) {
      scale += 0.002;
      if (scale >= 1.06) growing = false;
    } else {
      scale -= 0.002;
      if (scale <= 1.0) growing = true;
    }
    iosBtn.scale.set(scale);
    androidBtn.scale.set(scale);
  };

  return container;
}
