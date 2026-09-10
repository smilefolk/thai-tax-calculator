# Handoff: ภาษีง่าย — Thai Tax Calculator (เว็บคำนวณภาษี)

## Overview
A consumer web product for calculating Thai taxes. The core module is **Personal Income Tax (ภ.ง.ด. 90/91)** — a step-by-step wizard with a live-updating summary — surrounded by a product shell: landing page, multi-year dashboard, deduction-plan comparison, e-filing/download, and sign-up.

Five more tax modules are scoped and represented in the landing/mobile hubs but **not yet designed as flows**: Corporate (ภ.ง.ด. 50), VAT (ภ.พ. 30), Withholding tax (ภ.ง.ด. 3/53), Land & building tax, Crypto/investment (40(4)(ฌ)).

Audience: salaried employees, freelancers/small business owners, accountants, and investors doing tax planning. UI language is Thai; all numerals are Arabic digits.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. `Tax Calculator.dc.html` is a Design Component (a custom streaming-template format) — read it for exact markup, colors, and spacing, but **do not port the format itself**.

The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns, component library, and state management. If no environment exists yet, choose the most appropriate framework and implement there.

All numbers shown are a single consistent worked example (see *Worked Example* below), not fixtures to hardcode.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and layout. Recreate pixel-accurately using the codebase's own primitives. What is *not* covered: real hover/focus/error/loading states (only default states are drawn), form validation UI, empty states, and responsive breakpoints between the two designed widths.

Two viewports are designed:
- **Desktop** — 1282px-wide artboards; content max-width ~1192px with 44px page gutters.
- **Mobile** — 372×790 device frames (≈ iPhone 14/15 logical size, 390×844 minus bezel); content gutter 24px.

Tablet is undesigned — treat as a single-column stack of the desktop content.

---

## Worked Example (used on every screen — keep consistent if you build fixtures)
| Field | Value |
|---|---|
| เงินเดือน/เดือน | 65,000 → 780,000/ปี |
| โบนัส | 130,000 |
| เงินได้พึงประเมิน 40(1) | 910,000 |
| หักค่าใช้จ่าย (เหมา 50%, cap 100,000) | −100,000 |
| ค่าลดหย่อน (ส่วนตัว 60,000 + ประกันสังคม 9,000 + ประกันชีวิต 25,000 + SSF 40,000) | −134,000 |
| เงินได้สุทธิ | 676,000 |
| ภาษี | 53,900 |
| หัก ณ ที่จ่ายแล้ว | 58,000 |
| ขอคืน | +4,100 |
| Effective rate | 5.9% · marginal 15% |

### Tax logic to implement (ปีภาษี 2568 / TY2025)
Progressive brackets on เงินได้สุทธิ:

| Band | Rate |
|---|---|
| 0 – 150,000 | ยกเว้น (0%) |
| 150,001 – 300,000 | 5% |
| 300,001 – 500,000 | 10% |
| 500,001 – 750,000 | 15% |
| 750,001 – 1,000,000 | 20% |
| 1,000,001 – 2,000,000 | 25% |
| 2,000,001 – 5,000,000 | 30% |
| 5,000,001+ | 35% |

Verification of the example: 0 + 7,500 + 20,000 + (176,000 × 15% = 26,400) = **53,900**.

Deduction caps referenced in the UI: personal 60,000 · spouse 60,000 · social security 9,000 · life insurance 100,000 · SSF 30% of income capped 200,000 · RMF 30% of income · home-loan interest 100,000 · combined retirement-fund ceiling 500,000. **These are UI copy from the design, not a legal source — verify against the current ประมวลรัษฎากร before shipping, and drive them from a config table keyed by tax year, never hardcoded in components.**

---

## Design Tokens

### Color
| Token | Value | Use |
|---|---|---|
| `ground` | `#EDEAE3` | Page canvas behind cards (warm off-white) |
| `surface` | `#F6F4EF` | App background inside a screen |
| `card` | `#FFFFFF` | Cards, inputs, panels |
| `ink` | `#1A1917` | Primary text, dark panels, primary dark button |
| `ink-muted` | `#6E6A63` | Secondary text, labels |
| `ink-faint` | `#7A756C` | Tertiary/meta text, mono captions (AA on white) |
| `ink-ghost` | `#8C877D` | Em-dash placeholders, struck-through numbers |
| `line` | `#E3DFD6` | Card borders, dividers |
| `line-strong` | `#D5D0C6` | Secondary button borders, dashed drop zones |
| `line-faint` | `#F2EFE9` | Table row dividers |
| `dot` | `#CFCABF` | Dotted leader lines (ledger layout) |

Accent families — all `oklch()`, same lightness/chroma envelope, hue is the only variable. One hue per tax module.

