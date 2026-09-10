import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUpRight, Layers, LayoutGrid, Menu, Minus, Plus, Send } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useLenis } from "./lib/smoothScroll";
import {
  BackToTop,
  CountUp,
  EASE,
  IMG,
  Magnetic,
  Reveal,
  SplitText,
  ThemeSwitch,
  Wipe,
  useTheme,
} from "./primitives";
import "./App.css";
import Preloader from "./components/site/Preloader";
import SkillStickerWall from "./components/site/SkillStickerWall";
import AvatarHero from "./components/ui/AvatarHero";

/* ========================================================================
   Content
   ======================================================================== */

/* TODO(Eshani): fill in the subpoints for each offering (bullet lists).
   Left empty for now per your notes — an accordion with nothing inside just
   shows a "Detail coming soon" line. */
const offerings = [
  ["UX/UI Design", []],
  ["Graphic Design", []],
  ["Branding", []],
  ["Industrial Design", []],
];

/* [filename in public/Logos/, visible label]. Feeds both Toolkit views —
   SkillStickerWall (the physics wall) and ToolGrid below. Covers
   both the design side and the code side, which is what the section heading
   claims.

   Ordered by how prominently Eshani actually uses each one, most first. This
   array is the single source of truth for both views: the marquee scrolls in
   this order, and the grid reads it left to right, top to bottom. Reorder
   here, not in either component. */
const tools = [
  ["figma", "Figma"], ["claude", "Claude"], ["vscode", "VS Code"], ["html5", "HTML5"],
  ["javascript", "JavaScript"], ["react", "React"], ["cursor", "Cursor"], ["framer", "Framer"],
  ["photoshop", "Photoshop"], ["illustrator", "Illustrator"], ["after-effects", "After Effects"], ["miro", "Miro"],
  ["adobe", "Adobe CC"], ["canva", "Canva"], ["openai", "ChatGPT"], ["wordpress", "WordPress"],
  ["axure", "Axure RP"], ["perplexity", "Perplexity"],
];

const navItems = [
  ["top", "Home"],
  ["work", "Work"],
  ["about", "About"],
];

const RESUME_URL = "https://drive.google.com/file/d/1nMU-IFwWzMEcfJsD9FHLgwEyCda2ZLoo/preview";

/* ========================================================================
   Cursor — dot + ring, with a contextual label (and optional preview image)
   when hovering project media.

   Add data-cursor="Label" to any element to grow the ring into a filled
   accent circle with that label. Add data-cursor-img="/path" alongside it
   to also show a small preview thumbnail above the ring.
   ======================================================================== */

function Cursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState("default");
  const [label, setLabel] = useState("");
  const [img, setImg] = useState("");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 240, damping: 22, mass: 0.4 });
  const ry = useSpring(y, { stiffness: 240, damping: 22, mass: 0.4 });

  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer:fine)").matches) return;
    setEnabled(true);

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e) => {
      const media = e.target.closest("[data-cursor]");
      if (media) {
        setState("media");
        setLabel(media.dataset.cursor);
        setImg(media.dataset.cursorImg || "");
        return;
      }
      setLabel("");
      setImg("");
      setState(e.target.closest("a,button,input,textarea") ? "link" : "default");
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [reduced, x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} aria-hidden="true" />
      <motion.div
        className="cursor-ring"
        style={{ x: rx, y: ry }}
        data-state={state}
        data-has-img={img ? "true" : "false"}
        aria-hidden="true"
      >
        {img && <img src={img} alt="" className="cursor-preview-img" />}
        <span className="cursor-label">{label}</span>
      </motion.div>
    </>
  );
}

/* ========================================================================
   Tool marquee / grid
   ======================================================================== */

/* Themes whose page background is dark. */
const DARK_THEMES = new Set(["carbon", "petrol"]);

/* Brands that publish a second mark for dark backgrounds, sitting alongside
   the default as <slug>-dark.svg. Framer/ChatGPT/Cursor/Axure are black by
   design and would all but vanish; React's is a lighter blue than its
   on-light version. Everything else keeps one piece of artwork across all
   three themes — a multi-colour logo can't be tinted without
   misrepresenting the mark. */
const THEME_VARIANT_LOGOS = new Set(["framer", "openai", "cursor", "axure", "react"]);

/* Where the filename doesn't follow the slug. The grid wants Adobe's own
   Creative Cloud app icon — the one on its coloured tile — rather than the
   bare corporate "A": tiles here sit on the page background next to
   Photoshop, Illustrator and After Effects, which are all app icons on their
   own tiles, so the tile is what makes it match. (The wall is the opposite
   case and uses the bare mark, since a tile inside a coloured cube reads as a
   box in a box.) */
const GRID_LOGO_FILES = {
  adobe: "adobe-cc-tile.svg",
};

/* Per-logo size correction. Every tile gets the same box, but the artwork
   inside each file doesn't fill its own viewBox by the same amount — Adobe's
   CC icon carries noticeably more built-in padding than its neighbours, so at
   an identical box it reads smaller than Photoshop or Illustrator next to it.
   This nudges the drawn mark, not the box or the layout. */
