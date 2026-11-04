/* ExplorationVectorAvatar — the 2D avatar drawing, rebuilt as a layered
   vector puppet and rigged like the original avatar (2.5D).

   Source: Eshani's flat 2D drawing (assets/avatar-2d-cutout.webp, background
   removed). trace_avatar_2d.py reduces it to flat colours and traces every
   colour area as a smooth vector shape, split into rig layers
   (avatar2dLayers.js):
     hairBack + hair (sways) · body: face, neck, ears, kurta (static)
     lines: line art, kept as its own crisp layer · pendant · bindi
     brows (lift) · eyes: white, iris (tracks the cursor), lashes
     mouth (widens on hover) · jhumkas (swing)
   Brows and jhumkas were painted out of the base before tracing, so nothing
   ghosts behind them when they move. Lids for blinking are drawn here.

   Motion, as on the original avatar: cursor-tracking irises, blinking (with
   an occasional double), brow lift, wider smile on hover, jhumka swing, hair
   sway, whole-figure 3D tilt + parallax, idle drift, float. All off under
   prefers-reduced-motion. (No head-slide: face and neck are one traced
   area.) Previous versions are in git history. */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { META, LAYERS } from "./avatar2dLayers";

const PUPIL_TRAVEL = 7; // px the irises can move inside the eye

// Closed-lid lash lines, measured on the drawing (left/right eye).
const CLOSED = {
  L: "M300 470 C326 500 380 506 408 484",
  R: "M506 484 C534 506 588 500 608 470",
};

function Shapes({ list, filter }) {
  return (
    <g filter={filter}>
      {(list || []).map((p, i) => <path key={i} d={p.d} fill={p.fill} fillRule="evenodd" />)}
    </g>
  );
}

function Eye({ side, pupil, closed, eyeRef }) {
  const open = LAYERS[`eye${side}Open`][0];
  return (
    <g ref={eyeRef}>
      <clipPath id={`x2-eye-${side}`}><path d={open.d} /></clipPath>
      <path d={open.d} fill={open.fill} />
      <g clipPath={`url(#x2-eye-${side})`}>
        <g transform={`translate(${pupil.x} ${pupil.y})`}>
          <Shapes list={LAYERS[`eye${side}Iris`]} />
        </g>
      </g>
      <Shapes list={LAYERS[`eye${side}Lash`]} />
      {closed && (
        <g>
          <path d={open.d} fill={META.lid[side]} stroke={META.lid[side]} strokeWidth="6" />
          <path d={CLOSED[side]} stroke="#141114" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      )}
    </g>
  );
}