| Family | Hue | Primary | Deep (text on light) | Mid | Tint bg | Tint border | On-dark |
|---|---|---|---|---|---|---|---|
| **Teal — personal income tax / global primary** | 195 | `oklch(0.56 0.15 195)` | `oklch(0.44 0.14 195)` | `oklch(0.70 0.13 195)` | `oklch(0.96 0.045 195)` | `oklch(0.87 0.09 195)` | `oklch(0.68 0.15 195)`, `oklch(0.80 0.14 195)` |
| **Clay — corporate tax / warnings** | 45 | `oklch(0.60 0.16 45)` | `oklch(0.46 0.15 45)` | — | `oklch(0.94 0.05 45)` | `oklch(0.86 0.09 45)` | `oklch(0.72 0.16 45)` |
| **Violet — VAT** | 300 | `oklch(0.56 0.15 300)` | `oklch(0.44 0.14 300)` | — | `oklch(0.93 0.05 300)` | — | `oklch(0.68 0.15 300)` |
| **Green — withholding tax / refunds & success** | 152 | `oklch(0.58 0.16 152)` | `oklch(0.45 0.15 152)` | `oklch(0.50 0.16 152)` | `oklch(0.93 0.06 152)` | `oklch(0.83 0.11 152)` | `oklch(0.83 0.18 152)` |
| **Ochre — land & building tax** | 90 | `oklch(0.60 0.14 90)` | `oklch(0.44 0.12 90)` | — | `oklch(0.94 0.05 90)` | — | — |
| **Indigo — crypto & investment** | 262 | `oklch(0.56 0.15 262)` | `oklch(0.44 0.14 262)` | — | `oklch(0.93 0.05 262)` | — | `oklch(0.70 0.15 262)` |

Semantic overlay: refund/positive uses green 152; owed/attention/deadline uses clay 45. Text on dark `#1A1917` panels: `#fff` primary, `rgba(255,255,255,.66)` secondary, `rgba(255,255,255,.62)` faint; dividers `rgba(255,255,255,.14)`, borders `rgba(255,255,255,.22)`, hover-fill `rgba(255,255,255,.10)`.

Links (define globally — the design has few but the editor adds them): default `oklch(0.52 0.09 175)`, hover `oklch(0.42 0.09 175)`.

### Typography
Two families, both from Google Fonts, weights 300/400/500/600 (mono 400/500/600):
- **IBM Plex Sans Thai** — all Thai and Latin prose, labels, buttons.
- **IBM Plex Mono** — every numeral that represents money, a rate, a date count, or a form code; plus small uppercase eyebrow labels with `letter-spacing: .1em–.12em`.

**Thai line-height rule: never below 1.4 on Thai text.** Thai vowels and tone marks stack above and below the baseline; tighter leading collides them. Headings use `1.42`, body `1.55–1.65`. Do not apply negative `letter-spacing` to Thai runs — it is only used on Latin/mono numerals (`-.02em` to `-.04em` on large figures).

| Role | Spec |
|---|---|
| Hero H1 | 600 50px/1.42 Sans Thai |
| Page H1 | 600 40px/1.42 (result), 600 34px/1.42 (planning), 600 28px/1.42 (dashboard), 600 27px/1.42 |
| Mobile H1/H2 | 600 31–32px/1.42, 600 25–27px/1.42 |
| Section heading | 600 22px/1.4, 600 19px/1.4, 600 15.5–17px/1.4 |
| Card title | 600 14.5–15px Sans Thai |
| Body | 300 15–17px/1.6–1.65 (lead), 300 13–14.5px/1.55–1.6 (supporting) |
| Label | 500 12–13.5px Sans Thai |
| Eyebrow | 500 10–11px Mono, `letter-spacing:.1em`, uppercase, `ink-faint` or accent-deep |
| Hero figure | 600 42px Mono `-.03em` |
| Result figure | 600 38px (mobile 58px) Mono `-.03em/-.04em` |
| KPI figure | 600 26–34px Mono `-.02em/-.03em` |
| Table numeral | 500 13–15px Mono |
| Form code chip | 500 10px Mono `.1em` |

Mobile minimum tap target 44px: primary buttons are 16px vertical padding on 15px/1.4 text ≈ 52px; chips and list rows ≥ 44px.

### Spacing, radius, elevation
Spacing steps used: 4 · 6 · 9 · 11 · 14 · 16 · 20 · 22 · 26 · 30 · 34 · 44 · 56 px.

Radius: `4` file chips · `5–6` code chips, small squares · `7` sidebar nav row · `8–9` buttons, inputs, badges · `10` secondary buttons, inner cards · `12` cards, mobile inputs/buttons · `14` feature cards, mobile cards · `16` hero card · `34` phone screen · `42` phone bezel · `999` pills, dots, sliders, avatars.

Borders are 1px `line`; selected/active states step to 1.5–2px accent. Shadows only three:
- input focus ring — `0 0 0 3px oklch(0.92 0.07 195)` (mobile `0 0 0 4px`)
- raised card — `0 10px 30px rgba(26,25,23,.10)` (recommended plan)
- hero card — `0 14px 40px rgba(26,25,23,.09)`
- slider knob — `0 2px 8px rgba(0,0,0,.16)`

---

## Screens / Views

Ordering below matches the product flow, not the file. In the file, section `id="t2"` (options `2a`–`2e`) holds the product shell and comes first; section `id="t1"` (options `1a`–`1d`) holds the personal-income-tax flow. The `.dv-turn` / `.dv-opt` wrappers and their id badges are **presentation scaffolding for design review — do not build them.**

