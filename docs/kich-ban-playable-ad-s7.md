# Kịch Bản Playable Ad — Dummy — Scenario S7

> **Pillar**: Sắp xếp bài | **Variant**: 4 (V1-V4 dùng chung logic, chỉ khác art skin)
> **Mode**: Guided Drag (free order) — user kéo từng lá vào khung target
> **File naming**: `index-s7-v{N}.html`, `main-s7-v{N}.js`, `card-data-s7-v{N}.js`, `game-board-s7-v{N}.js`
> **Build**: `SCENARIO=s7-v1 npx vite build`

---

## Thông Tin Chung
- **Game**: Dummy (Rummy) ZingPlay Thailand
- **Canvas**: 640×1136 (portrait)
- **Thời gian chơi**: 30 giây (CTA pop khi hết giờ)
- **Hook cảm xúc**: Thoả mãn — tự tay sắp xếp gọn gàng
- **Target moment**: "Mình tự kéo lá vào nhóm — cảm giác làm chủ bài!"
- **Source spec**: `Dummy/PlayableAds/20260407/playable_ads_36_scenarios.md` §S7
- **Output**: Single-file HTML ~900KB-1.3MB
- **Link Android**: `https://play.google.com/store/apps/details?id=th.dm.card.casino`
- **Link iOS**: `https://apps.apple.com/app/dummy-zingplay/id6737778971`

---

## Bố Cục Màn Hình

| Vị trí | Thành phần | Mô tả |
|--------|-----------|-------|
| y=0    | Header gradient | `img_header.webp` |
| y=40   | Top Bar | "INCREASE YOUR IQ!" + "Download Now" + Skip Ads (sau 15s) |
| y=140  | Title | "Drag cards into groups" (pulse anim, đổi "Time's Up!" khi hết giờ) |
| y=230  | IQ Badge + Progress Bar | Brain + IQ counter + thanh tiến trình |
| y=360  | **2 khung target (trên)** | Phỏm (xanh) trái, Bộ (cam) phải — mỗi khung 3 slot trống |
| y=600  | Timer | Đồng hồ đếm ngược 30s |
| y=720  | **Hand 7 lá (dưới)** | Hàng ngang 7 lá lộn xộn, overlap 30px, scale 0.9× |
| y=978+ | Footer | App Store + Google Play |

---

## Bài Trên Tay (7 lá lộn xộn)

| Index | Lá | Group đích |
|-------|-----|-----------|
| 0 | 7♥ | Bộ |
| 1 | 3♠ | Phỏm |
| 2 | 7♣ | Bộ |
| 3 | K♦ | **Lẻ (giữ nguyên)** |
| 4 | 5♠ | Phỏm |
| 5 | 7♦ | Bộ |
| 6 | 4♠ | Phỏm |

**Target groups**:
- **Phỏm** (Run): `3♠ 4♠ 5♠` — color `#2ECC40` (xanh lá), 3 slot
- **Bộ** (Set): `7♥ 7♦ 7♣` — color `#FF851B` (cam), 3 slot
- **Lá lẻ**: `K♦` — không drag, ở lại trong hand

---

## Kịch Bản Tương Tác

### Mode: Guided Drag — Free Order

- User drag bất kỳ lá nào vào khung tương ứng (không ép thứ tự — Q3 = A)
- Hand pointer **gợi ý** lá kế tiếp theo thứ tự suggest: `3♠ → 4♠ → 5♠ → 7♥ → 7♦ → 7♣` (chỉ là hint, user vẫn drag tự do)
- Lá K♦ disable drag (eventMode = none) — drop reject về hand
- Drop **đúng khung** → snap card vào slot trống đầu tiên của khung, lá disappear khỏi hand row, IQ +15
- Drop **sai khung** → bounce back về vị trí cũ trong hand
- Drop **ngoài khung** → bounce back

### Tiến trình IQ + Progress

| Sau drag | IQ | Progress |
|---|---|---|
| 0 lá | 10 | 15% |
| 1 lá đúng | 25 | 25% |
| 2 lá đúng | 40 | 35% |
| 3 lá đúng | 55 | 50% |
| 4 lá đúng | 70 | 65% |
| 5 lá đúng | 85 | 80% |
| 6 lá đúng | 110 | 100% |

### Sau khi drag đủ 6 lá
- Cả 2 khung **glow + label "✓"**
- Title đổi "Phỏm + Bộ ba!"
- Dừng timer, disable tương tác
- Sau 1.2s → mở store link

