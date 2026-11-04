/* ExplorationVectorAvatar — the reference portrait rebuilt as an illustrated,
   layered 2.5D vector puppet, rigged like the original avatar.

   Everything is in the image's own coordinates (895 x 1117):
   - Smooth outlines traced from the reference (avatarOutlines.js, from
     outline_avatar.py): hair silhouette + four sheen layers, the face/neck/
     chest silhouette, the kurta silhouette. Masks are blurred and simplified
     before tracing, so they follow the image as clean curves.
   - Hand-drawn on top, placed by measuring the image: skin gradients, side
     shading, eye sockets, forehead/cheekbone light, blush, nose, smile lines,
     jaw shadow; eyes, brows, mouth, bindi; kurta gradients, folds, neckline
     and chikankari flowers.
   - Jewellery traced from the image (avatarShapes.js, trace_avatar.py): chain,
     pendant, and the right jhumka (mirrored for the left, which is in deep
     shadow in the image).

   Motion, as on the original avatar: cursor-tracking irises, blinking, brow
   lift, wider smile on hover, jhumkas swinging from the stud, hair sway,
   whole-figure 3D tilt + parallax, idle drift, float. Off under
   prefers-reduced-motion. (No head-slide: face and neck are one silhouette.) */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { SIZE, SHAPES, FEATURES } from "./avatarShapes";
import { OUTLINES } from "./avatarOutlines";

/* ---- Measured feature geometry (image px) ---- */
const EYE = {
  L: {
    open: "M300 392 C312 368 340 358 365 359 C388 360 404 376 408 398 C396 410 382 416 362 416 C338 415 314 405 300 392 Z",
    lash: "M294 390 C306 362 338 350 365 351 C392 352 408 370 412 397 C404 382 390 366 365 365 C340 364 314 374 300 395 Z",
    wing: "M300 392 C294 390 289 386 286 381 C292 383 297 385 302 386 Z",
    closed: "M300 393 C320 410 388 414 408 398",
    lower: "M312 408 C332 420 384 422 404 404",
    iris: { cx: 362, cy: 388 },
  },
  R: {
    open: "M508 400 C512 378 528 361 552 359 C578 358 600 368 610 388 C598 404 576 415 552 416 C532 416 516 410 508 400 Z",
    lash: "M504 402 C508 372 528 352 552 351 C580 350 604 362 616 386 C602 372 580 364 552 365 C530 366 514 380 508 400 Z",
    wing: "M610 388 C616 385 621 381 624 376 C618 379 613 382 608 384 Z",
    closed: "M508 401 C528 414 592 410 610 389",
    lower: "M516 408 C536 420 588 418 604 400",
    iris: { cx: 548, cy: 388 },
  },
};
const IRIS_R = 28;
const PUPIL_R = 18;
const PUPIL_TRAVEL = 8; // px the irises can move inside the eye

const BROW = {
  L: "M290 309 C300 297 320 290 345 289 C370 289 398 293 414 300 C416 306 412 312 406 312 C385 307 365 303 345 302 C320 302 302 306 292 312 Z",
  R: "M616 309 C606 297 586 290 561 289 C536 289 508 293 498 300 C496 306 500 312 506 312 C527 307 547 303 567 302 C592 302 610 306 614 312 Z",
};

const MOUTH = {
  // open area (interior + teeth sit inside this)
  open: "M372 536 C392 543 420 547 450 548 C482 548 508 545 526 540 C520 556 500 572 470 577 C440 580 410 574 392 560 C384 553 377 545 372 536 Z",
  teeth: "M378 538 C398 545 424 548 450 548 C480 548 506 545 524 540 C518 552 504 562 484 567 C466 571 448 571 432 569 C412 566 394 556 384 546 Z",
  teethLines: "M410 548 L408 563 M430 549 L429 569 M456 549 L456 571 M482 548 L483 567 M502 546 L503 561",
  upperLip: "M364 534 C380 526 410 522 432 524 C440 520 460 520 468 524 C492 522 528 524 552 529 C536 538 508 545 482 547 C450 549 420 548 400 545 C386 542 374 539 364 534 Z",
  lowerLip: "M372 538 C384 556 404 572 432 580 C454 585 476 583 498 575 C520 566 536 550 548 532 C540 548 520 570 496 585 C474 597 446 599 422 593 C398 586 382 566 372 538 Z",
  lowerLipShine: "M426 586 C442 591 464 590 480 585 C468 592 440 593 426 586 Z",
  center: { x: 458, y: 556 },
};

