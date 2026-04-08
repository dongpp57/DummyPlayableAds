/**
 * Card data for scenario S7 V1 — Pillar "Sắp xếp bài" — Guided Drag
 *
 * 7 lá lộn xộn: 7♥ 3♠ 7♣ K♦ 5♠ 7♦ 4♠
 * - PHỎM (run):  3♠ 4♠ 5♠
 * - BỘ   (set):  7♥ 7♦ 7♣
 * - LẺ:          K♦ (không drag được)
 *
 * Mode: Guided Drag — Free Order
 * User kéo bất kỳ lá nào vào khung đúng. Hand pointer hint theo HINT_ORDER.
 */

export function getInitialHand() {
  return [
    { value: '7', suit: 'hearts'   }, // 0 → BO
    { value: '3', suit: 'spades'   }, // 1 → PHOM
    { value: '7', suit: 'clubs'    }, // 2 → BO
    { value: 'K', suit: 'diamonds' }, // 3 → LEFTOVER
    { value: '5', suit: 'spades'   }, // 4 → PHOM
    { value: '7', suit: 'diamonds' }, // 5 → BO
    { value: '4', suit: 'spades'   }, // 6 → PHOM
  ];
}

/** Mapping: original card index → target group key */
export const CARD_TARGETS = {
  0: 'bo',
  1: 'phom',
  2: 'bo',
  3: 'leftover',
  4: 'phom',
  5: 'bo',
  6: 'phom',
};

/** Suggested hint order (free drag — chỉ để hand pointer hướng dẫn) */
export const HINT_ORDER = [1, 6, 4, 0, 5, 2]; // 3♠, 4♠, 5♠, 7♥, 7♦, 7♣

/** IQ + progress sau N lá đã drag đúng (index 0..6) */
export const PROGRESS_STEPS = [
  { iq: 10,  progress: 0.15 }, // 0
  { iq: 25,  progress: 0.25 }, // 1
  { iq: 40,  progress: 0.35 }, // 2
  { iq: 55,  progress: 0.50 }, // 3
  { iq: 70,  progress: 0.65 }, // 4
  { iq: 85,  progress: 0.80 }, // 5
  { iq: 110, progress: 1.00 }, // 6
];

export const TOTAL_TARGET_CARDS = 6;
