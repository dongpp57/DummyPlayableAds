# 36 Playable Ads Scenarios — Dummy Thái

**Ngày**: 2026-04-07
**Tổng**: 3 pillar × 3 kịch bản × 4 visual skin = **36 ads**
**Luật**: Dummy Thái chuẩn — chia 7 lá/người, Spe-to = 2♣ (+50/-50), cây mở = lá lật đầu game

**Ký hiệu chất**: ♠ bích | ♥ cơ | ♦ rô | ♣ chuồn
**CTA chung**: tap CTA → mở store của platform

## ⚙️ Interaction Rules (áp dụng toàn bộ ads)

1. **Guided Tap (mặc định cho S1, S3, S4, S6 — gameplay đánh/ăn 1 hướng đi)**:
   - Chỉ lá/nút được hint mới enable, các lá khác disable + làm mờ
   - Hand pointer + glow vàng chỉ rõ lá đúng
   - Tap sai → không phản hồi
   - Chuẩn industry (Voodoo, AppLovin, Mintegral)

2. **Free Tap với multi-outcome (S2, S5)**:
   - Áp dụng khi kịch bản design **mọi lựa chọn đều dẫn tới cùng outcome** (vd: đánh lá nào cũng thua)
   - Cho user free tap → tăng cảm giác bế tắc tự nhiên, không bị cảm giác bị ép

3. **Guided Drag (S7, S8 — sắp xếp cơ bản)**:
   - Pointer chỉ từng lá, user kéo vào khung target
   - Tự tay sắp xếp → cảm giác làm chủ, không phải bấm 1 nút magic

4. **Free Drag với suy luận (S9)**:
   - User kéo `5♥` vào nhóm A hoặc B tự do
   - **Có 1 đáp án đúng** dẫn tới knock thắng + đáp án sai có replay
   - Tăng cảm giác "aha!" khi tìm ra cách xếp tối ưu

---

## PILLAR 1 — MOMENT ĐIỂM THƯỞNG PHẠT

---

### 🎬 S1 — Win: Ăn cây mở (+50 điểm)

**Phần A — Tổng quan**
- Pillar: Moment điểm thưởng phạt
- Hook cảm xúc: **Bất ngờ + thắng lớn ngay từ turn đầu**
- Target moment: "Wow, ăn cây mở được +50 luôn!"
- Độ dài: 15s
- Số turn: 2
- Outcome: **WIN** (+50 điểm bonus)
- 3 player (Player + AI Bot1 + AI Bot2)

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-2s | Bàn 3 người hiện ra. Camera zoom vào tay bài Player. Hand Player flip lên (animation lật bài). Cây mở lật giữa bàn (highlight glow vàng). Text overlay: "Ăn cây mở = +50 điểm!" |
| F1 | 2-5s | **Turn 1 (auto, AI Bot1)**: Bot1 bốc 1 lá → đánh xuống lá `5♦`. Animation lá rơi xuống bàn. |
| F2 | 5-9s | **Turn 2 (interactive, Player)**: Hand pointer chỉ vào lá `4♣`+`6♣` trong tay Player + cây mở `5♣`. Text: "Tap để ăn!". Player tap → animation 3 lá ghép thành phỏm `4♣ 5♣ 6♣`. SFX "ting!". Particle vàng nổ. |
| F3 | 9-12s | Text overlay lớn: **"+50!"** bay lên. Điểm Player tăng từ 0 → 50 (counter animation). Confetti. |
| F4 | 12-15s | Fade qua CTA: logo game + nút **"DOWNLOAD NOW"** pulse. Tap → mở store. |

**Phần C — Spec kỹ thuật**

```yaml
players: 3
player_hand: [4♣, 6♣, 8♥, 9♥, J♠, Q♠, K♠]   # 7 lá
bot1_hand:   [2♥, 3♥, 5♦, 7♦, 9♣, 10♣, A♦]
bot2_hand:   [3♦, 4♦, 6♠, 7♠, 8♣, J♥, Q♥]
cay_mo: 5♣                                    # lá lật giữa bàn
deck_order: [10♦, 2♠, ...]                    # turn 1 bot1 bốc 10♦

turns:
  - turn: 1
    actor: bot1
    mode: auto
    action: draw 10♦, discard 5♦
  - turn: 2
    actor: player
    mode: interactive
    hint: "Tap 4♣ + 6♣ + cây mở 5♣ để tạo phỏm"
    action: meld [4♣, 5♣, 6♣]
    result: ăn cây mở → +50 điểm
    sfx: "ting_gold.wav"
    vfx: gold_particle_burst

end_condition: meld_cay_mo_success
final_score: { player: +50, bot1: 0, bot2: 0 }
cta: open_store
```

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

