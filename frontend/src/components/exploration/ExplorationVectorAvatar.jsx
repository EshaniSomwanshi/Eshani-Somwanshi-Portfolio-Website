/* ExplorationVectorAvatar — the 2D avatar drawing, rebuilt as a clean,
   layered vector puppet and rigged like the original avatar (2.5D).

   Source: Eshani's flat 2D drawing (assets/avatar-2d-cutout.webp, background
   removed). trace_avatar_2d.py reduces each region to a few flat colours and
   traces them as smoothed vector shapes (avatar2dLayers.js), split for rigging:
     head (moves): hair + hair back (sways), face, face line art, bindi,
       brows (lift), eyes (white, iris that tracks the cursor, lashes),
       open smile (hover), jhumkas (swing)
     body (steady): neck, chest, kurta, their line art, necklace pendant,
       plus a hidden neck piece under the jaw so the head can slide
   Brows, jhumkas and the open mouth are painted out of the base before
   tracing, so nothing ghosts when they move. Drawn here: blink lids and the
   closed smile (default), in the drawing's style.

   Motion, as on the original avatar: head slide + slight tilt, cursor-
   tracking irises, blinking (occasional double), brow lift, closed smile ->
   open smile on hover, jhumka swing, hair sway, whole-figure 3D tilt +
   parallax, idle drift, float. All off under prefers-reduced-motion. */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { META, LAYERS } from "./avatar2dLayers";
import { HAIR } from "./avatar2dHair";
import { EYES } from "./avatar2dEyes";

const PUPIL_TRAVEL = 7; // px the irises can move inside the eye

/* Default mouth: a closed smile drawn in the drawing's style (corners and
   lip colours measured from it). Hover swaps in the drawing's own open,
   toothy smile — the same closed -> open behaviour as the original avatar. */
const CLOSED_SMILE = {
  upper: "M359 614 C380 618 410 617 432 616 C442 612 452 613 456 616 C462 613 472 612 482 616 C506 617 534 617 554 612 C524 631 490 640 456 640 C424 640 392 632 359 614 Z",
  lower: "M366 621 C392 640 424 648 456 648 C490 648 520 638 546 619 C530 648 496 668 456 670 C418 668 386 648 366 621 Z",
  line: "M359 614 C392 632 424 640 456 640 C490 640 524 631 554 612",
  lowerEdge: "M408 667 C432 676 480 676 502 666",
};

/* Jhumka, hand-drawn clean to match the drawing (traced silver came out
   noisy): teardrop stud with an inset, link, domed bell with engraved bands,
   rim and a bead fringe. Measured: stud centre (cx, 615), bell 660-718,
   beads at 727, bell ~84 wide. Pivot = top of the stud. */
function Jhumka({ cx }) {
  return (
    <g>
      <path d={`M${cx} 592 C${cx + 14} 600 ${cx + 19} 616 ${cx + 13} 630 C${cx + 9} 639 ${cx - 9} 639 ${cx - 13} 630 C${cx - 19} 616 ${cx - 14} 600 ${cx} 592 Z`}
        fill="url(#x2-silver)" stroke="#2d2c33" strokeWidth="2.4" />
      <path d={`M${cx} 602 C${cx + 8} 607 ${cx + 10} 617 ${cx + 6} 625 C${cx + 3} 630 ${cx - 3} 630 ${cx - 6} 625 C${cx - 10} 617 ${cx - 8} 607 ${cx} 602 Z`}
        fill="#7d7c86" stroke="#2d2c33" strokeWidth="1.6" />
      <circle cx={cx} cy="645" r="5" fill="none" stroke="#2d2c33" strokeWidth="2.6" />
      <path d={`M${cx - 42} 716 C${cx - 42} 684 ${cx - 22} 662 ${cx} 660 C${cx + 22} 662 ${cx + 42} 684 ${cx + 42} 716 Z`}
        fill="url(#x2-silver)" stroke="#2d2c33" strokeWidth="2.6" />
      <path d={`M${cx - 30} 682 C${cx - 14} 674 ${cx + 14} 674 ${cx + 30} 682`} stroke="#5d5c66" strokeWidth="2" fill="none" />
      <path d={`M${cx - 37} 696 C${cx - 18} 688 ${cx + 18} 688 ${cx + 37} 696`} stroke="#5d5c66" strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <path d={`M${cx - 40} 707 C${cx - 20} 700 ${cx + 20} 700 ${cx + 40} 707`} stroke="#5d5c66" strokeWidth="1.8" fill="none" />
      <ellipse cx={cx - 14} cy="676" rx="8" ry="4" fill="#ffffff" opacity="0.7" />
      <rect x={cx - 45} y="714" width="90" height="6" rx="3" fill="#cfd0d6" stroke="#2d2c33" strokeWidth="2" />
      {[-36, -27, -18, -9, 0, 9, 18, 27, 36].map((dx) => (
        <g key={dx}>
          <line x1={cx + dx} y1="720" x2={cx + dx} y2="724" stroke="#2d2c33" strokeWidth="1.6" />
          <circle cx={cx + dx} cy="728" r="4" fill="#f3f2f0" stroke="#2d2c33" strokeWidth="1.4" />
        </g>
      ))}
    </g>
  );
}


