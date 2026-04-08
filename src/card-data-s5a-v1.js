/**
 * Card data for S5a V1 — Lose by Opponent KNOCK (1v1)
 *
 * Pre-game state:
 * - Player đã hạ 1 meld [2♠,3♠,4♠]. Tay còn 2 lá lẻ: 9♣ và J♦. Cây mở K♠.
 * - Opponent đã hạ 2 meld [10♦,10♥,10♣] và [4♣,5♣,6♣]. Tay opponent CHỈ CÒN 3 lá (face-down).
 *     2 lá lurk dùng để ăn + 1 lá rác để discard sau khi hạ meld → KNOCK.
 * - Opponent có lurk động:
 *     player thả 9♣ → opponent có [7♣,8♣,JUNK] → ăn meld [7♣,8♣,9♣] → discard junk → KNOCK
 *     player thả J♦ → opponent có [Q♦,K♦,JUNK] → ăn meld [J♦,Q♦,K♦] → discard junk → KNOCK
 * Free tap: tap lá nào cũng bị opponent KNOCK → LOSE.
 */

export function getPlayerHand() {
  return [
    { value: '9', suit: 'clubs' },    // → opponent ăn bằng 7♣ 8♣
    { value: 'J', suit: 'diamonds' }, // → opponent ăn bằng Q♦ K♦
  ];
}

export function getPlayerExistingMeld() {
  return [
    { value: '2', suit: 'spades' },
    { value: '3', suit: 'spades' },
    { value: '4', suit: 'spades' },
  ];
}

export function getCayMo() {
  return { value: 'K', suit: 'spades' };
}

/** Opponent đã hạ 2 meld trên bàn */
export function getOpponentExistingMelds() {
  return [
    [
      { value: '10', suit: 'diamonds' },
      { value: '10', suit: 'hearts' },
      { value: '10', suit: 'clubs' },
    ],
    [
      { value: '4', suit: 'clubs' },
      { value: '5', suit: 'clubs' },
      { value: '6', suit: 'clubs' },
    ],
  ];
}

/** Opponent lurk pair khi player thả 9♣ → meld [7♣,8♣,9♣] */
export function getOpponentLurk9() {
  return [
    { value: '7', suit: 'clubs' },
    { value: '8', suit: 'clubs' },
  ];
}

/** Opponent lurk pair khi player thả J♦ → meld [J♦,Q♦,K♦] */
export function getOpponentLurkJ() {
  return [
    { value: 'Q', suit: 'diamonds' },
    { value: 'K', suit: 'diamonds' },
  ];
}

/** Lá rác opponent discard sau khi hạ meld → KNOCK */
export function getOpponentJunk() {
  return { value: '2', suit: 'hearts' };
}

/** 4 lá ngẫu nhiên xếp vào discard pile (background visual) */
export function getDiscardPileFiller() {
  return [
    { value: '5', suit: 'spades' },
    { value: '8', suit: 'diamonds' },
    { value: 'A', suit: 'hearts' },
    { value: '3', suit: 'hearts' },
  ];
}
