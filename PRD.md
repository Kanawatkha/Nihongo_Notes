# PRD: Nihongo Notes

Product requirements for the vocabulary study website. Status: planned, not built.

## 1. Purpose

Give one student a fast, beautiful place to memorize JN60101 vocabulary and review how the oral quizzes work. The quizzes ask Thai -> Japanese words and short spoken answers, so the site is built around scanning and memorizing word lists, not reading long prose.

## 2. Users and context

- **Primary user:** the author, a Thai student, studying on phone, tablet and laptop, often right before an exam, sometimes offline.
- **Secondary:** classmates who get the link. The repository is public.
- Content language: romaji (Japanese) + Thai. Documents and code: English.

## 3. Goals

1. Find any word of chapters 1-6 within two taps or one scroll.
2. Groups are short and visually separated so each can be memorized in one sitting.
3. Exam patterns (question -> answer template -> example) are visible at a glance.
4. Read comfortably on a 360 px phone and on a desktop.
5. Work offline after the first visit and update to new versions automatically, with no button to press.
6. Look polished and calm with tasteful motion, following `DESIGN-cohere.md`.
7. Content changes are cheap: edit Markdown, push, site updates.

## 4. Non-goals

- No exercises, quizzes, flashcards or answer toggles in this version (possible later, see section 10).
- No kana or kanji. Romaji only.
- No backend, accounts, analytics, progress tracking or user data.
- No dark theme (light canvas with dark feature bands, as the design standard does).
- No in-browser Markdown parsing, no editing UI.

## 5. Information architecture

Two pages, client-side routes (`HashRouter`):

| Page | Route | Source content |
|---|---|---|
| คำศัพท์ (Vocabulary) | `#/` with set switch `?set=1-2`, `?set=3-4` or `?set=5-6` (nothing is open until one is chosen) | `content/vocab/ch1-2.md`, `content/vocab/ch3-4.md`, `content/vocab/ch5-6.md` |
| แนวสอบ (Exam guide) | `#/exam` with set switch `?set=1-2` or `?set=3-4` (nothing is open until one is chosen) | `content/exam/quiz1-ch1-2.md`, `quiz2-ch3-4.md`, `quiz3-ch5-6.md`, `final-ch1-6.md` |

| แบบทดสอบ (Flash-card quiz) | `#/quiz` (`?set=1-2` or `?set=3-4`, nothing is open until then; `?type=time` keeps one question kind) | the vocabulary file of the set, plus `src/config/quiz.ts` |

Plus a not-found route. Navigation: top navbar with three links.

## 6. Features

### F1 Vocabulary page
All words of the selected set as one list grouped by topic (places, things, questions, expressions, time, numbers, money, sentences), not split by chapter; the Markdown parts, sections and sub-groups give the order. Each word shows romaji (large) and Thai meaning. Number tables (1-10, hours, minutes, hundreds, thousands) render as tile grids. Irregular readings (bold in Markdown) get an accent marker. Memory tips (`>` lines) render as small callouts. A contents rail (desktop) or chip row (phone) jumps between groups and follows the page while it scrolls. On desktop the rail has a toggle that closes it with an animation; the content then widens into the freed space (the choice is remembered).

### F2 Set switch
Large chips, in order "บท 1-2" then "บท 3-4", choose what to show. Both pages start empty (a title and the prompt to choose) until a chip is pressed, so later chapters and exams are added by one more Markdown file. The choice is kept in the URL.

### F3 Exam guide page
Exam facts (date, score split, time per person), the question patterns with answer templates and examples, the worked examples from the lecturer's guide, and the reference tables needed to answer (time, phone, price). Each quiz (1: chapters 1-2, 2: chapters 3-4) is its own set chip with its own facts, patterns and examples.

### F2b Share
A coral button at the right end of the header opens a card with a QR code and the site link (copy button), over a blurred page. Same behavior as the Digital Logic Notes site.