export default function ExplorationVectorAvatar({ size = 560, interactive = true }) {
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);
  const eyeLRef = useRef(null);
  const eyeRRef = useRef(null);
  const [pupilL, setPupilL] = useState({ x: 0, y: 0 });
  const [pupilR, setPupilR] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [happy, setHappy] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { stiffness: 90, damping: 18, mass: 0.5 };
  const sx = useSpring(mouseX, spring);
  const sy = useSpring(mouseY, spring);

  // Same ranges as the original avatar; distances scaled to this ~2x canvas.
  const rotateY = useTransform(sx, [-1, 1], [-5, 5]);
  const rotateX = useTransform(sy, [-1, 1], [3.5, -3.5]);
  const figX = useTransform(sx, [-1, 1], [-10, 10]);
  const figY = useTransform(sy, [-1, 1], [-7, 7]);
  const browY = useTransform(sy, [-1, 1], [-4, 2.4]);
  const earL = useTransform(sx, [-1, 1], [-8, 12]);
  const earR = useTransform(sx, [-1, 1], [-12, 8]);

  const updatePupils = useCallback((clientX, clientY) => {
    const calc = (el) => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      const dx = clientX - (r.left + r.width / 2);
      const dy = clientY - (r.top + r.height / 2);
      const a = Math.atan2(dy, dx);
      const rad = Math.min(PUPIL_TRAVEL, Math.hypot(dx, dy) / 30);
      return { x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.6 };
    };
    setPupilL(calc(eyeLRef.current));
    setPupilR(calc(eyeRRef.current));
  }, []);

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
        updatePupils(e.clientX, e.clientY);
      });
    };
    const onTouch = (e) => { if (e.touches && e.touches[0]) onMove(e.touches[0]); };
    const idle = setInterval(() => {
      if (Date.now() - lastMove < 4000) return;
      const t = Date.now() / 1600;
      const ax = Math.sin(t) * 0.3;
      const ay = Math.cos(t * 0.7) * 0.18;
      mouseX.set(ax);
      mouseY.set(ay);
      const r = wrapRef.current?.getBoundingClientRect();
      if (r) updatePupils(r.left + r.width / 2 + ax * 260, r.top + r.height * 0.4 + ay * 180);
    }, 120);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      if (raf) cancelAnimationFrame(raf);
      clearInterval(idle);
    };
  }, [interactive, reduced, mouseX, mouseY, updatePupils]);

  useEffect(() => {
    if (reduced) return;
    let timer;
    const run = () => {
      setBlink(true);
      setTimeout(() => {
        setBlink(false);
        if (Math.random() < 0.22) {
          setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 120); }, 180);
        }
      }, 140);
      timer = setTimeout(run, 3400 + Math.random() * 3600);
    };
    timer = setTimeout(run, 2800);
    return () => clearTimeout(timer);
  }, [reduced]);

  const ear = (side, rotate) => {
    const [px, py] = META.earPivot[side];
    return (
      <motion.g style={reduced ? {} : { rotate, transformOrigin: `${px}px ${py}px` }}>
        <Shapes list={LAYERS[`ear${side}`]} />
      </motion.g>
    );
  };

  const [mx, my] = META.mouthCenter;

  return (
    <div
      ref={wrapRef}
      data-testid="exploration-vector-avatar"
      style={{ width: "100%", maxWidth: `${size}px`, margin: "0 auto", perspective: "1100px", userSelect: "none" }}
    >
      <motion.svg
        viewBox={`0 0 ${META.size.w} ${META.size.h}`}
        role="img"
        aria-label="Eshani's avatar"
        animate={reduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: "block", width: "100%", height: "auto", overflow: "visible", filter: "drop-shadow(0 22px 40px rgba(24,16,10,0.16))" }}
      >
        <defs>
          {/* softens the flat colour bands of the skin/kurta fills a touch;
              line art stays sharp on top */}
          <filter id="x2-soft"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>
        <motion.g
          onMouseEnter={() => setHappy(true)}
          onMouseLeave={() => setHappy(false)}
          style={reduced ? undefined : { rotateX, rotateY, x: figX, y: figY, transformOrigin: "447px 600px" }}
        >
          <motion.g
            style={{ transformOrigin: "447px 160px" }}
            animate={reduced ? undefined : { rotate: [-0.8, 0.8, -0.8] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Shapes list={LAYERS.hairBack} />
            <Shapes list={LAYERS.hair} />
          </motion.g>
          <Shapes list={LAYERS.body} filter="url(#x2-soft)" />
          <Shapes list={LAYERS.lines} />
          <Shapes list={LAYERS.pendant} />
          <Shapes list={LAYERS.bindi} />

          <motion.g style={reduced ? {} : { y: browY }}>
            <Shapes list={LAYERS.browL} />
            <Shapes list={LAYERS.browR} />
          </motion.g>

          <Eye side="L" pupil={pupilL} closed={blink} eyeRef={eyeLRef} />
          <Eye side="R" pupil={pupilR} closed={blink} eyeRef={eyeRRef} />

          <motion.g
            animate={reduced ? undefined : happy ? { scaleX: 1.05, scaleY: 1.1 } : { scaleX: 1, scaleY: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformOrigin: `${mx}px ${my}px` }}
          >
            <Shapes list={LAYERS.mouth} />
          </motion.g>

          {ear("L", earL)}
          {ear("R", earR)}
        </motion.g>
      </motion.svg>
    </div>
  );
}