---

## Khi Hết Giờ (30s)
- Title đổi "Time's Up!"
- Ẩn highlight + ẩn tay tutorial
- Hiện CTA Overlay (App Store + Google Play, pulse animation)

---

## File Structure

### `index-s7-v{N}.html`
Copy `index-1-1.html`, đổi `<script src="/src/main-s7-v{N}.js">` + `<title>Dummy - Playable Ad S7 V{N}</title>`.

### `src/card-data-s7-v{N}.js`
```js
export function getInitialHand() {
  return [
    { value: '7', suit: 'hearts'   }, // 0 → BO (set)
    { value: '3', suit: 'spades'   }, // 1 → PHOM (run)
    { value: '7', suit: 'clubs'    }, // 2 → BO
    { value: 'K', suit: 'diamonds' }, // 3 → LEFTOVER (không drag)
    { value: '5', suit: 'spades'   }, // 4 → PHOM
    { value: '7', suit: 'diamonds' }, // 5 → BO
    { value: '4', suit: 'spades'   }, // 6 → PHOM
  ];
}

// Mapping: original card index → target group ('phom' | 'bo' | 'leftover')
export const CARD_TARGETS = {
  0: 'bo',
  1: 'phom',
  2: 'bo',
  3: 'leftover',
  4: 'phom',
  5: 'bo',
  6: 'phom',
};

// Suggest hint order for hand pointer (free drag — không bắt buộc)
export const HINT_ORDER = [1, 6, 4, 0, 5, 2]; // 3♠, 4♠, 5♠, 7♥, 7♦, 7♣

// IQ + progress sau mỗi drag đúng (index = số lá đã drag đúng)
export const PROGRESS_STEPS = [
  { iq: 10,  progress: 0.15 }, // 0 lá
  { iq: 25,  progress: 0.25 }, // 1 lá
  { iq: 40,  progress: 0.35 }, // 2 lá
  { iq: 55,  progress: 0.50 }, // 3 lá
  { iq: 70,  progress: 0.65 }, // 4 lá
  { iq: 85,  progress: 0.80 }, // 5 lá
  { iq: 110, progress: 1.00 }, // 6 lá (xong)
];
```

### `src/game-board-s7-v{N}.js`
Định nghĩa 2 khung target (Phỏm + Bộ) ở trên, hand 7 lá ở dưới.

```js
export const PHOM_COLOR = 0x2ECC40; // xanh lá
export const BO_COLOR   = 0xFF851B; // cam
export const TARGETS_Y  = 360;
export const HAND_Y     = 720;

export const TARGET_GROUPS = {
  phom: { label: 'PHỎM', color: PHOM_COLOR, capacity: 3 },
  bo:   { label: 'BỘ',   color: BO_COLOR,   capacity: 3 },
};
```

Hàm `computeHandSlots()` trả về 7 vị trí ngang cho hand row.
Hàm `computeTargetSlots()` trả về 2 box (mỗi box 3 inner slot).
Hàm `createTargetBoxes()` vẽ Graphics 2 khung + label.

### `src/main-s7-v{N}.js`
Logic chính:
- Render 2 target box ở `TARGETS_Y`
- Render 7 lá ở `HAND_Y` (overlap, scale 0.9)
- Custom drag handler: pointer down trên card → follow pointer → pointer up:
  - Trong phạm vi đúng box → snap vào inner slot trống → mark `correctCount++`
  - Sai → tween về home position
- Update IQ + progress sau mỗi drag đúng
- Hand pointer animate từ home của lá hint kế tiếp → tâm box đích
- K♦ (orig 3) `eventMode = 'none'`, alpha 0.85
- Khi `correctCount === 6` → tất cả lá đúng → CTA flow

---

## Variant Skin (do Anh cung cấp sau)

| Variant | Theme/skin | Asset folder |
|---------|------------|--------------|
| V1 | TBD (tạm reuse style-1) | `res/style-1/` |
| V2 | TBD | `res/style-s7-v2/` |
| V3 | TBD | `res/style-s7-v3/` |
| V4 | TBD | `res/style-s7-v4/` |

Lưu ý: 4 variant chỉ khác **asset art**. Logic gameplay + card data + drag steps **giống hệt nhau**.

---

## Build Commands
```bash
SCENARIO=s7-v1 npx vite build   # → dist/index-s7-v1.html
SCENARIO=s7-v2 npx vite build
SCENARIO=s7-v3 npx vite build
SCENARIO=s7-v4 npx vite build
```
