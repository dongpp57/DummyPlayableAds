/**
 * Card data for scenario S9 V1 — Pillar "Sắp xếp bài" — Free Drag (Eureka suy luận)
 *
 * Hand (7 cards): 3♥ 5♥ 4♥ 5♦ 5♣ 5♠ 7♥
 * Player meld on table (cosmetic, non-interactable): 6♣ 7♣ 8♣
 *
 * Ambiguous card: 5♥ (orig idx 1)
 *
 * Correct (drag 5♥ → RUN):
 *   RUN hearts = 3♥ 4♥ 5♥ ✓
 *   SET 5s     = 5♦ 5♣ 5♠ ✓
 *   Leftover 7♥ → discarded on knock (the single deadwood card is legal to knock with)
 *   Outcome: KNOCK WIN
 *
 * Wrong (drag 5♥ → SET):
 *   SET 5s = 5♥ 5♦ 5♣ 5♠ (4-of-a-kind)
 *   Leftover: 3♥ 4♥ 7♥ — no meld possible (two cards short of a run, different suits)
 *   Cannot lay off to clubs meld (wrong suit).
 *   Outcome: NO KNOCK → replay
 */

export function getInitialHand() {
  return [
    { value: '3',  suit: 'hearts'   }, // 0 → RUN HEARTS (3-4-5♥)
    { value: '5',  suit: 'hearts'   }, // 1 → AMBIGUOUS (drag this)
    { value: '4',  suit: 'hearts'   }, // 2 → RUN HEARTS
    { value: '5',  suit: 'diamonds' }, // 3 → SET 5s
    { value: '5',  suit: 'clubs'    }, // 4 → SET 5s
    { value: '5',  suit: 'spades'   }, // 5 → SET 5s
    { value: '7',  suit: 'hearts'   }, // 6 → DISCARD on knock (deadwood)
  ];
}

/** Cosmetic meld on table — no lay-off interaction */
export function getBotMeld() {
  return [
    { value: '6', suit: 'clubs' },
    { value: '7', suit: 'clubs' },
    { value: '8', suit: 'clubs' },
  ];
}

/**
 * Display order for hand (slot index 0..6 → original card index).
 * Shuffled so 3♥/4♥ are not adjacent to 5♥, and the 5s are spread out.
 *   slot 0 → 5♦ (orig 3)
 *   slot 1 → 3♥ (orig 0)
 *   slot 2 → 5♣ (orig 4)
 *   slot 3 → 5♥ (orig 1)  ← ambiguous card, middle position
 *   slot 4 → 7♥ (orig 6)
 *   slot 5 → 4♥ (orig 2)
 *   slot 6 → 5♠ (orig 5)
 */
export const HAND_DISPLAY_ORDER = [3, 0, 4, 1, 6, 2, 5];

/** The only card that is draggable */
export const AMBIGUOUS_CARD_INDEX = 1; // 5♥

/** Correct choice groupings */
export const RUN_HEARTS_ORIGS = [0, 1, 2]; // 3♥ 5♥ 4♥ (display order: 3, 4, 5)
export const SET_5S_ORIGS     = [3, 4, 5]; // 5♦ 5♣ 5♠
export const DISCARD_ORIG     = 6;         // 7♥

/** Wrong choice: SET gets 4 cards */
export const WRONG_SET_ORIGS  = [1, 3, 4, 5]; // 5♥ 5♦ 5♣ 5♠
export const WRONG_LEFTOVER   = [0, 2, 6];    // 3♥ 4♥ 7♥
