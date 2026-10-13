# PLAN: Delivery plan

Phases run in order. Each phase ends with exit criteria and a **gate**: the user reviews and says "go" before the next phase starts. Nothing below has started.

Legend: `[ ]` todo, `[x]` done. "Ask" means stop and ask the user first.

## Phase 0 - Planning documents  (current)

- [x] Reference project studied (Digital Logic Notes): docs structure, pipeline, PWA, CI kept; math, SVG and diagram parts dropped
- [x] `DESIGN-cohere.md` adopted as the design standard, unchanged
- [x] Plan documents written: `CLAUDE.md`, `AGENTS.md`, `PRD.md`, `PLAN.md`, `ARCHITECTURE.md`, `CONTENT-SCHEMA.md`, `UI-SPEC.md`, `TESTING.md`, `DEPLOY.md`, `README.md`
- [ ] User reviews the documents
- [x] Decided by the user: Thai font IBM Plex Sans Thai; repository `Kanawatkha/Nihongo_Notes` (git initialized in `web/` with `origin` set, nothing pushed); table headers normalized to `โรมาจิ | ความหมาย` (approved); no announcement bar; responsive design for desktop, tablet and phone is a hard requirement (`UI-SPEC.md` section 7)
- [x] Decided by the assistant, change on request: phone navigation keeps both links visible (no hamburger)
- [x] Decided by the user: split into four content files (done, see Phase 2); "ไม่มีสอบซ่อม" is not added anywhere
- [ ] Still open: whether the two original study files at the course root are kept after review or removed
- Gate

## Phase 1 - Scaffold  (done, awaiting user review)

Goal: an empty app that builds, lints, tests and can deploy.

- [x] `git init -b main` inside `web/` with `origin` set to the GitHub repository (done in Phase 0)
- [x] `.gitignore` (node_modules, dist, generated data, coverage)
- [x] Vite + React + TypeScript strict, Tailwind v4, ESLint with layer import rules (also blocks React imports from `scripts/`), Prettier, Vitest + Testing Library + jsdom, `@/` alias, `.nvmrc` 24. Exact versions pinned. Installed now: react, react-dom, react-router-dom and the dev tooling; fonts, Motion and PWA packages are added in their own phases
- [x] `src/config/site.ts` with name, base path, nav items, content registry
- [x] `HashRouter`, placeholder `VocabPage`, `ExamPage`, `NotFoundPage` (3 route tests)
- [x] Scripts from `AGENTS.md`
- [x] `.github/workflows/ci.yml` and `deploy.yml` per `DEPLOY.md` (both run `format:check`, `lint`, `typecheck`, `test`, `build`)
- [x] Dependencies: only the ones already listed in `AGENTS.md`, nothing new
- Exit: `format:check`, `lint`, `typecheck`, `test`, `build` green locally (done)
- Gate

## Phase 2 - Content migration and pipeline  (done, awaiting user review of the report)

Goal: Markdown to typed, validated, tested data.

- [x] Split the study files into `content/vocab/ch1-2.md`, `ch3-4.md`, `content/exam/quiz1-ch1-2.md`, `quiz2-ch3-4.md` with front matter and demoted headings. Wording unchanged except: one table header normalized to `โรมาจิ | ความหมาย` (ch1-2 section 2.8), the heading `2.7` renamed to "คำถามจากรูป (แนวข้อสอบที่ 1)", blockquote intro lines replaced by front matter. Checked: no kana/kanji, NFC, no combining marks
- [x] `scripts/build-content`: front matter, parser, table classification, tree, validation (no kana/kanji, romaji rules), round trip, manifest, report
- [x] Types in `src/content/types.ts`, loaders in `src/content/loaders.ts`
- [x] Tests per construct (20 tests in `tests/parse.test.ts`), real-content tests with round trip on all four files and a counts snapshot (`tests/content.test.ts`); 29 tests green
- [ ] User reviews `src/content/generated/report.txt` (word counts per section) against the Markdown. Totals: 175 words, 116 readings (ch1-2: 111 / 10, ch3-4: 64 / 106). The word count matches an independent count of `โรมาจิ | ความหมาย` rows
- Exit: all four files convert with 0 errors and 0 warnings; tests green (done)
- Gate

## Phase 3 - Design system and app shell  (done, awaiting user review)