---

### 1. Landing (`2a`) — desktop, 1282px
**Purpose:** convince and route. A visitor either starts the salary calculator immediately or picks another tax module.

**Layout:**
- **Top bar** — 68px tall, white, 1px bottom `line`, 44px side padding. Left cluster gap 34px: logo (24px teal rounded square + "ภาษีง่าย" 600/16) then nav items at 24px gap — "เครื่องคำนวณ" (active, 500 `ink`), "วางแผนภาษี", "สำหรับสำนักงานบัญชี", "คลังความรู้" (400 `ink-muted`). Right: text link "เข้าสู่ระบบ", then dark pill button "เริ่มคำนวณฟรี" (`ink` bg, white, 11px/20px padding, r8).
- **Hero** — `grid-template-columns: 1fr 452px`, gap 44px, padding `56px 44px 48px`, vertically centered, on `surface`.
  - Left: teal tint status pill (7px dot + "อัปเดตอัตราและสิทธิลดหย่อนปีภาษี 2568 แล้ว") → H1 600 50px/1.42, max 15ch, "รู้ว่าต้องจ่ายภาษีเท่าไหร่ ภายในสามนาที" → lead 300 17px/1.65 max 46ch → button row (teal primary "คำนวณภาษีเงินเดือน →" 15/30px r10; white secondary "ดูตัวอย่างผลลัพธ์") → trust row, three items gap 26px, 400 13px: "ไม่ต้องสมัครสมาชิก", "คำนวณในเครื่องคุณ", "อ้างอิงประมวลรัษฎากร".
  - Right: **interactive salary card** — white, r16, 28px padding, hero shadow. Header row ("ลองเลื่อนดูเงินเดือน" / "ปี 2568" mono). Figure 600 32px mono + unit. Slider: 8px track `#EDEAE3` r999, teal fill to 43%, 24px white knob with 2px teal border. Then two summary rows (เงินได้ทั้งปี 910,000 · เงินได้สุทธิ 676,000) above a divider, then "ภาษีโดยประมาณ" with a 600 42px teal figure. Footer: 10px 4-segment bracket bar (widths 22.2 / 22.2 / 29.6 / 26 %, colors `line` → tint → mid → primary) with mono caption "ขั้นบันได 0% · 5% · 10% · 15%".
  - **Behavior:** dragging the slider recomputes annual income, net income, tax, and the bracket bar live. Debounce not needed — the math is trivial; compute synchronously on input.
- **Module grid** — heading row ("เลือกภาษีที่ต้องคำนวณ" 600 22px + right note "ทุกโมดูลใช้ข้อมูลร่วมกัน กรอกครั้งเดียว"), then `repeat(3, 1fr)` gap 16px, six cards. Each card: white, r14, 1px `line`, **3px top border in the module's hue**, padding `22px 22px 20px`. Inside: row with tinted form-code chip (e.g. "ภ.ง.ด. 90/91") and optional mono meta ("ยอดนิยม", "ใหม่"); title 600 17px; description 300 13px/1.6 `ink-muted`; footer link 500 13px in the module's deep hue, "เริ่มคำนวณ →".

Card contents in order: บุคคลธรรมดา (teal, ภ.ง.ด. 90/91, ยอดนิยม) · นิติบุคคล (clay, ภ.ง.ด. 50) · มูลค่าเพิ่ม (violet, ภ.พ. 30) · หัก ณ ที่จ่าย (green, ภ.ง.ด. 3/53) · ที่ดินและสิ่งปลูกสร้าง (ochre, ท้องถิ่น) · คริปโตและการลงทุน (indigo, 40(4)(ฌ), ใหม่).

---

### 2. Income step — wizard (`1a`) — desktop, 1282px
**Purpose:** the primary earn-your-trust screen. Step 2 of 4 in the personal income tax flow.

**Layout:**
- **Stepper header** — 62px, white, bottom `line`, 28px side padding. Left logo. Center: four steps at 26px gap joined by 22px×1px rules. Done step = 20px teal-tint circle with ✓ in deep teal + `ink-muted` label; current = solid teal circle, white numeral, 600 `ink` label; future = 1px `line-strong` ring, `ink-faint` numeral and label. Steps: ผู้ยื่น / รายได้ / ค่าลดหย่อน / สรุป. Right: "ปีภาษี 2568" mono pill + 28px avatar.
- **Body** — `grid-template-columns: 1fr 372px` on `surface`; right rail is white with a left `line` border.

**Left column** (padding `34px 34px 40px 40px`):
- Eyebrow "STEP 02 / 04" (mono, teal), H1 "รายได้ทั้งปี 2568" 600 32px/1.42, lead 300 15px/1.6 max 56ch.
- **Card: เงินได้ประเภทที่ 1** — white r12, 1px `line`, `22px 24px`. Header row: black "40(1)" mono chip + title 600 15px; right meta "จากหนังสือรับรอง 50 ทวิ". Two-column input grid gap 16px:
  - *เงินเดือนต่อเดือน* — **focused state**: 1.5px teal border + 3px teal-tint focus ring, r9, `11px 14px`; value 500 16px mono; "บาท" suffix `ink-faint`; helper below in mono: "× 12 เดือน = 780,000" (recomputes live).
  - *โบนัส / ค่าคอมมิชชั่น* — same, resting state (1px `line`, no ring); helper in Sans.
  - Footer separated by a dashed `line`: "รวมเงินได้ประเภทที่ 1" / 600 18px mono total.
