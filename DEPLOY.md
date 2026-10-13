# DEPLOY

How the site is built, hosted and updated. Everything runs on GitHub: no external service, no secrets.

## 1. Target (confirmed)

- Repository: `Kanawatkha/Nihongo_Notes` (public), remote `origin` = `https://github.com/Kanawatkha/Nihongo_Notes.git`, already added locally in `web/`. Nothing is pushed until the user says so.
- URL: `https://kanawatkha.github.io/Nihongo_Notes/`
- The repository root is this `web/` folder. The course folder around it (PDFs, study Markdown) is not pushed.
- Deployment: GitHub Actions publishes the Vite `dist/` folder as the Pages artifact. `dist/` is never committed.

## 2. One-time repository setup (user action)

1. Create the repository on GitHub.
2. Settings, Pages, Build and deployment, Source: **GitHub Actions**.
3. Default branch `main`.

## 3. Vite and router settings

| Setting | Value | Why |
|---|---|---|
| `base` | `'/Nihongo_Notes/'` for build and preview, `'/'` for dev | Pages serves under the repository name |
| Router | `HashRouter` | Deep links work without server rewrites |
| Asset URLs | Vite imports or `import.meta.env.BASE_URL` | No hard-coded absolute paths |

Keep the repository name in one constant read by `src/config/site.ts` and `vite.config.ts`.

## 4. Workflows

### `ci.yml` (push and pull request)

Checkout, `actions/setup-node` (version from `.nvmrc`, npm cache), `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

### `deploy.yml` (push to `main`, manual dispatch)

Same shape as the Digital Logic Notes project: build job (`npm ci`, `npm run build`, `actions/upload-pages-artifact` with `path: dist`) then deploy job (`actions/deploy-pages`), permissions `contents: read`, `pages: write`, `id-token: write`, concurrency group `pages`. Pin action versions to current stable majors at implementation time.

## 5. Build pipeline

`npm run build` = content generation and validation, type check, Vite build. Any failure (unknown Markdown, kana/kanji found, bad romaji, failed round trip, type error) stops the deploy. This is the safety net for "edit Markdown and push".

## 6. Offline and automatic updates

The user asked for updates that apply themselves, with no button to press.

- `vite-plugin-pwa`, `generateSW`, **`registerType: 'autoUpdate'`** (Workbox `skipWaiting` + `clientsClaim`).
- Precache the whole build: HTML, JS, CSS, generated content chunks, fonts, icons.
- `src/app/pwa/UpdateHost.tsx` registers the worker through `registerServiceWorker.ts` (the only file that imports `virtual:pwa-register`) and asks for a new version every 30 minutes, when the tab becomes visible again, and when the network returns. Checks are skipped while offline.
- When a new worker takes over (`onNeedReload`), the scroll position is saved in `sessionStorage` and the page reloads. After the reload the position is restored by polling every 50 ms for up to 2.5 s (timers, not animation frames: those stop in a background tab, where an update can happen) with `behavior: 'instant'` (the page CSS is smooth), then a toast "อัปเดตเป็นเวอร์ชันล่าสุดแล้ว" shows for 3.5 s. A saved position older than 60 s is ignored. Route and `?set=`/`?g=` survive the reload because they are in the URL.
- "ใช้งานออฟไลน์ได้แล้ว" shows once, the first time everything is cached.
- Icons (192, 512, maskable 512, Apple touch 180) are PNGs generated from the brand mark geometry in `UI-SPEC.md` section 8 on a white background; the maskable one keeps the mark inside the 80% safe zone.
- Manifest: `name` "Nihongo Notes", `short_name` "Nihongo", `display: standalone`, `start_url` and `scope` = base path, `theme_color` and `background_color` = `canvas` (#ffffff), icons 192, 512, maskable 512.
- `HashRouter` means only `index.html` is needed as the navigation fallback.
- Pages is HTTPS, which service workers require. Workbox removes outdated caches automatically.

Difference from Digital Logic Notes: that project used `registerType: 'prompt'` with a "โหลดใหม่" toast. Here the reload is automatic, and restoring the scroll position keeps it from interrupting study.

## 7. Editing workflow after launch

1. Edit Markdown in `content/`.
2. Optional: `npm run dev` to preview.
3. Commit and push to `main` (only when the user asks).
4. CI builds, validates and deploys. Open tabs update themselves.

## 8. Fonts and licensing

- Space Grotesk, Inter and the chosen Thai font are SIL OFL, self-hosted through `@fontsource` packages. No request leaves GitHub Pages.
- Import only used weights and subsets: Latin + Latin Extended for Space Grotesk and Inter (macrons), Thai + Latin for the Thai font.
- `font-display: swap`. Preload the two fonts used at first paint.

## 9. Rollback and troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| Blank page, 404 for JS/CSS | Wrong `base` | Check `vite.config.ts` and `site.ts` |
| Old content after deploy | Tab not yet checked for updates | Switch away and back to the tab, or wait for the interval |
| Deploy not triggered | Pages source not set to GitHub Actions | Fix in repository settings |
| CI-only failure | Node version or lockfile drift | `.nvmrc`, `npm ci`, commit the lockfile |

Rollback: revert the commit on `main` or re-run an earlier successful deploy.
