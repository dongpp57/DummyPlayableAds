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
  { name: 'Set',      slotIndices: [0, 1, 2],       color: 0x2ECC40, alpha: 0.5 },
  { name: 'Run',      slotIndices: [3, 4, 5, 6, 7], color: 0x0074D9, alpha: 0.5 },
  { name: 'Deadwood', slotIndices: [8, 9],          color: null,     alpha: 0 },
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
      const pad = 10;
      const x = firstSlot.x - pad;
      const y = firstSlot.y - pad;
      const w = lastSlot.x + SCALED_W - firstSlot.x + pad * 2;
      const h = SCALED_H + pad * 2;

      // Outer glow (softer, thicker)
      g.roundRect(x - 3, y - 3, w + 6, h + 6, 18);
      g.stroke({ color: group.color, width: 6, alpha: 0.35 });

      // Filled background
      g.roundRect(x, y, w, h, 14);
      g.fill({ color: group.color, alpha: group.alpha });

      // Solid bright border
      g.roundRect(x, y, w, h, 14);
      g.stroke({ color: group.color, width: 4, alpha: 1 });
    }

    return g;
  });
}
