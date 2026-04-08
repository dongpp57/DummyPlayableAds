/**
 * Card data for S4 V1 — Win by knock (combo: ăn + lay off + knock)
 *
 * Pre-game state:
 *   Player already melded [3♠ 4♠ 5♠] (run spades)
 *   Opponent already melded [9♥ 10♥ J♥] (run hearts)
 *
 * Player hand (4 cards): 5♣ 6♣ Q♥ 8♠
 * Opponent just discarded: 7♣
 *
 * Flow:
 *   Step 1: Tap 7♣ → 5♣ and 6♣ lift up
 *   Step 2: Tap 5♣ OR 6♣ → meld [5♣ 6♣ 7♣] forms
 *   Step 3: Drag Q♥ → opponent meld → extend to [9♥ 10♥ J♥ Q♥]
 *   Step 4: Tap KNOCK → 8♠ flies to discard pile → Knock effect
 */

/** Player hand — 4 cards */
export function getPlayerHand() {
  return [
    { value: '5', suit: 'clubs'  },  // 0 → meld with 7♣
    { value: '6', suit: 'clubs'  },  // 1 → meld with 7♣
    { value: 'Q', suit: 'hearts' },  // 2 → lay off to opponent meld
    { value: '8', suit: 'spades' },  // 3 → discard on knock
  ];
}

/** Player's pre-existing meld on table */
export function getPlayerExistingMeld() {
  return [
    { value: '3', suit: 'spades' },
    { value: '4', suit: 'spades' },
    { value: '5', suit: 'spades' },
  ];
}

/** Opponent's pre-existing meld (extendable via Q♥ lay off) */
export function getOpponentMeld() {
  return [
    { value: '9',  suit: 'hearts' },
    { value: '10', suit: 'hearts' },
    { value: 'J',  suit: 'hearts' },
  ];
}

/** Opponent's discard (the card player picks up) */
export function getOpponentDiscard() {
  return { value: '7', suit: 'clubs' };
}

/** Open card (neutral) */
export function getOpenCard() {
  return { value: 'A', suit: 'diamonds' };
}

// Card indices for each step
export const TAP_CARDS_STEP1 = [0, 1]; // 5♣ 6♣ are the cards to highlight for meld w/ 7♣
export const LAYOFF_Q_INDEX  = 2;      // Q♥
export const DISCARD_INDEX   = 3;      // 8♠ (discarded on knock)
