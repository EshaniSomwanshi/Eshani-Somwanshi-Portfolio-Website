import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useLenis } from "../../lib/smoothScroll";

/* ---------------------------------------------------------------------------
   CaseStudyTOC — sticky table-of-contents sidebar, shared across every case
   study page.

   Purely presentational + scrollspy: it knows nothing about a specific case
   study's content model. Callers pass a `sections` array of
   `{ id, label }` for whatever sections actually exist on THAT page (already
   filtered down — pass only sections with real content, so there's never an
   empty/dead nav item to render). It renders nothing if `sections` is empty.

   Scrollspy uses IntersectionObserver (not scroll-position math) to track
   which section is currently in view, matching the same rootMargin band
   App.js already uses for the main nav's active-section detection, so the
   two systems feel consistent if they're ever visible at once.
--------------------------------------------------------------------------- */
export default function CaseStudyTOC({ sections, testId = "case-toc" }) {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const idsKey = sections.map((s) => s.id).join("|");

  useEffect(() => {
    if (!sections.length) return undefined;
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!els.length) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (!sections.length) return null;

  const go = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    if (reduced) {
      window.scrollTo(0, top);
    } else if (lenis) {
      lenis.scrollTo(top, { duration: 1.1 });
    } else {
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActiveId(id);
  };

  return (
    <nav className="cs-toc" aria-label="Case study sections" data-testid={testId}>
      <p className="cs-toc-heading">On this page</p>
      <ul className="cs-toc-list">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="cs-toc-link"
              aria-current={activeId === s.id ? "true" : undefined}
              onClick={go(s.id)}
              data-testid={`${testId}-link-${s.id}`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
