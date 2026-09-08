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
     These clouds are decorative SVG shapes that get this x/y translate as a
     rigid transform. Earlier fixes chased the problem of the shape's edge
     pulling away from .avatar-hero-stage's clipped border by shrinking the
     translate to fit inside each path's small built-in bleed — but that
     bleed, measured in viewBox units and then stretched by
     `preserveAspectRatio="none"`, is a *variable* number of CSS px
     depending on viewport width/height, so a displacement that was safe at
     one size re-exposed a seam at another.

     The durable fix moved to CSS: `.hero-cloud-layer` is now sized well
     past the stage on every edge (`--cloud-overscan`, a clamp() that always
     exceeds the max displacement below), and the stage's `overflow: hidden`
     clips the surplus. So the painted cloud edge is always outside the clip
     no matter the viewport, and the translate just slides more of an
     already-overflowing shape into view. That freed the range back up for a
     livelier drift. `clamp: true` stays explicit so the mildly underdamped
     spring above can't push the offset past these bounds even if it
     overshoots ±1 — keep the maxima below `--cloud-overscan`'s floor. */
  const cloudBackX = useTransform(smoothX, [-1, 1], [42, -42], { clamp: true });
  const cloudBackY = useTransform(smoothY, [-1, 1], [24, -24], { clamp: true });

  const cloudFrontX = useTransform(smoothX, [-1, 1], [-60, 60], { clamp: true });
  const cloudFrontY = useTransform(smoothY, [-1, 1], [-32, 32], { clamp: true });

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