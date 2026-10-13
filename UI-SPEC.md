# UI-SPEC

Pages, layout, components, motion and responsive behavior. Visual tokens (colors, type, radius, spacing, component looks) come from `DESIGN-cohere.md` and are used as written; this file says where and how. Component names in `code` refer to the components section of `DESIGN-cohere.md`.

## 1. Design analysis: how Cohere maps to a vocabulary site

| Cohere idea | Use here | Why it fits memorizing |
|---|---|---|
| White editorial canvas, lots of air | Default surface for word lists | Calm page, nothing competes with the words |
| One monumental headline per page | Page hero only | Clear entry, then the page settles into list rhythm |
| `research-table`: tall rule-separated rows | **Every word list** | Scanning row by row is how lists are memorized; rules separate items without boxes |
| Deep green / dark navy full-width bands (`dark-feature-band`) | Part dividers (คำศัพท์ตามหมวด, เวลา, ตัวเลขและเงิน, รูปประโยคและบทสนทนา in alternating green and navy) and the exam pattern band | Strong color change marks "new topic" in memory. Words are grouped by topic, never split by chapter |
| `agent-console-card` (dark chat-like panel) | Question and answer patterns, dialogues | Exam is spoken Q and A; a console look shows question then answer |
| `blog-filter-chip` (large coral taxonomy chips) | Chapter-set switch | Big, obvious, touch friendly |
| `product-card` on soft stone | Number tiles (1-10, hours, 300, 3,000 ...) | Tiles group a sequence visually; irregular ones stand out |
| `trust-logo-strip` (quiet, wide spacing) | Romaji ticker under the hero | A passive "glance at words" strip, the site's signature motion |
| Mono uppercase labels | Section numbers, word counts, "Q1", "เคล็ดจำ" | Gives the lab-like cadence without heavy bold |
| Coral as small warm accent only | Irregular-reading markers, active chip | Coral means "pay attention here" and nothing else |
| Flat, no shadows | Everywhere | Per DESIGN |

## 2. Type, fonts and script handling

- Display (`hero-display`, `product-display`): `CohereText` is proprietary, so the documented fallback **Space Grotesk** is used.
- Body/UI: documented fallback **Inter** (variable).
- Mono labels: documented fallback chain for `CohereMono` (Arial, system UI). No extra mono font unless the user asks.
- **Thai** (not covered by DESIGN): one open Thai font, appended to every stack so Latin uses the DESIGN fonts and Thai falls through. Decided: **IBM Plex Sans Thai** (clean, technical, close to Inter), weights 400 and 500, Thai and Latin subsets.
- **Macrons**: romaji uses `ā ī ū ē ō`. Load the `latin-ext` subset of Space Grotesk and Inter, otherwise those letters fall back to another font.
- **Thai line height and tracking** (implementation rule, tokens unchanged): DESIGN display styles have line height 1.0 and negative tracking, which clip Thai tone marks. Any element with `lang="th"` text uses line height at least 1.3 and letter spacing 0. Romaji keeps the DESIGN values.
- Mark languages: Thai text `lang="th"`, romaji `lang="ja-Latn"`.

### Type roles on these pages

| Use | DESIGN role | Phone size |
|---|---|---|
| Page hero headline | `hero-display` 96 px | 48 px |
| Exam hero headline | `product-display` 72 px | 40 px |
| Part title in band | `section-display` 60 px | 36 px |
| Section heading (`###`) | `card-heading` 32 px | 26 px |
| Group heading (`####`) | `feature-heading` 24 px | 20 px |
| Romaji in word rows | `feature-heading` 24 px | 20 px |
| Thai meaning | `body-large` 18 px | 17 px |
| Paragraphs, list text | `body` 16 px | 16 px |
| Numbers, counts, Q labels | `mono-label` 14 px uppercase (`body-muted` on light) | 13 px |

## 3. App shell

```
┌──────────────────────────────────────────────────────────────┐
│ [mark] Nihongo Notes        คำศัพท์    แนวสอบ          [share] │  navbar 64 px (phone 56 px)
├──────────────────────────────────────────────────────────────┤
│                         page content                         │
└──────────────────────────────────────────────────────────────┘
```