const GRID_LOGO_SCALE = {
  adobe: 1.05,
};

/* Logos are the brands' own full-colour marks, served locally from
   public/Logos/ (was cdn.simpleicons.org, which only had monochrome marks
   and cost 17 external requests). */
function ToolLogo({ slug, name, size, theme }) {
  const onDark = THEME_VARIANT_LOGOS.has(slug) && DARK_THEMES.has(theme);
  const file = GRID_LOGO_FILES[slug] || `${slug}${onDark ? "-dark" : ""}.svg`;
  /* Inline, because the px size the grid uses lives in CSS and would other-
     wise win over the width/height attributes. */
  const px = Math.round(size * (GRID_LOGO_SCALE[slug] || 1));
  return (
    <span className="tool-tile">
      <img
        src={`${process.env.PUBLIC_URL}/Logos/${file}`}
        alt=""
        width={px}
        height={px}
        style={px === size ? undefined : { width: px, height: px }}
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <span className="tool-tile-label">{name}</span>
    </span>
  );
}

/* Static four-across grid, centred on the page. Laid out with wrapping flex
   rather than CSS grid so the final short row (18 tools don't divide by 4)
   centres itself instead of hanging off the left edge. */
function ToolGrid({ theme }) {
  return (
    <div className="tool-grid" aria-label="Tools of the trade" data-testid="tool-grid">
      {tools.map(([slug, name]) => (
        <ToolLogo key={slug} slug={slug} name={name} size={77} theme={theme} />
      ))}
    </div>
  );
}

/* ========================================================================
   Selected work — one shared card template, driven by data, so all six
   entries (five projects + the screens gallery) render identically and
   the sticky-stack below just repeats one component. Content here is the
   same information already live elsewhere (the EYE AI/Rebecca/Travelogue/
   DAB fields mirror caseStudies.js and the case-study rail this replaces
   on the homepage teaser) — nothing is new copy, just reshaped to fit.
   ======================================================================== */

const workCards = [
  {
    key: "optra",
    testId: "project-card-optra",
    index: "01",
    company: "OptraHealth",
    statusLabel: "Full case study",
    role: "Product Designer · Dec 2024 – Mar 2025 · San Jose, CA",
    title: "Pediatric Therapy App",
    quiet: "(Zoe, an AI companion inside a health-tech platform)",
    subtitle: "Companion-guided app connecting patients, parents, and providers.",
    desc: "Primary designer for Zoe, building the interaction layer from the ground up alongside mobile onboarding, a patient management dashboard, and provider monitoring. Validated across 20+ usability and heuristic evaluation sessions with patients, parents, and providers.",
    metrics: [
      { value: <CountUp value={30} suffix="%" />, label: "Weekly engagement ↑", method: "Post-launch vs. prior release" },
      { value: <CountUp value={28} suffix="%" />, label: "Tutorial completion ↑", method: "Across 20+ sessions" },
      { value: <CountUp value={100} suffix="+" />, label: "Component library", method: "Adopted by PMs and engineers" },
    ],
    tags: ["AI companion", "Healthcare SaaS", "Design system"],
    image: { src: "myocircle-cover.png", alt: "MyoCircle mobile app across two phones, an AI-companion health app with achievement badges and a gamified exercise flow." },
    cursorLabel: "MyoCircle",
    link: "/work/optrahealth",
    linkLabel: "Read the case study",
    linkTestId: "read-case-optra",
  },
  {
    key: "eyeai",
    testId: "project-card-eyeai",
    index: "02",
    company: "Onward Technologies · EYE AI",
    statusLabel: "Full case study",
    role: "UX Designer · Jul 2024 – Aug 2024 · Chicago, IL",
    title: "Retinal Diagnostic Platform",
    subtitle: "Streamlining complex diagnostics into a unified, actionable experience.",
    desc: "Streamlining complex diagnostics into one unified, actionable experience for clinicians: a regulated B2B health-tech MVP followed end to end, from heuristic evaluation and stakeholder research through journey mapping, iterative prototyping, and high-fidelity delivery of a diagnostic tool clinicians could trust.",
    metrics: [
      { value: <CountUp value={20} suffix="%" />, label: "Faster diagnostic tasks", method: "Timed task testing, pre/post" },
      { value: "10→7", label: "Week MVP timeline", method: "Against the original delivery plan" },
    ],
    tags: ["Healthcare", "Research", "Prototyping", "Reporting"],
    image: { src: "onward-1.png", alt: "Eye AI product site: onboarding clinicians to the diagnostic platform" },
    cursorLabel: "EYE AI",
    link: "/work/eye-ai",
    linkLabel: "Open full case study",
    linkTestId: "read-case-eye-ai",
  },
  {
    key: "travelogue",
    testId: "project-card-travelogue",
    index: "03",
    company: "Travelogue",
    statusLabel: "Full case study",
    role: "Product Designer · Personal case study · 2025",
    title: "Travelogue",
    desc: "A self-initiated, research-led concept that consolidates trip planning into one home: upcoming trips, itineraries, documents, and the people coming along, shaped directly by traveler interviews about offline access, group coordination, and expense tracking.",
    metrics: [
      { value: "08", label: "Traveler interviews" },
      { value: "05", label: "Unmet needs mapped" },
    ],
    tags: ["Personal project", "Mobile UX", "Research-led"],
    image: { src: "travelogue-cover.png", alt: "Travelogue home feed and a group trip hub shown side by side on two phones." },
    cursorLabel: "Travelogue",
    link: "/work/travelogue",
    linkLabel: "Read case study",
    linkSrOnly: "Travelogue",
    linkTestId: "read-case-travelogue",
  },
];