- **Card: เงินได้ประเภทอื่น** — title + "ยังไม่มีรายการ", then four dashed-outline pill buttons that add income sections: "+ รับจ้างทั่วไป 40(2)", "+ วิชาชีพอิสระ 40(6)", "+ ค่าเช่า 40(5)", "+ เงินปันผล 40(4)".
- **Card: วิธีหักค่าใช้จ่าย** — title, explainer "เงินได้ประเภทที่ 1 หักแบบเหมาได้ 50% แต่ไม่เกิน 100,000 บาท", then two radio cards side by side (flex, gap 12). Selected: 1.5px teal border, teal-tint fill, 15px radio with 4px teal ring, label 600 13.5px, sub-line indented 24px showing the computed deduction "หักได้ 100,000 (เต็มเพดาน)". Unselected "ตามจริง": 1px `line`, hollow radio, muted text, "ต้องแนบหลักฐานค่าใช้จ่าย".
- **Footer row** — secondary "← ย้อนกลับ" left; right: autosave note "บันทึกร่างอัตโนมัติ · 2 นาทีที่แล้ว" + teal primary "ถัดไป: ค่าลดหย่อน →" (13px/30px, r9).

**Right rail** (padding `34px 30px`, white):
Eyebrow "สรุปแบบเรียลไทม์" → three ledger rows (เงินได้พึงประเมิน / หักค่าใช้จ่าย −100,000 / หักค่าลดหย่อน −134,000 with a "(ประมาณการ)" qualifier) → divider → เงินได้สุทธิ 600 30px mono → divider → **ภาษีที่ต้องชำระ 600 38px teal** + "อัตราภาษีเฉลี่ยจริง 5.9%" → divider → bracket progress: label row "ขั้นภาษีปัจจุบัน / 15%", 7px bar filled 70.4%, caption "อีก 74,000 จะขยับขึ้นขั้น 20%" → clay-tint advice box "ยังลดได้อีก / ซื้อ SSF/RMF เพิ่ม 60,000 ประหยัดภาษีได้ 9,000".

**Behavior:** every keystroke in the left column updates every number in the rail, including the bracket fill %, the distance-to-next-bracket line, and the advice box. The rail is `position: sticky` on scroll.

---

### 3. Ledger view (`1b`) — desktop, 1282px
**Purpose:** the accountant/repeat-filer mode. Everything on one page, in ภ.ง.ด. section order (ก/ข/ค/ง), editable in place. Offer this as a view toggle from the wizard, not a separate product.

**Layout:** `grid-template-columns: 216px 1fr`, plus a full-width dark summary bar at the bottom.
- **Sidebar** — `ink` background, 26px/20px padding, min-height 940px. Logo → mono eyebrow "แบบ ภ.ง.ด. 91 / 2568" → four section rows (active = `rgba(255,255,255,.10)` fill r7; each row has a label left and an abbreviated mono figure right: 910K / 100K / 134K / 58K) → divider → completion "กรอกครบ 18 จาก 24 ช่อง" + 5px teal progress bar at 75% → bottom privacy note "ข้อมูลทั้งหมดคำนวณในเครื่องคุณ / ไม่ถูกส่งออกไปที่ไหน".
- **Sheet** (`#FBFAF7`, padding `34px 44px 0`) — document header with 2px `ink` underline: H1 "แบบแสดงรายการภาษี" + subline "นายสมชาย ใจดี · เลขประจำตัวผู้เสียภาษี 3-1012-•••••-••-•" (masked); right two ghost buttons "นำเข้าไฟล์ 50 ทวิ", "ล้างทั้งหมด".
- **Ledger rows** — the signature pattern: `label ‹dotted leader› figure`. Leader is a flex-1 span with `border-bottom: 1px dotted #CFCABF` and `transform: translateY(-4px)`; figure is right-aligned mono at `min-width: 110px`. Row padding 13px, divider 1px `line-faint`. Empty values render as an em-dash in `ink-ghost`.
- **Sections** — teal mono eyebrows "ก · เงินได้พึงประเมิน", "ข · หักค่าใช้จ่าย", "ค · หักค่าลดหย่อน". Subtotal rows use a 1px solid `ink` rule above/below and 600 weight. Section ค splits into a two-column grid (gap 0 44px) of eight deduction rows (ส่วนตัว, คู่สมรส, บุตร × 0, ประกันสังคม | ประกันชีวิต, SSF, RMF, ดอกเบี้ยบ้าน).
- **Grand total** — "เงินได้สุทธิ" 600 17px vs 600 26px mono, 20px/26px padding, no rule.
- **Bottom bar** — `ink`, `20px 44px`, three figures at 44px gap (ภาษีที่คำนวณได้ 53,900 · หัก ณ ที่จ่ายแล้ว 58,000 in white-70% · **ขอคืนได้ +4,100 in `oklch(0.83 0.18 152)`**), right two buttons: outlined "ดาวน์โหลด PDF" and white-on-dark "ดูรายละเอียดการคำนวณ".

