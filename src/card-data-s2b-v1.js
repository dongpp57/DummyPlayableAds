/**
 * Card data for S2b V1 — Lose "Watch the trap" auto-play demo (1v1)
 *
 * Player đã hạ meld [2♣,3♣,4♣] từ trước.
 * Player tay còn 2 lá lẻ: 5♥ và 9♥. Cây mở 7♥.
 * Bot có SẴN cả 6♥ và 8♥ trong tay (ẨN — face-down, chỉ reveal khi ăn).
 *  - Player thả 5♥ → bot ăn run [5♥,6♥,7♥]
 *  - Player thả 9♥ → bot ăn run [7♥,8♥,9♥]
 * Đánh lá nào cũng bị ăn cây mở → LOSE -50 (Pain moment).
 */

export function getPlayerHand() {
  return [
    { value: '5', suit: 'hearts' }, // bot ăn bằng 6♥
    { value: '9', suit: 'hearts' }, // bot ăn bằng 8♥
  ];
}

/** Meld player đã hạ trên bàn */
export function getPlayerExistingMeld() {
  return [
    { value: '2', suit: 'clubs' },
    { value: '3', suit: 'clubs' },
    { value: '4', suit: 'clubs' },
  ];
}

/** Cây mở (open card) ở discard */
export function getCayMo() {
  return { value: '7', suit: 'hearts' };
}

/** Lá bot dùng để ăn 5♥ → meld [5♥,6♥,7♥] */
export function getBotLurk5() {
  return { value: '6', suit: 'hearts' };
}

/** Lá bot dùng để ăn 9♥ → meld [7♥,8♥,9♥] */
export function getBotLurk9() {
  return { value: '8', suit: 'hearts' };
}
