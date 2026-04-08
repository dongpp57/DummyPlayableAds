/**
 * Card data for S6 V1 — Win by clearing hand (combo: meld + layoff x2 + knock Q♠)
 *
 * Pre-game state:
 *   Player already melded [2♣ 3♣ 4♣] and [7♦ 8♦ 9♦]
 *   Opponent already melded [9♥ 10♥ J♥]
 *
 * Player hand (5 cards): 4♠ 5♠ 8♥ Q♥ Q♠
 * Opponent discard flow: 3♦ → J♣ → 6♠ (final)
 *
 * Interactive flow (after ~6s auto intro):
 *   Step 1: Tap 6♠ → pick 4♠ & 5♠ → Meld button → meld [4♠ 5♠ 6♠]
 *   Step 2: Drag 8♥ → opponent meld → [8♥ 9♥ 10♥ J♥]
 *   Step 3: Drag Q♥ → opponent meld → [8♥ 9♥ 10♥ J♥ Q♥]
 *   Step 4: Tap KNOCK → Q♠ flies to discard → WIN (clear hand)
 */

/** Player hand — 5 cards */
export function getPlayerHand() {
  return [
    { value: '4', suit: 'spades' },  // meld with 6♠
    { value: '5', suit: 'spades' },  // meld with 6♠
    { value: '8', suit: 'hearts' },  // layoff to opponent meld (left of 9♥)
    { value: 'Q', suit: 'hearts' },  // layoff to opponent meld (right of J♥)
    { value: 'Q', suit: 'spades' },  // knock card (discarded last)
  ];
}

/** Player's pre-existing melds on table */
export function getPlayerExistingMelds() {
  return [
    [
      { value: '2', suit: 'clubs' },
      { value: '3', suit: 'clubs' },
      { value: '4', suit: 'clubs' },
    ],
    [
      { value: '7', suit: 'diamonds' },
      { value: '8', suit: 'diamonds' },
      { value: '9', suit: 'diamonds' },
    ],
  ];
}

/** Opponent's pre-existing meld (extendable via 8♥ and Q♥ layoff) */
export function getOpponentMeld() {
  return [
    { value: '9',  suit: 'hearts' },
    { value: '10', suit: 'hearts' },
    { value: 'J',  suit: 'hearts' },
  ];
}

/** The card bot discards in the auto intro (becomes the interactive target) */
export function getFinalDiscard() {
  return { value: '6', suit: 'spades' };
}

/** Open card (neutral, not interactive) */
export function getOpenCard() {
  return { value: '5', suit: 'clubs' };
}

// Card role keys in hand (by value_suit) — used to track after shuffle
export const MELD_KEYS    = ['4_spades', '5_spades']; // pick these to meld with 6♠
export const LAYOFF_8H    = '8_hearts';
export const LAYOFF_QH    = 'Q_hearts';
export const KNOCK_KEY    = 'Q_spades';
