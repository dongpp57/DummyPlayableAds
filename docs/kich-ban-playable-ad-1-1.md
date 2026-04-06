# Kịch Bản Playable Ad — Dummy (Style 1) — Scenario 1-1

## Thông Tin Chung
- **Game**: Dummy (Rummy) ZingPlay Thailand
- **Canvas**: 640×1136 (portrait)
- **Thời gian chơi**: 30 giây
- **Bước tương tác**: 3 swap để tạo Set + Run
- **Output**: Single-file HTML ~900KB
- **Link Android**: https://play.google.com/store/apps/details?id=th.dm.card.casino
- **Link iOS**: https://apps.apple.com/app/dummy-zingplay/id6737778971

---

## Bố Cục Màn Hình (từ trên xuống)

| Vị trí | Thành phần | Mô tả |
|--------|-----------|-------|
| y=0    | Header gradient | Ảnh `img_header.webp` (style-1) |
| y=40   | Top Bar | "INCREASE YOUR IQ!" + nút "Download Now" + Skip Ads (hiện sau 15s) |
| y=140  | Title | "Drag cards to arrange" (pulse animation, đổi "Time's Up!" khi hết giờ) |
| y=230  | IQ Badge + Progress Bar | Brain icon + IQ counter + thanh tiến trình |
| y=460  | Timer | Đồng hồ đếm ngược 30s |
| y=530  | Game Board | 10 lá bài 1 hàng ngang (overlap 30px, scale 0.9×) |
| y=978+ | Footer | 2 nút App Store + Google Play |

---

## Bài Trên Tay (10 lá, thứ tự ban đầu)

| Index | Lá | Group cuối |
|-------|-----|-----------|
| 0 | 7♥ | Set |
| 1 | 7♣ | Set (đặc biệt — nền vàng) |
| 2 | K♦ | Deadwood (sau swap 1) |
| 3 | 8♥ | Run |
| 4 | Q♠ | Deadwood (sau swap 2) (nền vàng) |
| 5 | 9♥ | Run |
| 6 | 10♥ | Run |
| 7 | J♥ | Run |
| 8 | 7♦ | Set (sau swap 1) |
| 9 | Q♥ | Run (sau swap 3) |

---

## Kịch Bản Tương Tác

### Bước 1: Swap 7♦ ↔ K♦
- **Highlight**: 7♦ (slot 8) và K♦ (slot 2)
- **Tay animation**: kéo từ 7♦ → K♦
- **Sau swap**: `[7♥, 7♣, 7♦, 8♥, Q♠, 9♥, 10♥, J♥, K♦, Q♥]`
- **Set hoàn chỉnh** (slots 0-2 = 7♥ 7♣ 7♦) → background xanh lá `#2ECC40`
- **IQ**: 10 → 40 | **Progress**: 20% → 40%

### Bước 2: Swap Q♠ ↔ K♦
- **Highlight**: Q♠ (slot 4) và K♦ (slot 8 — vừa swap vào ở bước 1)
- **Tay animation**: kéo từ Q♠ → K♦
- **Sau swap**: `[7♥, 7♣, 7♦, 8♥, K♦, 9♥, 10♥, J♥, Q♠, Q♥]`
- **Run zone vẫn chưa hoàn chỉnh** (K♦ là intruder, Q♥ vẫn ở slot 9)
- **IQ**: 40 → 70 | **Progress**: 40% → 70%

### Bước 3: Swap Q♥ ↔ K♦
- **Highlight**: Q♥ (slot 9) và K♦ (slot 4 — vừa vào ở bước 2)
- **Tay animation**: kéo từ Q♥ → K♦
- **Sau swap**: `[7♥, 7♣, 7♦, 8♥, Q♥, 9♥, 10♥, J♥, Q♠, K♦]`
- **Run hoàn chỉnh** (slots 3-7 = 8♥ Q♥ 9♥ 10♥ J♥, đủ 5 hearts) → background xanh dương `#0074D9`
- **IQ**: 70 → 110 | **Progress**: 70% → 100%

### Sau Bước 3
- Dừng timer
- Disable tương tác bài
- Sau 1 giây → mở store link (auto detect iOS/Android via MRAID hoặc fallback)

---

## Khi Hết Giờ (30s)
- Title đổi "Drag cards to arrange" → "Time's Up!"
- Ẩn highlight tất cả bài, ẩn tay tutorial
- Disable tương tác bài
- Hiện CTA Overlay:
  - Title: "Time's Up!"
  - Subtitle: "Think you can do better?"
  - 2 nút: App Store (đen) + Google Play (xanh) — pulse animation
  - Tap nút → mở store link tương ứng

---

## Visual Notes

### Card Background Đặc Biệt
Hai lá bài có nền **vàng** (highlight wildcard trong game thật):
- `2_clubs` (2♣)
- `Q_spades` (Q♠)

Còn lại tất cả 50 lá có nền **trắng**.

### Group Highlight Backgrounds
- Set (3 lá): `#2ECC40` alpha 0.35 — chỉ hiện sau bước 1
- Run (5 lá): `#0074D9` alpha 0.35 — chỉ hiện sau bước 3
- Deadwood (2 lá): không có background

### Tutorial Hand Animation
- Loop: Pause 300ms → Move 800ms → Fade out 200ms → Delay 1000ms → Fade in 200ms
- Total cycle ~2.5s
- Reset khi user tự swap

---

## Build & Deploy

```bash
# Dev server
npx vite

# Build production single-file
SCENARIO=1-1 npx vite build
# Output: dist/index-1-1.html (~900KB)
```

Deploy targets: GitLab → Vercel auto-deploy, hoặc upload `dist/index-1-1.html` lên ad network (AppLovin, AdMob, IronSource, Facebook).

---

## Compliance Checklist (Playable Ad Standards)

- [x] Single-file HTML ≤ 5MB (current: ~900KB)
- [x] No external network requests
- [x] MRAID-aware boot (`mraid.addEventListener('ready')`)
- [x] MRAID `mraid.open()` cho store CTAs
- [x] MRAID `mraid.close()` cho Skip Ads
- [x] Touch events handled (preventDefault để tránh page scroll)
- [x] iOS Safari fallback (`location.href`)
- [x] CTA visible từ đầu (Download Now button)
- [x] Endcard với store buttons sau timeout
- [x] Game hoàn thành flow trong 30s
