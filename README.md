# Nihongo Notes

Vocabulary and oral-exam notes for course JN60101 Japanese for Communication 1 (chapters 1-4). A static, frontend-only site with three pages: a vocabulary page (romaji exactly as in the lecturer's slides, with Thai meanings, grouped for memorizing), an exam guide page, and a flash-card quiz in the shape of the oral exam. It works offline and updates itself.

Live site (after the first deploy): https://kanawatkha.github.io/Nihongo_Notes/

## What is in it

| Page | Route | Source Markdown |
|---|---|---|
| คำศัพท์ (Vocabulary) | `#/` (`?set=1-2` or `?set=3-4` chooses the set, nothing is open until then; `?g=2.2` opens a group) | `content/vocab/ch3-4.md`, `content/vocab/ch1-2.md` |
| แนวสอบ (Exam guide) | `#/exam` | `content/exam/quiz1-ch1-2.md`, `content/exam/quiz2-ch3-4.md` (`?set=1-2`, `?set=3-4`) |
| แบบทดสอบ (Flash-card quiz) | `#/quiz` (`?set=1-2` or `?set=3-4`, nothing is open until then; `?type=time` keeps one question kind) | the vocabulary file of the set, plus `src/config/quiz.ts` |

- Each vocabulary file is one list grouped by topic, not by lecturer chapter: for บท 3-4 the parts are `1. คำศัพท์ตามหมวด`, `2. เวลา`, `3. ตัวเลขและเงิน`, `4. รูปประโยคและบทสนทนา`; บท 1-2 has words, pronunciation and grammar.
- Word lists are tables with the header `โรมาจิ | ความหมาย`. A bold romaji cell marks an irregular reading (coral dot). `>` lines are memory tips.
- The quiz deals one card at a time: a Thai word to say in Japanese, or an exam question with a place, a time, a phone number, a price (up to 99,999) or a start-end time to answer aloud. The card turns over to show the answer, split into spoken chunks with the irregular readings marked. Words come from the vocabulary file; numbers are generated with the reading rules in `src/lib/readings.ts`, which a test checks against every reading table in the slides and against every worked answer in the exam guides.
- The exam guide turns the question-pattern table into cards that link to the matching vocabulary group (mapping: `PATTERN_LINKS` in `src/config/site.ts`).
- Offline: after the first visit every page works without a network. A new deployment is installed in the background; an open tab reloads itself, goes back to the same reading position and shows a short toast. No button to press.

## Editing content

All text lives in Markdown under `content/`. Never edit generated files. Rules: `CONTENT-SCHEMA.md`.

1. Edit a file in `content/vocab/` or `content/exam/`. Romaji only, spelled as in the slides, never kana or kanji. Never guess a reading or a meaning.
2. Check it:

   ```bash
   npm run content
   ```

   The build script fails on unknown Markdown, any kana or kanji, bad romaji characters, a heading level that is skipped, or text that does not round-trip back to the Markdown. It prints the word counts; `src/content/generated/report.txt` lists them per section for review.

3. Preview with `npm run dev`.
4. Commit and push to `main`. GitHub Actions checks, builds and publishes the site.

Adding chapters 5-6 later: add `content/vocab/ch5-6.md` and `content/exam/quiz3-ch5-6.md`, register them in `src/config/site.ts` and update `PATTERN_LINKS` (see `ARCHITECTURE.md` section 12).

## Commands

```bash
npm ci                 # install from the lockfile (Node 24, see .nvmrc)
npm run dev            # content + dev server
npm run content        # Markdown -> generated data
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run test           # Vitest, including the content round trip
npm run build          # content + typecheck + production build into dist/
npm run preview        # serve dist/ with the real base path (service worker works here)
```

Before reporting any change as done: `format:check`, `lint`, `typecheck`, `test` and `build` must all pass.

## How it is built

Markdown -> `scripts/build-content` -> JSON per file -> lazy chunks -> React renders typed blocks. The browser never parses Markdown. Stack: Vite, React, TypeScript (strict), Tailwind CSS v4, React Router (`HashRouter`), Motion, Vitest, vite-plugin-pwa. Design standard: `DESIGN-cohere.md` (fixed, never edited). See `ARCHITECTURE.md`.

## Quality (measured on the production build)

Lighthouse 13, mobile preset, local `npm run preview`:

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Vocabulary | 93 | 100 | 100 | 100 | 2.8 s | 0 |
| Exam guide | 94 | 100 | 100 | 100 | 2.8 s | 0 |

axe-core finds no violations. LCP is slightly above the 2.5 s goal in Lighthouse's throttled profile; the page chunk, manifest and content file already load in parallel and the remaining time is the 127 KB (gzip) main script. See `PLAN.md` Phase 8 for ideas if it needs to go lower.

## Deploy

GitHub Pages through `.github/workflows/deploy.yml`. In the repository settings, set Pages > Source to "GitHub Actions" once. Details in `DEPLOY.md`.

## Documents

`PRD.md` (goals), `PLAN.md` (phases), `ARCHITECTURE.md`, `CONTENT-SCHEMA.md`, `UI-SPEC.md`, `DESIGN-cohere.md` (design standard, fixed), `TESTING.md`, `DEPLOY.md`, `AGENTS.md` (rules for AI agents).

## Fonts and licenses

Space Grotesk, Inter and IBM Plex Sans Thai are open licensed (SIL Open Font License) and self-hosted through `@fontsource` packages. The logo is original. The design standard describes Cohere's public website style; no Cohere marks or assets are used.
