import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Menu, Minus, Plus, Send } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useLenis } from "./lib/smoothScroll";
import {
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
import AvatarHero from "./components/ui/AvatarHero";
import MacBookScroll from "./components/devices/MacBookScroll";
import Assemble from "./components/devices/Assemble";

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

const tools = [
  ["figma", "Figma"], ["framer", "Framer"], ["anthropic", "Claude"], ["openai", "ChatGPT"],
  ["miro", "Miro"], ["adobephotoshop", "Photoshop"], ["adobeillustrator", "Illustrator"],
  ["adobeaftereffects", "After Effects"], ["cursor", "Cursor"], ["canva", "Canva"],
  ["adobecreativecloud", "Adobe CC"], ["wordpress", "WordPress"], ["visualstudiocode", "VS Code"],
  ["axure", "Axure RP"], ["html5", "HTML5"], ["javascript", "JavaScript"], ["perplexity", "Perplexity"],
];

/* A denser wall of real screens, dropped between the two lead case studies —
   more of the actual work visible without a click-through, Brandon Lee
   Designs-style. Rendered as CSS-column masonry so each image keeps its
   native aspect ratio instead of being cropped into a uniform tile.
   myocircle-profile.png was dropped: its 3-phone composite is nearly 2.5x
   taller than everything else and dominated the grid awkwardly.
   myocircle-level13.png has the same problem (a single 700x2083 phone
   composite) but earns its spot on content, so it's capped with the "tall"
   flag below instead of being cut entirely — see .shot--tall in App.css. */
/* Natural pixel dimensions (w, h) are included so the <img> can reserve its
   aspect ratio before the lazy-loaded image downloads — without this, each
   image collapses to 0 height until loaded, which shifts everything below
   the gallery (About, Contact) down mid-scroll and throws off any in-flight
   scrollTo animation targeting a section further down the page. */
const shots = [
  ["onward-1.png", "Onward's EYE AI product site hero: “Enhance your practice with AI technology.”", "Onward Technologies · EYE AI", "The site clinicians land on first", false, 504, 420],
  ["myocircle-interaction.png", "MyoCircle exercise screen with Zoe's congratulations card after a completed exercise, awarding points.", "OptraHealth · MyoCircle", "Zoe's encouragement moment, mid-exercise", false, 1200, 481],
  ["travelogue-tripdetail.png", "Travelogue trip detail screen with people, map locations, and an itinerary hub.", "Travelogue", "One trip: people, places, and itinerary in one hub", false, 1200, 1595],
  ["myocircle-day1.png", "MyoCircle Day 1 exercise screen with a guided video, sets and reps tracking, and a Start Exercise button.", "OptraHealth · MyoCircle", "Where a session starts", false, 900, 675],
  ["myocircle-level13.png", "MyoCircle workout progress screen showing Level 13, 25% progress, and the Day 1 exercise video queue.", "OptraHealth · MyoCircle", "Progress and the exercise queue", true, 700, 2083],
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
   Tool marquee
   ======================================================================== */

function ToolMarquee({ theme }) {
  const ink = theme === "paper" ? "14130F" : theme === "petrol" ? "E4F1F2" : "F4F2ED";
  return (
    <div className="tool-marquee" aria-label="Tools of the trade" data-testid="tool-marquee">
      <div className="tool-track">
        {[...tools, ...tools].map(([slug, name], i) => (
          <span className="tool-tile" key={`${slug}-${i}`}>
            <img
              src={`https://cdn.simpleicons.org/${slug}/${ink}`}
              alt=""
              width="19"
              height="19"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ========================================================================
   02 — chaptered case study (EYE AI)
   ======================================================================== */

function CaseStudy({ go }) {
  const [active, setActive] = useState("ch-1");
  const flowRef = useRef(null);

  useEffect(() => {
    const root = flowRef.current;
    if (!root) return;
    const chapters = root.querySelectorAll(".chapter");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    chapters.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  const chapters = [["ch-1", "01", "Research"], ["ch-2", "02", "Method"], ["ch-3", "03", "Interface"]];

  return (
    <div className="case">
      <div className="case-rail">
        <Reveal>
          <p className="lead-index">Onward Technologies · EYE AI</p>
          <h3 data-testid="case-study-heading">
            Retinal Diagnostic Platform
          </h3>
          <p className="lead-subtitle">
            Streamlining complex diagnostics into a unified, actionable experience.
          </p>
          <p className="lead-role">UX Designer · Jul 2024 – Aug 2024 · Chicago, IL</p>
          <div className="case-metrics">
            <div>
              <div className="m-value"><CountUp value={20} suffix="%" /></div>
              <div className="m-label">Faster diagnostic tasks</div>
              <div className="m-method">Timed task testing, pre/post</div>
            </div>
            <div>
              <div className="m-value">10→7</div>
              <div className="m-label">Week MVP timeline</div>
              <div className="m-method">Against the original delivery plan</div>
            </div>
          </div>
          <ul className="case-highlights" data-testid="case-highlights-eye-ai">
            <li><Check size={15} /> Unified patient data, AI image analysis, and reporting into one clinical interface.</li>
            <li><Check size={15} /> Compressed MVP delivery timeline by 3 weeks through rapid prototyping and usability validation.</li>
            <li><Check size={15} /> Enabled clinicians to streamline diagnostic tasks 20% quicker while maintaining regulatory compliance.</li>
          </ul>
          <figure className="case-cover-preview">
            <Wipe
              src={IMG("onward-1.png")}
              alt="Eye AI product site: onboarding clinicians to the diagnostic platform"
              testId="case-onward-cover"
            />
          </figure>
          <nav className="chapter-nav" aria-label="Case study chapters">
            <ul>
              {chapters.map(([id, n, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active === id}
                    data-testid={`chapter-nav-${id}`}
                    onClick={(e) => { e.preventDefault(); go(id); }}
                  >
                    <span className="n">{n}</span> {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            to="/work/eye-ai"
            className="read-case"
            data-testid="read-case-eye-ai"
            style={{ marginTop: "1.6rem" }}
          >
            Open full case study <ArrowUpRight size={14} />
          </Link>
        </Reveal>
      </div>

      <div className="chapter-flow" ref={flowRef}>
        <article className="chapter" id="ch-1">
          <Reveal>
            <p className="section-label">01 · Research</p>
            <h4>Where clinicians lose time.</h4>
            <p>
              Applied heuristic evaluation and competitive analysis across 15+ stakeholder
              workshops to set design direction through 3 product pivots, directly reshaping
              sprint priorities and roadmap sequencing.
            </p>
          </Reveal>
        </article>

        <article className="chapter" id="ch-2">
          <Reveal>
            <p className="section-label">02 · Method</p>
            <h4>A defined path from research to handoff.</h4>
            <p>
              Journey mapping through wireframing, iterative prototyping, and high-fidelity
              delivery. Compressed the MVP timeline from 10 to 7 weeks through user-centered
              prototyping and early usability validation, eliminating 5 high-severity
              interaction issues before engineering commitment.
            </p>
          </Reveal>
        </article>

        <article className="chapter" id="ch-3">
          <Reveal>
            <p className="section-label">03 · Interface</p>
            <h4>The clinician&rsquo;s four minutes.</h4>
            <p>
              Diagnostic workflows and automated reporting for a B2B health-tech platform MVP,
              enabling clinicians to complete diagnostic tasks 20% faster while maintaining
              compliance in a regulated environment.
            </p>
          </Reveal>
          <div className="chapter-art">
            <MacBookScroll
              src={IMG("eyeai-cover.png")}
              alt="Eye AI clinician dashboard listing patients with diagnostic status and images analyzed."
              caption="Patient dashboard: status and diagnostic queue at a glance"
              testId="case-image-cover"
            />
          </div>
        </article>
      </div>
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
  const [showTop, setShowTop] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const headerRef = useRef(null);
  const navToggleRef = useRef(null);
  const menuCloseRef = useRef(null);
  const wasMenuOpen = useRef(false);
  const { scrollY, scrollYProgress } = useScroll();

  /* Header compression */
  useMotionValueEvent(scrollY, "change", (y) => {
    headerRef.current?.style.setProperty("--p", Math.min(1, y / 120).toFixed(3));
    setShowTop(y > 600);
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

  /* Nav-link scrolling goes through Lenis (when it's ready) so a click feels
     like the same momentum as a manual scroll, rather than the browser's
     separate smooth-scroll curve. Falls back to native smooth scroll if
     Lenis hasn't mounted yet. */
  const go = useCallback((id) => {
    setMenu(false);
    const top = id === "top" ? 0 : (() => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.scrollY - 90 : null;
    })();
    if (top === null) return;
    if (lenis) lenis.scrollTo(top, { duration: 1.2 });
    else window.scrollTo({ top, behavior: "smooth" });
  }, [lenis]);

  /* Menu: lock the page, close on Escape, manage focus in/out of the panel */
  useEffect(() => {
    if (menu) document.body.classList.add("menu-open");
    else document.body.classList.remove("menu-open");
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

  useEffect(() => () => document.body.classList.remove("menu-open"), []);

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
              src={`${process.env.PUBLIC_URL}/logo/${theme === "paper" ? "black-logo.svg" : "logo-white.svg"}`}
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

        {/* ---------- 01 lead project — OptraHealth (has shippable screens) ---------- */}
        <section className="section" id="work">
          <div className="container">
            <div className="section-head">
              <div>
                <Reveal><p className="section-label">Selected work</p></Reveal>
                <SplitText as="h2" text="An AI companion, built from zero." testId="work-heading" delay={0.05} />
              </div>
              <Reveal delay={0.15}>
                <p className="desc">
                  A hierarchy, not a grid: the work with the most to show leads,
                  everything else supports it.
                </p>
              </Reveal>
            </div>

            <Reveal>
              <article className="lead-panel" data-testid="project-card-optra">
                <div className="lead-top">
                  <span className="lead-index">01 · OptraHealth</span>
                  <span className="status-pill">Full case study</span>
                </div>
                <p className="lead-role" style={{ marginTop: "1.6rem" }}>
                  Product Designer · Dec 2024 – Mar 2025 · San Jose, CA
                </p>
                <h3
                  data-cursor="MyoCircle"
                  data-cursor-img={IMG("myocircle-cover.png")}
                >
                  Pediatric Therapy App <span className="quiet">(Zoe, an AI companion inside a health-tech platform)</span>
                </h3>
                <p className="lead-subtitle">
                  Companion-guided app connecting patients, parents, and providers.
                </p>
                {/* TODO(Eshani): the 3 checklist bullets you sent for OptraHealth were
                    identical to Onward's — looked like a copy/paste. Swap the paragraph
                    below for real OptraHealth-specific highlights once you have them. */}
                <div className="lead-media" data-cursor="MyoCircle">
                  <Wipe
                    src={IMG("myocircle-cover.png")}
                    alt="MyoCircle mobile app across two phones, an AI-companion health app with achievement badges and a gamified exercise flow."
                    testId="project-image-myocircle"
                  />
                </div>
                <div className="lead-body">
                  <div>
                    <p>
                      Primary designer for Zoe, building the interaction layer from the
                      ground up alongside mobile onboarding, a patient management dashboard,
                      and provider monitoring. Validated across 20+ usability and heuristic
                      evaluation sessions with patients, parents, and providers.
                    </p>
                  </div>
                  <div className="lead-metrics">
                    <div>
                      <div className="m-value"><CountUp value={30} suffix="%" /></div>
                      <div className="m-label">Weekly engagement ↑</div>
                      <div className="m-method">Post-launch vs. prior release</div>
                    </div>
                    <div>
                      <div className="m-value"><CountUp value={28} suffix="%" /></div>
                      <div className="m-label">Tutorial completion ↑</div>
                      <div className="m-method">Across 20+ sessions</div>
                    </div>
                    <div>
                      <div className="m-value"><CountUp value={100} suffix="+" /></div>
                      <div className="m-label">Component library</div>
                      <div className="m-method">Adopted by PMs and engineers</div>
                    </div>
                  </div>
                </div>
                <div className="lead-tags tag-row">
                  <span className="tag">AI companion</span>
                  <span className="tag">Healthcare SaaS</span>
                  <span className="tag">Design system</span>
                </div>
                <Link
                  to="/work/optrahealth"
                  className="read-case"
                  data-testid="read-case-optra"
                  style={{ marginTop: "1.8rem" }}
                >
                  Read the case study <ArrowUpRight size={14} />
                </Link>
              </article>
            </Reveal>
          </div>
        </section>

        {/* ---------- 02 chaptered case study ---------- */}
        <section className="section section-bright" id="case-onward">
          <div className="container">
            <div className="section-head">
              <div>
                <Reveal><p className="section-label">Case study 02</p></Reveal>
                <SplitText as="h2" text="From clinician pain points to a shippable diagnostic tool." delay={0.05} />
              </div>
              <Reveal delay={0.15}>
                <p className="desc">
                  A regulated B2B health-tech MVP, followed end to end: research, method,
                  and the interface they produced.
                </p>
              </Reveal>
            </div>
            <CaseStudy go={go} />
          </div>
        </section>

        {/* ---------- a closer look: real screens, no click-through ---------- */}
        <section className="section" id="gallery" aria-label="Selected screens">
          <div className="container">
            <div className="section-head">
              <div>
                <Reveal><p className="section-label">A closer look</p></Reveal>
                <SplitText as="h2" text="Real screens, not just covers." testId="gallery-heading" delay={0.05} />
              </div>
              <Reveal delay={0.15}>
                <p className="desc">
                  A handful of the actual interfaces behind the work above.
                </p>
              </Reveal>
            </div>
            {/* Plain <img>, not Wipe — Assemble already supplies the entrance
                motion, so a second clip-path reveal on top of it would just
                fight the fly-in. */}
            <Assemble className="shot-grid" spread={220} swirl={10} stagger={0.3}>
              {shots.map(([src, alt, tag, cap, tall, w, h], i) => (
                <figure className={`shot${tall ? " shot--tall" : ""}`} data-testid={`gallery-shot-${i}`} key={src}>
                  <div className="wipe">
                    <img
                      src={IMG(src)}
                      alt={alt}
                      width={w}
                      height={h}
                      loading="lazy"
                      decoding="async"
                      data-testid={`gallery-shot-img-${i}`}
                    />
                  </div>
                  <figcaption><b>{tag}</b>{cap}</figcaption>
                </figure>
              ))}
            </Assemble>
          </div>
        </section>

        {/* ---------- 03-05 supporting projects ---------- */}
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <Reveal><p className="section-label">Selected work 03, 04 &amp; 05</p></Reveal>
                <SplitText as="h2" text="Current 0→1 work, a travel concept, and brand at scale." delay={0.05} />
              </div>
              <Reveal delay={0.15}>
                <p className="desc">
                  A gamified B2C platform under NDA, a research-led travel concept, and
                  production design across a client roster.
                </p>
              </Reveal>
            </div>

            <div className="stack">
              {/* 03 — current role, under NDA. Third by design: the strongest work
                  a recruiter can actually see goes first. */}
              <Reveal className="stack-item" style={{ "--i": "0" }}>
                <article className="proj proj-compact" data-testid="project-card-rebecca">
                  <div className="proj-body">
                    <div>
                      <div className="lead-top">
                        <h3>Rebecca Everlene Trust Company</h3>
                        <span className="status-pill">Under NDA</span>
                      </div>
                      <p className="lead-role">UX/UI Designer · Oct 2025 – Present · Chicago, IL</p>
                    </div>
                    <div>
                      <p className="summary">
                        Leading design from discovery through high-fidelity execution for a
                        B2C web platform, restructuring dense financial content into gamified
                        learning modules, and partnering with product and engineering to keep
                        AI-driven features shippable.
                      </p>
                      <p className="nda-note">
                        Screens aren&rsquo;t public. The process is shareable and I&rsquo;m happy
                        to walk through the work live, just ask.
                      </p>
                      <div className="tag-row">
                        <span className="tag">0→1 product</span>
                        <span className="tag">Gamified learning</span>
                        <span className="tag">AI workflows</span>
                      </div>
                      <Link
                        to="/work/rebecca-everlene"
                        className="read-case"
                        data-testid="read-case-rebecca"
                        style={{ marginTop: "1.4rem" }}
                      >
                        Read the process <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    <div className="proj-metrics">
                      <div>
                        <div className="m-value"><CountUp value={25} suffix="%" /></div>
                        <div className="m-label">Task completion ↑</div>
                        <div className="m-method">Pre/post restructure</div>
                      </div>
                      <div>
                        <div className="m-value"><CountUp value={40} suffix="%" /></div>
                        <div className="m-label">Early drop-off ↓</div>
                        <div className="m-method">First-session funnel</div>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>

              {/* 04 — Travelogue.
                  TODO(Eshani): your notes marked this card's title, subtitle, and 3
                  checklist bullets as "I will input info here" — swap the summary
                  paragraph below for that copy once you've written it. */}
              <Reveal className="stack-item" style={{ "--i": "1" }}>
                <article className="proj proj-wide" data-testid="project-card-travelogue">
                  <div className="proj-media" data-cursor="Travelogue">
                    <Wipe
                      src={IMG("travelogue-cover.png")}
                      alt="Travelogue home feed and a group trip hub shown side by side on two phones."
                      testId="project-image-travelogue"
                    />
                  </div>
                  <div className="proj-body">
                    <div>
                      <h3 data-cursor="Travelogue" data-cursor-img={IMG("travelogue-login-thumb.png")}>Travelogue</h3>
                      <p className="lead-role">Product Designer · Personal case study · 2025</p>
                    </div>
                    <p className="summary">
                      A self-initiated, research-led concept that consolidates trip planning into
                      one home: upcoming trips, itineraries, documents, and the people coming
                      along, shaped directly by traveler interviews about offline access, group
                      coordination, and expense tracking.
                    </p>
                    <div className="tag-row">
                      <span className="tag">Personal project</span>
                      <span className="tag">Mobile UX</span>
                      <span className="tag">Research-led</span>
                    </div>
                    <Link to="/work/travelogue" className="read-case" data-testid="read-case-travelogue">
                      Read case study<span className="sr-only"> — Travelogue</span> <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </article>
              </Reveal>

              {/* 05 — DAB of India */}
              <Reveal className="stack-item" style={{ "--i": "2" }}>
                <article className="proj proj-compact" data-testid="project-card-dab">
                  <div className="proj-body">
                    <div>
                      <h3>DAB of India</h3>
                      <p className="lead-role">Visual Designer · Jan 2023 – Aug 2023 · Pune, India</p>
                    </div>
                    <div>
                      <p className="summary">
                        Built an AI-assisted design workflow spanning copy, mockups, and social
                        and print assets across 25+ clients, maintaining brand standards over
                        1,000+ assets, and designing brand pitch decks used directly in client
                        acquisition.
                      </p>
                      <div className="tag-row">
                        <span className="tag">Brand design</span>
                        <span className="tag">AI-assisted workflow</span>
                        <span className="tag">Client work</span>
                      </div>
                      <Link
                        to="/work/dab-of-india"
                        className="read-case"
                        data-testid="read-case-dab"
                        style={{ marginTop: "1.4rem" }}
                      >
                        Read case study<span className="sr-only"> — DAB of India</span> <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    <div className="proj-metrics">
                      <div>
                        <div className="m-value"><CountUp value={25} suffix="+" /></div>
                        <div className="m-label">Clients served</div>
                      </div>
                      <div>
                        <div className="m-value"><CountUp value={1000} suffix="+" comma /></div>
                        <div className="m-label">Assets maintained</div>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
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
        <section className="section" id="tools">
          <div className="container">
            <div className="section-head">
              <div>
                <Reveal><p className="section-label">Design tools</p></Reveal>
                <SplitText as="h2" text="What the work above was made with." testId="tools-heading" delay={0.05} />
              </div>
            </div>
            <Reveal delay={0.15}>
              <ToolMarquee theme={theme} />
            </Reveal>
          </div>
        </section>

        {/* ---------- about ---------- */}
        <section className="section section-bright" id="about">
          <div className="container about-grid">
            <Reveal>
              <figure className="about-photo">
                <Wipe
                  src={IMG("profile.png")}
                  alt="Portrait of Eshani Somwanshi, product and UX designer."
                  testId="about-image-portrait"
                />
                <figcaption>Eshani Somwanshi · San Francisco, CA</figcaption>
              </figure>
            </Reveal>
            <Reveal className="about-copy" testId="about-copy">
              <p className="section-label" style={{ marginBottom: "1rem" }}>About</p>
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
          <a
            href="#top"
            className="footer-top-link"
            data-testid="back-to-top-link"
            onClick={(e) => { e.preventDefault(); go("top"); }}
          >
            Back to top ↑
          </a>
        </div>
      </footer>

      {/* Sticky back-to-top, per notes: stays on screen, bottom-right. */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            className="back-to-top"
            onClick={() => go("top")}
            aria-label="Back to top"
            data-testid="back-to-top-button"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}