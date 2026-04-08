# Kịch Bản Playable Ad — Dummy — Scenario S8

> **Pillar**: Sắp xếp bài | **Variant**: 4 (V1-V4 chung logic, khác art)
> **Mode**: Single-Tap SORT → Instant Win Reveal
> **Source spec**: `Dummy/PlayableAds/20260407/playable_ads_36_scenarios.md` §S8
> **File naming**: `index-s8-v{N}.html`, `main-s8-v{N}.js`, `card-data-s8-v{N}.js`, `game-board-s8-v{N}.js`
> **Build**: `SCENARIO=s8-v1 npx vite build`

---

## Thông Tin Chung
- **Game**: Dummy (Rummy) ZingPlay Thailand
- **Canvas**: 640×1136
- **Độ dài**: 14 giây
- **Số turn**: 0 (instant win sau khi tap SORT)
- **Hook cảm xúc**: Wow — sắp xếp xong thấy ngay là thắng!
- **Target moment**: "Bài chia siêu đẹp, sort xong thắng instant!"
- **Players**: 2 (Player vs Bot)
- **Output**: Single-file HTML
- **Link Android**: `https://play.google.com/store/apps/details?id=th.dm.card.casino`
- **Link iOS**: `https://apps.apple.com/app/dummy-zingplay/id6737778971`

---

## Bố Cục Màn Hình

| Vị trí | Thành phần | Mô tả |
|--------|-----------|-------|
| y=0    | Header | `img_header.webp` |
| y=40   | Top Bar | "INCREASE YOUR IQ!" + Download Now + Skip Ads |
| y=140  | Title | "What's special about this hand?" → "INSTANT WIN!" |
| y=230  | IQ + Progress Bar | 10 → 110 sau khi sort |
| y=380  | Bot Hand (face-down) | 7 lá úp, hiển thị nhỏ ở phía trên |
| y=600  | Timer | Đồng hồ đếm ngược |
| y=720  | **Player Hand 7 lá** | Lộn xộn — sau SORT thì rearrange |
| y=978+ | Footer | App Store + Google Play |

---

## Bài Trên Tay (7 lá)

### Player Hand (lộn xộn ban đầu)
| Index | Lá | Group cuối |
|-------|----|-----------|
| 0 | K♥ | **Deadwood (lá lẻ, 10 pts)** |
| 1 | 7♦ | Set |
| 2 | 3♥ | Run |
| 3 | 7♣ | Set |
| 4 | 5♥ | Run |
| 5 | 7♠ | Set |
| 6 | 4♥ | Run |

### Hand sau SORT
- **Run** (slots 0-2): `3♥ 4♥ 5♥` — color `#0074D9`
- **Set** (slots 3-5): `7♣ 7♦ 7♠` — color `#2ECC40`
- **Deadwood** (slot 6): `K♥` — fade mờ, label "0 pts (allowed)"

### Bot Hand (face-down, reveal cuối khi knock)
`[2♦, 6♣, 9♠, J♦, Q♠, K♣, A♥]` — bot điểm cao (53 pts deadwood)

---

## Kịch Bản Tương Tác

### Phase 1: Intro (0-3s)
- Bàn 1v1 hiện ra
- Bot hand (7 lá úp) xuất hiện ở trên
- Player hand 7 lá flip animation lên (lộn xộn)
- Title pulse: **"What's special about this hand?"**
- Timer chạy 14s

### Phase 2: SORT button (3-5s)
- Nút **SORT** to xuất hiện ở giữa màn hình (under hand row)
- Hand pointer animate chỉ vào nút SORT
- Lá K♥ vẫn nằm trong hand, các lá khác cũng

### Phase 3: User tap SORT (5-10s)
- Tap SORT → button disappear
- Cards **fly animation** rearrange:
  - 3♥ → slot 0
  - 4♥ → slot 1
  - 5♥ → slot 2
  - 7♣ → slot 3
  - 7♦ → slot 4
  - 7♠ → slot 5
  - K♥ → slot 6 (fade alpha 0.5)
- Sau 800ms fly: highlight Run xanh dương + Set xanh lá
- Text vàng to: **"PERFECT HAND! INSTANT WIN!"**
- IQ 10 → 110, progress 0.2 → 1.0
- Trigger chip rain (confetti vàng)

### Phase 4: Auto Knock + Bot Reveal (10-13s)
- Bot hand flip face-up → reveal `[2♦,6♣,9♠,J♦,Q♠,K♣,A♥]`
- Score popup: Player vs Bot
- Title đổi: **"YOU WIN!"**

### Phase 5: CTA (13-14s)
- Auto open store link
- Hoặc hiện CTA overlay (App Store + Google Play)

---

## Khi Hết Giờ (14s nếu user không tap SORT)
- Title đổi "Time's Up!"
- Hiện CTA Overlay

---

## File Structure

### `index-s8-v{N}.html`
Copy `index-1-1.html`, đổi `<script src="/src/main-s8-v{N}.js">` + `<title>Dummy - Playable Ad S8 V{N}</title>`.

### `src/card-data-s8-v{N}.js`
```js
export function getInitialHand() {
  return [
    { value: 'K', suit: 'hearts'   }, // 0 → Deadwood (K♥, 10 pts allowed)
    { value: '7', suit: 'diamonds' }, // 1 → Set (7♦)
    { value: '3', suit: 'hearts'   }, // 2 → Run start
    { value: '7', suit: 'clubs'    }, // 3 → Set (7♣)
    { value: '5', suit: 'hearts'   }, // 4 → Run mid
    { value: '7', suit: 'spades'   }, // 5 → Set (7♠)
    { value: '4', suit: 'hearts'   }, // 6 → Run mid
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
```

### `src/game-board-s8-v{N}.js`
```js
export const CARD_SCALE = 0.9;
export const HAND_Y = 720;
export const RUN_COLOR = 0x0074D9;
export const SET_COLOR = 0x2ECC40;

export const GROUPS = [
  { name: 'Run',      slotIndices: [0, 1, 2], color: RUN_COLOR, alpha: 0.5 },
  { name: 'Set',      slotIndices: [3, 4, 5], color: SET_COLOR, alpha: 0.5 },
  { name: 'Deadwood', slotIndices: [6],       color: null,      alpha: 0 },
];
```

### `src/main-s8-v{N}.js`
- Render bot hand 7 lá face-down ở y=380 (small)
- Render player hand 7 lá ở y=720 với thứ tự initial (lộn xộn)
- Render SORT button ở giữa (y≈580)
- Hand pointer animation chỉ vào SORT button
- On tap SORT:
  - Disable button, clear pointer
  - Fly animation: tween mỗi card từ vị trí hiện tại → vị trí target (theo `SORT_TARGET_SLOTS`)
  - K♥ tween + fade alpha 0.5
  - Sau 800ms: show Run + Set highlight, hide K♥ effect
  - Show "INSTANT WIN!" text, IQ → 110, progress → 100%
  - Trigger `chip-rain.js`
  - Sau 1.5s: bot hand flip face-up
  - Sau 3s: open store

---

## Variant Skin

| Variant | Theme | Asset folder |
|---------|-------|--------------|
| V1 | TBD (tạm reuse style-1) | `res/style-1/` |
| V2 | TBD | `res/style-s8-v2/` |
| V3 | TBD | `res/style-s8-v3/` |
| V4 | TBD | `res/style-s8-v4/` |

---

## Build Commands
```bash
SCENARIO=s8-v1 npx vite build
SCENARIO=s8-v2 npx vite build
SCENARIO=s8-v3 npx vite build
SCENARIO=s8-v4 npx vite build
```