/* Hair, redrawn as smooth layered curves (avatar2dHair.js, from
   hair_curves.py): base silhouette, shadow gaps, locks, strands, sheen.
   Soft gradients inside each layer and a soft drop shadow under the locks
   and strands make them read as overlapping, with depth. */
function Hair() {
  return (
    <g>
      <path d={HAIR.silhouette.d} fill="url(#x2-hairBase)" fillRule="evenodd" />
      <path d={HAIR.shadow.d} fill="#08090b" fillRule="evenodd" />
      <path d={HAIR.locks.d} fill="url(#x2-hairLocks)" fillRule="evenodd" filter="url(#x2-lockShadow)" />
      <path d={HAIR.strands.d} fill="url(#x2-hairStrands)" fillRule="evenodd" filter="url(#x2-strandShadow)" />
      <path d={HAIR.sheen.d} fill="url(#x2-hairSheen)" fillRule="evenodd" opacity="0.9" />
    </g>
  );
}

function Shapes({ list, filter }) {
  return (
    <g filter={filter}>
      {(list || []).map((p, i) => <path key={i} d={p.d} fill={p.fill} fillRule="evenodd" />)}
    </g>
  );
}

/* Eyes: the drawing's own eye shapes (white + lash line with flicks) as
   clean vector curves (avatar2dEyes.js, from eye_curves.py), layered like
   the original avatar: white, lid shadow, iris (the original avatar's brown)
   + rim, pupil, two highlights, lashes, blink lid. Iris centres measured. */
const IRIS = { L: { cx: 365, cy: 471 }, R: { cx: 548, cy: 471 } };
const IRIS_R = 32;
// Closed-lid lash lines, measured on the drawing.
const CLOSED = {
  L: "M300 470 C326 500 380 506 408 484",
  R: "M506 484 C534 506 588 500 608 470",
};

