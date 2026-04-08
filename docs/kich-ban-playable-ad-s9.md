# Kịch Bản Playable Ad — Dummy — Scenario S9

> **Pillar**: Sắp xếp bài (suy luận) | **Variant**: 4 (V1-V4 chung logic)
> **Hook**: "Eureka! Tìm đúng cách xếp = thắng instant!"
> **Mode đặc biệt**: **Free interaction** + **2 nhánh outcome**
> **File naming**: `index-s9-v{N}.html`, `main-s9-v{N}.js`, `card-data-s9-v{N}.js`, `game-board-s9-v{N}.js`

---

## Thông Tin Chung
- **Game**: Dummy (Rummy) ZingPlay Thailand
- **Canvas**: 640×1136
- **Thời gian chơi**: 30 giây
- **Bước tương tác**: User free drag lá `5♥` vào 1 trong 2 group → 2 outcome khác nhau
- **Hook cảm xúc**: Aha! Suy luận ra cách xếp tối ưu → win instant. Sai → replay thử lại.
- **Khác biệt vs S7/S8**: KHÔNG có swap step cứng. User có 2 lựa chọn valid theo luật, nhưng chỉ 1 lựa chọn dẫn tới WIN.

---

## Bài Trên Tay (10 lá, thứ tự ban đầu)

| Index | Lá | Có thể thuộc |
|-------|-----|-------------|
| 0 | 4♥ | Run hearts (4-5-6♥) — chỉ valid nếu 5♥ vào run |
| 1 | 5♥ | **AMBIGUOUS** — Run hearts HOẶC Set 5s |
| 2 | 6♥ | Run hearts |
| 3 | 5♦ | Set 5s |
| 4 | 5♣ | Set 5s |
| 5 | 5♠ | Set 5s — chỉ valid nếu 5♥ KHÔNG vào set (giữ set 5♦5♣5♠ 3 lá) |
| 6 | 7♣ | Run clubs (7-8-9-10♣) |
| 7 | 8♣ | Run clubs |
| 8 | 9♣ | Run clubs |
| 9 | 10♣ | Run clubs |

**Phân tích 2 outcome**:

### Outcome A — Chọn 5♥ vào RUN HEARTS (ĐÚNG → WIN)
- Run hearts: `4♥ 5♥ 6♥` (3 lá ✓)
- Set 5s: `5♦ 5♣ 5♠` (3 lá ✓ — không cần 5♥)
- Run clubs: `7♣ 8♣ 9♣ 10♣` (4 lá ✓)
- **Tổng**: 3+3+4 = **10 lá đều thuộc bộ → KNOCK WIN!**

### Outcome B — Chọn 5♥ vào SET 5s (SAI → KHÔNG WIN)
- Set 5s: `5♥ 5♦ 5♣` (3 lá — bỏ 5♠ ra để chỉ 3 lá, hoặc set 4 lá `5♥5♦5♣5♠`)
  - Trường hợp set 4 lá: `5♥ 5♦ 5♣ 5♠` ✓
- Còn lại: `4♥, 6♥, 7♣, 8♣, 9♣, 10♣` = 6 lá
  - `4♥` và `6♥` cô đơn (không có 5♥ nối, vì 5♥ đã dùng)
  - Run clubs `7♣8♣9♣10♣` ✓
- **Còn 2 lá lẻ `4♥` và `6♥`** → Deadwood → **KHÔNG knock**

---

## Bố Cục Màn Hình

Giống pattern 1-1, nhưng có **2 KHUNG TARGET** ở giữa màn hình (thay vì layout 10 lá flat):

```
y=0     Header
y=40    Top bar (Download Now)
y=140   Title: "Where does 5♥ belong?"
y=230   IQ + Progress
y=460   Timer
y=530   Game board:
        ┌─────────────────────────────────┐
        │  HAND (8 lá, 5♥ glow vàng)      │  y=530-650
        │  [4♥][5♥*][6♥][5♦][5♣][5♠]     │  
        │       [7♣][8♣][9♣][10♣]         │
        ├─────────────────────────────────┤
        │  GROUP A: RUN HEARTS  GROUP B: SET 5s
        │  [4♥][__][6♥]         [5♦][5♣][5♠]
        │  ↑ slot trống          ↑ slot trống
        └─────────────────────────────────┘
y=978+  Footer
```

