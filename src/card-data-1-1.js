/**
 * Card data for scenario 1-1
 *
 * Initial: [0]7♥ [1]7♣ [2]K♦ [3]8♥ [4]Q♠ [5]9♥ [6]10♥ [7]J♥ [8]7♦ [9]Q♥
 *
 * Step 1: 7♦(8) ↔ K♦(2) → Set 0-2 = 7♥7♣7♦ ✓
 *   Result: [7♥,7♣,7♦, 8♥,Q♠,9♥,10♥,J♥, K♦,Q♥]
 *   Run zone has Q♠ intruder, Q♥ outside → NOT complete
 *
 * Step 2: Q♠(4) ↔ K♦(2→slot8) → Q♠ to deadwood, K♦ as temp in run
 *   Result: [7♥,7♣,7♦, 8♥,K♦,9♥,10♥,J♥, Q♠,Q♥]
 *   Run zone has K♦ intruder, Q♥ still outside → NOT complete
 *
 * Step 3: Q♥(9) ↔ K♦(2→slot4) → Q♥ into run zone, K♦ to deadwood → Run complete!
 *   Result: [7♥,7♣,7♦, 8♥,Q♥,9♥,10♥,J♥, Q♠,K♦]
 *   Run zone = 8♥ Q♥ 9♥ 10♥ J♥ ✓
 */

export function getInitialHand() {
  return [
    { value: '7',  suit: 'hearts'   }, // 0 — Set
    { value: '7',  suit: 'clubs'    }, // 1 — Set
    { value: 'K',  suit: 'diamonds' }, // 2 — temp placeholder, leaves Set zone in step1
    { value: '8',  suit: 'hearts'   }, // 3 — Run
    { value: 'Q',  suit: 'spades'   }, // 4 — intruder in run zone, leaves in step2
    { value: '9',  suit: 'hearts'   }, // 5 — Run
    { value: '10', suit: 'hearts'   }, // 6 — Run
    { value: 'J',  suit: 'hearts'   }, // 7 — Run
    { value: '7',  suit: 'diamonds' }, // 8 — Set, enters Set zone in step1
    { value: 'Q',  suit: 'hearts'   }, // 9 — Run, enters Run zone in step3
  ];
}

/**
 * highlightA/B: original card indices (0-9).
 * isComplete(m): Map<slotIndex, originalCardIndex> → boolean
 */
export const SWAP_STEPS = [
  {
    // Step 1: 7♦(orig8) ↔ K♦(orig2)
    highlightA: 8,
    highlightB: 2,
    isComplete: (m) => m.get(0) === 8 || m.get(1) === 8 || m.get(2) === 8,
    iqAfter: 40,
    progressAfter: 0.4,
    progressFrom: 0.2,
  },
  {
    // Step 2: Q♠(orig4) ↔ K♦(orig2, now at slot8)
    highlightA: 4,
    highlightB: 2,
    isComplete: (m) => {
      let qsSlot = -1;
      m.forEach((orig, slot) => { if (orig === 4) qsSlot = slot; });
      return qsSlot >= 8;
    },
    iqAfter: 70,
    progressAfter: 0.7,
    progressFrom: 0.4,
  },
  {
    // Step 3: Q♥(orig9) ↔ K♦(orig2, now at slot4)
    highlightA: 9,
    highlightB: 2,
    isComplete: (m) => {
      let qhSlot = -1, kdSlot = -1;
      m.forEach((orig, slot) => {
        if (orig === 9) qhSlot = slot;
        if (orig === 2) kdSlot = slot;
      });
      return qhSlot >= 3 && qhSlot <= 7 && (kdSlot < 3 || kdSlot > 7);
    },
    iqAfter: 110,
    progressAfter: 1.0,
    progressFrom: 0.7,
  },
];
