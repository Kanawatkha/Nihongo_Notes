# ARCHITECTURE

How the repository, the build pipeline and the app are organized. Target state; nothing here is built yet. Rules marked **MUST** are enforced by lint, tests or review.

## 1. Principles

1. **One source of truth.** Markdown in `content/`. Everything shown to students is generated from it.
2. **Data-driven UI.** Components render typed data. No course text is hard-coded in components.
3. **Feature-first.** Code that changes together lives together.
4. **Static and cheap.** Parsing and validation happen at build time. The browser only renders.
5. **Small.** Two pages, one content pipeline, no math or figure handling. Do not add machinery the content does not need.
6. **Flexible by data.** Adding chapters 5-6 later means adding Markdown files and one registry entry, not new components.

## 2. System overview

```
content/**/*.md  --(scripts/build-content)-->  src/content/generated/*.json + manifest.json + report.txt
                                                       |
                         React app (Vite) <------------+  lazy import per content file
                                   |
                            dist/  (static files + service worker)
                                   |
                            GitHub Pages  (deployed by GitHub Actions)
```

Build order is always: `content`, then `typecheck`, then `vite build`.

## 3. Target folder structure

This folder (`web/`) is the repository root.

```
web/
├─ AGENTS.md  CLAUDE.md  PRD.md  PLAN.md  ARCHITECTURE.md  CONTENT-SCHEMA.md
├─ UI-SPEC.md  TESTING.md  DEPLOY.md  DESIGN-cohere.md  README.md
├─ package.json  package-lock.json  tsconfig*.json  vite.config.ts
├─ eslint.config.js  .prettierrc  .prettierignore  .gitignore  .nvmrc
├─ .github/workflows/       ci.yml, deploy.yml
├─ content/                 SOURCE OF TRUTH (Markdown only)
│  ├─ vocab/                ch1-2.md, ch3-4.md, ch5-6.md
│  └─ exam/                 quiz1-ch1-2.md, quiz2-ch3-4.md
├─ scripts/build-content/   run.ts, index.ts, frontmatter.ts, parse.ts, classify.ts, tree.ts, validate.ts, project.ts, report.ts
├─ public/                  favicon.svg, PWA icons, robots.txt
├─ src/
│  ├─ main.tsx
│  ├─ app/                  App.tsx, layouts/AppLayout.tsx, pwa/ (UpdateHost, registerServiceWorker, readingPosition)
│  ├─ pages/                VocabPage, ExamPage, NotFoundPage
│  ├─ features/
│  │  ├─ vocab/             VocabView, Contents (ContentsRail, ContentsChips), contentsItems, RomajiTicker, tickerWords, useActiveSection, useRailOpen
│  │  ├─ exam/              ExamView, ScoreSplit, PatternBand, PracticeRows
│  │  └─ quiz/              QuizView, QuizCardView, quizCards (decks, card builders, dealer)
│  ├─ components/
│  │  ├─ ui/                Button, ButtonLink, Chip, SetSwitch, MonoLabel, Skeleton, Toast, Icon
│  │  ├─ content/           BlockRenderer, InlineContent, VocabRows, NumberGrid, PairTable, DataTable, TipCallout, Dialogue
│  │  ├─ motion/            Reveal, Stagger (wrappers that respect reduced motion)
│  │  └─ layout/            Navbar, ShareDialog, QrCode, Logo, PageContainer, PageHero
│  ├─ content/
│  │  ├─ types.ts           shared with scripts
│  │  ├─ loaders.ts         lazy loaders for generated JSON
│  │  └─ generated/         BUILD OUTPUT, git-ignored
│  ├─ hooks/                usePageTitle (more hooks only when a feature needs them; reduced motion comes from motion/react)
│  ├─ lib/                  cn, setParam, text helpers, readings (numbers, clock times, prices, phone numbers in romaji), qr
│  ├─ styles/               index.css (@theme tokens), fonts.css, content.css
│  └─ config/               site.ts (name, base path, nav items, content registry)
└─ tests/                   parse.test.ts, content.test.ts, __snapshots__/
```

Notes:
- The lecturer PDFs (`../docs/`) and the two study Markdown files at the course root are outside the repository.
- Planning documents stay at the repository root.

## 4. Data flow