/* Depth-of-stack values for one card, i of total, driven by the whole
   stack's own scroll progress (see the `stackProgress` MotionValue set up
   in App() and passed down here — computed once for the whole section,
   not per-card scroll tracking). Card i owns the [i/total, (i+1)/total]
   slice of that progress: it sits at rest (scale 1, full brightness) until
   the next card's turn begins, then recedes — scaling down, dimming, and
   gaining a deeper shadow — as it gets covered. The last card never has
   anything covering it, so its range is left neutral. Purely a visual
   read of the *existing* sticky-stack scroll; it doesn't change the
   trigger points, the top-offset stagger, or the stack's scroll length.

   Scale only — no opacity dim, no blur, no shadow. Cards stay flush,
   full-opacity, with their existing border as the only edge treatment;
   the shrinking width/height against the next (undimmed) card is what
   reads as "receding." Once a card is fully covered it's simply hidden
   behind the next one — nothing keeps it partially visible on purpose,
   so there's no multi-tier depth to track, just this card's own single
   handoff to the one right after it. */
function useCardDepth(progress, i, total, vh) {
  const reduced = useReducedMotion();
  const isLast = i >= total - 1;
  const start = i / total;
  const end = (i + 1) / total;

  /* Scroll drives a *number* here, not a position.

     The cards used to be position:sticky, which meant the browser placed the
     incoming card straight from scroll — the card and the wheel were the same
     thing, so there was no gap for a lag to live in and a spring could only
     decorate a 48px nudge on top of ~700px of native travel. That is why the
     section never felt like it had any weight.

     Now every card is absolutely positioned in one sticky viewport-sized
     frame, and its whole travel is this transform. Nothing moves from scroll
     directly: progress feeds a target, the target feeds a spring, and the
     spring's trailing is the inertia.

     ENTER is a full frame height, so a card starts completely below the frame
     and rides all the way up. vh is measured rather than assumed (svh in CSS,
     ResizeObserver in App) because that travel has to match the frame exactly
     or a card parks partly on screen. */
  const ENTER = vh || 800;
  const RECEDE_SCALE = 0.86;
  const RECEDE_Y = Math.round(ENTER * 0.04);

  /* HOLD is the dwell: the share of a card's slice where it does not move at
     all. Before it existed a card was at rest for a single instant of scroll
     and was already receding one pixel later, while the next card arrived
     across the same window — no card was ever simply *there*.

     At 0.35 the card is still for the first 35% of its slice and hands over
     across the remaining 65%. The incoming card waits below the frame through
     that dwell and only begins to rise once the current card starts to go. */
  const HOLD = 0.35;
  const slice = 1 / total;
  const hold = start + slice * HOLD;
  const prevHold = start - slice * (1 - HOLD);

  const yPoints = [];
  const yVals = [];
  if (i > 0) {
    yPoints.push(prevHold);
    yVals.push(ENTER);
  }
  yPoints.push(start);
  yVals.push(0);
  yPoints.push(hold);
  yVals.push(0);
  if (!isLast) {
    yPoints.push(end);
    yVals.push(RECEDE_Y);
  }

  const rawScale = useTransform(
    progress,
    [start, hold, end],
    reduced || isLast ? [1, 1, 1] : [1, 1, RECEDE_SCALE],
    { clamp: true },
  );
  const rawY = useTransform(progress, yPoints, reduced ? yPoints.map(() => 0) : yVals, { clamp: true });

  /* The spring is the whole point now, not a garnish. It is smoothing a
     full-frame travel rather than a 48px nudge, so its trailing is what the
     eye reads as momentum.

     Settle is bounded by the dwell — the card has to stop moving inside the
     still phase or it is still travelling when the next handoff starts, which
     was the original fault. Stiffness 90 settles in ~527ms against a dwell of
     roughly 295px (~490ms of scrolling at a leisurely pace), so it lands just
     as the card comes to rest. Damping 22 keeps the ratio at ~1.16: trailing,
     never overshooting. Softer than this and cards visibly fail to arrive.

     Always called (Rules of Hooks — reduced can change at runtime) but inert
     under reduced-motion: the inputs are flat constants there, and a spring
     only moves when its input does. */
  const springConfig = { stiffness: 90, damping: 22, mass: 1 };
  const scale = useSpring(rawScale, springConfig);
  const y = useSpring(rawY, springConfig);
  /* A hard step, not a fade: full opacity the whole time a card is being
     covered, then gone the instant it is fully behind the next one. */
  const opacity = useTransform(progress, (p) => (reduced || isLast || p < end ? 1 : 0));
  return { scale, y, opacity };
}