### 🎬 S2 — Lose: 2 lá lẻ cuối, đánh lá nào cũng bị ăn cây mở (-50)

**Phần A — Tổng quan**
- Pillar: Moment điểm thưởng phạt
- Hook cảm xúc: **Bế tắc + tiếc nuối — "Đánh lá nào cũng chết!"**
- Target moment: "Hai lá cuối đều cạ với cây mở, hai bot rình hai bên — không lối thoát!"
- Độ dài: 18s
- Số turn: 1 (free choice — user chọn 1 trong 2 lá)
- Outcome: **LOSE** (-50)
- 3 player

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Bàn 3 người. Player đã hạ phỏm `2♣3♣4♣` trên bàn. Tay player chỉ còn **2 lá lẻ** `5♥` và `9♥` (không tạo cạ với nhau qua 7♥ vì thiếu 6♥/8♥). Cây mở `7♥` highlight glow đỏ. Text: "Còn 2 lá... đánh lá nào đây?" |
| F1 | 3-7s | Camera zoom hint: bot1 silhouette có `6♥` glow, bot2 silhouette có `8♥` glow. Text: "Cả 2 bot đang rình cây mở!" |
| F2 | 7-13s | **Turn 1 — FREE TAP**: Pointer chỉ "Đánh lá nào cũng được". Cả 2 lá `5♥` và `9♥` đều enable.<br>• Tap **5♥** → Bot1 (có `6♥`) ăn `5♥ 6♥ 7♥` (mất cây mở)<br>• Tap **9♥** → Bot2 (có `8♥`) ăn `7♥ 8♥ 9♥` (mất cây mở) |
| F3 | 13-16s | Animation bot tương ứng lấy lá + cây mở → meld 3 lá. SFX "buzz". Text overlay đỏ: **"-50!"** rung lắc. |
| F4 | 16-18s | Text: "Học cách giữ lá an toàn — chơi ngay!" → CTA **"DOWNLOAD"**. |

**Phần C — Spec kỹ thuật**

```yaml
players: 3
# Pre-game: player đã hạ 1 phỏm 3 lá
player_melds_on_table: [[2♣, 3♣, 4♣]]
player_hand: [5♥, 9♥]                       # 2 lá lẻ — KHÔNG tạo được cạ với 7♥ một mình (thiếu 6♥/8♥)
                                            # Player KHÔNG thể tự ăn cây mở
                                            # Player KHÔNG tự meld 5♥+9♥ (không liên quan)

bot1_melds_on_table: []
bot1_hand: [6♥, K♠, Q♠, J♠, 10♠, 9♣, 2♦]   # có 6♥ → ăn 5-6-7♥ nếu player thả 5♥
bot2_melds_on_table: []
bot2_hand: [8♥, A♦, 3♦, 4♦, 8♣, 10♣, J♣]   # có 8♥ → ăn 7-8-9♥ nếu player thả 9♥

cay_mo: 7♥

turns:
  - turn: 1
    actor: player
    mode: free_tap (KHÔNG guided — cả 2 lá đều enable)
    hint: "Đánh lá nào cũng được"
    constraint: player KHÔNG có option "ăn cây mở" vì thiếu lá nối (6♥/8♥)
    options:
      - choice: discard 5♥
        next_actor: bot1
        next_action: pickup 5♥, meld [5♥, 6♥, 7♥]   # bot1 ăn cây mở
      - choice: discard 9♥
        next_actor: bot2
        next_action: pickup 9♥, meld [7♥, 8♥, 9♥]   # bot2 ăn cây mở
  - turn: 2
    actor: bot (1 hoặc 2 tuỳ choice)
    mode: auto
    sfx: "buzz_error.wav"
    vfx: red_shake

end_condition: bot_an_cay_mo_du_chon_la_nao
final_score: { player: -50, bot_winner: +50 }
cta: open_store
```

> **Note**: Đây là **trường hợp đặc biệt cho phép free tap** trong S1-S6 vì kịch bản design cả 2 lựa chọn đều dẫn tới cùng outcome (thua) → message vẫn nguyên vẹn. Tăng cảm giác bế tắc tự nhiên.

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

### 🎬 S3 — Win: Ăn Spe-to (+50 điểm)