1. `scripts/build-content` discovers every `content/vocab/*.md` and `content/exam/*.md`. A test checks that the registry in `src/config/site.ts` matches the files on disk.
2. For each file: read front matter, parse Markdown into blocks, classify tables (vocab, number grid, pair table, generic), build the heading tree, validate (romaji rules, no kana/kanji), and write:
   - `generated/manifest.json` (files, titles, heading index with ids, word counts)
   - `generated/vocab/<key>.json`, `generated/exam/<key>.json`
   - `generated/report.txt` (counts per file and section, warnings)
3. `src/content/loaders.ts` exposes `loadContent(collection, key)` using `import.meta.glob`, so each file is its own lazy chunk.
4. Pages call loaders, show a skeleton while loading, then pass typed data to features.
5. `BlockRenderer` maps `block.t` to a component with an exhaustive switch. A new block type that is not handled fails the type check.

## 5. Layering and import rules (MUST)

```
pages  ->  features  ->  components  ->  hooks / lib / content(types) / config
app    ->  pages, components, config
```

- `features/*` MUST NOT import other `features/*`.
- `components/*` MUST NOT import from `features/` or `pages/`.
- `scripts/*` MAY import `src/content/types.ts` only.
- `src/content/generated/*` is imported only by `src/content/loaders.ts`.
- Enforced with ESLint `no-restricted-imports`.

## 6. State

- Local component state only. No global store.
- Selected set and the target group live in the hash query: `#/?set=3-4&g=2.2` (vocabulary) and `#/exam?set=3-4` (exam). No `set` or an unknown one means nothing is shown yet. Links from the exam page to vocabulary tables use this. `lib/setParam.ts` maps a file key (`ch3-4`, `quiz2-ch3-4`) to the value (`3-4`).
- The share dialog is local state of the navbar.
- Stored in the browser: the service worker cache, a one-time scroll position used across an automatic update reload (`sessionStorage`, see `DEPLOY.md`), and whether the contents rail is open (`localStorage` key `nihongo-contents-open`, optional, the page works without it).

## 7. Routing

- `HashRouter` (GitHub Pages cannot rewrite deep links).
- Routes: `/` (vocabulary), `/exam`, `/quiz` (flash cards, `?set=` and `?type=`), `*`.
- Pages are code-split with `React.lazy`.

## 8. Styling and tokens

- Tailwind v4 CSS-first config. Colors, radii, spacing and type scale are defined once in `src/styles/index.css` under `@theme`, copied verbatim from `DESIGN-cohere.md`.
- Thai and macron handling are implementation rules on top of the tokens (see `UI-SPEC.md` section 2); they never change the tokens.
- No raw hex in TSX.

## 9. Motion

- Motion (`motion/react`) for enter, layout (sliding indicators) and stagger animations.
- All animated components go through `components/motion/` wrappers, which render static output when `prefers-reduced-motion: reduce` is set.
- Only `transform` and `opacity` are animated. Scroll-linked effects use `IntersectionObserver`, not scroll listeners.

## 10. Offline and updates

- `vite-plugin-pwa`, `generateSW`, `registerType: 'autoUpdate'`. Details in `DEPLOY.md` section 6.

## 11. Naming and conventions

| Thing | Convention |
|---|---|
| Components | `PascalCase.tsx`, named export, default export only for lazy pages |
| Hooks | `useThing.ts` |
| Utilities | `camelCase.ts` |
| Types | `PascalCase`, no `I` prefix |
| Content keys | file name without extension (`ch3-4`, `quiz2-ch3-4`) |
| Node ids | `<collection>/<key>/<number or position>` |
| Tests | `thing.test.ts(x)` next to the code, `tests/` for cross-cutting |
| Commits | Conventional Commits |

## 12. Extension points

| Want to add | Do this |
|---|---|
| Exam guide for chapters 5-6 | Add `content/exam/quiz3-ch5-6.md` and register it in `EXAM_FILES` in `config/site.ts`; the exam page gains a chip automatically. The vocabulary (`ch5-6.md`) and the quiz are already there |
| A new Markdown construct | Extend `parse.ts`/`classify.ts` and `types.ts`, add a block component and tests, document it in `CONTENT-SCHEMA.md` |
| Quiz for chapters 5-6 | Add an entry to `QUIZ_SETS` in `config/quiz.ts` (kinds, section numbers, question sentences copied from the slides); `lib/readings56.ts` holds the readings that the chapter 5-6 cards generate (counters, months, days, weekdays, years, verb forms); `tests/readings56.test.ts` checks every one against the tables of `ch5-6.md`; `tests/quiz.test.ts` checks that every question appears in the slides |
| A design token | Not allowed. `DESIGN-cohere.md` is fixed |
