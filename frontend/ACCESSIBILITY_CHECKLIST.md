# Accessibility Checklist — Portfolio Site

Based on WCAG 2.2, adapted from WebAIM's checklist (https://webaim.org/standards/wcag/checklist) and rewritten for a personal product/UX design portfolio site. Target: **WCAG 2.2 Level AA** (the standard most companies and hiring teams expect), with a few AAA items that are cheap wins.

---

## How to use this file (instructions for Claude Code)

1. **Audit first, fix second.** Go through every section below against the current codebase. For each item, mark it `PASS`, `FAIL`, or `N/A` and note the file + line. Put the results in `A11Y_AUDIT.md` at the repo root before changing anything.
2. **Fix in priority order:** `P0` → `P1` → `P2`. Do not skip P0 items to work on P2.
3. **Don't change the visual design** unless the item requires it (e.g. contrast). Where a fix has a visual impact, make the smallest change that passes and flag it in the audit so I can review.
4. **Prefer native HTML over ARIA.** A `<button>` beats `<div role="button">`. Only reach for ARIA when HTML can't do it.
5. **Every fix must be testable.** Each item has a "How to test" line — run it after the fix.
6. **Nothing here is optional because "it's just a portfolio."** Hiring managers at design-mature companies will open the site with a keyboard, a screen reader, or Lighthouse. This site is the proof of the process I claim in my case studies.

**Priority key**
- `P0` — Blocks users entirely (keyboard, screen readers, seizure risk). Fix first.
- `P1` — Required for AA conformance.
- `P2` — AAA or best practice. Do if cheap; otherwise log it.

---

## 0. Portfolio quick-scan (the 12 things that matter most)

Do these before the full audit. If all 12 pass, the site is already better than most portfolios.

- [ ] `P0` Every page can be fully used with only the Tab, Shift+Tab, Enter, Space, Esc, and arrow keys.
- [ ] `P0` Focus is always visible — you can see which element is focused at every Tab press.
- [ ] `P0` No content flashes more than 3 times per second.
- [ ] `P0` Nothing traps keyboard focus (modals, lightboxes, video embeds, carousels).
- [ ] `P1` Every image has correct `alt` text — descriptive for meaningful images, empty (`alt=""`) for decorative ones.
- [ ] `P1` Text contrast ≥ 4.5:1 (≥ 3:1 for large text). UI components and icons ≥ 3:1.
- [ ] `P1` One `<h1>` per page, headings nest in order (no skipping from `h2` to `h4`).
- [ ] `P1` `<html lang="en">` is set and every page has a unique, descriptive `<title>`.
- [ ] `P1` A "Skip to main content" link exists and is the first focusable element.
- [ ] `P1` Site works at 320px wide and at 400% browser zoom with no horizontal scroll.
- [ ] `P1` Animations respect `prefers-reduced-motion`. Anything that auto-plays > 5s can be paused.
- [ ] `P1` Link text makes sense out of context. No bare "click here", "read more", "view".

---

## 1. PERCEIVABLE — can everyone see/hear/read the content?

### 1.1 Text alternatives for images and non-text content

**1.1.1 Non-text Content** — `P1` (Level A)

Plain English: Anyone who can't see an image needs a text version of what it communicates.

What to check:
- [ ] Meaningful images (case-study screens, mockups, diagrams, photos of me) have `alt` text that describes what the image *shows and why it's there*. E.g. `alt="Clinician dashboard redesign: patient list with risk flags sorted by severity"` not `alt="dashboard"` or `alt="image1.png"`.
- [ ] Decorative images (background textures, dividers, blobs, gradients) have `alt=""` or are CSS backgrounds.
- [ ] Icon-only buttons and links have an accessible name: `aria-label="Open LinkedIn profile"` or visually-hidden text.
- [ ] Logos that link home: `alt="Eshani — home"` (or the site name), not `alt="logo"`.
- [ ] Complex images (flows, journey maps, architecture diagrams, before/after comparisons) have a longer description nearby in text or via `aria-describedby`. The alt alone won't carry a journey map.
- [ ] Embedded video/prototype iframes (Figma, YouTube, Loom) have a `title` attribute: `<iframe title="Prototype walkthrough: onboarding flow">`.
- [ ] SVG icons that are decorative have `aria-hidden="true"`. SVGs that carry meaning have `role="img"` and `<title>`.
- [ ] No `alt` text starts with "image of" / "picture of" — screen readers already say that.