function Paths({ list }) {
  return (list || []).map((p, i) => <path key={i} d={p.d} fill={p.fill} fillRule="evenodd" />);
}

/* ---------- Illustrated layers (smooth outlines + hand-placed gradients) ---------- */

function Hair() {
  return (
    <g>
      <path d={OUTLINES.hair} fill="url(#xv-hairBase)" fillRule="evenodd" />
      <path d={OUTLINES.hairMid} fill="#272124" fillRule="evenodd" />
      <path d={OUTLINES.hairSheen} fill="#3c3438" fillRule="evenodd" />
      <path d={OUTLINES.hairShine} fill="url(#xv-hairSheen)" fillRule="evenodd" />
      <path d={OUTLINES.hairGloss} fill="#a89da3" opacity="0.8" fillRule="evenodd" />
    </g>
  );
}

/* Face, neck and chest: one smooth silhouette, a warm radial base, then soft
   shading and highlights placed from the reference (all clipped to the skin). */
function Skin() {
  return (
    <g>
      <clipPath id="xv-skinClip"><path d={OUTLINES.skin} /></clipPath>
      <path d={OUTLINES.skin} fill="url(#xv-skin)" />
      <g clipPath="url(#xv-skinClip)">
        <rect x="0" y="0" width={SIZE.w} height={SIZE.h} fill="url(#xv-skinSides)" />
        {/* hairline shadow and eye sockets */}
        <ellipse cx="455" cy="200" rx="230" ry="60" fill="url(#xv-shadeSoft)" opacity="0.55" />
        <ellipse cx="358" cy="346" rx="62" ry="16" fill="url(#xv-shadeSoft)" opacity="0.4" />
        <ellipse cx="552" cy="346" rx="62" ry="16" fill="url(#xv-shadeSoft)" opacity="0.4" />
        <ellipse cx="362" cy="428" rx="46" ry="10" fill="url(#xv-shadeSoft)" opacity="0.25" />
        <ellipse cx="550" cy="428" rx="46" ry="10" fill="url(#xv-shadeSoft)" opacity="0.25" />
        {/* forehead and cheekbone light */}
        <ellipse cx="452" cy="255" rx="100" ry="48" fill="url(#xv-light)" opacity="0.6" />
        <ellipse cx="338" cy="452" rx="30" ry="18" fill="url(#xv-light)" opacity="0.45" />
        <ellipse cx="580" cy="452" rx="30" ry="18" fill="url(#xv-light)" opacity="0.45" />
        {/* rosy cheeks */}
        <ellipse cx="325" cy="488" rx="74" ry="54" fill="url(#xv-blush)" />
        <ellipse cx="598" cy="488" rx="74" ry="54" fill="url(#xv-blush)" />
        {/* nose: bridge light, round lit tip, shaded wings, nostrils */}
        <ellipse cx="455" cy="395" rx="13" ry="58" fill="url(#xv-light)" opacity="0.4" />
        <ellipse cx="455" cy="466" rx="44" ry="36" fill="url(#xv-noseTip)" />
        <g filter="url(#xv-soft2)">
          <path d="M420 470 C405 488 414 508 436 506" stroke="#7a2e1b" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M490 470 C505 488 496 508 474 506" stroke="#7a2e1b" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
          <ellipse cx="455" cy="514" rx="26" ry="7" fill="#7a2614" opacity="0.4" />
          {/* smile lines */}
          <path d="M366 516 C352 528 348 546 358 560" stroke="#8a3a26" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.35" />
          <path d="M550 512 C564 524 568 542 558 556" stroke="#8a3a26" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.35" />
        </g>
        <ellipse cx="437" cy="501" rx="7.5" ry="3.8" fill="#561c10" opacity="0.65" />
        <ellipse cx="473" cy="501" rx="7.5" ry="3.8" fill="#561c10" opacity="0.65" />
        <ellipse cx="447" cy="456" rx="12" ry="8" fill="#f7b993" opacity="0.75" />
        <path d="M446 350 C444 390 442 420 440 446" stroke="#7a2e1b" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.18" filter="url(#xv-soft2)" />
        {/* chin light, jaw shadow on the neck, chest light */}
        <ellipse cx="452" cy="640" rx="44" ry="20" fill="url(#xv-light)" opacity="0.4" />
        <path d="M290 590 C330 646 396 674 455 674 C514 674 580 646 622 590 L640 790 L270 790 Z" fill="url(#xv-jawShadow)" filter="url(#xv-soft4)" />
        <ellipse cx="455" cy="850" rx="80" ry="44" fill="url(#xv-light)" opacity="0.35" />
      </g>
    </g>
  );
}

/* Chikankari flower: six raised petals with a shadow edge, plus two leaves. */
function Chikan({ x, y, r = 14, rot = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <ellipse cx={-r * 1.25} cy={r * 0.6} rx={r * 0.55} ry={r * 0.22} transform="rotate(-30)" fill="#fffaf6" stroke="#cfc3c4" strokeWidth="1.2" />
      <ellipse cx={r * 1.25} cy={r * 0.6} rx={r * 0.55} ry={r * 0.22} transform="rotate(30)" fill="#fffaf6" stroke="#cfc3c4" strokeWidth="1.2" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="0" cy={-r * 0.6} rx={r * 0.32} ry={r * 0.6} transform={`rotate(${a})`}
          fill="url(#xv-petal)" stroke="#cbbfc1" strokeWidth="1.1" />
      ))}
      <circle r={r * 0.26} fill="#fffaf6" stroke="#c4b7b9" strokeWidth="1.1" />
    </g>
  );
}

