import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Play } from "lucide-react";
import RotateCard from "./components/devices/RotateCard";
import BeforeAfter from "./components/site/BeforeAfter";
import CaseStudyTOC from "./components/site/CaseStudyTOC";
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
import "./components/site/casestudytoc.css";

/* Renders a row of genuinely-empty placeholder tiles for content that has no
   matching asset in the codebase yet (see caseStudies.js `imagePlaceholders`
   on the eye-ai case study) — never a stand-in image, just an honest empty
   state so it's obvious more art is coming rather than looking broken. Each
   entry is either a caption string or null for a plain unlabeled slot. */
function ImagePlaceholderRow({ items }) {
  if (!items?.length) return null;
  return (
    <div className="cs-art-placeholders">
      {items.map((caption, i) => (
        <div className="cs-image-placeholder" key={i} role="img" aria-label={caption || "Image coming soon"}>
          <span>{caption || "Image coming soon"}</span>
        </div>
      ))}
    </div>
  );
}

/* One section in the fixed-taxonomy content model (Overview, Problem
   Statement, Research & Key Insights, ...) — used only by case studies that
   provide a `sections` array (currently eye-ai). Reuses the exact same
   RotateCard/Wipe image treatment as the legacy `chapters` rendering below,
   so real images keep their existing animation wrapper intact; this
   component only adds the *layout* around them. */
function CaseStudySection({ index, section, company }) {
  return (
    <section
      id={section.id}
      className="cs-section container"
      data-testid={`cs-section-${section.id}`}
    >
      <Reveal>
        <p className="section-label">{String(index).padStart(2, "0")} · {section.navLabel}</p>
        <h2>{section.title || section.navLabel}</h2>
        {section.paragraphs?.map((p, i) => <p className="cs-body" key={i}>{p}</p>)}
        {section.bullets && (
          <ul className="cs-bullets">
            {section.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
      </Reveal>

      {section.images && (
        <div className="cs-art">
          {section.images.map(([src, alt, cap], j) => (
            <RotateCard
              key={src}
              src={IMG(src)}
              alt={alt}
              caption={cap}
              from={j % 2 === 0 ? "left" : "right"}
              cursor={company.split(" ")[0]}
              testId={`case-image-${section.id}-${j}`}
            />
          ))}
        </div>
      )}
      <ImagePlaceholderRow items={section.imagePlaceholders} />

      {section.subsections?.map((sub, i) => (
        <div className="cs-subsection" key={i}>
          <h3>{sub.heading}</h3>
          {sub.paragraphs?.map((p, pi) => <p className="cs-body" key={pi}>{p}</p>)}
          {sub.images && (
            <div className="cs-art">
              {sub.images.map(([src, alt, cap], j) => (
                <RotateCard
                  key={src}
                  src={IMG(src)}
                  alt={alt}
                  caption={cap}
                  from={j % 2 === 0 ? "left" : "right"}
                  cursor={company.split(" ")[0]}
                  testId={`case-image-${section.id}-sub${i}-${j}`}
                />
              ))}
            </div>
          )}
          <ImagePlaceholderRow items={sub.imagePlaceholders} />
        </div>
      ))}
    </section>
  );
}

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

        {/* Sticky TOC + content: `sections` (fixed taxonomy, e.g. eye-ai) is
            reused as the source of nav entries when present; every other
            case study still renders exactly as before via `chapters`, just
            now with an id on each chapter section so the same shared TOC
            can link/scroll to them too.

            Overview (and the cover image, for studies that have one) live
            INSIDE this grid's content column, not above it — they used to
            sit in their own full-width .container ABOVE the two-column
            layout, so the sticky sidebar (whose "top" pins near the top of
            the viewport) would visually appear alongside that unrelated
            full-width text while scrolling past it, before the actual
            two-column section even started. Moving them into the same
            column as everything else the sidebar links to removes that
            overlap outright, at every breakpoint, rather than papering
            over it with spacing. */}
        <div className="container cs-toc-layout">
          <CaseStudyTOC
            sections={[
              { id: "overview", label: "Overview" },
              ...(study.sections
                ? study.sections.map((s) => ({ id: s.id, label: s.navLabel }))
                : study.chapters.map((ch, i) => ({ id: `chapter-${i + 1}`, label: ch.label }))),
            ]}
          />

          <div className="cs-toc-content">
            <section className="cs-overview" id="overview">
              {study.heroVideoPlaceholder && (
                <div className="cs-video-placeholder" role="img" aria-label="Video coming soon">
                  <span className="play-glyph"><Play size={16} /></span>
                  <span className="label">Video coming soon</span>
                </div>
              )}
              <Reveal><p className="lede">{study.overview}</p></Reveal>
              {!study.sections && <ReadModeToggle minutes={Math.max(3, study.chapters.length + 1)} />}
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
              <section className="cs-cover-section">
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

            {study.sections
              ? study.sections.map((s, i) => (
                  <CaseStudySection key={s.id} index={i + 1} section={s} company={study.company} />
                ))
              : study.chapters.map((ch, i) => (
                  <section className="cs-chapter" id={`chapter-${i + 1}`} key={ch.label} data-testid={`case-chapter-${i + 1}`}>
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
          </div>
        </div>

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