- [x] `@theme` tokens copied from `DESIGN-cohere.md` (colors, radii, spacing, breakpoints, font families) and the type scale as `type-*` classes with phone/tablet/desktop sizes
- [x] Fonts: Space Grotesk and Inter (latin + latin-ext, self-hosted woff2), IBM Plex Sans Thai (Thai subset, 400 and 500); Thai line-height 1.35 and no tracking via `:lang(th)`; romaji marked `lang="ja-Latn"`
- [x] Brand mark (speech bubble with coral dot), wordmark, `public/favicon.svg`. **Waiting for the user to approve the mark**
- [x] Navbar (sliding underline, two visible tabs on phone, static on short landscape screens), footer (course name and build date; offline status comes in Phase 7), `Toast` component (mounted in Phase 7 by `UpdateHost`), skip link, focus moves to main on navigation
- [x] UI primitives: Button, ButtonLink, Chip, MonoLabel, Disclosure, Skeleton, Toast, Icon (chevron); motion wrappers `Reveal`, `Stagger`; app wrapped in `MotionConfig reducedMotion="user"`
- [x] Browser check at 1440, 768, 390, 360 and landscape 844x390: no horizontal scroll, header 64 px (phone 56 px), 44 px tap targets, h1 96/64/48 px, axe: 0 violations on all 3 routes (after fixing a contrast problem, see UI-SPEC section 10). Not done: 200% text zoom (the pane cannot set it) and reduced-motion emulation (covered by unit tests)
- Exit: shell works at desktop, tablet and phone; all checks green (done). 40 tests
- Gate (user reviews look and feel)

## Phase 4 - Vocabulary page  (done, awaiting user review)

- [x] Hero with counts (from the manifest), set switch (`?set=`, sliding coral fill), romaji ticker (CSS marquee, static when reduced motion)
- [x] Block renderer (`components/content/`, exhaustive switch): word rows as description lists, readings, pairs, number tiles, tips, generic table (scroll area focusable only while overflowing), dialogue console, paragraph, list
- [x] Chapter bands (alternating deep green / dark navy, count-up), section and group headings with counts
- [x] Contents rail (desktop) and sticky chip row (below 1024 px; static on short landscape screens) with scroll spy (IntersectionObserver) and `?g=` (set on click, honored on load)
- [x] Tests: block renderer, `NodeView` on all four real files (every word, reading and cell appears), `VocabPage` (set switch, URL, counts, contents, `?g=`), text helpers, contents and ticker data
- Exit: both sets render completely; no horizontal scroll at 1440, 768, 390, 360 and landscape; axe 0 violations (done)
- Gate

## Phase 5 - Exam guide page  (done, awaiting user review)

- [x] Hero and facts line, score split cards
- [x] Pattern band with Q1-Q5 console cards, fill-in chips, "ดูตาราง" links into the vocabulary page (mapping in `config/site.ts`, `PATTERN_LINKS`)
- [x] Worked examples rows (question / prompt / answer, stacked on a phone)
- [x] Quiz 1 archive disclosure (self-introduction, picture questions), collapsed by default
- [x] Tests (`ExamPage.test.tsx`: facts, score parts, five patterns and links, fill-in chips, worked examples, archive toggle)
- Exit: every pattern and example from the Markdown is on the page (done)
- Gate

## Phase 6 - Motion and polish  (done, awaiting user review)