There is no announcement bar and no footer: the page simply ends after its content (bottom spacing 80 px).

- **Navbar**: sticky, canvas background, hairline bottom border. Desktop and tablet use three zones per DESIGN: mark + wordmark left, the three links "คำศัพท์", "แนวสอบ" and "แบบทดสอบ" centered, a coral share button (44 px square, radius 8, share icon, `aria-label` "แชร์เว็บไซต์") right. The active link has a 2 px ink underline that slides between links (Motion `layoutId`).
- **Phone (< 768)**: no hamburger. With only three destinations the links stay visible: mark (no wordmark) left, the three links (8 px side padding, never wrapped) as 44 px high text tabs with the same sliding underline; the share button stays at the right end. Navbar height 56 px. The course code is not shown in the navbar (it stays in the vocabulary page hero).
- **Share dialog** (same as Digital Logic Notes): a press on the share button opens a centered white card (radius 16, max width 420) over a dimmed, blurred page (backdrop blur 6 px). The card has the title "แชร์เว็บไซต์", the hint "สแกน QR หรือคัดลอกลิงก์", a QR code of the site address, and the address in a read-only field with a coral copy button inside it (the icon turns into a check and a polite live region says "คัดลอกลิงก์แล้ว"). A cross, Esc or a press outside closes it. Focus is trapped while open and returns to the share button; the page scroll is locked. The QR encoder is our own (`lib/qr.ts`, byte mode, level M), no dependency.
- **Toast host**: bottom-left dark toast (`agent-console-card` colors), for "อัปเดตเป็นเวอร์ชันล่าสุดแล้ว" and "ใช้งานออฟไลน์ได้แล้ว".

### UI strings (Thai)

| Key | Text |
|---|---|
| app name | Nihongo Notes |
| nav vocab | คำศัพท์ |
| nav exam | แนวสอบ |
| set chips | from front matter `label` (บท 1-2 then บท 3-4; สอบครั้งที่ 1 (บท 1-2) then สอบครั้งที่ 2 (บท 3-4)) |
| choose a set (vocab / exam prompt) | เลือกบทที่ต้องการเรียน / เลือกชุดข้อสอบที่ต้องการดู |
| share, copy, copied, close | แชร์เว็บไซต์ / คัดลอกลิงก์ / คัดลอกลิงก์แล้ว / ปิด |
| contents toggle | ซ่อนสารบัญ / แสดงสารบัญ |
| word count | `N คำ` |
| contents | สารบัญ |
| tip label | เคล็ดจำ |
| irregular marker (screen reader) | อ่านไม่ปกติ |
| exam answer label | ตอบ |
| exam example label | ตัวอย่าง |
| jump to vocab chip | ดูตาราง |
| loading | กำลังโหลด... |
| load error | โหลดเนื้อหาไม่สำเร็จ / ลองอีกครั้ง |
| not found | ไม่พบหน้านี้ / กลับหน้าคำศัพท์ |
| updated toast | อัปเดตเป็นเวอร์ชันล่าสุดแล้ว |
| offline ready toast | ใช้งานออฟไลน์ได้แล้ว |

## 4. Page 1: Vocabulary (`#/`)

### 4.1 Desktop wireframe (>= 1024)