### F5 Flash-card quiz (แบบทดสอบ)
Choose a set: บท 1-2, บท 3-4, บท 5-6 (the three exams) or ปลายภาค (บท 1-6, the final speaking test); empty until chosen. Each set mirrors its exam guide: the parts of the exam as chips with their points (exam 1: แนะนำตัว 5, คำศัพท์ 5, ตอบคำถามจากรูป 5; exams 2 and 3: คำศัพท์ 5, ตอบคำถาม 10; final: สอบพูด 15), and for a part with several patterns one chip per question pattern that is asked in the exam (exam 1: 5, exam 2: 5, exam 3: 6, final: 10). Without a choice the random mix follows the exam: each part by its points, each pattern by how many questions it has (exam 3: two each for the country, color/size, order and picture-date questions, one each for birthday and today). Patterns of exam 3: `Kore wa doko no tokei desuka?` (item + flag), `Kore wa nan desuka?` (color or size + noun), `Irasshaimase!` (`Sono [noun] o [number] kudasai`, counters 1-10), `Kore wa nan gatsu nan nichi desuka?` (a date in the picture, month before day), `O tanjōbi wa ...` (own birthday: the card shows the form with a sample date) and `Kyō wa ...` (the date of the device today). The card turns over (3D flip) to show the answer sentence, the spoken chunks with the number each stands for (irregular readings in coral) and a reminder from the exam guide. A dice button deals a new card; after looking at the answer the student marks "ตอบได้" or "ยังไม่ได้" (a word not known yet returns a few cards later). Only words and readings from the slides are used; generated readings are checked against the slide tables by tests. The listening part of the final exam is not a card (it is done in e-learning). Two options are kept on the device of each student (`localStorage`, so each person and device has its own): for the `วันนี้` pattern a switch "สุ่มวัน" (off: the date of the device; on: a random day to practise with), and for the `วันเกิด` pattern a day and a month for the own birthday, which the card then uses.

### F4 Motion
Restrained, meaningful animation: hero text reveal, rows fading up as they enter, sliding active indicator on chips and the contents rail, a slow romaji ticker strip, pattern cards that reveal question then answer. All of it disabled under `prefers-reduced-motion`. Details in `UI-SPEC.md` section 6.

### F5 Responsive layout
Desktop, tablet and phone (portrait and landscape) are equally important. Mobile-first design with defined per-device layouts, 44 px touch targets and safe areas. See `UI-SPEC.md` section 7.

### F6 Offline and auto-update
After the first load everything works with no network. A new deployment is installed and applied automatically (no prompt). See `DEPLOY.md` section 6.

### F7 Brand
Name "Nihongo Notes". Original mark (see `UI-SPEC.md` section 8). No Cohere, Anthropic or Claude marks.

## 7. Content requirements

- Markdown is the single source of truth. Romaji and Thai are preserved character for character.
- Romaji spelled as in the slides. Unknown meanings are asked, never guessed.
- Structure rules in `CONTENT-SCHEMA.md`.

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Under 200 KB gzip JS+CSS per route (fonts excluded); LCP under 2.5 s on a mid-range phone over 4G; CLS under 0.1 (measured in Phase 8: about 135 KB JS+CSS gzip, CLS 0, LCP 2.8 s in Lighthouse's throttled mobile profile, so the LCP goal is slightly missed there; Lighthouse performance 93-94) |
| Accessibility | WCAG 2.2 AA contrast, full keyboard use, visible focus, correct heading order, reduced motion honored |
| Compatibility | Last 2 versions of Chrome, Safari, Firefox, Edge; iOS Safari 16+ |
| Correctness | Build fails on unknown Markdown constructs, any kana/kanji, bad romaji characters, or a failed round-trip |
| Hosting | GitHub Pages only, deployed by GitHub Actions |

## 9. Acceptance criteria

1. Both content sets and both exam files convert without error; the round-trip test passes.
2. Every word in `ch1-2` and `ch3-4` appears on the vocabulary page (count matches the build report).
3. The exam page shows all five question patterns and all worked examples from the Markdown.
4. Layouts verified at 360x640, 390x844, 768x1024, 1024x768, 1440x900 and 844x390 with no horizontal page scroll.
5. Offline: load once, go offline, reload, both pages and both sets work.
6. A new deploy reaches an open tab without any user action.
7. Lighthouse mobile: Performance 90+, Accessibility 95+, Best Practices 95+.

## 10. Later (not in this version)

- Hide-meaning mode (cover Thai or romaji to self-test). Flash cards are done (F5).
- Listening practice for the final exam (the listening test is done in e-learning, not on this site).

## 11. Risks and open items

| Item | Handling |
|---|---|
| Thai font (DESIGN-cohere has none) | Decided: IBM Plex Sans Thai, see `UI-SPEC.md` section 2 |
| Macron glyphs (ā ī ū ē ō) must render in the display and body fonts | Load the `latin-ext` subsets; visual check in Phase 3 |
| Quiz 2 is on 14 Oct 2026, likely before the site ships | The Markdown files remain the study copy; the site serves later review and quiz 3 |
| Repository | Decided: `Kanawatkha/Nihongo_Notes`, see `DEPLOY.md` section 1 |