- [x] Motion pass per `UI-SPEC.md` section 6 (hero words, set chip fill, rail bar, navbar underline, chapter band + count-up, row/tile stagger, pattern cards, disclosure, toast). Fixes found while checking: restoring a position must jump (`behavior: 'instant'`) because the page CSS is `scroll-behavior: smooth`; route changes now jump to the top the same way
- [x] Reduced motion: unit tests for `Reveal`, `Stagger`, `Disclosure`, toast; the whole app sits in `MotionConfig reducedMotion="user"`; ticker and smooth scroll are disabled in CSS. Not verified in a real browser (the Browser pane cannot emulate the setting)
- [x] axe: 0 violations on both pages and both sets at 1440, 768, 390 and landscape (checked while the page was really painted: the hidden pane delays Motion's in-view reveals and ResizeObserver, which gave false contrast results). Keyboard walk (Tab): skip link, logo, nav, set chips, contents chips in a sensible order; focus ring settles to 2 px `focus-blue`
- [x] Performance: pages are lazy chunks; first-load JS about 140 KB gzip plus CSS 6.6 KB (budget 200 KB). CLS was 0.206 (footer jumped when the content replaced the skeleton, navbar moved when the scrollbar appeared); fixed with a one-screen skeleton and `scrollbar-gutter: stable`, now 0. LCP could not be measured (hidden pane); Lighthouse comes in Phase 8. Three fonts are preloaded at first paint
- Gate

## Phase 7 - Offline and automatic updates  (done, awaiting user review)

- [x] `vite-plugin-pwa` 2.0.0 + `workbox-window` (from the approved list), `autoUpdate`, manifest (Nihongo Notes / Nihongo, standalone, white theme, scope and start URL = base path), icons 192, 512, maskable 512 and Apple touch icon generated from the mark geometry. Precache: 30 entries, about 754 KiB
- [x] `UpdateHost`: checks every 30 min and on tab focus or network return, reloads itself when a new version takes over, restores the reading position (timer polling, not animation frames), shows "อัปเดตเป็นเวอร์ชันล่าสุดแล้ว" and "ใช้งานออฟไลน์ได้แล้ว"; footer shows "ใช้งานออฟไลน์ได้"; 15 unit tests
- [x] Offline and update tested by the assistant in the Browser pane against `npm run preview` (the pane does allow service workers): registered, cache filled, server stopped -> both pages and both sets still load; a changed build reached an open tab by itself (reload, same route and scroll position, toast). Temporary content change was reverted
- [ ] User: repeat the offline test on a real phone after the first deploy (`TESTING.md` section 6)
- Gate

## Phase 8 - Launch  (prepared, waiting for the user)

- [x] README final. Lighthouse 13 (CLI through `npx`, not a dependency; Chrome headless, mobile preset) against `npm run preview`: vocabulary 93 / 100 / 100 / 100 (performance / accessibility / best practices / SEO), exam 94 / 100 / 100 / 100, CLS 0, FCP 1.9 s, TBT 30-170 ms
- [x] Performance fix from the audit: `prefetchForRoute` (called in `main.tsx`) starts loading the manifest and the content file at once, so the loading chain is flat (page chunk, manifest and content fetched in parallel)
- [ ] Known: LCP is 2.8 s in Lighthouse's throttled profile (goal 2.5 s). What is left is the main script (127 KB gzip: React, router, Motion) and style/layout of about 200 rows. Tried and dropped: `content-visibility: auto` on sections (no gain, and it risks `?g=` and scroll restore). Not tried: loading Motion's feature set lazily (`LazyMotion`), about 25 KB gzip, would need every `motion.*` to become `m.*`; worth it only if the LCP goal matters more than the current 93-94 scores
- [ ] User: commit and push (only when the user asks), then set Pages source to GitHub Actions: steps are in the final report of round 5 and in `DEPLOY.md` section 2
- [ ] Live URL check, offline check on a phone (`TESTING.md` section 6)
- [ ] Tag `v1.0.0` after approval

## Later (not planned)

- Self-test modes (hide meaning or romaji, flashcards)
- Chapters 5-6 for quiz 3 (content only, see `ARCHITECTURE.md` section 12)

## Change after Phase 8 - vocabulary merged by topic (13 Oct 2026)

Requested by the user: the vocabulary of a set is one list grouped by topic, not split by lecturer chapter.

- [x] `content/vocab/ch3-4.md`: chapters 3 and 4 merged into parts `1. คำศัพท์ตามหมวด` (places, activities and people, things and devices, questions and pointing words, common expressions incl. `mo`), `2. เวลา`, `3. ตัวเลขและเงิน`, `4. รูปประโยคและบทสนทนา`. Every row moved unchanged (64 words and 106 readings before and after; the round trip passed)
- [x] `content/vocab/ch1-2.md`: parts `1. คำศัพท์ตามหมวด` (the former categories, plus the name endings and the yes/no words moved in as sub-groups), `2. การออกเสียง`, `3. ไวยากรณ์และรูปประโยค` (111 words, 10 readings, unchanged). The two `5.1`/`5.2` cells became `แบบ 1`/`แบบ 2`
- [x] Web: bands are now parts (`PART 01`...), `ChapterBand` became `PartBand`, `chapterParts` became `partParts`, contents rail and chips list parts and sections, `PATTERN_LINKS` now point to 1.1 (places), 2.2 (time), 3.1 (numbers 1-100), 3.2 (hundreds to millions)
- [x] Tests: 90 (two new: no heading splits words by chapter; every exam link targets an existing group)
- [x] The study copies at the course root (`ch1-2-vocab.md`, `ch3-4-vocab.md`) were regenerated from the web content (exam parts included)

## Change after Phase 8 - share button, empty start, collapsible contents (13 Oct 2026)

Requested by the user after seeing the Digital Logic Notes site.

- [x] Header: the course code is gone; a coral share button at the right end opens the same blurred share card with QR and copy field (`ShareDialog`, `QrCode`, `lib/qr.ts`, `useFocusTrap`, `useLockBodyScroll`, copied from the Digital Logic project). `Icon` gained share, copy, check, close and panel icons
- [x] Vocabulary and exam pages start empty until a set chip is pressed (no `?set=` default). Chips are ordered by front matter `order` (บท 1-2, then บท 3-4; quiz 1, then quiz 2), so a new chapter or exam is one more Markdown file plus one registry entry. `archived` and the archive disclosure were removed (`Disclosure`, `ArchivePanel`); each quiz is now its own set. Every content file needs `label` and `order`
- [x] Exam page: chips from the manifest, hero from the manifest title and facts, the chosen quiz loaded on demand. `prefetchForRoute` loads the manifest, and the content file only when `?set=` names one
- [x] Contents rail: toggle button, animated close (column 240 -> 44 px, list fades out, content widens into the space) and open (rows stagger in), state remembered, active entry kept visible inside the rail while the page scrolls
- [x] Tests: 108 (empty states, chip order, share dialog, QR structure, rail toggle, registry order)

- [x] Footer removed (user request, 13 Oct 2026): `Footer`, its test, the build date define and the offline status line are gone; the offline-ready toast stays

## Working agreements

- One phase at a time. Report after each checklist group, then wait.
- Missing decision: ask. Never guess on scope, dependencies, vocabulary, meanings, or anything that costs money.
- Keep docs current. If behavior changes, update the matching document in the same change.
- Never commit or push unless the user asks.