**Chi tiết hơn**:
- Top row (y=530): hand 10 lá pattern flat (như 1-1), `5♥` highlight glow vàng pulse
- Middle (y=720): label "Where does 5♥ belong?"
- 2 group target (y=780):
  - **Khung A "RUN HEARTS"**: hiện sẵn `4♥ _ 6♥` (slot giữa trống chờ 5♥), color xanh dương `#0074D9`, label "RUN"
  - **Khung B "SET 5s"**: hiện sẵn `5♦ 5♣ 5♠` (full, drag 5♥ vào sẽ thành 4 lá), color xanh lá `#2ECC40`, label "SET"

---

## Kịch Bản Tương Tác

### Phase 1: Intro (0-3s)
- Hand 10 lá flip lên
- Lá `5♥` highlight glow vàng pulse + tay tutorial chỉ vào
- 2 khung A và B mờ, slowly fade in
- Title "Where does 5♥ belong?" pulse

### Phase 2: Free drag (3s - hết giờ)
- User drag `5♥` thả vào khung A hoặc B
- **Drag detect**: dùng `drag-and-drop-handler.js` modified — khi drag 5♥, check nếu drop vào bounding box khung A hoặc B → trigger handler tương ứng
- Các lá khác disable (chỉ 5♥ enable)

### Phase 3a: Drop vào khung A (RUN HEARTS) — ĐÚNG → WIN
1. `5♥` snap vào slot giữa khung A → khung A fill `4♥ 5♥ 6♥` ✓ glow xanh dương
2. Sau 300ms: highlight tự động khung B `5♦ 5♣ 5♠` ✓ glow xanh lá
3. Sau 600ms: highlight khung Run clubs `7♣8♣9♣10♣` (xuất hiện thêm khung C ở dưới) ✓ glow xanh dương
4. Sau 900ms: text **"PERFECT! KNOCK WIN!"** xuất hiện, vàng + chip rain
5. IQ 10 → 110, progress 0.2 → 1.0 (skip phase trung gian, jump thẳng)
6. Sau 1.5s: mở store

### Phase 3b: Drop vào khung B (SET 5s) — SAI → REPLAY
1. `5♥` snap vào khung B → khung B `5♥ 5♦ 5♣ 5♠` (4 lá) glow xanh lá
2. Sau 300ms: highlight Run clubs `7♣8♣9♣10♣` ✓ glow xanh dương
3. Sau 600ms: 2 lá `4♥` và `6♥` rung lắc + glow đỏ → text **"4♥ và 6♥ bị bỏ rơi!"**
4. Text **"Try again!"** xuất hiện, kèm nút **REPLAY** (icon refresh)
5. IQ 10 → 50 (chỉ tăng 1 phần), progress 0.2 → 0.5
6. User tap REPLAY → reset state, `5♥` quay về hand, có thể drag lại
7. Lần 2 nếu chọn đúng → flow Phase 3a; nếu sai lần 2 → giữ Try again, không reset nữa, đợi timer hết

### Khi Hết Giờ (30s, chưa win)
- Hiện CTA Overlay như pattern 1-1

---

## File Structure

### `index-s9-v{N}.html`
Copy `index-1-1.html`, đổi script src.

### `src/card-data-s9-v{N}.js`
```js
export function getInitialHand() {
  return [
    { value: '4',  suit: 'hearts'   }, // 0
    { value: '5',  suit: 'hearts'   }, // 1 — AMBIGUOUS
    { value: '6',  suit: 'hearts'   }, // 2
    { value: '5',  suit: 'diamonds' }, // 3
    { value: '5',  suit: 'clubs'    }, // 4
    { value: '5',  suit: 'spades'   }, // 5
    { value: '7',  suit: 'clubs'    }, // 6
    { value: '8',  suit: 'clubs'    }, // 7
    { value: '9',  suit: 'clubs'    }, // 8
    { value: '10', suit: 'clubs'    }, // 9
  ];
}

export const AMBIGUOUS_CARD_INDEX = 1;  // 5♥

export const TARGET_GROUPS = {
  A_run_hearts: {
    label: 'RUN',
    color: 0x0074D9,
    expected_after_drop: [0, 1, 2],  // 4♥, 5♥, 6♥
    is_correct_choice: true,
  },
  B_set_fives: {
    label: 'SET',
    color: 0x2ECC40,
    expected_after_drop: [1, 3, 4, 5],  // 5♥, 5♦, 5♣, 5♠
    is_correct_choice: false,
  },
};

export const ALL_GROUPS_AFTER_CORRECT = [
  { name: 'RUN HEARTS', cards: [0, 1, 2],         color: 0x0074D9 },
  { name: 'SET 5s',     cards: [3, 4, 5],         color: 0x2ECC40 },
  { name: 'RUN CLUBS',  cards: [6, 7, 8, 9],      color: 0x0074D9 },
];
```

