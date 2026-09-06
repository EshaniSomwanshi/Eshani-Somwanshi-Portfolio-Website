import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

export const IMG = (name) => `${process.env.PUBLIC_URL}/images/${name}`;

/* Shared motion language -------------------------------------------------- */
export const EASE = [0.22, 0.61, 0.36, 1]; // entrances — fast out, long settle
export const EASE_STATE = [0.65, 0, 0.35, 1]; // state changes — symmetrical

export const THEMES = [
  { id: "paper", label: "Paper", color: "#F2EEE7" },
  { id: "carbon", label: "Carbon", color: "#0B0B0B" },
  { id: "petrol", label: "Petrol", color: "#052A31" },
];

/* Theme ------------------------------------------------------------------- */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("portfolio-theme") || "paper";
    } catch {
      return "paper";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      /* private mode — ignore */
    }
    // Keep the browser chrome (mobile address bar) in sync with the palette.
    const meta = document.querySelector('meta[name="theme-color"]');
    const entry = THEMES.find((t) => t.id === theme);
    if (meta && entry) meta.setAttribute("content", entry.color);
  }, [theme]);

  return [theme, setTheme];
}

/* Count-up ---------------------------------------------------------------- */
export function CountUp({ value, suffix = "", comma = false }) {
  const target = typeof value === "string" ? parseFloat(value) : value;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const reduced = useReducedMotion();
  const final = (comma ? target.toLocaleString("en-US") : target) + suffix;
  const [display, setDisplay] = useState(reduced ? final : "0" + suffix);

  useEffect(() => {
    if (reduced) {
      setDisplay(final);
      return;
    }
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) =>
        setDisplay(
          (comma ? Math.round(v).toLocaleString("en-US") : Math.round(v)) +
            suffix,
        ),
    });
    return () => controls.stop();
  }, [inView, reduced, target, suffix, comma, final]);

  return (
    <span ref={ref} className="num">
      {display}
    </span>
  );
}

/* Generic in-view reveal --------------------------------------------------- */
export function Reveal({
  children,
  delay = 0,
  className = "",
  testId,
  amount = 0.15,
  y = 26,
  style,
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      data-testid={testId}
      style={style}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.72, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Word-by-word masked headline reveal -------------------------------------
   Each word sits inside its own overflow-hidden wrapper so words rise out of
   a mask instead of simply fading. Wrappers carry padding + negative margin so
   descenders (g, y, p) are never clipped. */
export function SplitText({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 0.045,
  once = true,
  testId,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.4 });
  const reduced = useReducedMotion();
  const words = String(text).split(" ");

  return (
    <Tag ref={ref} className={`split ${className}`} data-testid={testId}>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span className="split-w">
            <motion.span
              className="split-i"
              initial={reduced ? { opacity: 0 } : { y: "110%" }}
              animate={inView ? (reduced ? { opacity: 1 } : { y: 0 }) : undefined}
              transition={{
                duration: 0.85,
                delay: delay + i * stagger,
                ease: EASE,
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

/* Clip-path image wipe -----------------------------------------------------
   Renders a <div>, not a <figure>, so callers can wrap it in their own
   <figure>/<figcaption> without nesting figures (invalid HTML in the old
   version). Border and background live on the caller, so frames never
   double up. */
export function Wipe({
  src,
  alt,
  delay = 0,
  className = "",
  testId,
  ratio,
  fit = "cover",
  position = "center",
  zoom = true,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduced = useReducedMotion();

  return (
    <div
      ref={ref}
      className={`wipe${zoom ? " wipe-zoom" : ""} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        data-testid={testId}
        style={{ objectFit: fit, objectPosition: position }}
        initial={
          reduced
            ? { opacity: 0 }
            : { opacity: 1, clipPath: "inset(0 100% 0 0)", scale: 1.06 }
        }
        animate={
          inView
            ? { opacity: 1, clipPath: "inset(0 0% 0 0)", scale: 1 }
            : undefined
        }
        transition={{ duration: 1.05, delay, ease: EASE }}
      />
    </div>
  );
}

/* Magnetic hover ----------------------------------------------------------- */
export function Magnetic({ children, strength = 0.28, className = "" }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });

  const onMove = (e) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className={`magnetic ${className}`}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x, y }}
    >
      {children}
    </motion.span>
  );
}

/* Theme switch — collapsed to a single pill showing the active theme;
   expands inline into all three options (active first) on click, Apple-style
   expanding/collapsible capsule. Picking an option or clicking outside
   collapses it back down. ------------------------------------------------- */
export function ThemeSwitch({ theme, setTheme, mobile = false, tabIndex }) {
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  const ref = useRef(null);

  useEffect(() => {
    if (!expanded) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setExpanded(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const active = THEMES.find((t) => t.id === theme) || THEMES[0];
  const shown = expanded ? [active, ...THEMES.filter((t) => t.id !== theme)] : [active];

  const pill = (
    <motion.div
      ref={ref}
      layout
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38, mass: 0.7 }}
      className={`theme-switch${mobile ? " theme-switch-mobile" : " theme-switch-floating"}${expanded ? " is-expanded" : ""}`}
      role="group"
      aria-label="Colour theme"
      data-testid={mobile ? "theme-switch-mobile" : "theme-switch"}
    >
      <AnimatePresence initial={false}>
        {shown.map((t, i) => (
          <motion.button
            type="button"
            key={t.id}
            layout
            initial={reduced ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
            transition={{
              layout: reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38, mass: 0.7 },
              opacity: { duration: 0.16, delay: expanded ? i * 0.03 : 0 },
              scale: { duration: 0.16, delay: expanded ? i * 0.03 : 0 },
            }}
            className="theme-dot"
            data-theme-value={t.id}
            aria-pressed={theme === t.id}
            aria-expanded={i === 0 ? expanded : undefined}
            tabIndex={tabIndex}
            onClick={() => {
              if (!expanded) setExpanded(true);
              else if (t.id === theme) setExpanded(false);
              else { setTheme(t.id); setExpanded(false); }
            }}
            data-testid={`theme-${t.id}-button`}
          >
            <span className="theme-swatch" aria-hidden="true" />
            <span className="theme-name">{t.label}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </motion.div>
  );

  if (mobile) return pill;

  // Desktop: the pill floats absolutely, anchored to its own right edge, so
  // expanding/collapsing never reflows the rest of the nav row (wordmark,
  // links) and always grows leftward instead of pushing its right edge out.
  // This invisible spacer reserves the collapsed pill's real footprint
  // (measured from its own rendered markup, not a guessed pixel value) so
  // the surrounding flex layout sees a constant-width slot at all times.
  return (
    <span className="theme-switch-anchor">
      <span className="theme-switch-spacer" aria-hidden="true">
        <span className="theme-switch">
          <span className="theme-dot" data-theme-value={active.id} aria-pressed="true">
            <span className="theme-swatch" />
            <span className="theme-name">{active.label}</span>
          </span>
        </span>
      </span>
      {pill}
    </span>
  );
}

/* Preloader moved to components/site/Preloader.jsx — bouncing letters. */