```
                 JN60101 · ภาษาญี่ปุ่นเพื่อการสื่อสาร 1          (mono label, centered)
                        คำศัพท์ บท 3-4                         (hero-display, word reveal)
                     186 คำ · 24 กลุ่ม · โรมาจิตามสไลด์          (body-large, muted)

                  ( บท 3-4 )   ( บท 1-2 )                       (blog-filter-chip x2)

  ·· kyōshitsu  ·  depāto  ·  ikura desuka  ·  ku-ji  ·  hap-pun ··   (romaji ticker)

┌─ contents rail ─┐  ┌───────────────── content column (fills the rest) ──────────┐
│ [▯] สารบัญ          │  │ ███ dark-feature-band (deep green, radius 22) ███████████  │
│ ▌คำศัพท์ตามหมวด │  │  PART 01                                                  │
│   1.1 สถานที่   │  │  คำศัพท์ตามหมวด                           50 คำ           │
│   1.2 กิจกรรม   │  │ ██████████████████████████████████████████████████████  │
│   1.3 สิ่งของ   │  │                                                           │
│   ...           │  │  1.1  สถานที่                                  (card-heading)│
│ เวลา            │  │  สถานที่เรียน/ทำงาน                    5 คำ  (feature-heading)│
│   2.1 ...       │  │  ─────────────────────────────────────────────────────── │
│ (sticky,        │  │  kyōshitsu                    ห้องเรียน                  │
│  sliding bar)   │  │  ─────────────────────────────────────────────────────── │
└─────────────────┘  │  kaigi-shitsu                 ห้องประชุม                 │
                     │  ─────────────────────────────────────────────────────── │
                     │  ┌────────┐┌────────┐┌────────┐┌────────┐  (number tiles)  │
                     │  │ 1      ││ 4  •   ││ 7  •   ││ 9  •   │                 │
                     │  │ ichi-ji││ yo-ji  ││shichi-ji│ ku-ji  │                 │
                     │  └────────┘└────────┘└────────┘└────────┘                 │
                     │  ┌ pale-green tip ───────────────────────────────────┐   │
                     │  │ เคล็ดจำ  4 = yo-ji, 7 = shichi-ji, 9 = ku-ji       │   │
                     │  └───────────────────────────────────────────────────┘   │
                     └───────────────────────────────────────────────────────────┘
```

Counts in the wireframes (186 คำ, 64 คำ, ...) are placeholders; real numbers come from the build manifest.

### 4.2 Blocks

| Block | Look |
|---|---|
| Hero | Centered. Mono label, `hero-display` headline built from the set label, a muted line with counts from the manifest. Before a set is chosen the headline is just "คำศัพท์" and the muted line is the prompt "เลือกบทที่ต้องการเรียน". Generous space below (80 px) per DESIGN |
| Set switch | Two `blog-filter-chip`s. Active: coral fill, ink text. Inactive: coral outline, pale fill. Chips are in `order` (บท 1-2, then บท 3-4). None is pressed at first and nothing is rendered below them until one is chosen (an unknown `?set=` counts as none). Updates `?set=` |
| Romaji ticker | Single line of romaji from the current set (first entry of each group), `caption` size, `muted`, separated by middle dots, faded edges (mask). Decorative: `aria-hidden` |
| Contents rail | Sticky left column 240 px (desktop only). Lists `##` parts and `###` sections. A 2 px ink bar marks the section in view and slides between items; the list scrolls inside the rail to keep that item visible while the page scrolls. Clicking scrolls smoothly and updates `?g=`. A toggle button (panel icon, `aria-expanded`) at the top-left closes the rail: the list fades and slides out, the grid column shrinks to the 44 px toggle (520 ms, ease-out) and the content column, which has no maximum width, grows into the space. Opening reverses it, with the list rows staggering in. The choice is kept in `localStorage` |
| Part band | `dark-feature-band`, radius 22, padding 48 (phone 28). Mono label `PART 01` (from the heading number), part title in `section-display` white, item count right. Alternates `deep-green` and `dark-navy` by position. Each vocabulary file is one list of topics (places, things, questions, expressions, time, numbers, money, sentences); the lecturer's chapters are not shown |
| Section heading | `card-heading` with the number as a mono label before it. 56 px top spacing |
| Group heading | `feature-heading` plus a mono label word count at the right edge |
| Word rows (`vocab`) | `research-table`: full-width rows, 1 px `hairline` rules, min height 64 px. Two columns 40/60: romaji (`feature-heading`, ink) and Thai meaning (`body-large`, `body-muted`). `A = B` romaji shows `=` in `slate`. Irregular: 6 px coral dot before the romaji and the romaji underlined with a 2 px `coral-soft` line |
| Readings / pairs | Same row style; pairs sit side by side at >= 768, stacked below |
| Number grid | `product-card` tiles on `soft-stone`, radius 8, auto-fill columns min 120 px. Mono label (the number) top-left, reading below in `feature-heading`. Irregular tile: 1 px `coral` border and coral dot |
| Tip | `pale-green` panel, radius 16, padding 20, mono label "เคล็ดจำ", body text |
| Generic table | Rule-separated table, header row in mono labels, horizontal scroll wrapper on small screens |
| Dialogue | `agent-console-card` (primary background, white text, radius 8, padding 24). Each line: speaker as a mono label in `muted`, text in white. Reads like a chat log |
| Paragraph and list | `body`, max 70ch |