---

### 4. Result (`1c`) — desktop, 1282px
**Purpose:** explain where the number came from, then convert to planning.

**Layout:** `surface`, padding `44px 52px 0`.
- **Header** — eyebrow "ผลการคำนวณ · ปีภาษี 2568", H1 600 40px/1.42 max 19ch, "ปีนี้คุณจ่ายภาษี **53,900** บาท" (figure in mono inline). Right: white "แชร์ผล" + dark "บันทึกเป็น PDF".
- **Verdict banner** — two mutually exclusive variants driven by whether withholding exceeded liability:
  - *Refund* — green tint bg, green border, 38px solid-green ↓ circle, title "คุณขอคืนภาษีได้ 4,100 บาท", sub explaining the 58,000 vs 53,900 difference, right button "วิธีขอคืน".
  - *Owed* — clay tint, "!" circle, "คุณต้องชำระเพิ่ม 4,100 บาท", sub about 3-instalment option over ฿3,000, button "ช่องทางชำระ".
- **Two columns** — `1fr 372px`, gap 22px, bottom padding 44px.

**Left column:**
- **Bracket breakdown card** — title "เงินได้สุทธิ 676,000 ถูกซอยเป็น 4 ขั้น", explainer, then a 62px stacked bar: four segments at 22.2/22.2/29.6/26% carrying an in-segment rate label and amount (`0% 150,000` grey → `5% 150,000` tint → `10% 200,000` mid → `15% 176,000` primary; white text from the mid segment onward). Axis ticks below: 0 · 150K · 300K · 500K · 676K.
  Then a 4-column table (`1.6fr .7fr 1fr 1fr`) — ช่วงเงินได้สุทธิ / อัตรา / เงินในขั้น / ภาษี — with **all eight statutory bands listed**; unreached bands at `opacity: .4` with em-dashes; the **active band highlighted** (teal-tint fill, negative 12px side margins with matching padding and r6, 600 weight, teal figures). Total row "รวมภาษีทั้งสิ้น 53,900" 600 17px mono.
- **Advice card** — header "ถ้าอยากลดภาษีปีหน้า" + sub "คุณยังใช้สิทธิลดหย่อนไปแค่ 134,000 จากเพดานรวมที่ใช้ได้" + link "ดูสิทธิทั้งหมด →". Three sub-cards: **SSF** ("ซื้อเพิ่มได้อีก 60,000", 40% teal bar, "ประหยัดภาษี 9,000 · ถือ 10 ปี"), **RMF** ("ยังไม่ได้ใช้เลย", 0% bar, "เพดาน 30% ของรายได้ · ถือถึงอายุ 55"), **ระวัง / ประกันชีวิตใกล้เต็ม** (clay-tinted card, 25% clay bar, "ใช้ 25,000 จากเพดาน 100,000").

**Right rail:**
- Dark KPI card — "อัตราภาษีเฉลี่ยจริง" with a 600 44px figure split as `5.9` + `%`, then three rows (อัตราขั้นสูงสุด 15% · รายได้ต่อเดือน 75,833 · ภาษีต่อเดือน 4,492).
- Year comparison card — two bars (2567 grey 47,200 / 2568 teal 53,900), captions, footnote "เพิ่มขึ้น 6,700 เพราะโบนัสมากกว่าเดิม".
- Document checklist — dashed border card, three rows with 15px r4 checkboxes; checked = solid teal with white ✓; unchecked = 1px `line-strong` with `ink-faint` label. Items: 50 ทวิ (done), ประกันชีวิต, SSF.

---

### 5. Deduction plan comparison (`2c`) — desktop, 1282px
**Purpose:** the planning tool. Frames the trade-off honestly: tax saved **vs** cash locked up.

**Layout:** `surface`, padding `40px 44px 44px`. Header (eyebrow, H1 600 34px/1.42 "ประหยัดภาษีได้เท่าไหร่ แลกกับเงินที่ต้องล็อกไว้แค่ไหน", lead max 64ch) with two right buttons ("สร้างแผนเอง", dark "ส่งให้ที่ปรึกษาดู").

**Three plan cards** — `repeat(3, 1fr)`, gap 18px, r14, three stacked bands each (header / inputs / outcome), dividers 1px `line-faint`:
| | A · ไม่ทำอะไรเพิ่ม | B · สมดุล (recommended) | C · ใช้สิทธิเต็มเพดาน |
|---|---|---|---|
| SSF เพิ่ม | — | 60,000 | 160,000 |
| RMF | — | — | 113,000 |
| ประกันชีวิตเพิ่ม | — | 15,000 | 75,000 |
| บริจาค | — | 5,000 | 20,000 |
| ภาษี | 53,900 | **41,900** (53,900 struck) | 19,850 (53,900 struck) |
| ประหยัดได้ | 0 | 12,000 (green) | 34,050 (green) |
| เงินที่ต้องล็อก | 0 | 80,000 | 368,000 (clay) |
| สภาพคล่อง | สูงสุด | ปานกลาง | ต่ำ (clay) |

