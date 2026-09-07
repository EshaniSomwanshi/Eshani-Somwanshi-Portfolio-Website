import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import InteractiveAvatar from "./InteractiveAvatar";

/**
 * AvatarHero
 * Inspired by uxdularia.com:
 * - Bold typographic backdrop ("ESHANI")
 * - Interactive mouse-tracking stylized avatar with lifelike eyes
 * - Two drifting parallax cloud layers (bubble cluster removed: too much
 *   competing motion above the headline)
 */
export default function AvatarHero({ theme = "paper", go }) {
  const reduced = useReducedMotion();
  const heroRef = useRef(null);

  // Mouse motion values for stage parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  /* Was { stiffness: 45, damping: 20 } — damping above critical (2·√45 ≈
     13.4, ratio ≈1.49) meant zero overshoot/bounce, so even though it's a
     spring it settled in a flat, mechanical ease rather than feeling
     alive. Lower damping ratio (~0.7, mildly underdamped) brings back a
     soft trailing wobble as it settles — livelier and more "springy"
     without wild oscillation. This governs raw cursor-position feel only;
     it does not touch the output ranges below that keep the clouds
     attached. */
  const springConfig = { stiffness: 120, damping: 16, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  /* Parallax offsets for different depth layers.
     These clouds are decorative SVG shapes drawn to bleed off the edges of
     .avatar-hero-stage (the enclosing rectangle) — their bezier paths dip
     past the SVG's own viewBox at each edge, but only by a small, fixed
     margin. The whole layer (SVG included) gets this x/y translate as one
     rigid transform, so any offset larger than that built-in margin drags
     the shape's edge away from the stage boundary and exposes bare
     background in the gap — confirmed visually: the previous range (up to
     ±30/±40px) revealed a ~22px seam at the back layer's left edge, and
     the back layer's top / front layer's bottom edges have essentially
     zero built-in bleed at all, so any offset there showed a gap almost
     1:1. Ranges below are unchanged from that fix — same verified-safe
     max displacement — and `clamp: true` is explicit (rather than relying
     on the library default) so that even if the now-livelier spring above
     overshoots past ±1, the cloud offset it produces can never exceed
     this boundary. */
  const cloudBackX = useTransform(smoothX, [-1, 1], [8, -8], { clamp: true });
  const cloudBackY = useTransform(smoothY, [-1, 1], [4, -4], { clamp: true });

  const cloudFrontX = useTransform(smoothX, [-1, 1], [-12, 12], { clamp: true });
  const cloudFrontY = useTransform(smoothY, [-1, 1], [-6, 6], { clamp: true });

  const handleMouseMove = (e) => {
    if (reduced) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseX.set((e.clientX - cx) / cx);
    mouseY.set((e.clientY - cy) / cy);
  };

  return (
    <section
      ref={heroRef}
      className="avatar-hero-section"
      onMouseMove={handleMouseMove}
      data-testid="avatar-hero-section"
      aria-label="Hero introduction"
    >
      {/* ================= AVATAR VIEWPORT BLOCK ================= */}
      <div className="avatar-hero-top">
        {/* ================= AVAILABILITY BAR ================= */}
        <div className="container hero-availability-row">
          <div className="hero-badge-row">
            <a
              href="#contact"
              className="avail-badge"
              data-testid="avail-badge-contact-link"
              onClick={(e) => {
                e.preventDefault();
                go("contact");
              }}
            >
              <span className="avail-pulse" />
              Hire me on your team
            </a>
            <span className="hero-location-pill">San Francisco, CA · Healthcare · AI · Systems</span>
          </div>
        </div>

        {/* ================= HERO STAGE ================= */}
        <div className="avatar-hero-stage">
          {/* Layer 1: Title — fixed in place, always in front of the avatar */}
          <div className="hero-backdrop-title" aria-hidden="true">
            <span className="backdrop-sub">
              <span className="backdrop-sub-line">Product Designer</span>
            </span>
          </div>

          {/* Layer 1b: Giant Background Typography — fixed in place, stays behind the avatar */}
          <div className="hero-backdrop-name" aria-hidden="true">
            <span className="backdrop-name">ESHANI</span>
          </div>

          {/* Layer 2: Background Clouds */}
          <motion.div
            className="hero-cloud-layer hero-cloud-back"
            style={reduced ? {} : { x: cloudBackX, y: cloudBackY }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 1440 600" fill="none" className="cloud-svg-back" preserveAspectRatio="none">
              <path
                d="M-80 0 C 120 100, 180 280, 40 380 C -60 450, -120 300, -120 0 Z"
                className="cloud-fill-warm"
              />
              <path
                d="M1520 0 C 1320 100, 1260 280, 1400 380 C 1500 450, 1560 300, 1560 0 Z"
                className="cloud-fill-warm"
              />
              <path
                d="M 100 0 C 350 80, 600 -40, 850 60 C 1100 140, 1300 30, 1440 0 L 1440 0 L 0 0 Z"
                className="cloud-fill-faint"
              />
            </svg>
          </motion.div>

          {/* Layer 3: Interactive Character Avatar (Eshani) */}
          <div className="hero-avatar-container">
            <InteractiveAvatar size={744} theme={theme} />
          </div>

          {/* Layer 4: Foreground Cloud Silhouette Bed */}
          <motion.div
            className="hero-cloud-layer hero-cloud-front"
            style={reduced ? {} : { x: cloudFrontX, y: cloudFrontY }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 1440 320" fill="none" className="cloud-svg-front" preserveAspectRatio="none">
              <path
                d="M-50 320 C 150 200, 300 240, 520 270 C 720 295, 920 220, 1140 260 C 1300 290, 1400 210, 1500 320 Z"
                className="cloud-fill-warm"
              />
              <path
                d="M-40 320 C 80 180, 260 170, 430 250 C 580 320, 860 320, 1010 250 C 1180 170, 1360 180, 1480 320 Z"
                className="cloud-fill-dark"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}