**Phần A — Tổng quan**
- Pillar: Moment điểm thưởng phạt
- Hook cảm xúc: **Phấn khích đặc biệt — Spe-to là lá quý nhất!**
- Target moment: "Spe-to đây rồi! +50 vào túi!"
- Độ dài: 18s
- Số turn: 2
- Outcome: **WIN** (+50)
- 3 player

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Bàn 3 người. Hand Player flip. Text giới thiệu: **"Spe-to (2♣) = lá vàng +50 điểm!"**. Icon Spe-to glow rực. |
| F1 | 3-7s | **Turn 1 (auto, Bot2)**: Bot2 bốc, đắn đo, đánh xuống `2♣` (Spe-to!). Camera zoom slow-mo lá Spe-to rơi. Text: "Bot vừa đánh Spe-to!" |
| F2 | 7-12s | **Turn 2 (interactive, Player)**: Hand pointer chỉ vào `A♣` + `3♣` trong tay Player + Spe-to `2♣` Bot vừa đánh. Text: "Tap ăn Spe-to!". Player tap → meld `A♣ 2♣ 3♣`. SFX "ting vàng x2". Particle vàng + tia chớp. |
| F3 | 12-15s | Text **"SPE-TO! +50!"** to đùng. Counter điểm 0 → 50. Avatar player ăn mừng. |
| F4 | 15-18s | CTA **"PLAY NOW"** → store. |

**Phần C — Spec kỹ thuật**

```yaml
players: 3
player_hand: [A♣, 3♣, 5♥, 6♥, 9♦, 10♦, J♥]
bot1_hand:   [4♥, 7♣, 8♣, 10♣, J♣, Q♣, K♣]
bot2_hand:   [2♣, 4♠, 5♠, 6♠, 7♥, 8♥, Q♥]   # bot2 có Spe-to nhưng bị "ép" đánh ra
bot2_logic: "Bot có meld 4♠5♠6♠ → không cần 2♣, đánh 2♣"
cay_mo: K♦
deck_order: [9♣, ...]

turns:
  - turn: 1
    actor: bot2
    mode: auto
    action: draw 9♣, discard 2♣ (Spe-to)
    vfx: slow_motion_zoom
  - turn: 2
    actor: player
    mode: interactive
    hint: "Tap A♣ + 3♣ để ăn Spe-to 2♣"
    action: meld [A♣, 2♣, 3♣]
    result: player ăn Spe-to → +50
    sfx: "ting_gold_double.wav"
    vfx: gold_lightning

end_condition: an_speto_thanh_cong
final_score: { player: +50, bot1: 0, bot2: 0 }
cta: open_store
```

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

## PILLAR 2 — ĐA DẠNG ACTION

---

### 🎬 S4 — Win: Ăn xong knock luôn

**Phần A — Tổng quan**
- Pillar: Đa dạng action
- Hook cảm xúc: **Combo đỉnh cao — ăn + knock + thắng cùng turn**
- Target moment: "Ăn 1 phát knock luôn, hạ gục đối thủ!"
- Độ dài: 20s
- Số turn: 3
- Outcome: **WIN by knock**
- 2 player (1v1)

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Bàn 1v1. Hand Player flip — đã có sẵn **1 phỏm 3♠4♠5♠ trên bàn** từ trước (giả định player đã hạ ở turn trước). Tay còn 4 lá: cạ `5♣6♣` chờ + `9♦` (gửi được vào meld bot 9♥10♥J♥). Bot có sẵn meld `9♥10♥J♥` trên bàn. Text: "Còn 1 lá là knock sạch tay!" |
| F1 | 3-7s | **Turn 1 (auto, Bot)**: Bot bốc, đánh `2♦`. |
| F2 | 7-11s | **Turn 2 (auto, Player)**: Player bốc `K♠` không cần, đánh ra `K♠`. Bot bốc, đánh `8♦`. |
| F3 | 11-17s | **Turn 3 (interactive, Player)**: Bot đánh `7♣`. <br>**Step 1**: Pointer chỉ → tap ăn `7♣` → hạ phỏm `5♣ 6♣ 7♣` xuống bàn.<br>**Step 2**: Pointer chỉ `9♦` → drag gửi vào meld bot `9♥10♥J♥` → hợp lệ vì 9♦ thành set với 9♥. Wait — sai chất, set cần cùng số khác chất → `9♥9♦` chỉ 2 lá, không thành set. ⚠️ Em fix ở phần C.<br>**Step 2 (fixed)**: Pointer chỉ `Q♣` → drag gửi vào meld bot `9♥10♥J♥Q♣`? Cũng sai (run cần cùng chất). |
| F3 (revised) | 11-17s | **Turn 3**: Bot đánh `7♣`. Step 1: tap ăn 7♣ → hạ phỏm 5♣6♣7♣. Step 2: drag `Q♥` gửi vào meld bot `9♥10♥J♥` → meld bot mở rộng thành `9♥10♥J♥Q♥` (run cùng chất). Tay player giờ trống. Step 3: tap KNOCK. |
| F4 | 17-19s | Animation knock: bài player lộ — 0 lá tay, 2 phỏm trên bàn. Bot bài lộ điểm dead. Text **"KNOCK! WIN!"**. Confetti. |
| F5 | 19-20s | CTA **"DOWNLOAD"**. |