Card B is the recommended treatment: 2px teal border, teal-tint header band, "แนะนำ" pill, raised shadow, and a full-width teal CTA "เลือกแผนนี้".

**Diminishing-returns chart** — full-width card below. Twenty 2px-gapped bars rising 6%→100% across a 104px box, hue drifting teal → ochre → clay as locked capital grows (the visual argument that the last baht saved costs the most liquidity). Axis row: "ล็อก 0" · "แผน B · 80,000" (teal, bold) · "200,000" · "แผน C · 368,000" (clay, bold). Caption: "ยิ่งไปทางขวา ยิ่งต้องล็อกเงินมากขึ้นเพื่อประหยัดเพิ่มทีละน้อย". If you can, make this a real curve computed from the user's own bracket position rather than static bars.

---

### 6. Dashboard (`2b`) — desktop, 1282px
**Purpose:** the signed-in home. Multi-year, multi-module, deadline-aware.

**Layout:** `grid-template-columns: 216px 1fr`.
- **Sidebar** — `ink`, min-height 868px, flex column. Logo → five nav rows (8px square marker + label; active row `rgba(255,255,255,.10)` r7): ภาพรวม / เครื่องคำนวณ / วางแผนลดหย่อน / เอกสาร / ยื่นแบบ → eyebrow "โมดูลที่เปิดใช้" + five legend rows with 7px hue dots (บุคคลธรรมดา teal, นิติบุคคล clay, VAT violet, หัก ณ ที่จ่าย green, คริปโต indigo) → outlined promo box "โหมดสำนักงานบัญชี / จัดการลูกค้าหลายรายในหน้าเดียว" → bottom user row (28px avatar, "สมชาย ใจดี", "แผน Pro").
- **Main** (`surface`, padding `32px 40px 40px`):
  - Greeting header — H1 "สวัสดีตอนบ่าย คุณสมชาย" + sub with filing window and 75% readiness. Right: year picker "ปีภาษี 2568 ▾" + teal "+ คำนวณใหม่".
  - **Four KPI cards** — `repeat(4,1fr)` gap 14: ภาษีบุคคลธรรมดา 53,900 with clay delta "↑ 6,700 จากปีก่อน" · ขอคืนได้ 4,100 in green + "ยังไม่ได้ยื่น" · สิทธิลดหย่อนคงเหลือ 326,000 + 29% teal bar · **dark countdown card** "เหลือเวลายื่น 114 วัน / ปิดรับ 8 เม.ย. 2569".
  - **Body** — `1fr 336px` gap 16.
    - *Five-year bar chart* — 172px tall, gap 20; three grey bars (2564 31,400 / 2565 36,800 / 2566 42,100), one tint bar (2567 47,200), one teal bar (2568 53,900) with the current label in deep teal 600. Axis row above a 1px top rule.
    - *Filing history table* — columns `0.8fr 1.4fr 1fr 1fr 0.9fr` (ปีภาษี / แบบ / ภาษี / คืน-จ่ายเพิ่ม / สถานะ). Status pills: ร่าง (clay tint), คืนแล้ว / ชำระแล้ว (green tint). Signed amounts: `+` green for refunds, `−` `ink-muted` for payments. Footer link "ดูทั้งหมด 5 ปี →".
    - *Right rail* — "สิ่งที่ต้องทำต่อ" card with three tasks, each a 6px full-height rounded rule in a priority hue (clay = urgent, teal = timely, `line-strong` = low) beside title + sub; then a teal-tint upsell card "คุณจ่ายภาษีมากกว่าที่จำเป็น … ประหยัดได้ถึง 24,000 บาทต่อปี" with CTA "เปิดตัววางแผน".

---

### 7. Filing & auth (`2d`) — desktop, 1282px
**Purpose:** finish the job, and (optionally) create an account so next year is easier.

**Layout:** `ground` canvas, 30px padding, `grid-template-columns: 1fr 452px`, gap 24, `align-items: start`.

**Left — filing card** (white r14, `32px 34px`):
- Eyebrow "ขั้นตอนสุดท้าย", H2 "ยื่นแบบ ภ.ง.ด. 91 ปีภาษี 2568", lead max 58ch.
- Two radio cards: **selected** "ยื่นออนไลน์ผ่านภาษีง่าย" (2px teal, teal tint, sub about e-Filing / เลขรับทันที / PromptPay refund within 7 days, green "เร็วที่สุด" pill) and "ดาวน์โหลดไฟล์ไปยื่นเอง" (resting).
- **Attachments** — 2×2 grid gap 10. Two complete files (30×36 grey page glyph, filename 500 13px, mono filesize, green ✓ circle): `50ทวิ-2568.pdf` 248 KB, `ประกันชีวิต-AIA.pdf` 96 KB. One missing (clay dashed border + clay tint, "หนังสือรับรอง SSF / ยังไม่ได้อัปโหลด", clay "อัปโหลด" button). One dashed drop zone "+ ลากไฟล์มาวางที่นี่".
- **Footer** above a top rule: left "ยอดขอคืน" with 600 28px green figure + "เข้าพร้อมเพย์ ••••4471"; right outlined "ดาวน์โหลด PDF" and teal "ยื่นแบบเลย".

