
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal portfolio site for Eshani Somwanshi (product/UX designer), built as a single-page React app (`frontend/`) with a small FastAPI backend (`backend/`) for a contact form. Originally scaffolded by emergent.sh; the scaffold's unused kit (shadcn/Radix components, data-fetching libs, emergent tracking/visual-edits) has since been stripped out.

## Commands

All frontend commands run from `frontend/`; backend commands from `backend/`.

```bash
# Frontend (CRA via craco)
cd frontend
npm start          # dev server, http://localhost:3000
npm run build      # production build -> frontend/build
npm test           # craco test (Jest/RTL), interactive watch mode

# Backend (FastAPI)
cd backend
pip install -r requirements.txt
uvicorn server:app --reload   # dev server (needs .env — see below)
pytest                        # runs with -n 2 --dist loadscope (fixed in pytest.ini — don't change addopts)
pytest path/to/test.py::TestClass::test_name   # single test
pytest -n 0 path/to/test.py                    # run serially instead of parallel
```

There are currently no test files under `tests/` (just `__init__.py`) and no test files under `frontend/src`.

### Backend environment

`backend/server.py` loads `backend/.env` (gitignored) and requires:
- `MONGO_URL`, `DB_NAME` — MongoDB connection (via Motor)
- `CORS_ORIGINS` — comma-separated allowed origins (defaults to `*`)
- `RESEND_API_KEY` (optional) — if set, `/api/messages` also emails the submission via Resend; `SENDER_EMAIL` / `CONTACT_INBOX` override the from/to addresses.

Frontend reads `REACT_APP_BACKEND_URL` to know where the API lives (`frontend/src/App.js` → `API_BASE`); all API calls are prefixed with `/api`.

## Architecture

### Frontend structure

- **`src/index.js`** — entry point. Sets up `react-router-dom` with two routes: `/` → `App` (the single-page portfolio) and `/work/:slug` → `CaseStudyPage` (full case study reader). Wraps everything in `SmoothScrollProvider` (Lenis, skipped under reduced-motion) and `ReadModeProvider` (`components/site/ReadMode`); renders Vercel `<Analytics />`.
- **`src/App.js`** — the entire one-page portfolio (header, hero, proof strip, project sections, chaptered case study, capabilities, experience accordion, about, resume, contact form) lives in this one file, ~1000 lines. Content data (proof stats, capabilities, experience, tools, testimonial, nav items) is defined as arrays/objects at the top of the file — **edit content there, not by hunting for it elsewhere**. Several `TODO(Eshani)` comments mark placeholder content (testimonial quote, work-authorization line) that needs a real value before shipping.
- **`src/primitives.js`** — shared animation/UI primitives used throughout `App.js` and `CaseStudyPage.js`: `Reveal` (scroll-triggered fade/rise), `SplitText` (word-by-word headline reveal), `Wipe` (clip-path image reveal), `CountUp`, `Magnetic` (cursor-follow hover), `ThemeSwitch`/`useTheme`, and the `IMG()` helper that resolves `public/images/<name>`. `THEMES` here is the source of truth for the three color themes (paper/carbon/petrol) — theme id is written to `document.documentElement.dataset.theme` and persisted to `localStorage`.
- **`src/caseStudies.js`** — data-only array of case study objects (chapters, metrics, tags, images) consumed by `CaseStudyPage.js`. Adding a new case study means adding an entry here plus a matching link/slug in `App.js`.
- **`src/CaseStudyPage.js`** — renders one case study from `caseStudies.js` by `:slug` route param.
- **`components/devices/RotateCard.jsx`** — the one surviving device-frame component: a screenshot that swings in from an angle and locks flat on scroll. Used inside case-study art.
- **`components/site/`** — page-level chrome: `Preloader` (boot animation), `ReadMode` (a reading-mode context/provider used by case study pages), `BeforeAfter` (before/after image comparison slider), `CaseStudyTOC` (sticky TOC + scrollspy).
- **`components/ui/`** — just `AvatarHero.jsx` + `InteractiveAvatar.jsx` (the hero avatar). The rest of the scaffold's shadcn/Radix kit was unused and has been removed.
- **`constants/testIds/`** — central registry of `data-testid` values, re-exported from `constants/testIds/index.js`. These IDs are consumed by an external QA/testing agent to drive automated UI tests — **when adding interactive UI, add a `data-testid`** following the existing per-feature file pattern (`auth.js`, `home.js`, …), and re-export new files from `index.js`.
- **`lib/smoothScroll.js`** — the Lenis context (`LenisContext` / `useLenis`), shared between `index.js` (creates the instance) and consumers that trigger programmatic scrolls.
- Path alias `@/*` → `src/*` is configured in both `jsconfig.json` and webpack (`craco.config.js`).

