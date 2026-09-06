import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import RotateCard from "./components/devices/RotateCard";
import BeforeAfter from "./components/site/BeforeAfter";
import { ReadModeToggle, useReadMode } from "./components/site/ReadMode";
import { useLenis } from "./lib/smoothScroll";
import {
  EASE,
  IMG,
  Reveal,
  ThemeSwitch,
  Wipe,
  useTheme,
} from "./primitives";
import { caseStudies } from "./caseStudies";
import "./App.css";

export default function CaseStudyPage() {
  const { slug } = useParams();
  const lenis = useLenis();
  const [theme, setTheme] = useTheme();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [readMode] = useReadMode();
  const study = caseStudies.find((s) => s.slug === slug);

  // React Router doesn't reset scroll position on client-side navigation —
  // jump to the top of the new case study immediately (no easing) whenever
  // the slug changes, going through Lenis so its internal position stays
  // in sync with the real scroll offset.
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [slug, lenis]);

  // Keep the document title in sync — recruiters bookmark and share these.
  useEffect(() => {
    const base = "Eshani Somwanshi · Product & UX Designer";
    document.title = study
      ? `${study.titleLines.join(" ")} · ${study.company} | Eshani Somwanshi`
      : base;
    return () => {
      document.title = base;
    };
  }, [study]);

  if (!study) {
    return (
      <div className="container" style={{ paddingTop: "8rem", minHeight: "70vh" }}>
        <p className="section-label">Case study not found</p>
        <h1 className="cs-title" style={{ marginBottom: "2rem" }}>
          That project isn&rsquo;t here.
        </h1>
        <Link to="/" className="read-case" data-testid="case-notfound-home">
          Back to all work <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  const idx = caseStudies.indexOf(study);
  const next = caseStudies[(idx + 1) % caseStudies.length];

  return (
    <div data-testid={`case-page-${study.slug}`}>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="cs-header">
        <div className="container cs-header-inner">
          <Link to="/" className="cs-back" data-testid="case-back-link">
            <ArrowLeft size={15} /> Selected work
          </Link>
          <span className="wordmark"><b>ES/</b>ESHANI SOMWANSHI</span>
          <ThemeSwitch theme={theme} setTheme={setTheme} />
        </div>
        <motion.div
          className="scroll-progress"
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
      </header>

      <main id="main">
        <section className="cs-hero container">
          <motion.p
            className="eyebrow"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: EASE }}
            data-testid="case-eyebrow"
          >
            {study.company} · {study.period}
          </motion.p>

          <h1 className="cs-title" data-testid="case-title">
            {study.titleLines.map((line, i) => (
              <span className="line" key={line}>
                <motion.span
                  initial={reduced ? false : { y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.95, delay: 0.1 + i * 0.1, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            className="cs-meta"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, delay: 0.45, ease: EASE }}
          >
            <span className="lead-role" style={{ margin: 0 }}>{study.role}</span>
            <div className="tag-row">
              {study.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
            </div>
          </motion.div>
        </section>

        <section className="cs-metrics-band" aria-label="Outcomes">
          <div className="container cs-metrics-row">
            {study.metrics.map(([v, l]) => (
              <div key={l} data-testid={`case-metric-${l.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                <div className="m-value num">{v}</div>
                <div className="m-label">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="cs-overview container">
          <Reveal><p className="lede">{study.overview}</p></Reveal>
          <ReadModeToggle minutes={Math.max(3, study.chapters.length + 1)} />
          {study.confidential && (
            <Reveal delay={0.1}>
              <p className="note-strip" data-testid="case-nda-note">
                This engagement is under NDA: screens aren&rsquo;t public yet. The process
                below is shareable; the pixels aren&rsquo;t. Happy to walk through the work live.
              </p>
            </Reveal>
          )}
        </section>

        {study.cover && (
          <section className="cs-cover-section container">
            <Reveal>
              <figure className="cs-cover" data-testid="case-cover">
                <Wipe
                  src={IMG(study.cover[0])}
                  alt={study.cover[1]}
                  testId="case-cover-image"
                />
              </figure>
            </Reveal>
          </section>
        )}

        {study.chapters.map((ch, i) => (
          <section className="cs-chapter container" key={ch.label} data-testid={`case-chapter-${i + 1}`}>
            <Reveal>
              <p className="section-label">
                {String(i + 1).padStart(2, "0")} · {ch.label}
              </p>
              <h2>{ch.title}</h2>
              {readMode === "skim" ? (
                <p className="cs-skim">{ch.skim || ch.body}</p>
              ) : (
                <p className="cs-body">{ch.body}</p>
              )}
            </Reveal>

            {ch.beforeAfter && (
              <BeforeAfter
                before={IMG(ch.beforeAfter[0])}
                after={IMG(ch.beforeAfter[1])}
                beforeLabel={ch.beforeAfter[2]}
                afterLabel={ch.beforeAfter[3]}
                beforeAlt={`${ch.beforeAfter[2]}, ${study.company}`}
                afterAlt={`${ch.beforeAfter[3]}, ${study.company}`}
                caption={ch.beforeAfter[4]}
                testId={`case-beforeafter-${study.slug}`}
              />
            )}

            {ch.images && (
              <div className={ch.phone ? "phone-row" : "cs-art"}>
                {ch.images.map(([src, alt, cap], j) => 
                 ch.phone ? (
                  /* figcaption now lives inside its own <figure>. Previously it
                     sat next to the Wipe <figure> as a loose sibling in a <div>,
                     which is invalid HTML and lost the caption association. */
                  <figure
                    className="phone cs-shot"
                    key={src}
                    data-cursor={study.company.split(" ")[0]}
                  >
                    <Wipe
                      src={IMG(src)}
                      alt={alt}
                      delay={j * 0.1}
                      fit="contain"
                      zoom={false}
                      testId={`case-image-${study.slug}-${j}`}
                    />
                    <figcaption>{cap}</figcaption>
                  </figure>
                ) : (
                  <RotateCard
                    key={src}
                    src={IMG(src)}
                    alt={alt}
                    caption={cap}
                    from={j % 2 === 0 ? "left" : "right"}
                    cursor={study.company.split(" ")[0]}
                    testId={`case-image-${study.slug}-${j}`}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        <section className="cs-next">
          <div className="container">
            <Reveal>
              <p className="section-label">Next project</p>
              <Link to={`/work/${next.slug}`} className="cs-next-link" data-testid="case-next-link">
                {next.titleLines.join(" ")} <ArrowUpRight size={30} />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-row">
          <span className="footer-location"><span className="footer-emoji">🌁</span> San Francisco, CA</span>
          <span className="footer-copyright">© {new Date().getFullYear()} Eshani Somwanshi</span>
          <Link to="/" className="footer-top-link" data-testid="case-footer-home">Back to all work ↑</Link>
        </div>
      </footer>
    </div>
  );
}