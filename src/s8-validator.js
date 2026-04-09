/**
 * Hand validator for S8 V1 — "drag to form 2 melds" mode.
 *
 * Rules:
 *  - Hand has 7 cards in slot order (left → right)
 *  - A "group" is a contiguous run of slots whose cards form a valid meld:
 *      • RUN  = 3+ cards, same suit, consecutive values (no A-wrap)
 *      • SET  = 3+ cards, same value, distinct suits
 *  - We need to find 2 DISJOINT groups (each of size ≥ 3) inside the hand.
 *    The remaining cards (0–1 deadwood) are allowed.
 *
 * Value ordering used for runs (Ace is HIGH only in Dummy):
 *    2=2 3=3 4=4 5=5 6=6 7=7 8=8 9=9 10=10 J=11 Q=12 K=13 A=14
 */

const VALUE_ORDER = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

function isRun(cards) {
  if (cards.length < 3) return false;
  const suit = cards[0].suit;
  if (!cards.every((c) => c.suit === suit)) return false;
  const nums = cards.map((c) => VALUE_ORDER[c.value]).sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) return false;
  }
  return true;
}

function isSet(cards) {
  if (cards.length < 3) return false;
  const val = cards[0].value;
  if (!cards.every((c) => c.value === val)) return false;
  const suits = new Set(cards.map((c) => c.suit));
  return suits.size === cards.length; // distinct suits
}

function isValidMeld(cards) {
  return isRun(cards) || isSet(cards);
}

/**
 * Enumerate all contiguous valid melds (run or set) of size >= 3 in the hand.
 * Returns array of { start, end, type } (slot indices inclusive).
 */
export function findAllValidRanges(handSlotOrder) {
  const n = handSlotOrder.length;
  const ranges = [];
  for (let start = 0; start < n; start++) {
    for (let end = start + 2; end < n; end++) {
      const segment = handSlotOrder.slice(start, end + 1);
      if (isRun(segment)) ranges.push({ start, end, type: 'run' });
      else if (isSet(segment)) ranges.push({ start, end, type: 'set' });
    }
  }
  return ranges;
}

/**
 * Find the best non-overlapping highlight set — prefer 2 disjoint groups,
 * else 1 group, else empty. Used for realtime highlight feedback while
 * the user is dragging.
 *
 * Returns an array of 0, 1, or 2 range objects.
 */
export function findBestHighlightGroups(handSlotOrder) {
  const ranges = findAllValidRanges(handSlotOrder);
  if (ranges.length === 0) return [];

  // Try to find 2 disjoint ranges (prefer those that together cover the most cards)
  let best = null;
  let bestCoverage = 0;
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i];
      const b = ranges[j];
      if (a.end < b.start || b.end < a.start) {
        const cov = (a.end - a.start + 1) + (b.end - b.start + 1);
        if (cov > bestCoverage) {
          bestCoverage = cov;
          best = a.start < b.start ? [a, b] : [b, a];
        }
      }
    }
  }
  if (best) return best;

  // Fallback: longest single range
  let longest = ranges[0];
  for (const r of ranges) {
    if (r.end - r.start > longest.end - longest.start) longest = r;
  }
  return [longest];
}

/**
 * Win condition: hand has 2 disjoint valid melds.
 * Returns { groupA, groupB } or null.
 */
export function validateHand(handSlotOrder) {
  const groups = findBestHighlightGroups(handSlotOrder);
  if (groups.length === 2) return { groupA: groups[0], groupB: groups[1] };
  return null;
}