function Eye({ side, pupil, closed, eyeRef }) {
  const { open, lash } = EYES[side];
  const { cx, cy } = IRIS[side];
  return (
    <g ref={eyeRef}>
      <clipPath id={`x2-eye-${side}`}><path d={open} /></clipPath>
      <path d={open} fill="url(#x2-sclera)" />
      <g clipPath={`url(#x2-eye-${side})`}>
        <g transform={`translate(${pupil.x} ${pupil.y})`}>
          <circle cx={cx} cy={cy} r={IRIS_R} fill="url(#x2-iris)" />
          <circle cx={cx} cy={cy} r={IRIS_R} fill="none" stroke="#170A02" strokeWidth="3.6" />
          <circle cx={cx} cy={cy} r={IRIS_R * 0.49} fill="#0B0501" />
          <circle cx={cx - 9} cy={cy - 12} r={IRIS_R * 0.26} fill="#ffffff" opacity="0.95" />
          <circle cx={cx + 11} cy={cy + 11} r={IRIS_R * 0.12} fill="#ffffff" opacity="0.6" />
        </g>
        <path d={open} fill="url(#x2-lidShadow)" />
      </g>
      <path d={lash} fill="#16171d" fillRule="evenodd" />
      {closed && (
        <g>
          <path d={open} fill={META.lid[side]} stroke={META.lid[side]} strokeWidth="10" strokeLinejoin="round" />
          <path d={CLOSED[side]} stroke="#16171d" strokeWidth="6.5" strokeLinecap="round" fill="none" />
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
  // Head moves on its own over the body, like the original avatar's neck
  // slide, plus a slight tilt toward the cursor.
  const headX = useTransform(sx, [-1, 1], [-18, 18]);
  const headTilt = useTransform(sx, [-1, 1], [-2, 2]);
  // Neck bends with the head: skewed about its base so its top travels with
  // the head (headX at the jaw) while the base stays on the shoulders.
  const neckLen = META.neckBase[1] - META.neckTop;
  const neckDeg = (Math.atan(18 / neckLen) * 180) / Math.PI;
  const neckSkew = useTransform(sx, [-1, 1], [neckDeg, -neckDeg]);

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
        <Jhumka cx={px} />
      </motion.g>
    );
  };

  const [mx, my] = META.mouthCenter;
  const [hx, hy] = META.headPivot;

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
          {/* eyes — iris colours from the original avatar */}
          <radialGradient id="x2-iris" cx="38%" cy="34%" r="66%">
            <stop offset="0%" stopColor="#8A4C22" />
            <stop offset="58%" stopColor="#4A2409" />
            <stop offset="100%" stopColor="#1C0E04" />
          </radialGradient>
          <linearGradient id="x2-lidShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A1608" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#2A1608" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="x2-sclera" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDFCFA" />
            <stop offset="100%" stopColor="#EFE9E6" />
          </linearGradient>
          {/* hair */}
          <linearGradient id="x2-hairBase" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="1060">
            <stop offset="0" stopColor="#1d1e23" /><stop offset="1" stopColor="#0f1013" />
          </linearGradient>
          <linearGradient id="x2-hairLocks" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="1060">
            <stop offset="0" stopColor="#323338" /><stop offset="1" stopColor="#222327" />
          </linearGradient>
          <linearGradient id="x2-hairStrands" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="1060">
            <stop offset="0" stopColor="#4c4d53" /><stop offset="1" stopColor="#36373c" />
          </linearGradient>
          <linearGradient id="x2-hairSheen" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="1060">
            <stop offset="0" stopColor="#7b7c84" /><stop offset="1" stopColor="#5a5b62" />
          </linearGradient>
          <filter id="x2-lockShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.5" />
          </filter>
          <filter id="x2-strandShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000" floodOpacity="0.45" />
          </filter>
          <linearGradient id="x2-silver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f4f6" />
            <stop offset=".55" stopColor="#c9cad2" />
            <stop offset="1" stopColor="#8e8f99" />
          </linearGradient>
        </defs>
        <motion.g
          onMouseEnter={() => setHappy(true)}
          onMouseLeave={() => setHappy(false)}
          style={reduced ? undefined : { rotateX, rotateY, x: figX, y: figY, transformOrigin: "447px 600px" }}
        >
          {/* HEAD, back half: hair (sways), behind the body so the kurta and
              neck sit over it where the drawing has them in front */}
          <motion.g style={reduced ? {} : { x: headX, rotate: headTilt, transformOrigin: `${hx}px ${hy}px` }}>
            <motion.g
              style={{ transformOrigin: "447px 160px" }}
              animate={reduced ? undefined : { rotate: [-0.8, 0.8, -0.8] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Hair />
            </motion.g>
          </motion.g>

          {/* BODY: chest, kurta, necklace (steady) */}
          <Shapes list={LAYERS.body} />
          <Shapes list={LAYERS.bodyLines} />
          <Shapes list={LAYERS.pendant} />

          {/* NECK: bends with the head, base fixed on the shoulders */}
          <motion.g style={reduced ? {} : { skewX: neckSkew, transformOrigin: `${META.neckBase[0]}px ${META.neckBase[1]}px` }}>
            <Shapes list={LAYERS.neck} />
            <Shapes list={LAYERS.neckLines} />
            <Shapes list={LAYERS.neckUnder} />
          </motion.g>

          {/* HEAD, front half: face and features */}
          <motion.g style={reduced ? {} : { x: headX, rotate: headTilt, transformOrigin: `${hx}px ${hy}px` }}>
            <Shapes list={LAYERS.face} />
            <Shapes list={LAYERS.faceLines} />
            <Shapes list={LAYERS.bindi} />

            <motion.g style={reduced ? {} : { y: browY }}>
              <Shapes list={LAYERS.browL} />
              <Shapes list={LAYERS.browR} />
            </motion.g>

            <Eye side="L" pupil={pupilL} closed={blink} eyeRef={eyeLRef} />
            <Eye side="R" pupil={pupilR} closed={blink} eyeRef={eyeRRef} />

            {happy ? (
              <motion.g
                key="open"
                initial={reduced ? false : { scaleY: 0.6, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                style={{ transformOrigin: `${mx}px ${my - 20}px` }}
              >
                <Shapes list={LAYERS.mouthOpen} />
              </motion.g>
            ) : (
              <g key="closed">
                <path d={CLOSED_SMILE.upper} fill="#b9614d" />
                <path d={CLOSED_SMILE.lower} fill="#c96955" />
                <ellipse cx="482" cy="656" rx="16" ry="5" fill="#e3a186" opacity="0.75" />
                <path d={CLOSED_SMILE.line} stroke="#2a1410" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d={CLOSED_SMILE.lowerEdge} stroke="#3c1a14" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.8" />
              </g>
            )}

            {ear("L", earL)}
            {ear("R", earR)}
          </motion.g>
        </motion.g>
      </motion.svg>
    </div>
  );
}