function StackCard({ i, total, progress, card, vh }) {
  const {
    testId, index, company, role, title, quiet, subtitle, desc,
    confidentialNote, metrics, tags, image, cursorLabel, link, linkLabel, linkSrOnly,
  } = card;
  const { scale, y, opacity } = useCardDepth(progress, i, total, vh);

  /* Plain div, not Reveal. Reveal applies its own scroll-triggered opacity and
     rise, which is a second transform on the same element fighting the one
     below it — harmless while the cards were sticky and barely moved, wrong
     now that this transform owns the card's whole travel. */
  return (
    <div className="stack-item" style={{ "--i": i }}>
      <motion.article
        className={`lead-panel${image ? "" : " no-image"}`}
        data-testid={testId}
        style={{ scale, y, opacity, originX: 0.5, originY: 0 }}
      >
        <div className="lead-top">
          <span className="lead-index">{index} · {company}</span>
          {/* Was a static "Full case study" status pill, with the actual
              read-case link duplicated below under the tags. Consolidated
              into one clickable CTA here — same pill look (.status-pill),
              now an actual Link — so there's a single, unambiguous way to
              open the case study instead of two. */}
          <Link to={link} className="status-pill" data-testid={card.linkTestId}>
            {linkLabel}{linkSrOnly && <span className="sr-only"> — {linkSrOnly}</span>} <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="lead-columns">
          <div className="lead-col-text">
            <p className="lead-role" style={{ marginTop: ".75rem" }}>{role}</p>
            <h3 {...(cursorLabel && image ? { "data-cursor": cursorLabel, "data-cursor-img": IMG(image.src) } : {})}>
              {title} {quiet && <span className="quiet">{quiet}</span>}
            </h3>
            {subtitle && <p className="lead-subtitle">{subtitle}</p>}
            <p className="lead-desc">{desc}</p>
            {confidentialNote && <p className="nda-note">{confidentialNote}</p>}
            {metrics?.length > 0 && (
              <div className="lead-metrics">
                {metrics.map((m, mi) => (
                  <div key={mi}>
                    <div className="m-value">{m.value}</div>
                    <div className="m-label">{m.label}</div>
                    {m.method && <div className="m-method">{m.method}</div>}
                  </div>
                ))}
              </div>
            )}
            <div className="lead-tags tag-row">
              {tags.map((t) => <span className="tag" key={t}>{t}</span>)}
            </div>
          </div>
          {image && (
            <div className="lead-media" data-cursor={cursorLabel}>
              <Wipe src={IMG(image.src)} alt={image.alt} testId={`project-image-${card.key}`} />
            </div>
          )}
        </div>
      </motion.article>
    </div>
  );
}

/* ========================================================================
   Contact form
   ======================================================================== */

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState("idle");
  const [errors, setErrors] = useState({});
  const fieldRefs = { name: useRef(null), email: useRef(null), message: useRef(null) };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!form.email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(form.email)) next.email = "Enter an email address like name@example.com.";
    if (!form.message.trim()) next.message = "Enter a message.";
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (state === "sending") return;

    const nextErrors = validate();
    setErrors(nextErrors);
    const firstInvalid = ["name", "email", "message"].find((k) => nextErrors[k]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    setState("sending");
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("send failed");
      setState("sent");
      toast.success("Message sent. Thank you.");
    } catch {
      setState("idle");
      toast.error("Couldn't send just now, please email me directly instead.");
    }
  };

  if (state === "sent") {
    return (
      <div className="form-sent" data-testid="contact-form-success">
        <b>Message received.</b>
        Thanks for reaching out{form.name ? `, ${form.name}` : ""}. I'll get back to you at{" "}
        {form.email} soon.
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit} data-testid="contact-form" noValidate>
      <div className="form-field">
        <label htmlFor="cf-name">Your name</label>
        <input
          id="cf-name"
          name="name"
          ref={fieldRefs.name}
          value={form.name}
          onChange={set("name")}
          data-testid="contact-form-name"
          autoComplete="name"
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "cf-name-error" : undefined}
        />
        {errors.name && <p className="form-error" id="cf-name-error" role="alert">{errors.name}</p>}
      </div>
      <div className="form-field">
        <label htmlFor="cf-email">Your email</label>
        <input
          id="cf-email"
          name="email"
          type="email"
          ref={fieldRefs.email}
          value={form.email}
          onChange={set("email")}
          data-testid="contact-form-email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? "cf-email-error" : undefined}
        />
        {errors.email && <p className="form-error" id="cf-email-error" role="alert">{errors.email}</p>}
      </div>
      <div className="form-field">
        <label htmlFor="cf-message">What&rsquo;s on your mind?</label>
        <textarea
          id="cf-message"
          name="message"
          ref={fieldRefs.message}
          value={form.message}
          onChange={set("message")}
          data-testid="contact-form-message"
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? "cf-message-error" : undefined}
        />
        {errors.message && <p className="form-error" id="cf-message-error" role="alert">{errors.message}</p>}
      </div>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={state === "sending"}
        data-testid="contact-form-submit"
        style={{ width: "fit-content" }}
      >
        {state === "sending" ? "Sending…" : "Send message"} <Send size={14} />
      </button>
    </form>
  );
}