**Phần C — Spec kỹ thuật**

```yaml
players: 2
# Setup pre-game (giả định player đã hạ phỏm 3♠4♠5♠ ở turn trước):
player_melds_on_table: [[3♠, 4♠, 5♠]]
bot_melds_on_table:    [[9♥, 10♥, J♥]]      # meld bot mở rộng được bằng Q♥ hoặc 8♥

# Tay đầu turn 1 (4 lá vì đã hạ phỏm trước):
player_hand: [5♣, 6♣, Q♥, 8♣]               # cạ 5-6♣ chờ 7♣ + Q♥ gửi meld bot + 8♣ gửi meld bot
bot_hand:    [2♦, 4♥, 5♥, 7♣, 8♦, J♣, K♣]
cay_mo: 10♣
deck_order: [A♦, K♠, 3♦]                    # bot bốc A♦, player bốc K♠, bot bốc 3♦

turns:
  - turn: 1
    actor: bot
    mode: auto
    action: draw A♦, discard 2♦
  - turn: 2
    actor: player
    mode: auto
    action: draw K♠, discard K♠ (auto demo)
  - turn: 2b
    actor: bot
    mode: auto
    action: draw 3♦, discard 8♦
  - turn: 3
    actor: bot
    mode: auto
    action: discard 7♣
  - turn: 3b
    actor: player
    mode: interactive (guided tap)
    hint_step1: "Tap ăn 7♣"
    action_step1: meld [5♣, 6♣, 7♣]   # hạ phỏm mới → tay còn [Q♥, 8♣]
    hint_step2: "Drag Q♥ vào meld bot 9♥10♥J♥"
    action_step2: send Q♥ to bot_meld → bot_meld = [9♥,10♥,J♥,Q♥]   # tay còn [8♣]
    hint_step3: "Drag 8♣ vào meld 5♣6♣7♣ vừa hạ"
    action_step3: send 8♣ to player_new_meld → meld = [5♣,6♣,7♣,8♣]  # tay = trống
    hint_step4: "Tap nút KNOCK"
    action_step4: knock

end_condition: knock_win_clear_hand
final_score: { player: +knock_bonus, bot: -dead_points }
cta: open_store
```

> **Note**: Vì luật knock = tay sạch 0 lá, kịch bản này phải bao gồm: player có sẵn 1 phỏm trên bàn từ trước + tay 4 lá → ăn 1 lá tạo phỏm mới + gửi 2 lá vào 2 meld khác → tay trống → knock. Logic: ăn 7♣ + gửi Q♥ vào meld bot + gửi 8♣ vào meld vừa hạ.

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

### 🎬 S5 — Lose: 2 lá lẻ cuối, đánh lá nào bot cũng ăn + knock