How to test: Run WAVE or axe DevTools; check the "Images" list. Then read the page with images turned off in the browser and confirm nothing is lost.

### 1.2 Time-based media (video/audio)

**1.2.1–1.2.5** — `P1` (A/AA)

Plain English: Video and audio need captions and/or transcripts.

What to check:
- [ ] Any video with speech has synchronized captions (upload a caption file or use YouTube's editable auto-captions — check accuracy).
- [ ] Any video with meaningful visuals not described in the audio has a transcript or description below it.
- [ ] Silent screen-recording walkthroughs (common in portfolios): provide a short text description of what happens in the video directly under it.
- [ ] Audio-only content (rare here) has a transcript.

`P2` (AAA): Provide a full transcript for every video regardless.

How to test: Open each video muted and check you can still follow it from the captions/text.

### 1.3 Structure that survives without visual styling

**1.3.1 Info and Relationships** — `P1` (Level A)

Plain English: The structure you *see* (headings, lists, tables, sections) must also exist in the code, not just in CSS.

What to check:
- [ ] Headings use real `<h1>`–`<h6>`, not styled `<div>` or `<p>`. Exactly one `<h1>` per page (the page/project title).
- [ ] Heading levels don't skip (h1 → h2 → h3). Case study sections (Problem, Research, Solution, Outcome) are `h2`; sub-parts are `h3`.
- [ ] Landmarks are present: `<header>`, `<nav>`, `<main>`, `<footer>`. If there are two `<nav>`s, label them: `aria-label="Primary"` and `aria-label="Footer"`.
- [ ] Lists (skills, tools, project tags, nav links) use `<ul>`/`<ol>`/`<li>`.
- [ ] Data laid out as a table (e.g. before/after metrics, comparison tables) uses `<table>` with `<th>` headers and `scope`. Don't use tables for layout.
- [ ] Emphasis uses `<strong>`/`<em>`, not just `font-weight`.
- [ ] Form fields (contact form) have a `<label for="...">` tied to the input `id`. Placeholder text is not a label.
- [ ] Related inputs (radio groups, checkbox groups) are wrapped in `<fieldset>` with `<legend>`.

How to test: Use the HeadingsMap browser extension or the "Structure" tab in WAVE. Disable CSS (or use Reader mode) and check the page still makes sense.

**1.3.2 Meaningful Sequence** — `P1` (Level A)

Plain English: The order in the code = the order it should be read.

- [ ] DOM order matches visual order. Watch for CSS `order`, `flex-direction: row-reverse`, absolute positioning, and grid re-ordering that make things look right but read wrong.
- [ ] Case-study image grids read in a sensible order (left→right, top→bottom).

How to test: Tab through the page; focus should move in the visual order. Then use Reader mode.

**1.3.3 Sensory Characteristics** — `P1` (Level A)

Plain English: Don't give instructions that depend on shape, color, position, or sound.

- [ ] No copy like "see the blue button", "the panel on the right", "the round icon". Say what it's called instead.

**1.3.4 Orientation** — `P1` (AA)

- [ ] Nothing forces portrait or landscape. No CSS or JS that locks orientation.

**1.3.5 Identify Input Purpose** — `P1` (AA)

- [ ] Contact form inputs have `autocomplete` attributes: `name`, `email`, `tel`, `organization`, etc.

### 1.4 Distinguishable — contrast, color, zoom, spacing

**1.4.1 Use of Color** — `P1` (Level A)

Plain English: Color can add meaning, but it can't be the *only* thing that carries meaning.

- [ ] Links inside body text are distinguishable from surrounding text by something other than color (underline is simplest). If color-only, the link must have 3:1 contrast against surrounding text *and* gain an underline on hover/focus.
- [ ] Charts, tags, status indicators, and "current page" nav states use a second cue (icon, label, underline, weight, pattern), not just color.
- [ ] Form errors aren't shown by red outline alone — include an icon and/or text.

How to test: View the page in grayscale (Chrome DevTools → Rendering → Emulate vision deficiencies → Achromatopsia). Everything should still be understandable.

**1.4.2 Audio Control** — `P0` (Level A)

- [ ] No audio auto-plays for more than 3 seconds without a visible pause/mute control. (Best: no auto-playing audio at all.)

**1.4.3 Contrast (Minimum)** — `P1` (AA)

Plain English: Text has to be readable against its background.

- [ ] Normal text: contrast ratio ≥ **4.5:1**.
- [ ] Large text (≥ 24px regular, or ≥ 18.66px bold): ≥ **3:1**.
- [ ] Check every state: default, hover, focus, active, disabled (disabled is exempt but try anyway), and text on images/gradients/overlays.
- [ ] Check light *and* dark mode if both exist.
- [ ] Placeholder text, captions, timestamps, tag labels, and footer text are frequent failures — check those specifically.

How to test: WebAIM contrast checker (https://webaim.org/resources/contrastchecker/) or the contrast indicator in Chrome DevTools color picker. Log every text/background pair from the design tokens in the audit.

**1.4.4 Resize Text** — `P1` (AA)

- [ ] Page is fully readable and usable at 200% browser zoom. No overlapping text, no clipped content, no controls pushed off-screen.
- [ ] Font sizes use `rem`/`em`, not `px`, so browser font-size settings work.

**1.4.5 Images of Text** — `P1` (AA)

- [ ] Real text is used wherever it could be real text. Don't put headings, quotes, or labels inside images. (Text inside UI screenshots of your designs is fine — that's the artifact, not the page content.)

**1.4.10 Reflow** — `P1` (AA)

Plain English: The site must work on a very narrow screen without sideways scrolling.

- [ ] At 320px viewport width, there is no horizontal scrolling and no content or functionality is lost.
- [ ] Wide things (tables, big diagrams, code blocks) are the only exception and should scroll within their own container, not the whole page.
- [ ] Watch for fixed-width containers, `100vw` + padding overflow, long unbroken URLs/strings, and images without `max-width: 100%`.

How to test: Set browser to 1280px wide, zoom to 400%. Or resize the window to 320px.

**1.4.11 Non-text Contrast** — `P1` (AA)

Plain English: Buttons, form borders, icons, and focus rings also need to be visible — ≥ 3:1 against what's around them.

- [ ] Button and input borders/backgrounds ≥ 3:1 against page background.
- [ ] Icons that carry meaning (external-link arrow, menu, close, play) ≥ 3:1.
- [ ] Focus indicators ≥ 3:1 against adjacent colors.
- [ ] Chart/graph elements ≥ 3:1 against background and against adjacent segments.
- [ ] Custom checkboxes/toggles/radios in all states.

**1.4.12 Text Spacing** — `P1` (AA)

- [ ] Nothing breaks when the user overrides: line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em.
- [ ] Avoid fixed `height` on text containers. Use `min-height` or let them grow.

How to test: Apply this bookmarklet-style CSS in DevTools and look for clipping/overlap:
```css
* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }
```

**1.4.13 Content on Hover or Focus** — `P1` (AA)

Plain English: Tooltips and hover cards must be dismissable, hoverable, and persistent.

- [ ] Any tooltip/popover shown on hover or focus can be closed with **Esc** without moving the mouse.
- [ ] The user can move the pointer *onto* the tooltip without it vanishing.
- [ ] It stays visible until the user moves away or dismisses it (no auto-hide timers).
- [ ] Prefer native `title` alternatives that are visible-on-focus, or make helper text always visible.

`P2` **1.4.6 Contrast (Enhanced, AAA)** — aim for 7:1 on body text where it doesn't hurt the design. Easy win on a mostly-text portfolio.

`P2` **1.4.8 Visual Presentation (AAA)** — body text max-width ~80 characters (`max-width: 70ch`), not fully justified, line-height ≥ 1.5, paragraph spacing ≥ 1.5× line-height. This is just good typography — do it.

---

## 2. OPERABLE — can everyone navigate and interact?

### 2.1 Keyboard

**2.1.1 Keyboard** — `P0` (Level A)

Plain English: Everything a mouse can do, a keyboard can do.

- [ ] All links, buttons, menu toggles, accordions, tabs, carousels, lightboxes, and form controls are reachable with Tab and activated with Enter/Space.
- [ ] Custom interactive elements are real `<button>`/`<a>` elements, or have `tabindex="0"` + `role` + keyboard handlers (`onKeyDown` for Enter and Space).
- [ ] Hover-only interactions (image zoom on hover, hover-reveal captions, hover-reveal nav) also work on focus and on tap.
- [ ] Horizontal scroll galleries can be moved with arrow keys or have visible prev/next buttons.
- [ ] No `tabindex` greater than 0 anywhere.

How to test: Unplug the mouse. Complete every task on the site: navigate to a case study, open and close a lightbox, open the mobile menu, submit the contact form, use any filters.

**2.1.2 No Keyboard Trap** — `P0` (Level A)

- [ ] Focus can always leave any component. Modals/lightboxes: Esc closes them and focus returns to the element that opened them.
- [ ] Embedded iframes (Figma prototypes, videos) don't swallow focus permanently — the user can Tab out.

**2.1.4 Character Key Shortcuts** — `P1` (Level A)

- [ ] If any single-key shortcuts exist (e.g. pressing "j"/"k" to move between projects), they can be turned off or remapped, or only fire when a specific element is focused. Simplest: don't add single-key shortcuts.

### 2.2 Enough time

**2.2.1 Timing Adjustable** — `P1` (Level A)

- [ ] No time limits on anything. (Typically N/A for a portfolio.)

**2.2.2 Pause, Stop, Hide** — `P1` (Level A)

Plain English: Moving things that last more than 5 seconds need a pause button.

- [ ] Auto-advancing carousels, marquees, scrolling logo strips, auto-playing background videos, looping animations: any that run > 5s have a visible pause/stop control, or stop after 5s, or are disabled under `prefers-reduced-motion`.
- [ ] Auto-playing background videos have `muted`, `playsinline`, and a pause control.

### 2.3 Seizures and physical reactions

**2.3.1 Three Flashes** — `P0` (Level A)

- [ ] Nothing flashes/strobes more than 3 times per second. Check videos, loading animations, hover effects, and any "glitch" style effects.

**2.3.3 Animation from Interactions** — `P2` (AAA) — but treat as `P1` for this site

- [ ] All non-essential motion (scroll-triggered reveals, parallax, hover scale/tilt, page transitions, smooth scroll, cursor followers) is disabled or reduced when `prefers-reduced-motion: reduce` is set.
- [ ] Global rule as a safety net:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
- [ ] JS animation libraries (Framer Motion, GSAP, Lenis, etc.) check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip/shorten.

How to test: macOS → System Settings → Accessibility → Display → Reduce motion. Reload the site. Or emulate in Chrome DevTools → Rendering.

### 2.4 Navigable

**2.4.1 Bypass Blocks (Skip Link)** — `P1` (Level A)

- [ ] A "Skip to main content" link is the very first focusable element on every page, links to `#main` (or `<main id="main" tabindex="-1">`), and becomes visible on focus.
```html
<a href="#main" class="skip-link">Skip to main content</a>
<!-- CSS: position off-screen until :focus, then show at top-left with high contrast -->
```

**2.4.2 Page Titled** — `P1` (Level A)

- [ ] Each page has a unique, descriptive `<title>`: `Clinician Dashboard Redesign — Eshani | Product Designer`, not `Home` or `Portfolio` on every page.
- [ ] In a SPA, the title updates on route change.

**2.4.3 Focus Order** — `P1` (Level A)

- [ ] Tab order follows the visual/logical reading order.
- [ ] When a modal/menu opens, focus moves into it. When it closes, focus returns to the trigger.
- [ ] Newly revealed content (accordion body, filtered results) appears right after its trigger in tab order.

**2.4.4 Link Purpose (In Context)** — `P1` (Level A)

Plain English: A screen-reader user pulls up a list of all links on a page. Each one should make sense.

- [ ] No "Read more", "View", "Learn more", "Click here", "→" as the full link text. Use `View the OptraHealth case study` or add visually-hidden text: `Read more <span class="sr-only">about the fintech design system</span>`.
- [ ] Project cards: the whole card can be one link, but the accessible name should be the project title, not the entire card contents.
- [ ] Links that open a new tab say so: visible external-link icon with `aria-label` or sr-only text "(opens in new tab)".
- [ ] Two links with the same text go to the same place.

`P2` **2.4.9 Link Purpose (Link Only, AAA)** — every link makes sense from its text alone, without surrounding context. Aim for this; it's mostly copywriting.

**2.4.5 Multiple Ways** — `P1` (AA)

- [ ] At least two ways to reach any page: e.g. main nav + footer links, or nav + "Next project" links, or a project index page + inline links. (Pages that are steps in a process are exempt.)

**2.4.6 Headings and Labels** — `P1` (AA)

- [ ] Headings describe the content that follows. Form labels describe what to enter.
- [ ] No two `h2`s on the same page with identical text unless they're clearly different sections.

**2.4.7 Focus Visible** — `P0` (AA)

Plain English: Never hide the focus ring.

- [ ] No `outline: none` / `outline: 0` without a replacement focus style.
- [ ] Focus style is visible on every interactive element, on every background (light hero, dark footer, over images).
- [ ] Use `:focus-visible` so mouse users don't see rings but keyboard users do.
- [ ] Recommended baseline:
```css
:focus-visible {
  outline: 2px solid currentColor; /* or a brand color with ≥3:1 contrast */
  outline-offset: 3px;
}
```

**2.4.11 Focus Not Obscured (Minimum)** — `P1` (AA, new in 2.2)

- [ ] A focused element is never completely hidden behind sticky headers, cookie banners, floating buttons, or toasts. Add `scroll-padding-top` equal to the sticky header height:
```css
html { scroll-padding-top: 80px; }
```

`P2` **2.4.13 Focus Appearance (AAA)** — focus indicator is at least 2px thick around the whole element with ≥ 3:1 change between focused/unfocused. The baseline above satisfies this.

`P2` **2.4.8 Location (AAA)** — current page is indicated in the nav (`aria-current="page"`), and case studies show where you are (e.g. "Project 2 of 5" or breadcrumbs).

### 2.5 Input modalities (touch, pointer, motion)

**2.5.1 Pointer Gestures** — `P1` (Level A)

- [ ] Anything that works by swipe, pinch, or drag also works with a simple tap/click (e.g. carousels have buttons, image comparison sliders have a button alternative or keyboard support).

**2.5.2 Pointer Cancellation** — `P1` (Level A)

- [ ] Actions fire on click/`pointerup`, not on `mousedown`/`pointerdown`, so users can slide away to cancel.

**2.5.3 Label in Name** — `P1` (Level A)

- [ ] If a button visibly says "Download resume", its `aria-label` (if any) contains that text. Best practice: don't add `aria-label` to things that already have visible text.

**2.5.4 Motion Actuation** — `P1` (Level A)

- [ ] No feature relies on shaking/tilting the device. (Typically N/A.)

**2.5.7 Dragging Movements** — `P1` (AA, new in 2.2)

- [ ] Any drag interaction (before/after sliders, draggable galleries, sortable lists) has a non-drag alternative: buttons, arrow keys, or a slider input.

**2.5.8 Target Size (Minimum)** — `P1` (AA, new in 2.2)

- [ ] Every clickable target is at least **24×24 CSS px**, or has at least 24px of clear space around it. Inline links inside paragraphs are exempt.
- [ ] Common failures: icon buttons, social icons in the footer, pagination dots, close "×" buttons, tag chips.

`P2` **2.5.5 Target Size (Enhanced, AAA)** — **44×44px** for all standalone targets. Use this for anything a thumb will hit on mobile: nav items, buttons, social icons, carousel controls.

---

## 3. UNDERSTANDABLE — is the content and behavior predictable?

### 3.1 Readable

**3.1.1 Language of Page** — `P1` (Level A)

- [ ] `<html lang="en">` is present on every page.

**3.1.2 Language of Parts** — `P1` (AA)

- [ ] Any passage in another language (e.g. Hindi/Marathi name meaning, a quote) is wrapped with `lang="hi"` etc.

`P2` **3.1.4 Abbreviations (AAA)** — spell out acronyms on first use (HCI, EHR, SaaS, B2B, ATS) or use `<abbr title="...">`. Hiring managers outside your domain will thank you.

`P2` **3.1.5 Reading Level (AAA)** — case-study copy is plain and direct. Short sentences, one idea each. (This also just makes a better portfolio.)

### 3.2 Predictable

**3.2.1 On Focus** — `P1` (Level A)

- [ ] Tabbing to an element never triggers navigation, opens a modal, or moves focus elsewhere.

**3.2.2 On Input** — `P1` (Level A)

- [ ] Changing a select/checkbox/radio (e.g. a project filter) doesn't navigate or submit a form automatically without warning. Filtering results in place is fine if it's obvious.

**3.2.3 Consistent Navigation** — `P1` (AA)

- [ ] Nav links are in the same order on every page. Footer is the same on every page.

**3.2.4 Consistent Identification** — `P1` (AA)

- [ ] Same thing = same name everywhere. Don't call it "Resume" in the header and "CV" in the footer. Same icon for the same action.

**3.2.6 Consistent Help** — `P1` (Level A, new in 2.2)

- [ ] If contact info / email / "Get in touch" appears on multiple pages, it's in the same place each time (e.g. always in the footer).

### 3.3 Input assistance (forms)

Applies to the contact form or any newsletter/feedback form. If there's no form, mark N/A.

**3.3.1 Error Identification** — `P1` (Level A)

- [ ] Required fields are marked in the label (text, not just an asterisk in a different color; if using `*`, explain it once above the form).
- [ ] Errors are described in text next to the field and tied to it with `aria-describedby`. The input gets `aria-invalid="true"`.
- [ ] On submit failure, focus moves to the first error or to an error summary at the top.

**3.3.2 Labels or Instructions** — `P1` (Level A)

- [ ] Every input has a visible `<label>`. Format hints ("we'll reply within 2 days", "optional") are visible, not placeholder-only.

**3.3.3 Error Suggestion** — `P1` (AA)

- [ ] Error messages say how to fix it: "Enter an email address like name@example.com", not "Invalid input".

**3.3.4 Error Prevention (Legal/Financial/Data)** — `P1` (AA) — N/A unless the site takes payments or commitments.

**3.3.7 Redundant Entry** — `P1` (Level A, new in 2.2)

- [ ] In any multi-step form, information already entered is not asked for again (or is pre-filled).

**3.3.8 Accessible Authentication** — `P1` (AA, new in 2.2)

- [ ] If any part of the site is password-protected (gated case studies are common), the login doesn't require solving a puzzle/CAPTCHA and allows paste in the password field. Password managers must work.

---

## 4. ROBUST — does it work with assistive technology?

**4.1.2 Name, Role, Value** — `P0` (Level A)

Plain English: Every interactive component tells assistive tech what it is, what it's called, and what state it's in.

- [ ] Native elements first: `<button>`, `<a href>`, `<input>`, `<select>`, `<details>/<summary>`.
- [ ] Custom components (tabs, accordions, menus, toggles, carousels, modals) follow the WAI-ARIA Authoring Practices patterns (https://www.w3.org/WAI/ARIA/apg/patterns/):
  - Accordion: `<button aria-expanded="true|false" aria-controls="panel-id">`
  - Tabs: `role="tablist"` / `role="tab"` + `aria-selected` / `role="tabpanel"`, arrow-key navigation
  - Modal/lightbox: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, focus trapped *inside while open*, Esc closes, background `inert`
  - Mobile menu toggle: `<button aria-expanded aria-controls aria-label="Menu">`
  - Current nav item: `aria-current="page"`
- [ ] `aria-hidden="true"` is never on a focusable element or its ancestor.
- [ ] ARIA roles are used correctly — no `role="button"` on a `<div>` without `tabindex="0"` and key handlers; no redundant `role="navigation"` on `<nav>`.
- [ ] HTML validates: no duplicate `id`s, no nested interactive elements (`<a>` inside `<button>`, `<button>` inside `<a>`).
- [ ] Toggle buttons (dark mode switch) use `aria-pressed` or are implemented as a `<button role="switch" aria-checked>`.

How to test: axe DevTools "Best practices" on; screen reader pass (below).

**4.1.3 Status Messages** — `P1` (AA)

- [ ] Things that change without moving focus — "Message sent", "3 projects shown", "Copied to clipboard", loading states — are announced via a live region:
```html
<div role="status" aria-live="polite" class="sr-only" id="status"></div>
<!-- set its textContent when the status changes -->
```
- [ ] Errors that need immediate attention use `role="alert"`.

---

## 5. Testing workflow (run after fixes)

Run all of these. Record results in `A11Y_AUDIT.md`.

1. **Automated** — catches ~30–40% of issues, never all:
   - Lighthouse (Chrome DevTools → Lighthouse → Accessibility). Target ≥ 95, but a 100 does *not* mean accessible.
   - axe DevTools browser extension — run on every route/page template.
   - WAVE (https://wave.webaim.org/) — good for alt text, contrast, and structure overview.
   - If the repo has a test setup, add `@axe-core/playwright` or `jest-axe` so regressions fail CI.
2. **Keyboard only** — mouse unplugged, every page, every component. Watch for: invisible focus, wrong order, traps, hover-only content.
3. **Zoom + reflow** — 200% zoom, then 400% at 1280px width, then 320px viewport.
4. **Reduced motion** — OS setting on; confirm animations stop or shorten.
5. **Color blindness / grayscale** — Chrome DevTools → Rendering → Emulate vision deficiencies. Check links, charts, states.
6. **Screen reader** — one full pass with **VoiceOver on macOS** (Cmd+F5). Use the rotor (Ctrl+Option+U) to review headings, links, landmarks, and images lists. Confirm: page title read on load, skip link works, headings outline makes sense, every image has sensible alt, every link/button has a name, form fields have labels, modals announce themselves.
7. **Mobile** — VoiceOver on iOS or TalkBack on Android for a quick pass of the home page and one case study. Check target sizes with a thumb.

---

## 6. Audit report template (`A11Y_AUDIT.md`)

```
# Accessibility Audit — <date>

Scope: <pages / templates / components reviewed>
Target: WCAG 2.2 AA
Tools: Lighthouse <score>, axe <n issues>, WAVE, manual keyboard + VoiceOver

## Summary
- P0 failures: n
- P1 failures: n
- P2 items: n
- Items marked N/A: n (list which and why)

## Findings
| # | SC | Priority | Status | Where (file:line / component) | Issue | Fix applied / proposed | Visual impact? |
|---|----|----------|--------|-------------------------------|-------|------------------------|----------------|

## Design decisions needing review
<anything where the fix changes how the site looks — list with before/after values, e.g. "Muted caption color #8A8A8A → #6B6B6B to reach 4.5:1">

## Not fixed yet
<items and why>
```

---

## 7. Things to build once and reuse

Having these as shared utilities/components prevents most regressions:

- [ ] `.sr-only` / `.visually-hidden` utility class.
- [ ] `<SkipLink />` component included in the root layout.
- [ ] Global `:focus-visible` style in the base stylesheet.
- [ ] Global `prefers-reduced-motion` reset + a `useReducedMotion()` hook (or equivalent) that animation components consult.
- [ ] `<Image />` wrapper that *requires* an `alt` prop (allow `alt=""` explicitly, but not omitted).
- [ ] `<ExternalLink />` that adds `rel="noopener"` and the sr-only "(opens in new tab)" text.
- [ ] `<Dialog />` / `<Lightbox />` with focus trap, Esc-to-close, and focus return built in.
- [ ] `<LiveRegion />` for status messages.
- [ ] Design tokens documented with their contrast ratios so new color pairs are checked at the source.

---

## 8. Success criteria that are usually N/A for a portfolio

Mark these N/A in the audit unless the feature exists:

- 1.2.4 Live captions, 1.2.6–1.2.9 sign language / extended AD / live audio
- 2.2.3–2.2.6 timeouts, interruptions, re-authentication
- 2.5.4 Motion actuation, 2.5.6 concurrent input
- 3.3.4 / 3.3.6 Error prevention for legal/financial submissions
- 3.3.9 Accessible authentication (enhanced)
- 4.1.1 Parsing (removed from WCAG 2.2 — ignore)

---

## Quick reference: contrast numbers

| What | Minimum (AA) | Enhanced (AAA) |
|------|--------------|----------------|
| Body text | 4.5:1 | 7:1 |
| Large text (≥24px, or ≥18.66px bold) | 3:1 | 4.5:1 |
| UI components, borders, icons, focus rings | 3:1 | — |
| Link vs surrounding text (if color-only) | 3:1 + underline on hover/focus | — |

## Quick reference: sizes

| What | Value |
|------|-------|
| Minimum target size (AA) | 24×24px or 24px clear spacing |
| Recommended target size (AAA / mobile) | 44×44px |
| Reflow breakpoint | 320px wide, no horizontal scroll |
| Zoom that must still work | 200% (text), 400% at 1280px (reflow) |
| Body text line length | ≤ 80 characters (~`max-width: 70ch`) |
| Auto-moving content | pausable if > 5 seconds |
| Flashing | never > 3 per second |
