# Brainstorm — Concept Playable Ads cho Dummy

> Ngày tạo: 2026-04-06
> Tác giả: Đông + Claude
> Mục đích: Lên concept các scenario tiếp theo (1-2, 1-3, 1-4, 1-5) sau khi đã hoàn thành scenario 1-1

---

## 1. Key Moments của Dummy (cảm xúc cao trào)

| # | Key Moment | Cảm xúc | Tần suất | Tiềm năng playable |
|---|------------|---------|----------|-------------------|
| **A** | **Sắp xếp bài thành meld** (Set/Run) | "Aha!" — strategic satisfaction | Mỗi ván | ⭐⭐⭐ (đã làm scenario 1-1) |
| **B** | **Hạ bộ đầu tiên (First Meld)** | Relief + tactical commit | 1 lần/ván | ⭐⭐⭐⭐ |
| **C** | **Lay off (gửi bài) vào meld đối thủ** | Cunning + utility maximization | Mid-late game | ⭐⭐⭐⭐ |
| **D** | **Bắt được lá đặc biệt 2♣ / Q♠ (Hot Card)** | Bonus rush, +25 điểm POT mỗi lá | 1-2 lần/ván | ⭐⭐⭐⭐⭐ |
| **E** | **Knock / Tới trắng (Báo)** | Climax — winning hand | 1 lần/ván | ⭐⭐⭐⭐⭐ |
| **F** | **Nổ POT (King of The Table)** | Big win moment, vàng đổ | Sau ~5-8 ván | ⭐⭐⭐⭐⭐ |
| **G** | **Challenge x2 (gỡ gạc)** | Comeback drama, hồi hộp | Khi thua liên tiếp | ⭐⭐⭐⭐ |
| **H** | **Bankrupt → mua vàng** | Pain point (monetization moment) | Theo cycle gold | ⭐⭐ (không nên showcase) |

**Reference GDD:**
- Pot/King of The Table: `Dummy/Design/Pot/Docs/GDD_KingOfTheTable.md`
- Challenge: `Dummy/Design/Challenge/GDD_Challenge.md`
- Hot Cards (2♣, Q♠) — bonus +25 điểm POT mỗi lá khi meld/lay off, max 50 điểm/ván

---

## 2. Concept 5 Scenarios Playable Ads

### Scenario 1-1: Arrange Set + Run ✅ ĐÃ LÀM
- **Hook**: "Drag cards to arrange"
- **Mechanic**: 3 swap → tạo Set + Run + Deadwood (10 lá)
- **Key moment**: Strategic puzzle (Moment A)
- **Status**: LIVE, deployed Vercel + GitLab + GitHub

---

### Scenario 1-2: Hot Card Hunter 🎯 RECOMMENDED NEXT

- **Hook**: "Find the Lucky Cards! 2♣ + Q♠ = Big Bonus!"
- **Mechanic**:
  - User có 7 lá, trong đó có **2♣ và Q♠** đang ở deadwood
  - Cần swap 2-3 lần để lay off cả 2 lá vào meld có sẵn trên bàn
  - Mỗi lần lay off thành công → **+25 IQ + golden burst animation + sparkle effect**
  - Cuối cùng: "+50 BONUS!" with confetti
- **Key moment**: Hot Card moment (D) — showcase điểm độc đáo của Dummy
- **Visual**:
  - Glow vàng đậm cho 2♣ và Q♠ ngay từ đầu (đã có nền vàng sẵn từ extract script)
  - Sparkle particles khi lay off
  - "+25" floating text bay lên khi thành công
- **Differentiator**: Khác hẳn Pusoy — tận dụng special cards của Dummy
- **Code reuse**: ~80% giống 1-1

---

### Scenario 1-3: Knock to Win! 🏆

- **Hook**: "One more card to KNOCK!"
- **Mechanic**:
  - User có 6 lá đã sắp xếp gần xong (1 set 3 lá + 1 run 3 lá)
  - Bàn có deck draw pile + discard pile (2 ô)
  - User cần **draw 1 lá** từ pile → match vào meld → **KNOCK!**
  - Animation: bài bay vào meld, fireworks, "WIN +20,000 GOLD"
- **Key moment**: Moment E (Knock/Tới trắng) — climax của Rummy
- **Visual**:
  - Highlight discard pile và deck với pulse
  - Hand animation kéo lá vào meld
  - Fireworks particles
- **CTA**: "Tap to Knock!" thay vì "Drag to arrange"
- **New mechanic**: Draw from pile (chưa có ở 1-1)

---

### Scenario 1-4: King of The Table — POT Explosion 💰

- **Hook**: "Win the JACKPOT!"
- **Mechanic**:
  - Hiển thị POT bar hiện tại (vd: 1180/1200 điểm)
  - User chỉ cần thực hiện **1 hành động đúng** (lay off 2♣ vào meld) → +25 điểm → **POT EXPLODES!**
  - Animation: gold rain, "JACKPOT!" text, rotating crown icon
  - 1 second after explosion → store CTA