// Flower positions read off the reference (left panel/shoulder; right mirrors).
const CHIKAN = [
  { x: 330, y: 962, r: 16, rot: 10 }, { x: 378, y: 1002, r: 14, rot: -15 }, { x: 326, y: 1042, r: 17, rot: 25 },
  { x: 384, y: 1076, r: 15, rot: 5 }, { x: 338, y: 1104, r: 13, rot: -20 }, { x: 410, y: 962, r: 11, rot: 30 },
  { x: 412, y: 1040, r: 11, rot: -5 }, { x: 172, y: 902, r: 13, rot: 0 }, { x: 140, y: 962, r: 15, rot: 20 },
  { x: 192, y: 1012, r: 13, rot: -10 }, { x: 236, y: 940, r: 10, rot: 15 },
];

function Kurta() {
  const neck = "M302 794 C322 860 372 906 440 926 L455 1000 L470 926 C538 906 588 860 608 794";
  return (
    <g>
      <clipPath id="xv-kurtaClip"><path d={OUTLINES.kurta} /></clipPath>
      <path d={OUTLINES.kurta} fill="url(#xv-kurta)" />
      <g clipPath="url(#xv-kurtaClip)">
        <rect x="0" y="0" width={SIZE.w} height={SIZE.h} fill="url(#xv-kurtaSides)" />
        {/* soft folds */}
        <g filter="url(#xv-soft4)" opacity="0.35">
          <path d="M120 900 C110 960 112 1030 126 1110" stroke="#a89aa6" strokeWidth="10" fill="none" />
          <path d="M790 900 C800 960 798 1030 784 1110" stroke="#b9acb5" strokeWidth="8" fill="none" />
          <path d="M260 980 C250 1040 252 1080 262 1117" stroke="#c4b8bf" strokeWidth="6" fill="none" />
          <path d="M650 980 C660 1040 658 1080 648 1117" stroke="#c4b8bf" strokeWidth="6" fill="none" />
        </g>
        {/* embroidered neckline band and placket edges */}
        <path d={neck} transform="translate(0 14)" stroke="#d6cacb" strokeWidth="3" strokeDasharray="0.1 9" strokeLinecap="round" fill="none" />
        <path d={neck} transform="translate(0 26)" stroke="#e2d7d6" strokeWidth="2" fill="none" />
        <path d="M440 940 L440 1117 M470 940 L470 1117" stroke="#d3c7c8" strokeWidth="2" fill="none" />
        <path d="M428 950 L428 1117 M482 950 L482 1117" stroke="#d6cacb" strokeWidth="2.6" strokeDasharray="0.1 8" strokeLinecap="round" fill="none" />
        {CHIKAN.map((f, i) => <Chikan key={i} {...f} />)}
        {CHIKAN.map((f, i) => <Chikan key={`m${i}`} {...f} x={910 - f.x} rot={-f.rot} />)}
        {/* neckline piping + the slit's shadow */}
        <path d={neck} stroke="#fffaf6" strokeWidth="5" fill="none" strokeLinejoin="round" />
        <path d={neck} stroke="#c7b9bb" strokeWidth="1.4" fill="none" transform="translate(0 4)" />
      </g>
    </g>
  );
}

