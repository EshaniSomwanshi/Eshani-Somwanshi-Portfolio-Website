/* ExplorationAvatar — the working copy of the avatar for /exploration.

   Now the 3D-rendered portrait itself (assets/avatar-3d.webp: the reference
   image with its background removed by macOS Vision subject lifting),
   brought to life with the same kind of motion as the original avatar.

   The image is imported, not served from public/, so it only exists inside
   the lazily-loaded exploration chunk — production builds leave that chunk
   out (lib/exploration.js), so the file never ships to the live site.

   Previous version (hand-drawn SVG) is in git history at ac6ac5a. The live
   home-page avatar (components/ui/InteractiveAvatar.jsx) is untouched.

   Motion — a flat image has no separate eyes, mouth or earrings, so the
   per-feature motion of the SVG avatar (eye tracking, blink, smile, jhumka
   swing) can't apply here. What carries over:
     - 3D tilt toward the cursor (perspective rotateX/Y) + small parallax
     - idle drift when the cursor is still, like the original
     - slow float
     - a moving light: a soft highlight, clipped to her silhouette, that
       slides with the cursor so the surface reads as lit and rounded
   All of it is off under prefers-reduced-motion. */
import React, { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import avatar from "./assets/avatar-3d.webp";

export default function ExplorationAvatar({ size = 560, interactive = true }) {
  const reduced = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { stiffness: 90, damping: 18, mass: 0.5 };
  const sx = useSpring(mouseX, spring);
  const sy = useSpring(mouseY, spring);

  // Tilt and parallax: a little stronger than the SVG figure's ±5° because a
  // single image has no inner layers moving to add life.
  const rotateY = useTransform(sx, [-1, 1], [-9, 9]);
  const rotateX = useTransform(sy, [-1, 1], [6, -6]);
  const x = useTransform(sx, [-1, 1], [-8, 8]);
  const y = useTransform(sy, [-1, 1], [-5, 5]);

  // Light follows the cursor: the side she turns toward catches it.
  const lightX = useTransform(sx, [-1, 1], [30, 70]);
  const lightY = useTransform(sy, [-1, 1], [22, 48]);
  const light = useMotionTemplate`radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,246,232,0.42), rgba(255,246,232,0) 46%)`;

  useEffect(() => {
    if (!interactive || reduced) return;
    let raf = null;
    let lastMove = Date.now();

    const onMove = (e) => {
      lastMove = Date.now();
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        mouseX.set(Math.max(-1, Math.min(1, (e.clientX - cx) / cx)));
        mouseY.set(Math.max(-1, Math.min(1, (e.clientY - cy) / cy)));
      });
    };
    const onTouch = (e) => {
      if (e.touches && e.touches[0]) onMove(e.touches[0]);
    };

    // Same idle behaviour as the original: after 4s without input, drift.
    const idle = setInterval(() => {
      if (Date.now() - lastMove < 4000) return;
      const t = Date.now() / 1600;
      mouseX.set(Math.sin(t) * 0.3);
      mouseY.set(Math.cos(t * 0.7) * 0.18);
    }, 120);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      if (raf) cancelAnimationFrame(raf);
      clearInterval(idle);
    };
  }, [interactive, reduced, mouseX, mouseY]);

  // Her silhouette, reused as a mask so the light only falls on her.
  const silhouette = {
    WebkitMaskImage: `url(${avatar})`,
    maskImage: `url(${avatar})`,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };

  return (
    <div
      data-testid="exploration-interactive-avatar"
      style={{
        width: "100%",
        maxWidth: `${size}px`,
        margin: "0 auto",
        perspective: "1100px",
        userSelect: "none",
      }}
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          style={
            reduced
              ? { position: "relative" }
              : { position: "relative", rotateX, rotateY, x, y, transformOrigin: "50% 60%" }
          }
        >
          <img
            src={avatar}
            alt="Eshani's avatar"
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              filter: "drop-shadow(0 22px 40px rgba(24,16,10,0.18))",
            }}
          />
          {!reduced && (
            <motion.div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: light,
                mixBlendMode: "soft-light",
                pointerEvents: "none",
                ...silhouette,
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