### 4.3 Phone (< 768)

- Hero shrinks (48 px headline), chips full width in a row.
- Contents rail becomes a **sticky chip row** under the navbar (horizontal scroll, active chip filled), listing sections of the current set.
- Word rows stack: romaji on top (20 px), Thai meaning below (17 px), 16 px gutters, rows keep the rules.
- Number tiles: 3 per row at 360 px, 4 at 430 px and up.
- Part bands lose the side margin (full bleed with radius 22 kept at 16 px inset).

## 5. Page 2: Exam guide (`#/exam`)

### 5.1 Desktop wireframe

```
  ORAL EXAM · บท 3-4                                     (mono label)
  สอบพูดครั้งที่ 2                                        (product-display)
  พุธ 14 ต.ค. 2569 · 15 คะแนน · คนละ 3 นาที               (body-large)

  ┌ 1 ───────────────────────────┐ ┌ 2 ───────────────────────────┐
  │ คำศัพท์ ไทย → ญี่ปุ่น          │ │ ตอบคำถาม                      │   capability cards
  │ 5 คะแนน · 5 คำ               │ │ 10 คะแนน · 5 คำถาม x 2 ข้อ     │   (top rule, no box)
  └──────────────────────────────┘ └──────────────────────────────┘

█████████████████ dark-feature-band (deep green, radius 22, padding 80) ███████████████
█  5 รูปแบบคำถาม                                                                     █
█  ┌ Q1 ──────────────────────┐ ┌ Q2 ──────────────────────┐ ┌ Q3 ────────────────┐  █
█  │ Koko wa doko desuka?     │ │ Ima nan ji desuka?       │ │ Anata no denwa ... │  █
█  │ ─────────────────────    │ │ ─────────────────────    │ │ ─────────────────  │  █
█  │ ตอบ  Koko wa [สถานที่]   │ │ ตอบ  Ima [gozen/gogo]... │ │ ตอบ  ... no ...    │  █
█  │      desu.               │ │                          │ │                    │  █
█  │ ตัวอย่าง Koko wa          │ │ ตัวอย่าง Ima gogo yo-ji  │ │                    │  █
█  │ kaigi-shitsu desu.       │ │ han desu.                │ │                    │  █
█  │ (ดูตาราง →)              │ │ (ดูตาราง →)              │ │                    │  █
█  └──────────────────────────┘ └──────────────────────────┘ └────────────────────┘  █
█  ┌ Q4 ──────────────────────┐ ┌ Q5 ──────────────────────┐                         █
█  └──────────────────────────┘ └──────────────────────────┘                         █
█  เคล็ดจำ (white on translucent): ข้อ 3 พูดเลขอย่างเดียว ...                          █
███████████████████████████████████████████████████████████████████████████████████████

  ฝึกจากตัวอย่างในแนวข้อสอบ                                (section-heading)
  ───────────────────────────────────────────────────────────────────────────
  IMA NAN JI DESUKA?      16.30 น.             Ima gogo yo-ji han desu.
  ───────────────────────────────────────────────────────────────────────────
  KORE WA IKURA DESUKA?   3,625 เยน            Sanzen roppyaku nijū go en desu.
  ───────────────────────────────────────────────────────────────────────────

```

### 5.2 Blocks