function Eye({ side, pupil, closed, eyeRef }) {
  const e = EYE[side];
  const { cx, cy } = e.iris;
  return (
    <g ref={eyeRef}>
      <clipPath id={`xv-eye-${side}`}>
        <path d={e.open} />
      </clipPath>
      <path d={e.open} fill="url(#xv-sclera)" />
      <g clipPath={`url(#xv-eye-${side})`}>
        <g transform={`translate(${pupil.x} ${pupil.y})`}>
          <circle cx={cx} cy={cy} r={IRIS_R} fill="url(#xv-iris)" />
          <circle cx={cx} cy={cy} r={IRIS_R} fill="none" stroke="#1f1714" strokeWidth="3" />
          <circle cx={cx} cy={cy} r={PUPIL_R} fill="#080504" />
          <circle cx={cx + 15} cy={cy - 11} r="6" fill="#ffffff" />
          <circle cx={cx - 10} cy={cy + 12} r="2.4" fill="#ffffff" opacity="0.6" />
        </g>
        {/* upper-lid shadow falling on the eyeball */}
        <path d={e.open} fill="url(#xv-lidShadow)" />
      </g>
      <path d={e.lower} stroke="#8d533d" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d={e.lash} fill="#140a07" />
      <path d={e.wing} fill="#140a07" />
      {closed && (
        <g>
          <path d={e.open} fill="url(#xv-lid)" stroke="url(#xv-lid)" strokeWidth="6" />
          <path d={e.closed} stroke="#140a07" strokeWidth="5" strokeLinecap="round" fill="none" />
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

  // Same ranges as the original avatar (degrees), parallax scaled to this
  // canvas (it is ~2x the original's 440 units).
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
      if (r) updatePupils(r.left + r.width / 2 + ax * 260, r.top + r.height * 0.35 + ay * 180);
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

  // Natural blinking, with an occasional double blink (same as original).
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

  /* Jhumkas swing from the top of the stud. The left one in the image is in
     deep shadow and traces poorly, so both use the cleanly-traced right
     jhumka — the left as its mirror image, moved onto the left earlobe. */
  const EAR_PIVOT = { L: { x: 262, y: 510 }, R: { x: FEATURES.earR.px, y: FEATURES.earR.py } };
  const ear = (side, rotate) => {
    const p = EAR_PIVOT[side];
    const src = EAR_PIVOT.R;
    const place = side === "L"
      ? `translate(${p.x} ${p.y}) scale(-1 1) translate(${-src.x} ${-src.y})`
      : undefined;
    return (
      <motion.g style={reduced ? {} : { rotate, transformOrigin: `${p.x}px ${p.y}px` }}>
        <g transform={place}>
          <Paths list={SHAPES.earR} />
        </g>
      </motion.g>
    );
  };

  return (
    <div
      ref={wrapRef}
      data-testid="exploration-vector-avatar"
      style={{ width: "100%", maxWidth: `${size}px`, margin: "0 auto", perspective: "1100px", userSelect: "none" }}
    >
      <motion.svg
        viewBox={`0 0 ${SIZE.w} ${SIZE.h}`}
        role="img"
        aria-label="Eshani's avatar"
        animate={reduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: "block", width: "100%", height: "auto", overflow: "visible", filter: "drop-shadow(0 22px 40px rgba(24,16,10,0.16))" }}
      >
        <defs>
          <radialGradient id="xv-iris" cx="45%" cy="62%" r="58%">
            <stop offset="0" stopColor="#95857a" />
            <stop offset=".55" stopColor="#5c4c45" />
            <stop offset="1" stopColor="#2b211e" />
          </radialGradient>
          <radialGradient id="xv-sclera" cx="50%" cy="60%" r="60%">
            <stop offset="0" stopColor="#f7f2f2" />
            <stop offset=".75" stopColor="#e6dde2" />
            <stop offset="1" stopColor="#c9b8be" />
          </radialGradient>
          <linearGradient id="xv-lidShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a1e14" stopOpacity="0.45" />
            <stop offset=".35" stopColor="#3a1e14" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="xv-lid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9b5236" />
            <stop offset="1" stopColor="#b8684a" />
          </linearGradient>
          <linearGradient id="xv-brow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a3626" />
            <stop offset="1" stopColor="#3a2219" />
          </linearGradient>
          <linearGradient id="xv-upperLip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b85a46" />
            <stop offset="1" stopColor="#9a3e34" />
          </linearGradient>
          <linearGradient id="xv-lowerLip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9504a" />
            <stop offset=".6" stopColor="#cf6a62" />
            <stop offset="1" stopColor="#b9554c" />
          </linearGradient>
          <linearGradient id="xv-teeth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbf5f1" />
            <stop offset="1" stopColor="#ddcdc8" />
          </linearGradient>
          {/* illustrated skin, hair, kurta (colours sampled from the reference) */}
          <radialGradient id="xv-skin" gradientUnits="userSpaceOnUse" cx="455" cy="430" r="420">
            <stop offset="0" stopColor="#d9895c" />
            <stop offset=".45" stopColor="#c8764d" />
            <stop offset=".8" stopColor="#a65a39" />
            <stop offset="1" stopColor="#8a4229" />
          </radialGradient>
          <linearGradient id="xv-skinSides" x1="0" y1="0" x2="1" y2="0">
            <stop offset=".24" stopColor="#5e2416" stopOpacity="0.55" />
            <stop offset=".36" stopColor="#5e2416" stopOpacity="0" />
            <stop offset=".66" stopColor="#5e2416" stopOpacity="0" />
            <stop offset=".76" stopColor="#5e2416" stopOpacity="0.45" />
          </linearGradient>
          <radialGradient id="xv-light"><stop offset="0" stopColor="#f2b088" /><stop offset="1" stopColor="#f2b088" stopOpacity="0" /></radialGradient>
          <radialGradient id="xv-shadeSoft"><stop offset="0" stopColor="#6b2a18" /><stop offset="1" stopColor="#6b2a18" stopOpacity="0" /></radialGradient>
          <linearGradient id="xv-jawShadow" gradientUnits="userSpaceOnUse" x1="0" y1="640" x2="0" y2="760">
            <stop offset="0" stopColor="#4a170a" stopOpacity="0.75" />
            <stop offset=".35" stopColor="#4a170a" stopOpacity="0.4" />
            <stop offset="1" stopColor="#4a170a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="xv-shadeDeep"><stop offset="0" stopColor="#4e1a0c" /><stop offset="1" stopColor="#4e1a0c" stopOpacity="0" /></radialGradient>
          <radialGradient id="xv-blush"><stop offset="0" stopColor="#e65a43" stopOpacity="0.62" /><stop offset="1" stopColor="#e65a43" stopOpacity="0" /></radialGradient>
          <radialGradient id="xv-noseTip" cx="45%" cy="40%" r="60%"><stop offset="0" stopColor="#ec8a5f" /><stop offset=".7" stopColor="#d9714a" stopOpacity="0.5" /><stop offset="1" stopColor="#d9714a" stopOpacity="0" /></radialGradient>
          <linearGradient id="xv-hairBase" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1117">
            <stop offset="0" stopColor="#1d181c" /><stop offset="1" stopColor="#0b090a" />
          </linearGradient>
          <linearGradient id="xv-hairSheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7a6f75" /><stop offset="1" stopColor="#4d444a" />
          </linearGradient>
          <linearGradient id="xv-kurta" gradientUnits="userSpaceOnUse" x1="0" y1="780" x2="0" y2="1117">
            <stop offset="0" stopColor="#fcf6f2" /><stop offset="1" stopColor="#efe4df" />
          </linearGradient>
          <linearGradient id="xv-kurtaSides" x1="0" y1="0" x2="1" y2="0">
            <stop offset=".05" stopColor="#8f8597" stopOpacity="0.6" />
            <stop offset=".22" stopColor="#8f8597" stopOpacity="0" />
            <stop offset=".85" stopColor="#8f8597" stopOpacity="0" />
            <stop offset=".97" stopColor="#8f8597" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="xv-petal" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ece2df" /></radialGradient>
          <filter id="xv-soft2"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="xv-soft4"><feGaussianBlur stdDeviation="4" /></filter>
          <radialGradient id="xv-gold" cx="38%" cy="32%" r="70%">
            <stop offset="0" stopColor="#ffe7a3" />
            <stop offset=".6" stopColor="#d9a441" />
            <stop offset="1" stopColor="#8e6118" />
          </radialGradient>
          <radialGradient id="xv-bindiStone" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#f4f7fb" />
            <stop offset=".6" stopColor="#9fb1c4" />
            <stop offset="1" stopColor="#566a80" />
          </radialGradient>
        </defs>

        <motion.g
          onMouseEnter={() => setHappy(true)}
          onMouseLeave={() => setHappy(false)}
          style={reduced ? undefined : { rotateX, rotateY, x: figX, y: figY, transformOrigin: "447px 560px" }}
        >
          <Kurta />
          {/* hair sways gently from the crown */}
          <motion.g
            style={{ transformOrigin: "447px 120px" }}
            animate={reduced ? undefined : { rotate: [-0.8, 0.8, -0.8] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hair />
          </motion.g>
          <Skin />
          <Paths list={SHAPES.chain} />
          <Paths list={SHAPES.pendant} />

          {/* bindi: gold beaded ring around a silver stone */}
          <circle cx="456" cy="311" r="13" fill="url(#xv-gold)" />
          <circle cx="456" cy="311" r="13" fill="none" stroke="#7a5212" strokeWidth="2.4" strokeDasharray="0.1 4.2" strokeLinecap="round" />
          <circle cx="456" cy="311" r="7" fill="url(#xv-bindiStone)" />

          <motion.g style={reduced ? {} : { y: browY }}>
            <path d={BROW.L} fill="url(#xv-brow)" />
            <path d={BROW.R} fill="url(#xv-brow)" />
          </motion.g>

          <Eye side="L" pupil={pupilL} closed={blink} eyeRef={eyeLRef} />
          <Eye side="R" pupil={pupilR} closed={blink} eyeRef={eyeRRef} />

          {/* mouth: the image's smile; hover widens it */}
          <motion.g
            animate={reduced ? undefined : happy ? { scaleX: 1.05, scaleY: 1.1 } : { scaleX: 1, scaleY: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformOrigin: `${MOUTH.center.x}px ${MOUTH.center.y}px` }}
          >
            <path d={MOUTH.open} fill="#5a1f1a" />
            <path d={MOUTH.teeth} fill="url(#xv-teeth)" />
            <path d={MOUTH.teethLines} stroke="#cbb7b1" strokeWidth="1.6" strokeLinecap="round" />
            <path d={MOUTH.lowerLip} fill="url(#xv-lowerLip)" />
            <path d={MOUTH.lowerLipShine} fill="#eba196" opacity="0.7" />
            <path d={MOUTH.upperLip} fill="url(#xv-upperLip)" />
          </motion.g>

          {ear("L", earL)}
          {ear("R", earR)}
        </motion.g>
      </motion.svg>
    </div>
  );
}