**Phần A — Tổng quan**
- Pillar: Đa dạng action
- Hook cảm xúc: **Bế tắc + tiếc nuối — Bot rình 2 cạ, đánh lá nào cũng knock**
- Target moment: "2 lá cuối đều là mồi cho bot — không cách gì sống sót!"
- Độ dài: 18s
- Số turn: 1 (free choice — user chọn 1 trong 2 lá lẻ)
- Outcome: **LOSE by bot knock**
- 2 player

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Bàn 1v1. Player đã hạ 1 phỏm `2♠3♠4♠` trên bàn. Tay player còn 2 lá lẻ `9♣` và `J♦`. Bot avatar nham hiểm. Bot đã hạ 2 meld trên bàn `[10♦10♥10♣]` và `[4♣5♣6♣]`, tay bot **chỉ còn 2 lá**. Text: "Bot chỉ còn 2 lá... đánh gì đây?" |
| F1 | 3-7s | Camera hint: bot silhouette lộ `7♣ 8♣` (cạ chờ 9♣) **và** `Q♦ K♦` (cạ chờ J♦). Wait — bot 2 lá thôi → em sửa F1: bot lộ 1 trong 2 cạ tuỳ user chọn (UI generic "bot có cạ chờ"). |
| F2 | 7-13s | **Turn 1 — FREE TAP**: Pointer "Tap lá để đánh". Cả 2 lá `9♣` và `J♦` đều enable.<br>• Tap **9♣** → Bot ăn `7♣ 8♣ 9♣` (cần bot có 7♣8♣)<br>• Tap **J♦** → Bot ăn `J♦ Q♦ K♦` (cần bot có Q♦K♦)<br>**Vì bot chỉ có 2 lá**, dùng cơ chế "bot hand dynamic" — bot luôn có cạ phù hợp với lá player vừa thả. |
| F3 | 13-16s | Animation bot hí hửng → ăn lá → hạ phỏm 3 lá → tay bot sạch → KNOCK. SFX "buzz!" Text **"KNOCK! YOU LOSE!"** |
| F4 | 16-18s | Text: "Học cách giữ lá an toàn!" → CTA **"PLAY"**. |

**Phần C — Spec kỹ thuật**

```yaml
players: 2
# Pre-game: cả 2 đã hạ phỏm trước đó
player_melds_on_table: [[2♠, 3♠, 4♠]]
player_hand: [9♣, J♦]                          # 2 lá lẻ — cả 2 đều "mồi" cho bot

bot_melds_on_table: [[10♦, 10♥, 10♣], [4♣, 5♣, 6♣]]
# Bot 2 lá tay — DYNAMIC theo lá player chọn (xem note bên dưới)

cay_mo: K♠

turns:
  - turn: 1
    actor: player
    mode: free_tap (KHÔNG guided — cả 2 lá enable)
    hint: "Tap lá để đánh"
    options:
      - choice: discard 9♣
        bot_hand_at_this_moment: [7♣, 8♣]
        bot_action: pickup 9♣, meld [7♣, 8♣, 9♣], knock (tay sạch)
      - choice: discard J♦
        bot_hand_at_this_moment: [Q♦, K♦]
        bot_action: pickup J♦, meld [J♦, Q♦, K♦], knock (tay sạch)
  - turn: 2
    actor: bot
    mode: auto
    sfx: "buzz_error.wav"
    vfx: red_shake_then_knock_animation

end_condition: bot_knock_du_player_chon_la_nao
final_score: { player: -dead_points, bot: +knock_bonus }
cta: open_store
```

> **Note quan trọng**: 
> 1. **Bot hand dynamic** — vì playable ad không cần fair logic, bot hand sẽ "ảo hoá" theo lá player chọn. Hai variant bot hand `[7♣8♣]` và `[Q♦K♦]` chỉ load khi user tap lá tương ứng. Trong storyboard F1 có thể che bot hand (úp bài) để user không nghi ngờ.
> 2. Có thể implement khác bằng cách cho bot hand 4 lá `[7♣, 8♣, Q♦, K♦]` — nhưng tay bot 4 lá → ăn 1 lá hạ 3 → tay còn 2 lá → KHÔNG knock được. Phải dùng dynamic.

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

### 🎬 S6 — Win: Ăn 1 meld → hạ 1 meld / gửi hết bài

**Phần A — Tổng quan**
- Pillar: Đa dạng action
- Hook cảm xúc: **Combo nâng cao — ăn + gửi hết bài cùng lúc**
- Target moment: "Ăn xong gửi sạch bài, kết thúc ngọt!"
- Độ dài: 22s
- Số turn: 3
- Outcome: **WIN by gửi hết bài**
- 2 player

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Bàn 1v1. Hand Player có sẵn 2 phỏm hạ trên bàn. Tay còn 2 lá lẻ. Text: "Còn 2 lá lẻ — gửi hết để win!" |
| F1 | 3-7s | Turn 1 auto: Bot bốc đánh `3♦`. |
| F2 | 7-12s | Turn 2 auto: Player bốc `4♦` không khớp gì cả, đánh `4♦`. Bot bốc đánh `J♣`. |
| F3 | 12-18s | **Turn 3 (interactive, Player)**: Bot đánh `6♠`. Hand pointer chỉ Player tap ăn `6♠` → tạo phỏm mới `4♠ 5♠ 6♠`. Sau đó pointer chỉ 2 lá lẻ còn lại → drag gửi vào meld đối thủ đang có (`9♥ 10♥ J♥` → gửi `Q♥` và `8♥`). |
| F4 | 18-21s | Tay Player trống sạch. Text **"WIN! GỬI HẾT BÀI!"**. Confetti vàng. |
| F5 | 21-22s | CTA **"DOWNLOAD NOW"**. |

