# Dummy Playable Ads — Scenario 1-1 Design

## Overview

Playable ad cho game Dummy (Rummy) trên ZingPlay. User được phát 10 lá bài xếp 1 hàng ngang, cần swap 3 lần để tạo 2 meld hợp lệ (1 Set + 1 Run) và 2 lá deadwood.

- **Canvas**: 640×1136 (portrait)
- **Thời gian**: 30 giây
- **Bước tương tác**: 3 swap
- **Engine**: PixiJS v8 + Vite + vite-plugin-singlefile
- **Output**: Single HTML file (~880KB)

---

## Card Data — Scenario 1-1

### 10 lá ban đầu (thứ tự index 0–9)

| Index | Lá | Group cuối |
|-------|-----|-----------|
| 0 | 7♥ (7_hearts) | Set (idx 0-2) |
| 1 | 7♣ (7_clubs) | Set (idx 0-2) |
| 2 | Q♠ (Q_spades) | Deadwood (sau swap 1) |
| 3 | 8♥ (8_hearts) | Run (idx 3-7) |
| 4 | J♥ (J_hearts) | Run (idx 3-7) |
| 5 | Q♥ (Q_hearts) | Run (sau swap 2) |
| 6 | 10♥ (10_hearts) | Run (idx 3-7) |
| 7 | 9♥ (9_hearts) | Run (idx 3-7) |
| 8 | 7♦ (7_diamonds) | Set (sau swap 1) |
| 9 | K♠ (K_spades) | Deadwood |

### Kết quả cuối (sau 3 swap)

| Group | Index | Lá | Loại |
|-------|-------|----|------|
| Set | 0–2 | 7♥ 7♣ 7♦ | Three of a Kind |
| Run | 3–7 | 8♥ 9♥ 10♥ J♥ Q♥ | Run (hearts) |
| Deadwood | 8–9 | Q♠ K♠ | — |

> Note: Run hiển thị theo thứ tự index, không nhất thiết sorted — group highlight đủ rõ ràng cho user.

---

## Kịch Bản Tương Tác

### Bước 1: Swap 7♦ ↔ Q♠
- **Highlight**: 7♦ (index 8) và Q♠ (index 2)
- **Tay animation**: kéo từ 7♦ → Q♠
- **Sau swap**: `[7♥, 7♣, 7♦, 8♥, J♥, Q♥, 10♥, 9♥, Q♠, K♠]` → Set idx 0-2 hoàn chỉnh → highlight xanh lá
- **IQ**: 10 → 40 | **Progress**: 20% → 40%

### Bước 2: Swap 9♥ ↔ Q♥
- **Highlight**: 9♥ (index 7) và Q♥ (index 5)
- **Tay animation**: kéo từ 9♥ → Q♥
- **Sau swap**: `[7♥, 7♣, 7♦, 8♥, J♥, 9♥, 10♥, Q♥, Q♠, K♠]`
- **IQ**: 40 → 70 | **Progress**: 40% → 70%

### Bước 3: Swap J♥ ↔ 9♥ (enable Run hoàn chỉnh)
- **Highlight**: J♥ (index 4) và 9♥ (index 5)
- **Tay animation**: kéo từ J♥ → 9♥
- **Sau swap**: `[7♥, 7♣, 7♦, 8♥, 9♥, J♥, 10♥, Q♥, Q♠, K♠]` → Run idx 3-7 = `8♥ 9♥ J♥ 10♥ Q♥` hoàn chỉnh → highlight xanh dương
- **IQ**: 70 → 110 | **Progress**: 70% → 100%

### Sau bước 3
- Dừng timer
- Disable tất cả bài
- Sau 1 giây → mở store link (auto detect iOS/Android)

---

## Visual Layout

### Bài 1 hàng ngang
- **10 lá** xếp ngang, overlap ~30px (bài sau đè bài trước)
- Effective width per card: 96 - 30 = 66px → total ~720px → scale 0.88× để fit 640px
- Căn giữa canvas theo chiều ngang
- Y position: ~550 (giữa canvas)

### Group Highlight Backgrounds
- Mỗi group có 1 `Graphics` rectangle background, bo góc 12px, đặt phía sau bài
- **Set** (3 lá): `#2ECC40`, alpha 0.4
- **Run** (5 lá): `#0074D9`, alpha 0.4
- **Deadwood**: không có background
- Highlight chỉ hiện sau khi group hoàn chỉnh (sau swap đúng)

### UI từ trên xuống dưới

| Vị trí | Thành phần |
|--------|-----------|
| y=0 | Header gradient (img_header) |
| y=40 | Top Bar: "INCREASE YOUR IQ!" + "Download Now" |
| y=140 | Title: "Drag cards to arrange" (pulse animation) |
| y=230 | IQ Badge + Progress Bar |
| y=480 | Timer (đồng hồ đếm ngược 30s) |
| y=520–620 | Game Board: 10 lá 1 hàng ngang |
| y=980+ | Bottom Bar (đen mờ) + Store Link |

---

## Architecture & File Structure

### Files reuse từ Pusoy (copy, chỉnh nhỏ)
- `src/card-renderer.js` — đổi key format thành `{value}_{suit}` (vd `7_hearts`)
- `src/drag-and-drop-handler.js` — dùng nguyên (flat layout)
- `src/ui-header.js` — dùng nguyên
- `src/cta-overlay.js` — dùng nguyên
- `vite.config.js` — dùng nguyên
- `package.json` — dùng nguyên

### Files mới tạo

```
DummyPlayableAds/
├── CLAUDE.md
├── index-1-1.html
├── src/
│   ├── main-1-1.js          # game logic, layout, swap flow
│   ├── card-data-1-1.js     # 10 lá + swap steps definition
│   └── game-board-1-1.js    # group config: {name, indices, color}
└── docs/
    └── kich-ban-playable-ad-1-1.md
```

### Naming Convention
- Style `1` = Dummy
- Scenario `1-1` = style 1, variant 1

### Key Difference vs Pusoy
- Không có `rowRefs` / row labels
- `game-board-1-1.js` export: `groups = [{name, indices, color}]`
- `main-1-1.js` vẽ group highlight backgrounds, update sau mỗi swap đúng
- Card layout: overlap flat (không dùng slot rotation)

---

## Store Links

- **Android**: `https://play.google.com/store/apps/details?id=com.zingplay.dummy`
- **iOS**: (cần xác nhận link App Store)
- Auto-detect iOS/Android giống Pusoy

---

## Timer & CTA

- 30 giây đếm ngược
- Hết giờ: title → "Time's Up!", ẩn highlight, disable bài, hiện CTA overlay
- CTA overlay: "Time's Up!" + "Think you can do better?" + nút "DOWNLOAD NOW" (pulse)

---

## Open Questions

- [ ] Xác nhận link App Store iOS cho Dummy Thailand
- [ ] Xác nhận card key format trong `composed/`: value dùng `7`, `10`, `J`, `Q`, `K`, `A` hay số?
