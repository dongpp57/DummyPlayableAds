/**
 * Game board for scenario 1-1
 * 10 cards in a single overlapping row with group highlight backgrounds.
 */
import { Graphics } from 'pixi.js';
import { CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

export const CARD_SCALE = 0.9;
export const SCALED_W = CARD_WIDTH * CARD_SCALE;   // 86.4
export const SCALED_H = CARD_HEIGHT * CARD_SCALE;  // 121.5

const OVERLAP = 30;                        // px each card overlaps the previous
const EFFECTIVE_W = SCALED_W - OVERLAP;   // width consumed per card (except last)
const TOTAL_W = EFFECTIVE_W * 9 + SCALED_W; // 9 gaps + 1 full last card

/**
 * Group definitions: which original card indices belong to each group.
 * color: null means no highlight (Deadwood).
 */
export const GROUPS = [
  { name: 'Set',      slotIndices: [0, 1, 2],       color: 0x2ECC40, alpha: 0.35 },
  { name: 'Run',      slotIndices: [3, 4, 5, 6, 7], color: 0x0074D9, alpha: 0.35 },
  { name: 'Deadwood', slotIndices: [8, 9],           color: null,     alpha: 0 },
];

/**
 * Compute slot positions for 10 cards in a single overlapping row.
 * Returns Array<{x, y}> — top-left of each card (before card scale is applied).
 * @param {number} boardWidth  canvas width (640)
 * @param {number} startY      top Y of the card row
 */
export function computeSlots(boardWidth, startY) {
  const startX = (boardWidth - TOTAL_W) / 2;
  const result = Array.from({ length: 10 }, (_, i) => ({
    x: startX + i * EFFECTIVE_W,
    y: startY,
    // No scale/rotation — cards are scaled manually, not via slot transform
  }));
  console.log('[slots] CARD_SCALE=', CARD_SCALE, 'SCALED_W=', SCALED_W, 'OVERLAP=', 30, 'EFFECTIVE_W=', EFFECTIVE_W, 'TOTAL_W=', TOTAL_W);
  console.log('[slots] startX=', startX, 'slots:', result.map((s,i) => `${i}:(${s.x.toFixed(1)},${s.y})`).join(' '));
  return result;
}

/**
 * Create group highlight Graphics objects (hidden initially).
 * Returns Array<Graphics>, index matches GROUPS array.
 * Add these to stage BEFORE cards so they render behind cards.
 * @param {Array<{x,y}>} slots  from computeSlots
 */
export function createGroupHighlights(slots) {
  return GROUPS.map((group) => {
    const g = new Graphics();
    g.visible = false;

    if (group.color !== null) {
      const firstSlot = slots[group.slotIndices[0]];
      const lastSlot  = slots[group.slotIndices[group.slotIndices.length - 1]];
      const x = firstSlot.x - 8;
      const y = firstSlot.y - 8;
      const w = lastSlot.x + SCALED_W - firstSlot.x + 16;
      const h = SCALED_H + 16;
      g.roundRect(x, y, w, h, 14);
      g.fill({ color: group.color, alpha: group.alpha });
    }

    return g;
  });
}
