/**
 * Card data for scenario S8 V1 — Pillar "Sắp xếp bài" — Single-Tap SORT
 *
 * Initial unsorted hand: K♥ 7♦ 3♥ 7♣ 5♥ 7♠ 4♥
 * After SORT:
 *   slots 0-2 = Run 3♥ 4♥ 5♥
 *   slots 3-5 = Set 7♣ 7♦ 7♠
 *   slot 6    = Deadwood K♥ (10 pts, ad-allowed)
 */

export function getInitialHand() {
  return [
    { value: 'K', suit: 'hearts'   }, // 0 → Deadwood
    { value: '7', suit: 'diamonds' }, // 1 → Set
    { value: '3', suit: 'hearts'   }, // 2 → Run
    { value: '7', suit: 'clubs'    }, // 3 → Set
    { value: '5', suit: 'hearts'   }, // 4 → Run
    { value: '7', suit: 'spades'   }, // 5 → Set
    { value: '4', suit: 'hearts'   }, // 6 → Run
  ];
}

export function getBotHand() {
  return [
    { value: '2',  suit: 'diamonds' },
    { value: '6',  suit: 'clubs'    },
    { value: '9',  suit: 'spades'   },
    { value: 'J',  suit: 'diamonds' },
    { value: 'Q',  suit: 'spades'   },
    { value: 'K',  suit: 'clubs'    },
    { value: 'A',  suit: 'hearts'   },
  ];
}

/**
 * Sort target order (slot index → original card index).
 * After sort:
 *   slot 0 = orig 2 (3♥)
 *   slot 1 = orig 6 (4♥)
 *   slot 2 = orig 4 (5♥)
 *   slot 3 = orig 3 (7♣)
 *   slot 4 = orig 1 (7♦)
 *   slot 5 = orig 5 (7♠)
 *   slot 6 = orig 0 (K♥, deadwood)
 */
export const SORT_TARGET_SLOTS = [2, 6, 4, 3, 1, 5, 0];

/** Group definitions after sort */
export const RUN_SLOTS = [0, 1, 2];
export const SET_SLOTS = [3, 4, 5];
export const DEADWOOD_SLOT = 6;
