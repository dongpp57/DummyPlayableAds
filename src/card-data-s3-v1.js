/**
 * Card data for S3 V1 — Win: Ăn Spe-to (+50, opponent -50)
 *
 * Dummy rules: meld run = 3+ consecutive cards same suit. Meld set = 3+ same value.
 *
 * Open card (cây mở, neutral): 7♦ — neutral top of deck
 * Opponent discarded Spe-to Q♠
 * Player must pick J♠ + K♠ from hand → meld [J♠, Q♠, K♠] (valid run in spades)
 *   → Player +50, Opponent -50
 */

export function getInitialHand() {
  return [
    { value: 'J',  suit: 'spades'   }, // 0 → meld (run with Q♠)
    { value: '5',  suit: 'hearts'   }, // 1 → filler
    { value: '8',  suit: 'diamonds' }, // 2 → filler
    { value: 'K',  suit: 'spades'   }, // 3 → meld (run with Q♠)
    { value: '4',  suit: 'clubs'    }, // 4 → filler
    { value: '9',  suit: 'hearts'   }, // 5 → filler
    { value: '3',  suit: 'spades'   }, // 6 → filler (not consecutive with J♠)
  ];
}

/** Open card (cây mở) — neutral, top of deck, not interactive */
export function getOpenCard() {
  return { value: '7', suit: 'diamonds' };
}

/** Spe-to card — opponent just discarded this. Player can grab it. */
export function getSpeToCard() {
  return { value: 'Q', suit: 'spades' };
}

/** Indices in hand that form a valid meld with Spe-to Q♠. All must be picked to enable Meld button. */
export const MELD_CARD_INDICES = [0, 3]; // J♠ and K♠
