/**
 * Card data for S1 V1 — Win: Ăn cây mở 5♣ (+50)
 * Layout: 1v1 (player + bot opponent)
 *
 * Cây mở 5♣ ở discard pile từ đầu.
 * Player phải pick 4♣ + 6♣ → meld [4♣, 5♣, 6♣] (run in clubs)
 */

export function getInitialHand() {
  return [
    { value: '4',  suit: 'clubs'    }, // 0 → meld with cay_mo
    { value: '6',  suit: 'clubs'    }, // 1 → meld with cay_mo
    { value: '8',  suit: 'hearts'   }, // 2 → filler
    { value: '9',  suit: 'hearts'   }, // 3 → filler
    { value: 'J',  suit: 'spades'   }, // 4 → filler
    { value: 'Q',  suit: 'spades'   }, // 5 → filler
    { value: 'K',  suit: 'spades'   }, // 6 → filler
  ];
}

/** Cây mở (open card) at discard center */
export function getCayMo() {
  return { value: '5', suit: 'clubs' };
}

/** Indices of cards player needs to pick to meld with cay_mo. All must be picked to enable Meld button. */
export const MELD_CARD_INDICES = [0, 1]; // 4♣ and 6♣