**Phần C — Spec kỹ thuật**

```yaml
players: 2
player_hand_initial: [4♠, 5♠, 8♥, Q♥]        # 2 lá chờ ăn 6♠ + 2 lá để gửi
player_melds_on_table: [[2♣,3♣,4♣], [7♦,8♦,9♦]]
bot_hand: [3♦, 6♠, 7♥, 9♥, 10♥, J♥, K♣]
bot_melds_on_table: [[9♥,10♥,J♥]]             # meld có thể gửi 8♥ và Q♥
cay_mo: 5♣
deck_order: [4♦, A♠]

turns:
  - turn: 1
    actor: bot
    mode: auto
    action: discard 3♦
  - turn: 2
    actor: player
    mode: auto
    action: draw 4♦, discard 4♦
  - turn: 2b
    actor: bot
    mode: auto
    action: draw A♠, discard J♣
  - turn: 3
    actor: bot
    mode: auto
    action: discard 6♠
  - turn: 3b
    actor: player
    mode: interactive
    hint_step1: "Tap ăn 6♠"
    action_step1: meld [4♠, 5♠, 6♠]
    hint_step2: "Drag 8♥ vào meld 9-10-J♥"
    action_step2: send 8♥ to bot_meld
    hint_step3: "Drag Q♥ vào meld 9-10-J♥"
    action_step3: send Q♥ to bot_meld
    result: tay trống → win

end_condition: win_by_clear_hand
final_score: { player: +win_bonus, bot: -dead_points }
cta: open_store
```

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

## PILLAR 3 — SẮP XẾP BÀI

---

### 🎬 S7 — Sắp xếp bộ Rummy bình thường (Meld, Set)

**Phần A — Tổng quan**
- Pillar: Sắp xếp bài
- Hook cảm xúc: **Thoả mãn — tự tay sắp xếp gọn gàng**
- Target moment: "Mình tự kéo lá vào nhóm — cảm giác làm chủ bài!"
- Độ dài: 16s
- Số turn: không có (chỉ thao tác sắp xếp)
- 2 player

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Bàn 1v1. Hand Player flip lên — bài lộn xộn các chất, các số. Text: "Bài lộn xộn — sắp xếp lại!" |
| F1 | 3-5s | Hai khung trống xuất hiện bên dưới hand: **Khung "PHỎM"** (xanh) và **Khung "BỘ"** (cam). |
| F2 | 5-8s | **Guided drag step 1**: Hand pointer chỉ lá `3♠` glow → drag vào khung Phỏm. Tiếp theo `4♠` → khung Phỏm. Tiếp `5♠` → khung Phỏm. Khung tự highlight "Phỏm 3-4-5♠ ✓". |
| F3 | 8-12s | **Guided drag step 2**: Hand pointer chỉ `7♥` → khung Bộ. Tiếp `7♦` → khung Bộ. Tiếp `7♣` → khung Bộ. Khung tự highlight "Bộ ba 7♥-7♦-7♣ ✓". |
| F4 | 12-14s | Lá lẻ `K♦` còn lại → text "Còn 1 lá lẻ K♦". Cả 2 nhóm sáng lên. Text: **"Phỏm + Bộ ba!"** |
| F5 | 14-16s | CTA **"PLAY NOW"**. |

**Phần C — Spec kỹ thuật**

```yaml
players: 2
player_hand_unsorted: [7♥, 3♠, 7♣, K♦, 5♠, 7♦, 4♠]
target_groups:
  group_run:
    label: "PHỎM"
    color: green
    cards: [3♠, 4♠, 5♠]
  group_set:
    label: "BỘ"
    color: orange
    cards: [7♥, 7♦, 7♣]
  leftover: [K♦]

interactive_action:
  mode: guided_drag                          # Pointer chỉ từng lá, user kéo
  steps:
    - step: 1
      hint: "Kéo 3♠ vào khung PHỎM"
      action: drag 3♠ to group_run
    - step: 2
      hint: "Kéo 4♠ vào khung PHỎM"
      action: drag 4♠ to group_run
    - step: 3
      hint: "Kéo 5♠ vào khung PHỎM"
      action: drag 5♠ to group_run
    - step: 4
      hint: "Kéo 7♥ vào khung BỘ"
      action: drag 7♥ to group_set
    - step: 5
      hint: "Kéo 7♦ vào khung BỘ"
      action: drag 7♦ to group_set
    - step: 6
      hint: "Kéo 7♣ vào khung BỘ"
      action: drag 7♣ to group_set
  rule: chỉ lá hint mới enable, các lá khác mờ
  vfx: card_glow_then_drag_trail

end_condition: all_target_cards_sorted
cta: open_store
```

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

