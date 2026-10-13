# TESTING

What is checked, how, and when. Goal: wrong content or a broken layout never reaches GitHub Pages.

## 1. Required before reporting any task as done

```
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

All five must pass. CI runs the same list.

## 2. Test layers

| Layer | Tool | Runs | Fails the build |
|---|---|---|---|
| Content pipeline | Vitest + build-time validation | `npm run test`, `npm run build` | yes |
| Types, lint, format | `tsc`, ESLint, Prettier | locally and CI | yes |
| Components | Vitest + Testing Library (jsdom) | `npm run test` | yes |
| Accessibility | `axe-core` run in the Browser pane against `npm run preview` | per phase, before review | serious or critical findings block the phase |
| Responsive and motion | Browser pane at the sizes in section 5 | per phase, before review | issues block the phase |
| Offline and update | Real browser (the Browser pane blocks service workers) | Phase 7 and before launch | user check |

Playwright and Lighthouse CI are not planned (keep dependencies small). Add them only if the user asks.

## 3. Content pipeline checks

1. **Parse coverage.** Every registered file parses. Unknown constructs fail with file and line.
2. **Round trip.** Generated data converted back to normalized text equals the normalized Markdown. Normalization: collapse whitespace, drop `---` rules and front matter fences, un-escape `\*` and `\|`, drop bold markers that became `irregular` flags (and re-add them in the projection). Zero diff required. This guarantees the site shows exactly the Markdown wording.
3. **No kana or kanji.** Scan every string in the output.
4. **Romaji cells.** Contain a Latin letter; macrons are precomposed.
5. **Classification.** Fixture tests for each table kind (`vocab`, `pairs` with uneven halves, `readings`, `grid`, generic), dialogue detection, tips, and a skipped heading level error.
6. **Tree.** Ids unique; numbered headings keep their numbers; source order kept.
7. **Counts snapshot.** `report.txt` word and reading counts per file and section are a committed snapshot. Any change must be reviewed, not silently accepted.
8. **Front matter.** Unknown keys fail; exactly one default vocab set.

Constructs are tested with small inline Markdown sources in `tests/parse.test.ts`; `tests/content.test.ts` runs the real files.

## 4. Component tests

- `BlockRenderer`: one test per block type; an unknown type is a TypeScript error.
- Word rows: romaji and meaning are paired for assistive technology; irregular entries expose "อ่านไม่ปกติ".
- `SetSwitch`: reads and writes `?set=`, default is the `order: 1` file, `aria-pressed` correct.
- `ContentsRail` / chip row: lists every `##` and `###`, click scrolls to the target and sets `?g=`.
- Exam page: renders every pattern card and worked example from the fixture; archive disclosure toggles `aria-expanded`.
- Motion wrappers: with reduced motion mocked, components render final state with no transform.
- `UpdateHost`: shows the updated toast after an automatic reload, offline-ready toast once.
- Navbar: `aria-current` on the active link; both links stay visible and reachable at 360 px.
- Full render test: every block of all four content files renders, and every vocab romaji string from the Markdown appears in the DOM.

## 5. Browser checks (Browser pane, per phase)

Sizes: 360x640, 390x844, 768x1024, 1024x768, 1440x900, landscape 844x390.

1. Both pages and both vocab sets load without console errors.
2. `document.scrollingElement.scrollWidth <= innerWidth` on every page and set, also at 200% browser text zoom.
   Per-device layout from `UI-SPEC.md` section 7.1 matches (rail vs chip row, stacked vs two-column rows, card columns), anchored scrolls are not hidden under sticky bars, and tap targets are at least 44 px.
3. Thai tone marks are not clipped in headings; macron letters render in Space Grotesk / Inter (inspect computed font).
4. Keyboard walk: navbar, set chips, contents, exam cards, archive disclosure.
5. Reduced motion emulation: no transforms, ticker static.
6. axe: zero serious or critical violations on each page.

## 6. Offline and update test (real browser)

The Browser pane allows service workers, so the assistant runs this against `npm run preview` (done in Phase 7); the user repeats it on a real phone after the first deploy.

1. `npm run build` then `npm run preview`. Open the site, wait for "ใช้งานออฟไลน์ได้แล้ว".
2. DevTools, Network: Offline. Reload. Visit both pages and both sets.
3. Online again. Change one word in a fixture copy, rebuild, keep the tab open. Within the update interval (or on tab focus) the page reloads by itself at the same scroll position and shows "อัปเดตเป็นเวอร์ชันล่าสุดแล้ว".

## 7. Performance budgets

| Metric | Budget |
|---|---|
| JS + CSS per route, gzip | under 200 KB |
| LCP (mobile, 4G profile) | under 2.5 s |
| CLS | under 0.1 |
| Lighthouse mobile (run before launch with the CLI through `npx`, not a dependency) | Performance 90+, Accessibility 95+, Best Practices 95+ (measured: 93-94 / 100 / 100) |

Fonts are excluded from the JS + CSS budget but only used weights and subsets are imported, with `font-display: swap`.

## 8. Manual checks before release

- Compare both vocab sets with the Markdown preview in VS Code (spot check 10 words per part).
- View on a real phone, portrait and landscape.
- Install as PWA, go offline, open both pages.
- Read `report.txt` for warnings.