### `src/game-board-s9-v{N}.js`
Custom layout với **2 vùng target ở dưới hand**:
```js
import { Graphics } from 'pixi.js';
import { CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

export const CARD_SCALE = 0.7;  // nhỏ hơn 1-1 để fit 2 zone
export const SCALED_W = CARD_WIDTH * CARD_SCALE;
export const SCALED_H = CARD_HEIGHT * CARD_SCALE;

const HAND_OVERLAP = 25;
const HAND_Y = 530;

// Hand zone: 10 lá flat overlap (giống 1-1 nhưng scale nhỏ)
export function computeHandSlots(boardWidth) {
  const effectiveW = SCALED_W - HAND_OVERLAP;
  const totalW = effectiveW * 9 + SCALED_W;
  const startX = (boardWidth - totalW) / 2;
  return Array.from({ length: 10 }, (_, i) => ({
    x: startX + i * effectiveW,
    y: HAND_Y,
  }));
}

// Target zones (vẽ khung)
export const TARGET_ZONES = {
  A: { x: 60,  y: 760, w: 250, h: 140, label: 'RUN', color: 0x0074D9 },
  B: { x: 330, y: 760, w: 250, h: 140, label: 'SET', color: 0x2ECC40 },
};

export function createTargetZones() {
  const zones = {};
  for (const [key, z] of Object.entries(TARGET_ZONES)) {
    const g = new Graphics();
    g.roundRect(z.x, z.y, z.w, z.h, 12);
    g.fill({ color: 0x000000, alpha: 0.3 });
    g.stroke({ color: z.color, width: 3, alpha: 0.8 });
    g._zoneKey = key;
    g._bounds = z;
    zones[key] = g;
  }
  return zones;
}

export function pointInZone(x, y, zoneKey) {
  const z = TARGET_ZONES[zoneKey];
  return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
}
```

### `src/main-s9-v{N}.js`
Customize từ `main-1-1.js`. Logic chính khác:

1. **KHÔNG dùng `drag-and-drop-handler.js` mặc định** (đó là swap-based). Custom drag riêng cho 5♥.
2. Disable tất cả lá trừ `5♥` (orig idx 1).
3. Khi user drag-drop 5♥:
   - Check `pointInZone(dropX, dropY, 'A')` → trigger `handleCorrectChoice()`
   - Check `pointInZone(dropX, dropY, 'B')` → trigger `handleWrongChoice()`
   - Nếu drop ra ngoài → snap về vị trí cũ

