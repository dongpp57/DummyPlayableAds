/**
 * Game board for scenario S7 V1 — Guided Drag layout
 * 2 target boxes (Phỏm + Bộ) ở trên, hand 7 lá ở dưới.
 */
import { Graphics, Container, Text } from 'pixi.js';
import { CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

export const CARD_SCALE = 0.9;
export const SCALED_W = CARD_WIDTH * CARD_SCALE;   // 86.4
export const SCALED_H = CARD_HEIGHT * CARD_SCALE;  // 121.5

export const PHOM_COLOR = 0x2ECC40; // xanh lá
export const BO_COLOR   = 0xFF851B; // cam

export const TARGETS_Y = 480;  // Meld zone (vùng "ดัมมี่" giữa background)
export const HAND_Y    = 830;  // Hand player dưới, trên bottom bar (bar starts y≈996)

// Smaller scale for target slots so 2 boxes fit inside the grey meld zone
export const TARGET_SLOT_SCALE = 0.65;

/** target group config */
export const TARGET_GROUPS = {
  phom: { label: 'RUN', color: PHOM_COLOR, capacity: 3 },
  bo:   { label: 'SET', color: BO_COLOR,   capacity: 3 },
};

const HAND_OVERLAP = 30;
const HAND_EFFECTIVE_W = SCALED_W - HAND_OVERLAP;
const HAND_TOTAL_W = HAND_EFFECTIVE_W * 6 + SCALED_W; // 7 cards

/** Compute home positions for hand row (7 cards). */
export function computeHandSlots(boardWidth) {
  const startX = (boardWidth - HAND_TOTAL_W) / 2;
  return Array.from({ length: 7 }, (_, i) => ({
    x: startX + i * HAND_EFFECTIVE_W,
    y: HAND_Y,
  }));
}

/**
 * Compute target box layout: 2 boxes side-by-side, each holding 3 inner slots.
 * Returns: { boxes: { phom: {x,y,w,h, slots: [{x,y}x3]}, bo: {...} } }
 */
export const TARGET_SLOT_W = CARD_WIDTH * TARGET_SLOT_SCALE;
export const TARGET_SLOT_H = CARD_HEIGHT * TARGET_SLOT_SCALE;

export function computeTargetBoxes(boardWidth) {
  const innerSlotW = TARGET_SLOT_W;
  const innerSlotH = TARGET_SLOT_H;
  const innerGap = 4;
  const boxPad = 10;
  const labelTop = 22;
  const boxW = innerSlotW * 3 + innerGap * 2 + boxPad * 2;
  const boxH = innerSlotH + boxPad * 2 + labelTop;
  const gapBetweenBoxes = 16;
  const totalW = boxW * 2 + gapBetweenBoxes;
  const startX = (boardWidth - totalW) / 2;

  function makeBox(x, key) {
    const slots = Array.from({ length: 3 }, (_, i) => ({
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
    phom: makeBox(startX, 'phom'),
    bo:   makeBox(startX + boxW + gapBetweenBoxes, 'bo'),
  };
}

/**
 * Create graphics for both target boxes (label + dashed slot outlines).
 * Returns Container with .completeFns = { phom, bo } to glow on completion.
 */
export function createTargetBoxes(boxes) {
  const root = new Container();
  const completeFns = {};

  for (const key of ['phom', 'bo']) {
    const box = boxes[key];
    const cfg = TARGET_GROUPS[key];

    const g = new Graphics();
    // outer box
    g.roundRect(box.x, box.y, box.w, box.h, 16);
    g.fill({ color: cfg.color, alpha: 0.12 });
    g.stroke({ color: cfg.color, width: 3, alpha: 0.9 });
    root.addChild(g);

    // inner slot outlines (dashed-look = 4 thin rects per slot)
    box.slots.forEach((slot) => {
      const sg = new Graphics();
      sg.roundRect(slot.x, slot.y, TARGET_SLOT_W, TARGET_SLOT_H, 8);
      sg.fill({ color: 0xffffff, alpha: 0.08 });
      sg.stroke({ color: cfg.color, width: 2, alpha: 0.7 });
      root.addChild(sg);
    });

    // label
    const label = new Text({
      text: cfg.label,
      style: {
        fontFamily: 'Arial Black, Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: cfg.color, width: 4 },
      },
    });
    label.anchor.set(0.5, 0);
    label.x = box.x + box.w / 2;
    label.y = box.labelY;
    root.addChild(label);

    // glow overlay (hidden, shown on complete)
    const glow = new Graphics();
    glow.roundRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 18);
    glow.stroke({ color: cfg.color, width: 6, alpha: 1 });
    glow.visible = false;
    root.addChild(glow);

    completeFns[key] = () => {
      glow.visible = true;
      label.text = `${cfg.label} ✓`;
    };
  }

  root.completeFns = completeFns;
  return root;
}