- **Key moment**: Moment F (POT Explosion) — biggest dopamine hit
- **Visual**:
  - King crown icon
  - Gold pile, particle effects (gold coins falling)
  - POT bar animate từ 1180 → 1205 → EXPLOSION
  - Screen shake effect
- **Differentiator**: Showcase POT là USP của Dummy ZingPlay — rất ít game card khác có
- **Target audience**: Whales/VIP, gamblers
- **Reference**: GDD King of The Table, threshold 1200 điểm

---

### Scenario 1-5: Challenge x2 Comeback 🔥

- **Hook**: "DOUBLE OR NOTHING — Get your gold back!"
- **Mechanic**:
  - Intro: hiển thị "You lost 50K gold... Challenge x2?"
  - Tap "CHALLENGE" → bàn mới với mức cược x2
  - User có hand đẹp (1 set + 1 run sắp xong)
  - 2 swap → win → "+200K GOLD WON!" (gấp 4 lần thua trước)
- **Key moment**: Moment G (Challenge comeback drama)
- **Visual**:
  - Red glow border (intense mood)
  - Challenge button với x2 badge
  - Gold counter animate up tại endgame
- **Differentiator**: Showcase emotional engagement, comeback hope
- **Audience**: Gambler personalities, players motivated by recovery
- **Reference**: GDD Challenge — điều kiện thua ≥2 ván liên tiếp HOẶC thua ≥500x stake

---

## 3. Recommended Implementation Order

| Order | Scenario | Lý do |
|-------|----------|-------|
| 1 | **1-2 Hot Card Hunter** | Tái sử dụng nhiều code 1-1, showcase USP đặc biệt của Dummy (2♣/Q♠) — 2 lá đã có nền vàng sẵn |
| 2 | **1-4 POT Explosion** | High-impact visual, target whales/VIP. Nếu push retention/monetization, cái này quan trọng |
| 3 | **1-3 Knock to Win** | Add mechanic mới (draw from pile) → playable mới mẻ hơn |
| 4 | **1-5 Challenge Comeback** | Emotional hook, target win-back audience |

---

## 4. Shared Components Có Thể Reuse

Tất cả 4 scenarios mới đều dùng được:
- `card-renderer.js` — sprite renderer
- `drag-and-drop-handler.js` — swap logic
- `ui-header.js` — top bar / title / IQ / progress / timer
- `cta-overlay.js` — endgame overlay
- `open-store.js` — MRAID-aware store opener
- 52 card images extracted từ CardsV2 sprite sheet
- Font/styling/colors

**Cần thêm cho từng scenario:**

| Scenario | Asset/Code mới |
|----------|---------------|
| 1-2 Hot Card | Particle effect (sparkles), `+25` floating text animation, glow effect quanh 2♣/Q♠ |
| 1-3 Knock | Draw pile + discard pile graphics, draw animation, fireworks particles |
| 1-4 POT | POT bar UI component, gold rain particles, crown icon, jackpot SFX, screen shake |
| 1-5 Challenge | Challenge button intro screen, x2 multiplier badge, red border glow |

---

## 5. Câu hỏi cần làm rõ khi brainstorm

1. **Ưu tiên audience**: strategic players (1-2, 1-3) hay whale/gambler (1-4, 1-5)?
2. **Asset budget**: có designer làm particle effects, hay làm bằng PixiJS Graphics tự code?
3. **A/B test plan**: deploy 1 scenario per ad network hay rotate?
4. **Localization**: hiện tại tiếng Anh — có cần Thai/Burmese không?
5. **Sound effects**: hiện chưa có MP3 nào — có muốn thêm card flip / win SFX không?
6. **Endgame variations**: nên show "you won" với gold amount cụ thể, hay generic "Time's Up"?
7. **Difficulty**: 1-1 dễ — có muốn 1 scenario harder cho người chơi rummy thật không?

---

## 6. Notes & Cảnh báo

- **Tránh moment H** (bankrupt/đói gold) — đây là pain point, không nên showcase trong ads
- **Hot card 2♣/Q♠ đã có nền vàng sẵn** từ extract script → built-in visual hint
- **POT explosion** là USP mạnh nhất của Dummy — nên đầu tư cho 1-4
- **Challenge x2** chỉ available ở mức cược ≥40K → audience là whale, không phải casual
- **Knock mechanic** cần hiểu Rummy thật — có thể làm user mới confused, cân nhắc tutorial pop-up

---

## 7. Reference Files

- Master Index: `Dummy/Design/00_Master_Index.md`
- Pot GDD: `Dummy/Design/Pot/Docs/GDD_KingOfTheTable.md`
- Challenge GDD: `Dummy/Design/Challenge/GDD_Challenge.md`
- Mirror Player GDD: `Dummy/Design/MirrorPlayer/GDD_MirrorPlayer.md`
- Scenario 1-1 spec: `docs/superpowers/specs/2026-04-06-dummy-playable-ads-scenario-1-1-design.md`
- Scenario 1-1 plan: `docs/superpowers/plans/2026-04-06-dummy-playable-ads-1-1.md`
- Scenario 1-1 kịch bản: `docs/kich-ban-playable-ad-1-1.md`
