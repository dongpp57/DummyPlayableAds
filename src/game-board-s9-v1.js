/**
 * Game board for scenario S9 V1 — Free Drag layout
 * - Bot meld [8♥ 9♥ 10♥] face-up at top (y=380)
 * - 2 target boxes (RUN + SET) in middle (y=520)
 * - Hand 7 cards at bottom (y=830)
 */
import { Graphics, Container, Text, Sprite, Assets } from 'pixi.js';
import { CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

export const CARD_SCALE = 0.9;
export const SCALED_W = CARD_WIDTH * CARD_SCALE;
export const SCALED_H = CARD_HEIGHT * CARD_SCALE;

export const BOT_MELD_Y     = 310;
export const BOT_MELD_SCALE = 0.55;
export const TARGETS_Y      = 480;  // Meld zone (khung xám "ดัมมี่")
export const HAND_Y         = 830;

export const RUN_COLOR = 0x0074D9; // xanh dương
export const SET_COLOR = 0x2ECC40; // xanh lá

export const TARGET_SLOT_SCALE = 0.6; // bigger for visibility, same as S7
export const TARGET_SLOT_W = CARD_WIDTH * TARGET_SLOT_SCALE;
export const TARGET_SLOT_H = CARD_HEIGHT * TARGET_SLOT_SCALE;
export const TARGET_BOX_CAPACITY = 4; // 4 slots per box

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

/**
 * Target boxes layout — 2 boxes (RUN, SET) side-by-side inside meld zone.
 * Returns: { run: {x,y,w,h, slots, labelY}, set: {...} }
 */
export function computeTargetBoxes(boardWidth) {
  const innerSlotW = TARGET_SLOT_W;
  const innerSlotH = TARGET_SLOT_H;
  const innerGap = 2;
  const boxPad = 6;
  const labelTop = 20;
  const boxW = innerSlotW * TARGET_BOX_CAPACITY + innerGap * (TARGET_BOX_CAPACITY - 1) + boxPad * 2;
  const boxH = innerSlotH + boxPad * 2 + labelTop;
  const gapBetweenBoxes = 8;
  const totalW = boxW * 2 + gapBetweenBoxes;
  const startX = (boardWidth - totalW) / 2;

  function makeBox(x, key) {
    const slots = Array.from({ length: TARGET_BOX_CAPACITY }, (_, i) => ({
      x: x + boxPad + i * (innerSlotW + innerGap),
      y: TARGETS_Y + labelTop + boxPad,
    }));
    return {
      x,
      y: TARGETS_Y,
      w: boxW,
      h: boxH,
      labelY: TARGETS_Y + 2,
      slots,
      key,
    };
  }

  return {
    run: makeBox(startX, 'run'),
    set: makeBox(startX + boxW + gapBetweenBoxes, 'set'),
  };
}

/** Bot meld slots — 3 cards face-up at top center */
export function computeBotMeldSlots(boardWidth) {
  const w = CARD_WIDTH * BOT_MELD_SCALE;
  const overlap = 15;
  const eff = w - overlap;
  const totalW = eff * 2 + w;
  const startX = (boardWidth - totalW) / 2;
  return Array.from({ length: 3 }, (_, i) => ({
    x: startX + i * eff,
    y: BOT_MELD_Y,
  }));
}

/** Create target boxes graphics with labels */
export function createTargetBoxes(boxes) {
  const root = new Container();
  const completeFns = {};
  const labels = {};

  const labelText = { run: 'RUN', set: 'SET' };
  const colors    = { run: RUN_COLOR, set: SET_COLOR };

  for (const key of ['run', 'set']) {
    const box = boxes[key];
    const color = colors[key];

    // Outer box
    const g = new Graphics();
    g.roundRect(box.x, box.y, box.w, box.h, 14);
    g.fill({ color, alpha: 0.12 });
    g.stroke({ color, width: 3, alpha: 0.9 });
    root.addChild(g);

    // Inner slot outlines (4 slots per box)
    box.slots.forEach((slot) => {
      const sg = new Graphics();
      sg.roundRect(slot.x, slot.y, TARGET_SLOT_W, TARGET_SLOT_H, 5);
      sg.fill({ color: 0xffffff, alpha: 0.08 });
      sg.stroke({ color, width: 1.5, alpha: 0.7 });
      root.addChild(sg);
    });

    // Label
    const label = new Text({
      text: labelText[key],
      style: {
        fontFamily: 'Arial Black, Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color, width: 4 },
      },
    });
    label.anchor.set(0.5, 0);
    label.x = box.x + box.w / 2;
    label.y = box.labelY;
    root.addChild(label);
    labels[key] = label;

    // Glow overlay (hidden)
    const glow = new Graphics();
    glow.roundRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 18);
    glow.stroke({ color, width: 6, alpha: 1 });
    glow.visible = false;
    root.addChild(glow);

    completeFns[key] = () => {
      glow.visible = true;
      label.text = `${labelText[key]} ✓`;
    };
  }

  root.completeFns = completeFns;
  root.labels = labels;
  return root;
}
