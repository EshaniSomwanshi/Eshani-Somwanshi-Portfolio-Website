import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import Lenis from "lenis";
import "@/index.css";
import App from "@/App";
import CaseStudyPage from "@/CaseStudyPage";
import { ReadModeProvider } from "@/components/site/ReadMode";
import { LenisContext } from "@/lib/smoothScroll";

/* Smooth inertia scrolling, applied once at the root so it covers every
   route. No `wrapper`/`content` options are passed, so Lenis attaches
   directly to window/document scroll (not a wrapper div) — native scroll
   listeners (framer-motion's useScroll, IntersectionObserver-based nav
   highlighting) keep working unmodified. Touch is left native
   (syncTouch defaults to false) since smoothing touch scroll tends to
   feel worse than the OS's own momentum.

   The RAF loop is explicit and manual — lenis.raf(time) must be called
   every frame for the instance to do anything; without it, Lenis is
   inert and scrolling stays completely native.

   Skipped entirely under prefers-reduced-motion: Lenis drives scroll via
   JS/rAF rather than native CSS scrolling, so the site-wide
   `scroll-behavior: auto !important` reduced-motion rule in App.css has
   no effect on it — every nav click and "back to top" would otherwise
   still play the full eased momentum scroll. Every consumer (App.js's
   `go()`, CaseStudyPage's route-change scroll reset) already falls back
   to plain `window.scrollTo` when `lenis` is null, so leaving it
   uninstantiated here is a complete fix, not a partial one. */
function SmoothScrollProvider({ children }) {
  const [lenis, setLenis] = useState(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setLenis(null);
      return;
    }
    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId;
    function raf(time) {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    setLenis(instance);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <SmoothScrollProvider>
      <BrowserRouter>
        <ReadModeProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/work/:slug" element={<CaseStudyPage />} />
            <Route path="*" element={<App />} />
          </Routes>
        </ReadModeProvider>
      </BrowserRouter>
    </SmoothScrollProvider>
    <Analytics />
  </React.StrictMode>,
);