```js
// Pseudo-code main-s9-v{N}.js (chỉ phần khác biệt)

import { computeHandSlots, createTargetZones, pointInZone, ALL_GROUPS_AFTER_CORRECT } from './game-board-s9-v1.js';
import { getInitialHand, AMBIGUOUS_CARD_INDEX } from './card-data-s9-v1.js';

// ... pattern boot, header, top bar, title, IQ, timer, hand ...

const slots = computeHandSlots(GAME_WIDTH);
const targetZones = createTargetZones();
Object.values(targetZones).forEach(z => app.stage.addChild(z));

// Render hand 10 cards
const hand = getInitialHand();
const cards = hand.map((data, i) => {
  const card = createCardSprite(data);
  card.scale.set(CARD_SCALE);
  card.x = slots[i].x;
  card.y = slots[i].y;
  app.stage.addChild(card);
  return card;
});

// Disable all except 5♥ (idx 1)
cards.forEach((c, i) => {
  if (i !== AMBIGUOUS_CARD_INDEX) {
    c.eventMode = 'none';
    c.tint = 0x888888;
  }
});
const fiveHearts = cards[AMBIGUOUS_CARD_INDEX];
highlightCard(fiveHearts, true);

// Tutorial hand pointer chỉ vào 5♥
const handSprite = await createHandPointerOnCard(app, fiveHearts);

// Custom drag for 5♥ only
let dragging = null;
let dragOffset = { x: 0, y: 0 };
let originalPos = { x: fiveHearts.x, y: fiveHearts.y };

fiveHearts.on('pointerdown', (e) => {
  dragging = fiveHearts;
  const pos = e.getLocalPosition(app.stage);
  dragOffset.x = fiveHearts.x - pos.x;
  dragOffset.y = fiveHearts.y - pos.y;
  clearHandPointer(handSprite);
});

app.stage.on('pointermove', (e) => {
  if (!dragging) return;
  const pos = e.getLocalPosition(app.stage);
  dragging.x = pos.x + dragOffset.x;
  dragging.y = pos.y + dragOffset.y;
});

app.stage.on('pointerup', (e) => {
  if (!dragging) return;
  const pos = e.getLocalPosition(app.stage);
  const cx = dragging.x + SCALED_W / 2;
  const cy = dragging.y + SCALED_H / 2;
  
  if (pointInZone(cx, cy, 'A')) {
    handleCorrectChoice();
  } else if (pointInZone(cx, cy, 'B')) {
    handleWrongChoice();
  } else {
    // Snap back
    dragging.x = originalPos.x;
    dragging.y = originalPos.y;
  }
  dragging = null;
});

let attemptCount = 0;

function handleCorrectChoice() {
  // 5♥ snap to zone A center
  const za = TARGET_ZONES.A;
  fiveHearts.x = za.x + za.w / 2 - SCALED_W / 2;
  fiveHearts.y = za.y + za.h / 2 - SCALED_H / 2;

  // Step 1: highlight RUN HEARTS group (cards 0,1,2)
  setTimeout(() => highlightGroupCards([0, 1, 2], 0x0074D9), 300);

  // Step 2: highlight SET 5s (3,4,5)
  setTimeout(() => highlightGroupCards([3, 4, 5], 0x2ECC40), 600);

  // Step 3: highlight RUN CLUBS (6,7,8,9)
  setTimeout(() => highlightGroupCards([6, 7, 8, 9], 0x0074D9), 900);

  // Step 4: WIN overlay
  setTimeout(() => {
    showWinOverlay(app);
    updateIQ(progressSection, 110);
    animateProgress(0.2, 1.0);
  }, 1200);

  // Step 5: open store
  setTimeout(() => openUrl(STORE_URL), 2700);
}

function handleWrongChoice() {
  attemptCount++;
  
  // 5♥ snap to zone B
  const zb = TARGET_ZONES.B;
  fiveHearts.x = zb.x + zb.w / 2 - SCALED_W / 2;
  fiveHearts.y = zb.y + zb.h / 2 - SCALED_H / 2;

  // Highlight SET 5s (1,3,4,5)
  setTimeout(() => highlightGroupCards([1, 3, 4, 5], 0x2ECC40), 300);
  // Highlight RUN CLUBS
  setTimeout(() => highlightGroupCards([6, 7, 8, 9], 0x0074D9), 600);
  // Shake 4♥ và 6♥ (deadwood)
  setTimeout(() => {
    shakeCard(cards[0]);
    shakeCard(cards[2]);
    showText("4♥ và 6♥ bị bỏ rơi!", '#FF3333');
  }, 900);

  updateIQ(progressSection, 50);
  animateProgress(0.2, 0.5);

  if (attemptCount === 1) {
    // Show REPLAY button
    setTimeout(() => showReplayButton(), 1500);
  }
  // Lần 2 sai → không reset, đợi timer hết
}

function showReplayButton() {
  // Tạo button refresh, on click → resetToInitial()
}

function resetToInitial() {
  fiveHearts.x = originalPos.x;
  fiveHearts.y = originalPos.y;
  // Clear all group highlights
  // Re-enable drag for 5♥
}
```

---

## Logic kiểm tra Win/Lose

```yaml
win_condition: drop_5h_into_zone_A
lose_condition: timer_expired_without_win
replay_allowed: 1 lần (sau lần sai đầu tiên)
```

---

## Variant Skin

| Variant | Theme | Asset folder |
|---------|-------|--------------|
| V1 | TBD | `res/style-s9-v1/` |
| V2 | TBD | `res/style-s9-v2/` |
| V3 | TBD | `res/style-s9-v3/` |
| V4 | TBD | `res/style-s9-v4/` |

---

## Build Commands
```bash
SCENARIO=s9-v1 npx vite build
SCENARIO=s9-v2 npx vite build
SCENARIO=s9-v3 npx vite build
SCENARIO=s9-v4 npx vite build
```

---

## Notes cho Dev

1. **S9 phức tạp nhất** vì cần custom drag (không dùng swap pattern). Có thể cân nhắc tách `drag-zone-handler.js` mới reusable cho future scenarios.
2. Hàm `shakeCard()`, `showText()`, `showReplayButton()`, `showWinOverlay()` cần viết mới (chưa có trong shared modules) — cân nhắc bổ sung vào shared sau khi hoàn thiện S9.
3. **Timer**: vì S9 có replay nên user có thể tốn nhiều thời gian. Default 30s vẫn OK (đủ cho 1-2 lần thử).
4. **Title text**: "Where does 5♥ belong?" — đổi từ default "Drag cards to arrange".