/* ========================================================================
   App
   ======================================================================== */

export default function App() {
  const lenis = useLenis();
  const [theme, setTheme] = useTheme();
  const [menu, setMenu] = useState(false);
  const [openOffer, setOpenOffer] = useState(null);
  const [toolsView, setToolsView] = useState("wall"); // "wall" | "grid"
  const [wallReplay, setWallReplay] = useState(0);     // bump to re-drop the stickers
  const [activeSection, setActiveSection] = useState("");
  const headerRef = useRef(null);
  const navToggleRef = useRef(null);
  const menuCloseRef = useRef(null);
  const wasMenuOpen = useRef(false);
  const { scrollY, scrollYProgress } = useScroll();

  /* Scroll progress across the whole "Selected work" sticky stack (not
     the whole-page one above) — feeds StackCard's depth effect. See
     useCardDepth for how each card reads its own slice of it. Doesn't
     touch the stack's own sticky top-offsets/CSS. */
  const stackRef = useRef(null);
  const stackFrameRef = useRef(null);
  /* The cards' travel is a full frame height, so it has to be the *measured*
     frame, not an assumed viewport: svh, the sticky top offset and the nav
     height all feed it, and a card that travels the wrong distance parks
     partly on screen. */
  const [stackFrameH, setStackFrameH] = useState(0);
  /* useLayoutEffect, not useEffect: this has to land before first paint. The
     cards' resting positions are derived from this height, so measuring it
     after paint means every card renders once at a fallback distance and then
     springs to the real one — a visible settle on load. */
  useLayoutEffect(() => {
    const el = stackFrameRef.current;
    if (!el) return;
    setStackFrameH(el.getBoundingClientRect().height);
    const ro = new ResizeObserver(([entry]) => setStackFrameH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /* "end end" rather than "end start": the spacer is taller than the frame by
     exactly the scroll this section should consume, so progress runs 0->1
     across that surplus. */
  const { scrollYProgress: stackProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });
  const STACK_TOTAL = workCards.length;

  /* Header compression */
  useMotionValueEvent(scrollY, "change", (y) => {
    headerRef.current?.style.setProperty("--p", Math.min(1, y / 120).toFixed(3));
  });

  /* Which nav item is current */
  useEffect(() => {
    const ids = navItems.map(([id]) => id).concat("contact");
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => { if (en.isIntersecting) setActiveSection(en.target.id); });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Undoes the menu's body pin and puts the document scroll back where it
     was. Held in a ref rather than closed over by the effect so that go() can
     call it early; a second call does nothing. Declared above go() because
     go() depends on it. */
  const scrollLockRef = useRef(null);
  const releaseScrollLock = useCallback(() => {
    const lock = scrollLockRef.current;
    if (!lock) return;
    scrollLockRef.current = null;
    document.body.classList.remove("menu-open");
    document.body.style.top = "";
    /* Restore through Lenis, not window.scrollTo, whenever it is running.
       Lenis keeps its own idea of the scroll position and ignores scroll
       events it did not cause while stopped, so a bare window.scrollTo here
       left it believing the page was still at 0 while the document sat
       hundreds of pixels down. Every later scrollTo would then animate from
       that stale origin — and if the stale origin happened to be near the
       target, Lenis would conclude it had already arrived and do nothing at
       all. `immediate` moves both the page and Lenis's own state together. */
    if (lock.lenis) {
      lock.lenis.start();
      lock.lenis.scrollTo(lock.y, { immediate: true, force: true });
    } else {
      window.scrollTo(0, lock.y);
    }
  }, []);

  /* Nav-link scrolling goes through Lenis (when it's ready) so a click feels
     like the same momentum as a manual scroll, rather than the browser's
     separate smooth-scroll curve. Falls back to native smooth scroll if
     Lenis hasn't mounted yet. */
  const go = useCallback((id) => {
    /* Release the menu's scroll lock *before* measuring anything. While the
       lock is on, <body> is position:fixed at a negative offset and
       window.scrollY reads 0, so a getBoundingClientRect-based target comes
       out short by exactly the locked scroll position — and then the lock's
       own restore-on-close would scroll back over the top of the navigation
       anyway. Releasing first fixes both: the page is a normal scrolling
       document again by the time the target is computed. */
    releaseScrollLock();
    setMenu(false);
    const top = id === "top" ? 0 : (() => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.scrollY - 90 : null;
    })();
    if (top === null) return;

    if (!lenis) {
      window.scrollTo({ top, behavior: "smooth" });
      return;
    }

    lenis.scrollTo(top, { duration: 1.2, force: true });

    /* Safety net. Lenis animates from a requestAnimationFrame loop, so if that
       loop is not running — or its internal position has drifted far enough
       that it thinks it has already arrived — scrollTo is dropped in silence
       and the link does nothing whatsoever, which is the one outcome a nav
       link must never have. 250ms in, this easing is ~75% of the way, so any
       real scroll has visibly started by then; if nothing has moved, finish
       the job natively.

       This is a guard, not a diagnosis: Eshani hit dead nav links on the
       deployed preview that could not be reproduced here, because Chrome
       suspends rAF in the backgrounded tab this gets tested from, which makes
       the frame-driven path unobservable. The check is cheap and cannot fire
       when the scroll is working.

       The fallback jumps rather than easing on purpose. Whatever stops Lenis
       animating — a suspended frame loop most likely — stops the browser's own
       smooth scroll for exactly the same reason, so asking for `smooth` here
       reproduces the failure instead of escaping it. Verified: with frames
       suspended, a `smooth` fallback still went nowhere; an instant one
       arrives. */
    const from = window.scrollY;
    window.setTimeout(() => {
      const movedNothing = Math.abs(window.scrollY - from) < 4;
      const hadSomewhereToGo = Math.abs(top - from) > 8;
      if (movedNothing && hadSomewhereToGo) window.scrollTo(0, top);
    }, 250);
  }, [lenis, releaseScrollLock]);

  /* Landing here with #work in the URL (e.g. the case-study page's "←
     Selected work" back button) should scroll to that section, not sit at
     the top of the page — the browser's own hash-scroll can't be relied on
     here since Lenis owns scroll and the hero above #work is still
     laying out right after mount. One-time effect (empty deps, so it can't
     double-fire once Lenis finishes initializing): a short delay lets
     Lenis's own mount effect (in index.js, a sibling/ancestor effect that
     hasn't necessarily run yet on this same commit) finish setting up, and
     `lenisRef` — kept in sync every render — is read at call time so this
     always sees the current instance rather than whatever `lenis` was
     when the effect first ran. */
  const lenisRef = useRef(lenis);
  useEffect(() => { lenisRef.current = lenis; }, [lenis]);
  useEffect(() => {
    if (window.location.hash !== "#work") return;
    const t = setTimeout(() => {
      const el = document.getElementById("work");
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.2 });
      else window.scrollTo({ top, behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  /* Menu scroll lock.

     `overflow: hidden` on <body> alone does not hold on iOS Safari — the page
     keeps scrolling behind the open panel, so closing the menu dropped the
     reader somewhere else entirely. Pinning the body with position:fixed at a
     negative offset is the lock that actually works there; the offset keeps
     the page looking unmoved, and the scroll position is put back by hand on
     close. Lenis is paused for the duration because on desktop it drives
     window scroll itself and would fight the pin.

     Releasing is a named function rather than an inline cleanup because a nav
     link has to be able to release it *early* — see go(). It is idempotent,
     so the effect cleanup running afterwards is a no-op. */
  useEffect(() => {
    if (!menu) return;
    const lenisNow = lenisRef.current;
    lenisNow?.stop();
    const y = window.scrollY;
    scrollLockRef.current = { y, lenis: lenisNow };
    document.body.classList.add("menu-open");
    document.body.style.top = `-${y}px`;
    return releaseScrollLock;
  }, [menu, releaseScrollLock]);

  /* Menu: close on Escape, manage focus in/out of the panel */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", onKey);

    if (menu) {
      menuCloseRef.current?.focus();
    } else if (wasMenuOpen.current) {
      navToggleRef.current?.focus();
    }
    wasMenuOpen.current = menu;

    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  /* Unmount safety net: never leave the body pinned if the tree goes away
     with the menu still open. */
  useEffect(() => () => {
    document.body.classList.remove("menu-open");
    document.body.style.top = "";
  }, []);

  return (
    <div className="portfolio-shell">
      <Preloader />
      <Toaster position="bottom-right" />
      <Cursor />

      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header" ref={headerRef} data-testid="portfolio-header">
        <div className="container nav-inner">
          <a
            href="#top"
            className="wordmark"
            data-testid="logo-link"
            onClick={(e) => { e.preventDefault(); go("top"); }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/es-logo/${theme === "paper" ? "black-logo.svg" : "logo-white.svg"}`}
              alt=""
              className="wordmark-logo"
            />
            Eshani
          </a>

          <nav className="nav-links" aria-label="Primary">
            {navItems.map(([id, label]) => (
              <a
                href={`#${id}`}
                key={id}
                data-testid={`nav-${id}`}
                aria-current={activeSection === id}
                onClick={(e) => { e.preventDefault(); go(id); }}
              >
                {label}
              </a>
            ))}
            <a
              href="#contact"
              className="nav-cta"
              data-testid="nav-contact"
              onClick={(e) => { e.preventDefault(); go("contact"); }}
            >
              Contact
            </a>
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="nav-resume"
            >
              Resume<span className="sr-only"> (opens in new tab)</span>
            </a>
          </nav>

          <div className="header-right">
            <ThemeSwitch theme={theme} setTheme={setTheme} />
            <button
              ref={navToggleRef}
              className="nav-toggle"
              onClick={() => setMenu(true)}
              aria-expanded={menu}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              data-testid="mobile-menu-button"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
        <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      </header>

      <div
        id="mobile-menu"
        className={`mobile-menu${menu ? " open" : ""}`}
        data-testid="mobile-menu"
        aria-hidden={!menu}
      >
        <button
          ref={menuCloseRef}
          className="mobile-menu-close"
          onClick={() => setMenu(false)}
          tabIndex={menu ? 0 : -1}
          data-testid="mobile-menu-close"
        >
          Close
        </button>
        <ul>
          {[...navItems, ["contact", "Contact"]].map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                data-testid={`mobile-nav-${id}`}
                tabIndex={menu ? 0 : -1}
                onClick={(e) => { e.preventDefault(); go(id); }}
              >
                {label}
                <ArrowUpRight size={20} />
              </a>
            </li>
          ))}
          <li>
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="mobile-nav-resume"
              tabIndex={menu ? 0 : -1}
              onClick={() => setMenu(false)}
            >
              Resume<span className="sr-only"> (opens in new tab)</span>
              <ArrowUpRight size={20} />
            </a>
          </li>
        </ul>
        <ThemeSwitch theme={theme} setTheme={setTheme} mobile tabIndex={menu ? 0 : -1} />
      </div>

      <main id="main">
        <AvatarHero theme={theme} go={go} />

        {/* ---------- design ---------- */}
        <section className="section" id="design">
          <div className="container hero-content-bottom">
            <h1 className="hero-main-title" data-testid="design-heading">
              <SplitText text="Designing clarity into" delay={0.05} />{" "}
              <SplitText text="complex systems." className="hero-serif-accent" delay={0.185} />
            </h1>

            <p className="hero-lede-text">
              I work across healthcare, AI, and enterprise products, using research,
              systems thinking, and interactive craft to make complex experiences
              easier to understand and navigate.
            </p>

            <div className="hero-btn-group">
              <Magnetic>
                <a
                  href="#work"
                  className="btn btn-primary"
                  data-testid="hero-work-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    go("work");
                  }}
                >
                  Explore selected work <ArrowDown size={16} />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#contact"
                  className="btn btn-secondary"
                  data-testid="hero-contact-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    go("contact");
                  }}
                >
                  Hire Me <ArrowDown size={16} />
                </a>
              </Magnetic>
            </div>
          </div>
        </section>

        {/* ---------- selected work — one unified sticky-stack ----------
             Three entries share one card template (StackCard) and one
             .stack, so scrolling through this section is a single
             continuous stacking sequence instead of separate sections with
             their own headings. Rebecca Everlene, DAB of India, and the
             screens-gallery card were removed from this section per
             request; their full case-study pages are untouched. ---------- */}
        <section className="section" id="work">
          <div className="container">
            <div className="section-head">
              <div>
                <Reveal><p className="section-label">Selected work</p></Reveal>
              </div>
            </div>

            <div className="stack" ref={stackRef} style={{ "--n": STACK_TOTAL }}>
              <div className="stack-frame" ref={stackFrameRef}>
                {workCards.map((card, i) => (
                  <StackCard
                    key={card.key}
                    i={i}
                    total={STACK_TOTAL}
                    progress={stackProgress}
                    card={card}
                    vh={stackFrameH}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- what I offer ---------- */}
        <section className="section section-bright" id="offer">
          <div className="container">
            <div className="section-head">
              <div>
                <Reveal><p className="section-label">What I offer</p></Reveal>
                <SplitText as="h2" text="Four disciplines, one design process." testId="offer-heading" delay={0.05} />
              </div>
              <Reveal delay={0.15}>
                <p className="desc">Expand any discipline for the detail behind it.</p>
              </Reveal>
            </div>
            <div className="offer-list">
              {offerings.map(([title, items], i) => {
                const isOpen = openOffer === i;
                return (
                  <div className="offer-item" key={title}>
                    <button
                      className="offer-head"
                      onClick={() => setOpenOffer(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      data-testid={`offer-toggle-${i}`}
                    >
                      <h3>{title}</h3>
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          className="offer-detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.38, ease: EASE }}
                          data-testid={`offer-detail-${i}`}
                        >
                          {items.length ? (
                            <ul>{items.map((it) => <li key={it}>{it}</li>)}</ul>
                          ) : (
                            <p className="offer-empty">Detail coming soon.</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- design tools ---------- */}
        {/* The heading block is shared by both views. In Wall it's handed to
            SkillStickerWall as children and rendered as a static overlay
            *inside* the physics container, with cubes piling behind and in
            front of it; in Grid it sits in normal flow above the grid. */}
        {(() => {
          const toolkitHead = (
            <div className="container">
              <div className="section-head">
                <div>
                  <Reveal><p className="section-label">Design Tools</p></Reveal>
                  <SplitText as="h2" text="What I design and build with." testId="tools-heading" delay={0.05} />
                </div>
                {/* Layout switch, scoped to this section only — no persistence,
                    it resets to the wall on reload. Pressing "Wall" while it's
                    already showing re-drops the cubes, so the button doubles
                    as a replay without needing a second control. */}
                <Reveal delay={0.1}>
                  <div className="tools-switch" role="group" aria-label="Tool logo layout">
                    <button
                      type="button"
                      className="tools-switch-btn"
                      aria-pressed={toolsView === "wall"}
                      onClick={() => {
                        if (toolsView === "wall") setWallReplay((n) => n + 1);
                        else setToolsView("wall");
                      }}
                      data-testid="tools-view-wall"
                    >
                      <Layers size={14} aria-hidden="true" /> Wall
                    </button>
                    <button
                      type="button"
                      className="tools-switch-btn"
                      aria-pressed={toolsView === "grid"}
                      onClick={() => setToolsView("grid")}
                      data-testid="tools-view-grid"
                    >
                      <LayoutGrid size={14} aria-hidden="true" /> Grid
                    </button>
                  </div>
                </Reveal>
              </div>
            </div>
          );

          return (
            <section className="section" id="tools" data-tools-view={toolsView}>
              {toolsView === "grid" ? (
                <>
                  {toolkitHead}
                  <div className="container">
                    <Reveal delay={0.15}><ToolGrid theme={theme} /></Reveal>
                  </div>
                </>
              ) : (
                <SkillStickerWall tools={tools} replayKey={wallReplay}>
                  {toolkitHead}
                </SkillStickerWall>
              )}
            </section>
          );
        })()}

        {/* ---------- about ---------- */}
        <section className="section section-bright" id="about">
          <div className="container about-grid">
            {/* The "About" label lives outside .about-copy so tablet/mobile can
                order it above the portrait while the rest of the copy stays
                below it. On desktop it sits in the copy column as before. */}
            <Reveal className="about-lead">
              <p className="section-label">About</p>
            </Reveal>
            <Reveal className="about-figure">
              <figure className="about-photo">
                <Wipe
                  src={IMG("profile.jpg")}
                  alt="Portrait of Eshani Somwanshi, product and UX designer."
                  testId="about-image-portrait"
                />
                <figcaption>Eshani Somwanshi · San Francisco, CA</figcaption>
              </figure>
            </Reveal>
            <Reveal className="about-copy" testId="about-copy">
              <p>
                Eshani Somwanshi is a product and UX designer working at the intersection of
                research, systems thinking, and visual craft. Her work spans healthcare, AI
                interaction design, and enterprise workflows, grounded in usability testing,
                heuristic evaluation, and close collaboration with product and engineering teams.
              </p>
              <p className="muted">
                She holds a Master of Science in Human-Computer Interaction from DePaul
                University and a Bachelor of Design in Industrial Design from Symbiosis
                Institute of Design. Her roles have taken her through Chicago, San Jose, and
                Pune: from AI-companion interaction design to regulated diagnostic tooling to
                0→1 gamified product experiences.
              </p>
              <dl className="about-facts">
                <div>
                  <dt>Education</dt>
                  <dd>MS, HCI · DePaul University, 2025</dd>
                </div>
                {/* No <dt> here on purpose — this entry groups under the "Education" heading above it. */}
                <div>
                  <dt></dt>
                  <dd>B.Des, Industrial Design · Symbiosis, 2022</dd>
                </div>
                <div><dt>Based in</dt><dd>San Francisco, Bay Area</dd></div>
                <div><dt>Focus</dt><dd>Healthcare · AI · Enterprise</dd></div>
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ---------- contact ---------- */}
        <section className="section contact" id="contact" style={{ paddingTop: 0 }}>
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              <span>Healthcare <em>·</em> AI <em>·</em> Enterprise <em>·</em>&nbsp;</span>
              <span>Healthcare <em>·</em> AI <em>·</em> Enterprise <em>·</em>&nbsp;</span>
            </div>
          </div>
          <div className="container contact-grid">
            <Reveal>
              <p className="eyebrow contact-eyebrow">Get in touch</p>
              <h2 data-testid="contact-heading">
                Hiring for a <em>Product/UX design</em> role?
              </h2>
              <p className="lede">
                I&rsquo;m open to Product/UX design roles across healthcare, AI, and enterprise
                systems. Send a message here, or reach out directly. I reply to every one.
              </p>
              <div className="contact-actions">
                <Magnetic>
                  <a href="mailto:eshani.swdesign@gmail.com" className="btn btn-secondary" data-testid="contact-email-link">
                    Email Eshani <ArrowUpRight size={15} />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a
                    href="https://www.linkedin.com/in/eshani-somwanshi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    data-testid="contact-linkedin-link"
                  >
                    View LinkedIn<span className="sr-only"> (opens in new tab)</span> <ArrowUpRight size={15} />
                  </a>
                </Magnetic>
              </div>
            </Reveal>
            <Reveal className="contact-side" testId="contact-side">
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-row">
          <span className="footer-location"><span className="footer-emoji">🌁</span> San Francisco, CA</span>
          <span className="footer-copyright">© {new Date().getFullYear()} Eshani Somwanshi</span>
          {/* Static sign-off. Scroll-to-top now lives entirely in the sticky
              BackToTop control (which expands to "Back to Top" at the foot
              of the page), so the footer doesn't need its own link. */}
          <span className="footer-top-link footer-signoff" data-testid="back-to-top-link">
            You are the sun <span className="footer-emoji">☀️</span>
          </span>
        </div>
      </footer>

      {/* Sticky back-to-top, per notes: stays on screen, bottom-right.
          Shared with the case-study pages — see primitives BackToTop. */}
      <BackToTop />
    </div>
  );
}