| Block | Look and data |
|---|---|
| Hero | Mono label, `product-display` title from the exam file `#`, facts line from front matter `facts` |
| Score split | `capability-card`s built from the score table (one card per row): number as mono label, title `feature-heading`, points line. Top hairline rule only |
| Pattern band | `dark-feature-band` deep green. Cards are `agent-console-card` on a darker translucent surface: mono label `Q1`, question in `feature-heading` white, divider, label "ตอบ" + template with `[placeholder]` parts drawn as `coral-soft` outlined chips, label "ตัวอย่าง" + example in white at 80% opacity. Grid: 3 columns desktop, 2 tablet, 1 phone |
| Jump chips | `button-pill-outline` (white outline on the band) "ดูตาราง" linking to the related vocab group (`#/?set=3-4&g=2.2`). The mapping question -> group id lives in `config/site.ts` |
| Tips | Rendered inside the band in white text on 10% white surface |
| Worked examples | `research-table` rows: question (mono label), prompt (`feature-heading`, the time/number/phone), answer (romaji, `body-large`). Phone: three lines per row |
| Quiz sets | Same chip switch as the vocabulary page, labelled with the quiz names. Empty until chosen (headline "แนวสอบ", prompt "เลือกชุดข้อสอบที่ต้องการดู"); then the hero shows the quiz title and facts from the manifest and the quiz is rendered below with the blocks above. Quiz 1 has its self-introduction script and picture questions as generic blocks |

### 5.3 Phone

- Hero 40 px. Score cards stack.
- Pattern band full bleed, cards one per row, padding 28.
- Worked examples stack question / prompt / answer.

## 5b. Page 3: Flash-card quiz (`#/quiz`)

```
                 FLASH CARDS · บท 3-4                     (mono label)
                 แบบทดสอบ บท 3-4                           (product-display, compact hero)
      สุ่มโจทย์แบบเดียวกับสอบพูด ตอบออกเสียงเอง แล้วเปิดดูเฉลย
                 ( บท 1-2 )  ( บท 3-4 )                    (set chips, empty page until chosen)
  (สุ่มทุกแบบ) (คำศัพท์) (สถานที่) (บอกเวลา) (เบอร์โทร) (ราคา) (เวลาเริ่ม-เลิก)   (kind chips)
                 ตอบได้ 3 · ยังไม่ได้ 1
  ┌──────────── deep-green card, radius 22 ────────────┐
  │ บอกเวลา                                   ข้อที่ 4 │
  │ Ima nan ji desuka?                (feature-heading) │
  │                 16.30 น.          (quiz-number)    │
  │              แตะการ์ดเพื่อดูเฉลย                    │
  └─────────────────────────────────────────────────────┘
        [ดูเฉลย]   [🎲 สุ่มข้อใหม่ (coral pill)]
        ตอบได้ไหม  [ยังไม่ได้]  [ตอบได้]          (visible after turning)
```

| Block | Look |
|---|---|
| Card front | `deep-green` like the exam pattern band, white text, padding 24/32/40. Kind label and card number as mono labels, the examiner's question in romaji (or "พูดเป็นภาษาญี่ปุ่น" for words), the prompt large in the middle: Thai words in `quiz-thai` (32/44/48 px), times and prices in `quiz-number` (40-72 px, Space Grotesk, tabular), phone numbers and time ranges in `quiz-number-long` (30-56 px) and never broken at a hyphen. A remark of the meaning shows small under it |
| Card back | White card with hairline border and soft shadow. "เฉลย · kind" and the prompt as mono labels, the question small, the answer sentence in `quiz-answer` (22/28/32 px, medium), other spellings ("หรือ ..."), then the spoken chunks as small tiles (number or Thai label above, romaji below); irregular readings get a coral border and dot. A pale-green "เคล็ดจำ" line repeats the exam guide reminder for time, phone, price and start-end cards |
| Card size | Both faces share one grid cell, so the card is as tall as the taller face; min height 340/380/420 px; max width 720 px, centered |
| Controls | Outline pill "ดูเฉลย" / "ดูโจทย์" (`aria-pressed`) and the coral pill "สุ่มข้อใหม่" with a dice icon. The self-check row (outline "ยังไม่ได้", primary "ตอบได้") keeps its space and fades in after the card turns, so nothing jumps |
| Kind chips | Small pill chips like the contents chip row, wrapping and centered; "สุ่มทุกแบบ" deals about 40% words and 60% question patterns, like the exam |

## 6. Motion

All values use Motion. Easing: `[0.22, 1, 0.36, 1]` (ease-out) unless noted. Only `opacity` and `transform`.