### Dependencies

Kept deliberately small: `framer-motion` (all animation), `lenis` (smooth scroll), `lucide-react` (icons), `sonner` (contact-form toasts), `react-router-dom`, `@vercel/analytics`. Don't re-introduce a UI-component library, a data-fetching library (the contact form uses `fetch`), or `clsx`/`tailwind-merge` — the shadcn scaffold that pulled those in is gone. `npm install` needs `legacy-peer-deps=true` (in `.npmrc`) because of React 19 + CRA 5.

### Styling

Tailwind (`tailwind.config.js`) + hand-written CSS alongside components (`App.css`, `index.css`, `devices.css`, `beforeafter.css`, `preloader.css`, `readmode.css`). `design-system.html` at the repo root documents the design system: the nine-step type scale (each specimen set at its real pixel size), all three color themes (paper/carbon/petrol) with every token and hex, the four breakpoint tiers, and the layout/motion tokens — consult it before changing global visual style rather than reverse-engineering values from CSS.

`App.css` is still the source of truth; `design-system.html` is written from it, so when you change a token, update the guide in the same commit. It replaced `design_guidelines.json`, which had drifted badly — it still named Outfit and Manrope as the type faces long after Bricolage Grotesque replaced both, and its hex values were wrong. One document, not two that can disagree.

#### Type scale — root is 12px, not the browser default 16px

