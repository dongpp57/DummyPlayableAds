/**
 * Game board for scenario S8 V1 — Single-Tap SORT layout
 * Bot hand (face-down) ở trên, player hand 7 lá ở dưới.
 */
import { Graphics } from 'pixi.js';
import { CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

export const CARD_SCALE = 0.9;
export const SCALED_W = CARD_WIDTH * CARD_SCALE;
export const SCALED_H = CARD_HEIGHT * CARD_SCALE;

export const BOT_HAND_Y = 380;
export const BOT_CARD_SCALE = 0.55;
export const HAND_Y = 720;

export const RUN_COLOR = 0x0074D9;
export const SET_COLOR = 0x2ECC40;

const HAND_OVERLAP = 30;
const HAND_EFFECTIVE_W = SCALED_W - HAND_OVERLAP;
const HAND_TOTAL_W = HAND_EFFECTIVE_W * 6 + SCALED_W;

export function computeHandSlots(boardWidth) {
  const startX = (boardWidth - HAND_TOTAL_W) / 2;
  return Array.from({ length: 7 }, (_, i) => ({
    x: startX + i * HAND_EFFECTIVE_W,
    y: HAND_Y,
  }));
}

const BOT_SCALED_W = CARD_WIDTH * BOT_CARD_SCALE;
const BOT_OVERLAP = 25;
const BOT_EFF = BOT_SCALED_W - BOT_OVERLAP;
const BOT_TOTAL = BOT_EFF * 6 + BOT_SCALED_W;

export function computeBotSlots(boardWidth) {
  const startX = (boardWidth - BOT_TOTAL) / 2;
  return Array.from({ length: 7 }, (_, i) => ({
    x: startX + i * BOT_EFF,
    y: BOT_HAND_Y,
  }));
}

/**
 * Create group highlight graphics (Run + Set) — hidden initially.
 * Returns [runHighlight, setHighlight].
 */
export function createGroupHighlights(handSlots) {
  function box(slotIndices, color) {
    const g = new Graphics();
    g.visible = false;
    const first = handSlots[slotIndices[0]];
    const last  = handSlots[slotIndices[slotIndices.length - 1]];
    const pad = 10;
    const x = first.x - pad;
    const y = first.y - pad;
    const w = last.x + SCALED_W - first.x + pad * 2;
    const h = SCALED_H + pad * 2;

    g.roundRect(x - 3, y - 3, w + 6, h + 6, 18);
    g.stroke({ color, width: 6, alpha: 0.35 });

    g.roundRect(x, y, w, h, 14);
    g.fill({ color, alpha: 0.5 });

    g.roundRect(x, y, w, h, 14);
    g.stroke({ color, width: 4, alpha: 1 });
    return g;
  }
  return [
    box([0, 1, 2], RUN_COLOR),
    box([3, 4, 5], SET_COLOR),
  ];
}