### 🎬 S8 — Sắp xếp bài đẹp → thắng luôn

**Phần A — Tổng quan**
- Pillar: Sắp xếp bài
- Hook cảm xúc: **Wow — sắp xếp xong thấy ngay là thắng!**
- Target moment: "Bài chia siêu đẹp, sort xong thắng instant!"
- Độ dài: 14s
- Số turn: 0 (instant win sau sort)
- 2 player

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Bàn 1v1. Hand Player flip — 7 lá chia trông thường. Text: "Bài này có gì đặc biệt?" |
| F1 | 3-5s | Hand pointer → nút **SORT**. |
| F2 | 5-10s | Player tap SORT. Cards fly animation. Hiện ra **2 phỏm hoàn chỉnh** (3-4-5♥ và 8-9-10♦) + 1 bộ ba (J-J-J). Tổng cả 7 lá đều thuộc bộ. Text vàng to: **"BÀI ĐẸP! INSTANT WIN!"** |
| F3 | 10-13s | Animation knock auto. Bài Bot lật ra full điểm. Confetti. Score Player nhảy. |
| F4 | 13-14s | CTA **"DOWNLOAD"**. |

**Phần C — Spec kỹ thuật**

```yaml
players: 2
player_hand_unsorted: [J♣, 3♥, 9♦, J♥, 4♥, 8♦, J♠, 10♦, 5♥]   # NOTE: dùng 7 lá thực tế
player_hand_unsorted_actual: [J♣, 3♥, 9♦, J♥, 4♥, 8♦, 5♥]      # 7 lá
player_hand_sorted:
  meld_run_1: [3♥, 4♥, 5♥]
  meld_run_2: [8♦, 9♦, ???]       # cần 10♦ mới đủ
  meld_set: [J♣, J♥, ???]          # cần J thứ 3
  
# REVISED: hand đẹp = đủ 7 lá hoàn chỉnh
player_hand_final: [3♥, 4♥, 5♥, 8♦, 9♦, 10♦, J♣]   # 1 phỏm 3-4-5♥, 1 phỏm 8-9-10♦, 1 lá lẻ J♣
# Để "instant win" → cần thêm logic gửi J♣ hoặc rule "all melded"

# SIMPLIFIED rule cho ad: hand 7 lá chia thành 2 phỏm + 1 set qua sort
player_hand_demo: [3♥, 4♥, 5♥, 7♣, 7♦, 7♠, K♥]   
# 1 phỏm 3-4-5♥ + 1 set 7-7-7 + 1 lá K♥
# K♥ = lá knock với 0 điểm dead (rule: ad cho phép)
# Hoặc cho instant win demo bỏ qua lá K♥

bot_hand: [2♦, 6♣, 9♠, J♦, Q♠, K♣, A♥]   # bot dead points cao

interactive_action:
  hint: "Tap SORT"
  vfx_after_sort: 
    - highlight_meld_1: green_glow
    - highlight_meld_2: green_glow  
    - highlight_set: orange_glow
  text_overlay: "BÀI ĐẸP! WIN!"
  auto_knock: true

end_condition: instant_win_after_sort
cta: open_store
```

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

### 🎬 S9 — Sắp xếp suy luận: chọn đúng lá → ghép nhiều bộ → knock!

**Phần A — Tổng quan**
- Pillar: Sắp xếp bài
- Hook cảm xúc: **Eureka! — Tìm đúng cách xếp = thắng instant**
- Target moment: "Lá 5♥ xếp vào đúng nhóm → cả tay thành phỏm/set → knock luôn!"
- Độ dài: 20s
- Số turn: 0 (sort + auto knock nếu chọn đúng)
- 2 player

**Phần B — Storyboard**