**Right — auth panel** (`ink` r14, `38px 36px`, min-height 520px, flex column): logo → H2 "เก็บผลคำนวณไว้ดูปีหน้า" → sub "สมัครฟรี ไม่ต้องผูกบัตร ข้อมูลเข้ารหัสและลบได้ตลอดเวลา" → email field (resting, 1px white-22%) → password field (**focused**, 1.5px `oklch(0.68 0.15 195)`, dots + "แสดง" toggle in `oklch(0.78 0.14 195)`) → full-width light-teal button "สร้างบัญชี" with `ink` label → "หรือ" divider → two OAuth rows (Google, LINE with a green swatch) → bottom fine print incl. the disclaimer **"ภาษีง่ายไม่ใช่หน่วยงานของรัฐ"**.

---

### 8. Mobile — calculator flow (`1d`), 372×790 each
Three frames. Status bar 9:41 with 16×9 and 18×9 outlined indicators; content gutter 24px.

**8a · Deduction question** — back chevron + 4px progress bar (45%) + "5/11" counter. Teal eyebrow "ค่าลดหย่อน", H2 600 27px/1.42 "ปีนี้ซื้อกองทุน SSF ไปเท่าไหร่", lead. Big focused amount card (1.5px teal, 4px ring, r14): label "จำนวนเงิน", value 600 34px mono + "บาท". Three quick-fill chips: +10,000 / +50,000 / เต็มสิทธิ. Teal-tint info block with a 22px "i" circle explaining the SSF cap. Sticky footer: running total row ("ภาษีตอนนี้ / 53,900" teal 600 19px) then "ข้าม" + full-width teal "ถัดไป".

**8b · Result (dark)** — full `ink` screen. Eyebrow, "ภาษีที่ต้องชำระทั้งปี", **600 58px mono figure**, sub "เฉลี่ยเดือนละ 4,492 บาท · 5.9% ของรายได้". Dark-green panel "ขอคืนได้ 4,100 บาท" + explanation. Eyebrow "ที่มาของตัวเลข" then four ledger rows ending in a ruled "เงินได้สุทธิ 676,000". A 38px 4-segment bracket bar in ascending teal with a rate label row. Footer: white full-width "ดูวิธีลดภาษีปีหน้า".

**8c · What-if planner** — H2 "ลองปรับดูสิ" + lead. Slider card ("ซื้อ SSF/RMF เพิ่ม" / 600 18px 60,000; 8px track, 38% teal fill, 26px knob; scale "0 … สิทธิสูงสุด 160,000"). Green result card: "ภาษีจะเหลือ" 600 36px green **44,900** beside struck 53,900, plus a solid-green savings pill "ประหยัด 9,000 บาท". Two list rows (เงินบริจาค / ดอกเบี้ยบ้าน) with 34px icon slots and chevrons. Bottom tab bar (คำนวณ active / วางแผน / เอกสาร / ฉัน) — 20px r5 icon squares over 10.5px labels, white bg, top `line`.

### 9. Mobile — shell (`2e`), 372×790 each
**9a · Landing** — compact top bar (logo + "เข้าสู่ระบบ"), H1 600 31px/1.42, lead, full-width teal "เริ่มคำนวณฟรี", eyebrow "เลือกภาษี", then the six module cards as a 2-column grid (r12, 3px top border in module hue, title 600 13.5px/1.45, mono form code).

**9b · Dashboard** — header ("ภาพรวมของคุณ" 600 20px + "ปีภาษี 2568" + 32px avatar). Dark hero card: "ภาษีรวมทุกโมดูล" + 600 38px mono, footer split into ขอคืน 4,100 (light green) and เหลือเวลายื่น 114 วัน. Teal-tint nudge "ยังประหยัดได้อีก 24,000". Eyebrow "5 ปีย้อนหลัง" + 96px 5-bar chart with 2-digit year labels. One task row (clay 6px rule, "อัปโหลดหนังสือรับรอง SSF", chevron). Same 4-tab bar with ภาพรวม active.

---

## Interactions & Behavior
Only default states are drawn. Implement:

**Live recalculation** — every income, deduction, and slider input recomputes the whole model synchronously: net income, tax, effective rate, marginal band, bracket-bar fill, distance to next bracket, refund/owed verdict, and every advice figure. No "Calculate" button anywhere; the summary rail and mobile footer total are the feedback.

**Wizard navigation** — 4 steps (ผู้ยื่น / รายได้ / ค่าลดหย่อน / สรุป) on desktop, 11 questions on mobile. Back is always available and non-destructive; completed steps are clickable to jump. Mobile questions offer ข้าม (skip) which records "not applicable" rather than zero. Autosave draft to local storage; surface it as "บันทึกร่างอัตโนมัติ · N นาทีที่แล้ว".

**Verdict variant** — refund vs owed selects banner color, icon, copy, and CTA. This is a real branch, not a color swap; the owed variant also mentions instalments.