| Element | Animation | Trigger | Duration |
|---|---|---|---|
| Hero headline | Words rise 24 px and fade in, staggered 60 ms | Page load | 600 ms |
| Hero meta and chips | Fade in after the headline | Page load | 300 ms, delay 300 ms |
| Romaji ticker | Continuous horizontal scroll, 40 s per loop, pauses on hover and focus | Always | linear |
| Set chips | Active coral fill slides between chips (`layoutId`) | Click | 300 ms spring |
| Set change | Old list fades out 120 ms, new list fades/rises in 16 px | Click | 240 ms |
| Contents rail | Active bar slides to the section in view (`layoutId`) | Scroll spy | 250 ms spring |
| Chip row (phone, tablet) and contents rail | Three steps when the section in view changes: the old chip (rail: bar) fades out (200 ms), the row glides so the new chip is centered (eased toward a moving target, about 350 ms, so fast section changes keep gliding instead of restarting), then the new fill fades in (300 ms, 200 ms delay) and its text color follows. No sliding indicator: a shared element inside a scrolling row jitters | Scroll spy | 200 + 300 ms |
| Navbar underline | Slides between links | Route change | 250 ms spring |
| Part band | Scales from 0.98 and fades in; mono label counts up the word count | Enters viewport | 500 ms |
| Word rows | Fade and rise 12 px, staggered 30 ms within a group, once only | Group enters viewport | 300 ms |
| Number tiles | Fade and rise, staggered 25 ms (the planned one-time pulse of the irregular dot was dropped) | Grid enters viewport | 280 ms |
| Exam pattern cards | Card fades in; then the "ตอบ" line and example reveal after 200 ms | Card enters viewport | 400 ms |
| Contents rail toggle | Column 240 -> 44 px, content widens, list fades and slides out; icon flips | Click | 520 ms ease-out |
| Share dialog | Backdrop dims and blurs, card rises 8 px and scales from 0.96 | Click | 240 ms in, 200 ms out |
| Quiz card turn | 3D flip (rotateY 180, perspective 1600 px); the hidden face is `inert` | Card press or "ดูเฉลย" | 550 ms ease-out |
| Quiz new card | Old card slides left and fades, new one slides in from the right with a slight tilt; the dice icon spins once | Dice, self-check, kind chip | 220 ms each, spring for the dice |
| Toast | Slide up 16 px and fade | Show | 200 ms |

Rules:
- Every scroll-triggered animation runs **once** (no replay on scroll up) and starts when 15% of the element is visible.
- Lists longer than 40 rows animate only the first 12 rows of each group; the rest appear instantly to keep scrolling smooth.
- `prefers-reduced-motion: reduce`: everything renders in its final state, the ticker becomes a static wrapped line, smooth scroll becomes instant.
- Animation never hides content from assistive technology: text is in the DOM from the first render, and nothing waits on an animation to become usable.

## 7. Responsive behavior

Desktop, tablet and phone are all first-class targets. The layout is designed mobile-first, then enhanced upward; each page must be comfortable to use (not merely not broken) at every size below. Breakpoints follow `DESIGN-cohere.md`.

### 7.1 Per-device layout

| Area | Phone < 768 (360-767) | Tablet 768-1023 | Desktop >= 1024 |
|---|---|---|---|
| Navbar | 56 px, mark + two text tabs | 64 px, three zones | 64 px, three zones |
| Page gutters | 16 px | 32 px | centered, max 1200 px (prose column 880 px) |
| Hero headline | 40-48 px | 64 px | 96 px (vocab) / 72 px (exam) |
| Set chips | full-width row, two equal chips | centered, auto width | centered, auto width |
| Navigation inside a page | sticky chip row under the navbar (horizontal scroll, active chip filled, scrolls itself into view) | same sticky chip row | sticky contents rail (240 px, can be closed) |
| Word rows | stacked: romaji (20 px) above meaning (17 px); one column | two columns 40/60 | two columns 40/60 |
| Pairs tables | stacked, left half then right half | side by side | side by side |
| Number tiles | 3 per row at 360, 4 from 430 | auto-fill, min 120 px | auto-fill, min 120 px |
| Part band | inset 16 px, padding 28 | padding 40 | padding 48 |
| Exam score cards | 1 column | 2 columns | 2 columns |
| Exam pattern cards | 1 column | 2 columns | 3 columns |
| Worked-example rows | three lines (question / prompt / answer) | one row, answer wraps | one row |
| Dialogue console | full width, padding 20 | padding 24 | padding 24 |