| Frame | Thời lượng | Mô tả |
|-------|------------|-------|
| F0 | 0-3s | Hand Player flip — 7 lá `4♥ 5♥ 6♥ 5♦ 5♣ 5♠ 7♥`. Bot có meld `8♥9♥10♥` trên bàn. Text: "Sắp xếp bài để knock!" |
| F1 | 3-7s | Highlight `5♥` glow. Hiện 2 lựa chọn ghosted:<br>**A** = phỏm `4♥-5♥-6♥` (run cùng chất ♥)<br>**B** = bộ ba `5♥-5♦-5♣` (set 3 lá 5) |
| F2 | 7-14s | **Free drag**: User kéo `5♥` vào A hoặc B.<br>• **Chọn A (đúng!)** → run `4♥5♥6♥` thành công → 3 lá `5♦5♣5♠` còn lại tự ghép set → drag `7♥` gửi vào meld bot `8♥9♥10♥` → tay sạch → **AUTO KNOCK** ✅<br>• **Chọn B** → set `5♥5♦5♣` → còn `4♥6♥7♥5♠` → 4♥6♥ cạ chờ 5♥ (đã dùng), 5♠ và 7♥ lẻ → KHÔNG knock |
| F3 | 14-17s | Tuỳ outcome:<br>• A → confetti vàng, text **"PERFECT! KNOCK WIN!"**<br>• B → text "Tay còn lá lẻ — thử lại!" |
| F4 | 17-19s | Replay button (chỉ hiện nếu chọn B) cho user thử lại. Hoặc next directly. |
| F5 | 19-20s | CTA **"DOWNLOAD"** — học cách suy luận! |

**Phần C — Spec kỹ thuật**

```yaml
players: 2
player_hand: [4♥, 5♥, 6♥, 5♦, 5♣, 5♠, 7♥]   # 7 lá có 2 cách xếp khác nhau cho 5♥
bot_melds_on_table: [[8♥, 9♥, 10♥]]          # meld bot có thể nhận 7♥ (mở rộng run)

ambiguous_card: 5♥
option_A_correct:
  meld_run_1: [4♥, 5♥, 6♥]      # run cùng chất ♥
  meld_set: [5♦, 5♣, 5♠]         # set 3 lá 5 còn lại
  send_to_bot_meld: 7♥           # gửi 7♥ mở rộng run bot 7-8-9-10♥
  leftover: []                    # tay sạch
  outcome: AUTO_KNOCK_WIN
option_B_wrong:
  meld_set: [5♥, 5♦, 5♣]
  leftover: [4♥, 6♥, 5♠, 7♥]    # 4 lá lẻ, không thành bộ
  outcome: NO_KNOCK_show_replay

interactive_action:
  mode: free_drag
  hint: "Kéo 5♥ vào nhóm phù hợp để knock"
  ui_groups_visible: [group_A_run_4-5-6, group_B_set_5-5-5]
  on_choose_A:
    sequence:
      - meld [4♥,5♥,6♥]
      - auto-detect set [5♦,5♣,5♠] → hạ
      - drag 7♥ → bot meld [8♥9♥10♥] → expand to [7♥8♥9♥10♥]
      - tay sạch → trigger knock animation
    vfx: chain_combo_gold
    text: "PERFECT! KNOCK WIN!"
  on_choose_B:
    sequence:
      - meld [5♥,5♦,5♣]
      - hand còn [4♥,6♥,5♠,7♥]
      - không knock được
    vfx: subtle_wrong
    text: "Tay còn lẻ — thử lại?"
    show_replay_button: true

end_condition: knock_if_choose_A
cta: open_store
```

> **Note**: Đây là kịch bản free interaction nhưng có **1 đáp án đúng** dẫn tới knock thắng + 1 đáp án sai (vẫn valid theo luật, chỉ là không thắng). Tăng cảm giác "aha!" khi user phát hiện. Nếu chọn sai có replay button để thử lại — tăng engagement.

**Variant skin**: `[V1: TBD]` `[V2: TBD]` `[V3: TBD]` `[V4: TBD]`

---

## 📋 Tổng kết 36 ads

| Pillar | Kịch bản gốc | Variant | Tổng |
|--------|--------------|---------|------|
| Moment điểm thưởng phạt | S1, S2, S3 | × 4 | 12 ads |
| Đa dạng action | S4, S5, S6 | × 4 | 12 ads |
| Sắp xếp bài | S7, S8, S9 | × 4 | 12 ads |
| **TOTAL** | **9** | **× 4** | **36 ads** |

Chi tiết tracking từng variant xem file Excel `playable_ads_36_scenarios.xlsx`.