**Add-income chips** — the four dashed chips insert a new income-type card (each with its own statutory expense-deduction rule) into the form.

**Expense method** — switching เหมา 50% ↔ ตามจริง changes the deduction figure and, for ตามจริง, reveals an evidence-upload requirement.

**Slider** — keyboard accessible (arrow ±1 step, Home/End); step 1,000 baht; live `aria-valuetext` in Thai.

**File upload** — drag-drop and click; per-file states pending → uploading → verified (green ✓) → error. The missing-document state is clay-tinted and blocks the ยื่นแบบเลย button.

**Motion** — restrained. Number changes: no count-up animation on keystroke (it fights typing); do animate the bracket bar and progress fills with `width 220ms cubic-bezier(.2,.7,.3,1)`. Card/pill state changes 120ms ease-out. Respect `prefers-reduced-motion`.

**Hover (undesigned, recommended)** — cards lift to `0 4px 14px rgba(26,25,23,.08)` and border → `line-strong`; buttons darken one lightness step (teal primary → `oklch(0.50 0.15 195)`); nav/table rows tint to `#FBFAF7`.

**Focus** — always visible: the 3px teal-tint ring shown on the salary input is the standard focus treatment; never remove outlines without replacement.

**Responsive** — below ~1100px the `1fr 372px` splits stack, and the summary rail becomes a sticky bottom bar (as on mobile). Below ~700px, the 3-column module grid → 2 columns → 1; the plan-comparison cards become a horizontal snap-scroller with the recommended card first.

## State Management
Single tax-return model per (user, tax year, module). Personal income tax shape:

```
taxYear: 2568
filerProfile: { hasSpouse, spouseHasIncome, childrenCount, parentsSupported, disabledDependents }
income: [{ category: '40(1)'|'40(2)'|'40(4)'|'40(5)'|'40(6)'|'40(8)',
           amount, expenseMethod: 'standard'|'actual', actualExpense }]
deductions: { personal, spouse, children, socialSecurity, lifeInsurance,
              healthInsurance, parentHealthInsurance, ssf, rmf, pvd, nsf,
              homeLoanInterest, donations, doubleDonations, stimulusSchemes }
withholding: { amount, sources[] }
attachments: [{ id, kind, filename, size, status }]
ui: { currentStep, viewMode: 'wizard'|'ledger', verdictVariant (derived) }
```

Derived (pure functions, no component state): `grossIncome`, `expenseDeduction` (per-category rule + cap), `totalDeductions` (each capped, plus the combined retirement ceiling), `netIncome`, `taxByBracket[]`, `taxDue`, `balance = withholding − taxDue`, `effectiveRate`, `marginalRate`, `nextBracketDistance`, `unusedAllowanceByType`.

Put the whole rule set — brackets, caps, category expense rules — in a **year-keyed config**, since Thai rates and stimulus deductions change annually and the dashboard renders five years side by side. Keep the calculator a pure module with unit tests per bracket boundary; the UI should never do arithmetic inline.

Data fetching: none required for the calculator (compute client-side — the privacy claim "ข้อมูลทั้งหมดคำนวณในเครื่องคุณ" is load-bearing copy). Server work is only persistence, file upload, and e-Filing submission.

## Assets
No image assets. Everything is CSS: solid rounded squares stand in for logos, module icons, file thumbnails, and OAuth marks; "→ ← ✓ ↓ ! › ▾ i •" are text characters. Phone bezels are nested rounded divs.

Before implementation you need: a real wordmark/logo, an icon set (module icons, nav, file types), Google and LINE brand marks per their guidelines, and any illustration you want on the landing hero. The dotted-leader, bracket-bar, and progress-fill "graphics" are layout, not assets — rebuild them, don't export them.

Fonts: IBM Plex Sans Thai and IBM Plex Mono, Google Fonts, weights 300/400/500/600. Self-host for production; both are OFL.

## Files
- `Tax Calculator.dc.html` — all nine screens. Read for exact values; do not port the format. Structure: `<helmet>` (fonts + review-scaffold CSS) → `<section id="t2">` with `#2a` landing, `#2b` dashboard, `#2c` plan comparison, `#2d` filing+auth, `#2e` mobile shell → `<section id="t1">` with `#1a` wizard, `#1b` ledger, `#1c` result, `#1d` mobile calculator. The logic class only toggles the `1c` verdict variant and two card visibilities.
- `support.js` — runtime for the design-component format. **Not part of the deliverable**; included only so the HTML opens in a browser.

## Caveats for the implementer
1. **Verify every tax rule against the current ประมวลรัษฎากร / กรมสรรพากร guidance before shipping.** Figures in this design are illustrative and were authored for layout, not legal accuracy.
2. Add a visible disclaimer that the tool is an estimate and not a government service — the design carries one line of it in the auth panel; it likely needs more prominence, and possibly PDPA consent language.
3. Copy is written for a general audience; have a Thai tax professional review terminology (especially the section labels ก/ข/ค/ง and the 40(x) category names) before launch.
4. Buddhist-era years (2568) are used throughout, with Gregorian only inside deadline dates. Keep the convention consistent and locale-aware if you ever ship an English UI.
