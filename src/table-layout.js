/**
 * Shared table layout for 1v1 scenarios (S1-S6).
 *
 * Layout (canvas 640×1136):
 *
 *   y=0    Header
 *   y=140  Title
 *   y=230  IQ + Progress
 *   y=300  Timer (right corner)
 *   y=320  Bot avatar + bot meld zone
 *   y=480  Center: deck (left) + discard pile (right) + cay_mo highlight
 *   y=620  Player meld zone (above hand)
 *   y=830  Player hand
 *   y=978+ Footer
 */
import { Container, Graphics, Sprite, Text, Assets } from 'pixi.js';
import { CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

// Zone Y positions — match real game layout (see ảnh game thật)
// Bot avatar at top-left corner, bot hand fanned compact next to it.
// Deck/open/discard sit in the centre of the grey "ดัมมี่" meld zone.
export const BOT_AVATAR_X  = 50;
export const BOT_AVATAR_Y  = 290;
export const BOT_HAND_Y    = 280;  // bot face-down cards next to avatar
export const CENTER_ZONE_Y = 510;  // deck + open + discard inside grey meld zone
export const PLAYER_MELD_Y = 670;  // player melds land below center, above hand
export const PLAYER_HAND_Y = 830;
// Legacy alias
export const BOT_MELD_Y = BOT_HAND_Y;

// Card scales for each zone
export const HAND_SCALE  = 0.9;
export const MELD_SCALE  = 0.55;
export const DECK_SCALE  = 0.6;

export const HAND_SCALED_W = CARD_WIDTH * HAND_SCALE;
export const HAND_SCALED_H = CARD_HEIGHT * HAND_SCALE;
export const MELD_SCALED_W = CARD_WIDTH * MELD_SCALE;
export const MELD_SCALED_H = CARD_HEIGHT * MELD_SCALE;
export const DECK_SCALED_W = CARD_WIDTH * DECK_SCALE;
export const DECK_SCALED_H = CARD_HEIGHT * DECK_SCALE;

/** Compute hand slot positions (variable card count, overlapping) */
export function computeHandSlots(boardWidth, cardCount, y = PLAYER_HAND_Y) {
  const overlap = 30;
  const eff = HAND_SCALED_W - overlap;
  const totalW = eff * (cardCount - 1) + HAND_SCALED_W;
  const startX = (boardWidth - totalW) / 2;
  return Array.from({ length: cardCount }, (_, i) => ({
    x: startX + i * eff,
    y,
  }));
}

/** Compute meld slot positions for N cards in a row */
export function computeMeldSlots(boardWidth, cardCount, y, anchorCenter = true) {
  const overlap = 12;
  const eff = MELD_SCALED_W - overlap;
  const totalW = eff * (cardCount - 1) + MELD_SCALED_W;
  const startX = anchorCenter ? (boardWidth - totalW) / 2 : 30;
  return Array.from({ length: cardCount }, (_, i) => ({
    x: startX + i * eff,
    y,
  }));
}

/** Center zone: deck + cay_mo on the LEFT side of the grey meld zone */
export function computeCenterZone(boardWidth) {
  const cardW = DECK_SCALED_W;
  const gap = 16;
  // Anchor to left side of canvas (within grey meld zone)
  const startX = 60;
  return {
    deck:    { x: startX, y: CENTER_ZONE_Y },
    cayMo:   { x: startX + cardW + gap, y: CENTER_ZONE_Y },
    discard: { x: startX + (cardW + gap) * 2, y: CENTER_ZONE_Y }, // unused for S1
  };
}

/**
 * Create a face-down card sprite (for bot hand or deck).
 * Reusable purple back design.
 */
export function createCardBack(scale = HAND_SCALE) {
  const w = CARD_WIDTH * scale;
  const h = CARD_HEIGHT * scale;
  const c = new Container();
  const g = new Graphics();
  g.roundRect(0, 0, w, h, 8);
  g.fill({ color: 0x2a2a6e });
  g.stroke({ color: 0xffffff, width: 2 });
  g.roundRect(6, 6, w - 12, h - 12, 6);
  g.stroke({ color: 0x6464d6, width: 1.5 });
  g.moveTo(w / 2 - 12, h / 2 - 12);
  g.lineTo(w / 2 + 12, h / 2 + 12);
  g.moveTo(w / 2 + 12, h / 2 - 12);
  g.lineTo(w / 2 - 12, h / 2 + 12);
  g.stroke({ color: 0xffd700, width: 2 });
  c.addChild(g);
  c._cardW = w;
  c._cardH = h;
  return c;
}

/**
 * Create the deck pile (3-4 face-down cards stacked at center-left).
 * Returns Container; tracks `.topCard` for draw animation.
 */
export function createDeckPile(x, y) {
  const container = new Container();
  // Stack 3 backs offset slightly for depth
  for (let i = 0; i < 3; i++) {
    const back = createCardBack(DECK_SCALE);
    back.x = x + i * 2;
    back.y = y - i * 2;
    container.addChild(back);
  }
  return container;
}

/**
 * Create discard pile placeholder (empty rect with rounded border).
 */
export function createDiscardPile(x, y) {
  const w = DECK_SCALED_W;
  const h = DECK_SCALED_H;
  const g = new Graphics();
  g.roundRect(x, y, w, h, 8);
  g.fill({ color: 0x000000, alpha: 0.25 });
  g.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });

  const label = new Text({
    text: 'DISCARD',
    style: { fontFamily: 'Arial Black', fontSize: 10, fill: '#ffffff', alpha: 0.7 },
  });
  label.anchor.set(0.5);
  label.x = x + w / 2;
  label.y = y + h / 2;

  const c = new Container();
  c.addChild(g);
  c.addChild(label);
  c._x = x;
  c._y = y;
  c._w = w;
  c._h = h;
  return c;
}

/**
 * Create bot avatar — circle + label "BOT" or custom name.
 */
export function createBotAvatar(x, y, label = 'OPPONENT') {
  const c = new Container();
  const radius = 28;
  const g = new Graphics();
  g.circle(0, 0, radius);
  g.fill({ color: 0x4a4a8e });
  g.stroke({ color: 0xFFD700, width: 3 });
  // Simple face
  g.circle(-8, -4, 3); g.fill({ color: 0xffffff });
  g.circle(8, -4, 3);  g.fill({ color: 0xffffff });
  g.moveTo(-8, 8);
  g.quadraticCurveTo(0, 14, 8, 8);
  g.stroke({ color: 0xffffff, width: 2 });
  c.addChild(g);

  const labelText = new Text({
    text: label,
    style: {
      fontFamily: 'Arial Black',
      fontSize: 11,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#000', width: 3 },
    },
  });
  labelText.anchor.set(0.5, 0);
  labelText.x = 0;
  labelText.y = radius + 3;
  c.addChild(labelText);

  c.x = x;
  c.y = y;
  return c;
}

/**
 * Create empty meld zone outline (where cards will be placed during animation).
 * Returns Container with helper methods.
 */
export function createMeldZoneOutline(x, y, slotCount, color = 0x2ECC40) {
  const c = new Container();
  const slotW = MELD_SCALED_W;
  const slotH = MELD_SCALED_H;
  const overlap = 12;
  const eff = slotW - overlap;
  const totalW = eff * (slotCount - 1) + slotW;
  const pad = 6;

  const bg = new Graphics();
  bg.roundRect(x - pad, y - pad, totalW + pad * 2, slotH + pad * 2, 8);
  bg.fill({ color, alpha: 0.08 });
  bg.stroke({ color, width: 1.5, alpha: 0.6 });
  c.addChild(bg);
  return c;
}