`App.css` sets `html { font-size: 75%; }`, making **`1rem` equal 12px everywhere on this site** (75% of the user's own browser default, so it still respects a changed default font-size setting rather than hard-coding 12px). This means [typescale.com](https://typescale.com)'s own rem output — base 12, 1.125 (major second) ratio — can be pasted in **verbatim**, with no recalculation:

| step | rem | px |
|---|---|---|
| h1 | 2.027rem | 24.33px |
| h2 | 1.802rem | 21.62px |
| h3 | 1.602rem | 19.22px |
| h4 | 1.424rem | 17.09px |
| h5 | 1.266rem | 15.19px |
| h6 | 1.125rem | 13.5px |
| p | 1rem | 12px |
| small | .889rem | 10.67px |
| smaller | .79rem | 9.48px |

When touching typography on this site, map elements to the nearest step above rather than picking an arbitrary size — not every step needs to appear in a given component; skip levels that don't correspond to a real distinct role.

Every rem value that existed anywhere in the codebase *before* this root change (2026-09-06) was mechanically rescaled by 16/12 at the same time, specifically to keep every existing size/spacing pixel-identical — so this was not a visual regression, just a base-unit change. Don't rescale things again; only *new* rem values you write should use the type-scale table above directly.

### Build tooling

CRA is wrapped with **craco** (`craco.config.js`) rather than plain `react-scripts`, to add the `@` alias, tune webpack watch options, and optionally wire in a health-check webpack plugin (gated by `ENABLE_HEALTH_CHECK`). No need to touch `craco.config.js` for typical feature work. The build script sets `GENERATE_SOURCEMAP=false` — production source maps aren't shipped.

### Backend

`backend/server.py` is a single-file FastAPI app: all routes are on an `/api`-prefixed `APIRouter` mounted onto `app`. Two route groups: a legacy `StatusCheck` CRUD pair (`/api/status`) and the contact form endpoint (`POST /api/messages`), which writes to MongoDB (`db.messages`) and optionally sends an email notification via Resend. There's no ORM/model layer beyond Pydantic request/response models defined inline in this file.

### Deploy workflow (git → Vercel)

- **GitHub repo:** `EshaniSomwanshi/Eshani-Somwanshi-Portfolio-Website`
- **Vercel project:** `eshanisomwanshi` (team `eshanisomwanshi`) — dashboard: https://vercel.com/eshanisomwanshi/eshanisomwanshi/deployments
- **Live site:** https://www.eshanisomwanshi.com (also `eshanisomwanshi.com`)

The repo has two relevant branches: `dev` (day-to-day work) and `main` (Vercel's production branch — pushing it deploys the live site). Default flow for any change:

1. Commit and push to `dev`. This is what an unqualified "push" means — Vercel builds a **preview** deploy for the `dev` branch, not the live site.
2. Only after the user reviews and explicitly says to go live ("push to production", "ship it", etc.), promote by merging `dev` into `main` and pushing: `git checkout main && git merge --no-ff dev && git push origin main && git checkout dev`. `main` carries only merge commits from `dev` (plus pre-workflow direct fixes) — it can be behind `dev` between promotions; that's expected. Check what's unpromoted with `git log --oneline origin/main..origin/dev`.

Never push `main` on a bare "push" — wait for the explicit go-ahead.

Push step 1 (commit + preview deploy) happens after **every** change by default — don't wait to be asked "commit to git and vercel" each time; only step 2 (promoting to `main`) needs an explicit go-ahead. If the user says to wait/hold off/batch changes, respect that instead.

The user works mostly from the GitHub Desktop app, so keep the local working tree clean and commits self-contained.

### Testing protocol (`test_result.md`)

The repo root has a `test_result.md` file with a structured YAML-in-Markdown protocol for coordinating between a "main" agent and a "testing" agent (used by the emergent.sh workflow this project was scaffolded from). If asked to record or update test status, follow the format already documented inside that file rather than inventing a new one.

### Accessibility

Build and edit everything on this site with accessibility in mind — this isn't a one-time cleanup, it's a standing bar for all future work here. Concretely, for any new or changed UI:

- Follow `frontend/ACCESSIBILITY_CHECKLIST.md` (WCAG 2.2 AA, adapted for this site) — check new interactive elements, images, headings, and color choices against it as you build, not just when explicitly asked for an audit.
- Prefer native HTML semantics over ARIA (a `<button>` beats `<div role="button">`); only reach for ARIA when HTML can't do the job.
- Keyboard: anything a mouse/pointer can do, Tab + Enter/Space must also be able to do. Never remove the focus-visible outline without an equally visible, equally high-contrast replacement.
- Contrast: check new color pairs against the existing design tokens (`App.css` `:root` blocks, one per theme — paper/carbon/petrol) before introducing a new one. Compute the ratio (4.5:1 text, 3:1 large text/UI components/borders) rather than eyeballing it — text and UI elements have failed this in exactly this codebase before from eyeballing.
- Motion: gate new animation behind `useReducedMotion()` (Framer Motion) or an equivalent `prefers-reduced-motion` check, including for any JS-driven scroll/animation library that doesn't automatically respect it (Lenis didn't, until it was fixed to check this — same discipline applies to anything else added later).
- `A11Y_AUDIT.md` at the repo root is the living record of known issues and their fix/verification status — check it before starting new work in an area it covers, and update it (status + live-test-needed note) if you touch something it tracks. Never mark a finding PASS without an actual live check (Lighthouse/axe/keyboard/VoiceOver) backing it — "the code looks right" is not the same as verified.