### 7.2 Touch and input

- Touch targets at least 44 px (chips, tabs, rows that act as links, disclosure buttons). Hover-only effects are never required; every hover state has a focus and press equivalent.
- Sticky elements on phone (navbar 56 px + chip row 48 px) leave at least 60% of the viewport height for reading at 360x640. Anchored scrolls account for this with `scroll-margin-top` so a target is never hidden under the sticky bars.
- Landscape phones (height < 500): the chip row is not sticky, the navbar is not sticky, hero is compact (headline 32 px, no extra top spacing), so the list gets the full height.
- Safe areas: use `env(safe-area-inset-*)` padding on the navbar for notched phones; `100dvh` for full-height regions.
- Text stays at least 16 px for body, never below 12 px, and the user's browser text zoom up to 200% must not break layouts (no fixed heights on text containers).

### 7.3 Content safeguards at narrow widths

- No horizontal page scroll anywhere. The only horizontal scrollers are generic wide tables (inside a wrapper with an edge fade) and the ticker (masked).
- Long romaji (for example `Dōzo yoroshiku o-negai itashimasu`) wraps at hyphens or spaces and never overflows; words are never broken mid-letter except as a last resort with `overflow-wrap: anywhere` inside table cells.
- Thai text keeps line height >= 1.3 at every size so tone marks are never clipped.

### 7.4 Verification

The sizes in `TESTING.md` section 5 (360x640, 390x844, 768x1024, 1024x768, 1440x900, 844x390) are checked in every phase that touches layout, together with browser text zoom at 200%.

## 8. Brand mark

- **Mark**: an outlined speech bubble (the quizzes are spoken) with a coral dot at its lower right, on a 32 x 32 grid, 2 px `ink` stroke, round joins. Exact geometry drawn in Phase 3 and approved by the user.
- **Wordmark**: "Nihongo" in Space Grotesk, "Notes" in `muted`.
- Favicon: mark on a white rounded tile. PWA icons 192, 512 and maskable 512 (mark inside the 80% safe zone).
- Theme and background color: `canvas`.
- Never use Cohere, Anthropic or Claude marks or names.

## 9. Loading, empty and error states

- Content loads with a skeleton: three `soft-stone` bars with radius 8, `aria-busy`.
- Load error: message and "ลองอีกครั้ง" button (`button-primary`).
- Not found: centered message and a link back to the vocabulary page.

## 10. Accessibility

- Word lists are real tables (`<table>` with header cells, visually hidden on phones where rows stack) or `<dl>` pairs; decided in Phase 4, both keep romaji and meaning programmatically paired.
- Irregular marker has visually hidden text "อ่านไม่ปกติ".
- Set chips are a `radiogroup`-like toggle group with `aria-pressed`; the group is labelled with the prompt.
- Share dialog: `role="dialog"`, `aria-modal`, labelled by its title, focus trapped, Esc closes. The contents toggle has `aria-expanded` and a label that names the next action.
- Contents rail and chip row are `nav` landmarks labeled "สารบัญ"; the current item has `aria-current="true"`.
- Focus ring: 2 px `focus-blue` per DESIGN.
- Contrast: white on `deep-green` and `dark-navy` passes AA; coral is never used for body text on white.
- `muted` (#93939f) is only 2.9:1 and `slate` (#75758a) only 4.49:1 on white, both below AA. On light surfaces, secondary text and mono labels use `body-muted` (#616161, 6.2:1). `muted` is for text on dark surfaces (footer, console cards). Found by axe in Phase 3.

## 11. Definition of done for any page or component

1. Matches this spec and the tokens in `DESIGN-cohere.md` (unchanged).
2. Works and is comfortable at 360, 390, 768, 1024, 1440 widths and phone landscape (section 7).
3. Keyboard operable with visible focus.
4. Respects `prefers-reduced-motion`.
5. No horizontal page scroll, no clipped Thai marks, macrons render in the intended font.
6. Covered by the checks in `TESTING.md`.
