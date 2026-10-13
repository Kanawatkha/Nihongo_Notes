# AGENTS.md

Instructions for any AI coding agent working in this repository. Humans can read it too.

## Overview

Nihongo Notes is a static, frontend-only site with three pages: vocabulary (romaji + Thai meaning, grouped for memorizing), the oral exam guide, and a flash-card quiz built from the same data, for JN60101 Japanese for Communication 1. Content lives in Markdown. A Node build script turns it into typed data. A React app renders the data and ships as a PWA on GitHub Pages.

## Tech stack (pin exact versions in `package.json` at scaffold time)

Same base as the Digital Logic Notes project, minus everything math-related.

- Node.js 24 (see `.nvmrc`), npm with a committed `package-lock.json`
- Vite, React, TypeScript (strict), React Router (`HashRouter`)
- Tailwind CSS v4 with tokens in a CSS `@theme` block copied from `DESIGN-cohere.md`
- Motion for animation
- `vite-plugin-pwa` + `workbox-window` for offline and automatic updates
- Self-hosted open fonts via `@fontsource` packages (see `UI-SPEC.md` section 2): Space Grotesk, Inter, IBM Plex Sans Thai
- Vitest + Testing Library + jsdom, ESLint + Prettier, `axe-core` (dev) for accessibility checks
- No KaTeX, no SVG figure pipeline, no Markdown library in the browser
- No backend, database, analytics or external API

Anything not on this list needs the user's approval first.

## Commands (created in Phase 1)

```
npm ci                 # install exactly from the lockfile
npm run content        # Markdown -> generated data (scripts/build-content)
npm run dev            # content + Vite dev server
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test           # Vitest (includes content round-trip)
npm run build          # content + typecheck + Vite build into dist/
npm run preview        # serve dist/ locally with the real base path
```

Before reporting any task as done: `format:check`, `lint`, `typecheck`, `test` and `build` must pass.

## Repository layout (target, see ARCHITECTURE.md)

```
content/            Markdown source of truth (vocab/, exam/)
scripts/            build-content pipeline (Node, TypeScript)
src/                React app (app, pages, features, components, lib, styles)
public/             static files (icons)
tests/              content pipeline tests (parse, real content, snapshot)
.github/workflows/  CI and Pages deploy
```

## Code style

- TypeScript strict. No `any`; use `unknown` and narrow. `type` for data shapes.
- Function components and hooks only. One component per file, file name equals component name (`PascalCase.tsx`). Hooks `useX.ts`. Utilities `camelCase.ts`.
- Feature-first folders (`src/features/<feature>/`). Shared UI primitives in `src/components/ui/`.
- Import with the `@/` alias. No deep relative imports across features.
- Tailwind utility classes that reference design tokens. No inline hex or pixel literals that duplicate a token.
- Keep components presentational. Data shaping lives in `lib/` or the content pipeline.
- No dead code, no commented-out code, no `console.log` in committed code.
- Accessibility is part of done: semantic elements, labels, focus order, `aria-expanded` on disclosures, visible focus ring, `prefers-reduced-motion` respected.

## Content rules

- Edit content only in `content/**/*.md`. Never edit `src/content/generated/**` (git-ignored, rebuilt by `npm run content`).
- Follow `CONTENT-SCHEMA.md`.
- Romaji only, spelled as in the slides, including macrons (`ā ī ū ē ō`). Never add kana or kanji.
- Never invent a word, reading or meaning. Unclear items are asked, not guessed.

## Git and PR rules

- Small, focused commits. Conventional Commits (`feat:`, `fix:`, `docs:`, `content:`, `chore:`, `test:`, `refactor:`).
- Never commit `node_modules/`, `dist/`, generated data, or lecturer PDFs (the `docs/` folder outside this project stays out of the repo).
- Do not commit or push unless the user asks.

## Security and licensing

- No secrets. Nothing to authenticate against.
- Fonts are open licensed (SIL OFL) and self-hosted through `@fontsource`.
- Prefer well-maintained MIT/Apache/BSD packages. Ask before adding a dependency.

## Boundaries for agents

- Always: keep changes within the current phase of `PLAN.md`, update the relevant doc when behavior changes.
- Ask first: new dependencies, moving or deleting content, changing Markdown-to-data rules, anything needing a paid or external service, any vocabulary or meaning you are not sure about.
- Never: edit `DESIGN-cohere.md`, edit generated data by hand, hard-code content text in components, add Anthropic or Claude branding, push without being asked.
