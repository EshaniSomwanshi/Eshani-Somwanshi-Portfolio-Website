/* ExplorationAvatar — the working copy of the avatar for /exploration.

   Copied from components/ui/InteractiveAvatar.jsx (the live home-page avatar)
   on 2026-11-03 so the avatar can be reworked freely here without touching
   the live site. Nothing imports this file except ExplorationPage, which is
   left out of production builds (lib/exploration.js), so this code never
   ships. To promote a change to the live avatar, copy it into
   InteractiveAvatar.jsx deliberately. */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue, useTransform, useReducedMotion } from "framer-motion";


/**
 * ExplorationAvatar — redrawn from the 3D reference portrait (2026-11-03).
 *
 * Look: warm medium-brown skin with rounded, full cheeks; big glossy dark
 * eyes; thick soft-arched brows; gold bindi; open smile with teeth;
 * voluminous black wavy hair with a soft middle part falling past the
 * shoulders; silver jhumkas with pearl fringe; silver ball chain with a
 * sapphire pendant; white kurta with a slit neckline and chikankari florals.
 * The 3D feel comes from layered gradients and highlight/shadow shapes, so it
 * stays a crisp vector at any size.
 *
 * Motion is unchanged from InteractiveAvatar: cursor-tracking eyes, blinking,
 * whole-figure parallax, head slide, hair sway, jhumka swing, brow lift, idle
 * float. Hover widens the smile.
 */
export default function ExplorationAvatar({
  className = "",
  size = 460,
  interactive = true,
  theme = "paper"
}) {
  const containerRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const reduced = useReducedMotion();

  const [isBlinking, setIsBlinking] = useState(false);
  const [isHappy, setIsHappy] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spring = { stiffness: 90, damping: 18, mass: 0.5 };
  const smoothX = useSpring(mouseX, spring);
  const smoothY = useSpring(mouseY, spring);

  // Whole-figure parallax — hair, face, and body all move together as one
  // rigid unit so nothing drifts apart during interaction.
  const figureRotateY = useTransform(smoothX, [-1, 1], [-5, 5]);
  const figureRotateX = useTransform(smoothY, [-1, 1], [3.5, -3.5]);
  const figureX = useTransform(smoothX, [-1, 1], [-5, 5]);
  const figureY = useTransform(smoothY, [-1, 1], [-3.5, 3.5]);

  // Jhumka Reactive Physics — swing is layered on top of the whole-figure motion
  const earringLeftRotate = useTransform(smoothX, [-1, 1], [-8, 12]);
  const earringRightRotate = useTransform(smoothX, [-1, 1], [-12, 8]);
  const browY = useTransform(smoothY, [-1, 1], [-2, 1.2]);

  // Bharatanatyam-style neck slide — the head glides side to side on a level
  // plane (pure horizontal translation, no tilt) as the cursor moves left to
  // right, layered on top of the whole-figure motion. Kept within the neck's
  // visible width (~194–246 at the jaw line) so the head never slides past
  // the neck shape underneath it.
  const headSlideX = useTransform(smoothX, [-1, 1], [-11, 11]);

  const [leftPupil, setLeftPupil] = useState({ x: 0, y: 0 });
  const [rightPupil, setRightPupil] = useState({ x: 0, y: 0 });

  const updatePupils = useCallback((clientX, clientY) => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;

    const calcEye = (rect, maxRadius) => {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const angle = Math.atan2(dy, dx);
      const radius = Math.min(maxRadius, Math.hypot(dx, dy) / 30);
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.7 };
    };

    setLeftPupil(calcEye(leftEyeRef.current.getBoundingClientRect(), 4.6));
    setRightPupil(calcEye(rightEyeRef.current.getBoundingClientRect(), 4.6));
  }, []);

  useEffect(() => {
    if (!interactive || reduced) return;

    let rafId = null;
    let lastMove = Date.now();

    const track = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        mouseX.set(Math.max(-1, Math.min(1, (e.clientX - cx) / cx)));
        mouseY.set(Math.max(-1, Math.min(1, (e.clientY - cy) / cy)));
        updatePupils(e.clientX, e.clientY);
      });
    };

    const onMove = (e) => {
      lastMove = Date.now();
      track(e);
    };
    const onTouch = (e) => {
      if (e.touches && e.touches[0]) onMove(e.touches[0]);
    };

    const idle = setInterval(() => {
      if (Date.now() - lastMove < 4000) return;
      const t = Date.now() / 1600;
      const ax = Math.sin(t) * 0.3;
      const ay = Math.cos(t * 0.7) * 0.18;
      mouseX.set(ax);
      mouseY.set(ay);
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        updatePupils(r.left + r.width / 2 + ax * 260, r.top + r.height / 2 + ay * 180);
      }
    }, 120);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(idle);
    };
  }, [interactive, reduced, mouseX, mouseY, updatePupils]);

  useEffect(() => {
    let timer;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        if (Math.random() < 0.22) {
          setTimeout(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 120);
          }, 180);
        }
      }, 140);
      timer = setTimeout(blink, 3400 + Math.random() * 3600);
    };
    timer = setTimeout(blink, 2800);
    return () => clearTimeout(timer);
  }, []);

  const eyesClosed = isBlinking;

  return (
    <div
      ref={containerRef}
      className={`interactive-avatar-wrap ${className}`}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: `${size}px`,
        aspectRatio: "440 / 520",
        margin: "0 auto",
        userSelect: "none",
        perspective: "1100px"
      }}
      data-testid="exploration-interactive-avatar"
    >
      <motion.svg
        viewBox="0 0 440 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          filter: "drop-shadow(0 22px 44px rgba(24,16,10,0.16))"
        }}
      >
        <defs>
          {/* ---- Skin: warm medium-brown, lit from the front-top. The 3D
               read comes from stacking a radial base (lit centre, darker
               rim) with soft highlight and shadow shapes, not from blur. */}
          <radialGradient id="xa-skin" cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#E3A780" />
            <stop offset="55%" stopColor="#CC8B62" />
            <stop offset="100%" stopColor="#A9684A" />
          </radialGradient>
          <linearGradient id="xa-faceShade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7A3F25" stopOpacity="0.42" />
            <stop offset="22%" stopColor="#7A3F25" stopOpacity="0" />
            <stop offset="78%" stopColor="#7A3F25" stopOpacity="0" />
            <stop offset="100%" stopColor="#7A3F25" stopOpacity="0.42" />
          </linearGradient>
          <radialGradient id="xa-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F6CCA8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F6CCA8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="xa-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0685C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E0685C" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="xa-noseTip" cx="45%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#E9B089" />
            <stop offset="100%" stopColor="#C98660" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="xa-neck" gradientUnits="userSpaceOnUse" x1="220" y1="290" x2="220" y2="380">
            <stop offset="0%" stopColor="#99583A" />
            <stop offset="45%" stopColor="#BC7B55" />
            <stop offset="100%" stopColor="#C98A63" />
          </linearGradient>
          <radialGradient id="xa-chinShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6E3720" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#6E3720" stopOpacity="0" />
          </radialGradient>

          {/* ---- Hair: near-black with warm brown sheen, like the render. */}
          <linearGradient id="xa-hair" gradientUnits="userSpaceOnUse" x1="220" y1="50" x2="220" y2="510">
            <stop offset="0%" stopColor="#2C2522" />
            <stop offset="45%" stopColor="#1A1513" />
            <stop offset="100%" stopColor="#0C0908" />
          </linearGradient>
          <linearGradient id="xa-hairFront" gradientUnits="userSpaceOnUse" x1="120" y1="60" x2="320" y2="500">
            <stop offset="0%" stopColor="#332A26" />
            <stop offset="50%" stopColor="#1C1715" />
            <stop offset="100%" stopColor="#0E0B0A" />
          </linearGradient>

          {/* ---- Eyes: big, glossy, dark brown. */}
          <radialGradient id="xa-iris" cx="50%" cy="62%" r="58%">
            <stop offset="0%" stopColor="#6B4630" />
            <stop offset="55%" stopColor="#3A2417" />
            <stop offset="100%" stopColor="#140B06" />
          </radialGradient>
          <linearGradient id="xa-lid" gradientUnits="userSpaceOnUse" x1="0" y1="190" x2="0" y2="216">
            <stop offset="0%" stopColor="#3A1E10" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3A1E10" stopOpacity="0" />
          </linearGradient>

          {/* ---- Lips and mouth. */}
          <linearGradient id="xa-lipTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B4524C" />
            <stop offset="100%" stopColor="#9C3F3B" />
          </linearGradient>
          <radialGradient id="xa-lipBottom" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#DA7A70" />
            <stop offset="100%" stopColor="#B4524C" />
          </radialGradient>

          {/* ---- Jewelry. */}
          <radialGradient id="xa-silver" cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#D3D8E1" />
            <stop offset="100%" stopColor="#7C8393" />
          </radialGradient>
          <radialGradient id="xa-gold" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#FFE7A3" />
            <stop offset="60%" stopColor="#D9A441" />
            <stop offset="100%" stopColor="#8E6118" />
          </radialGradient>
          <radialGradient id="xa-sapphire" cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#A9C6FF" />
            <stop offset="45%" stopColor="#3A63D6" />
            <stop offset="100%" stopColor="#15297A" />
          </radialGradient>

          {/* ---- Kurta: white cotton with soft side shading, and raised
               chikankari embroidery (white-on-white, defined by shadow). */}
          <linearGradient id="xa-kurta" gradientUnits="userSpaceOnUse" x1="220" y1="365" x2="220" y2="520">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F2F3F6" />
            <stop offset="100%" stopColor="#E3E6EC" />
          </linearGradient>
          <linearGradient id="xa-kurtaSide" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B9BFCB" stopOpacity="0.55" />
            <stop offset="25%" stopColor="#B9BFCB" stopOpacity="0" />
            <stop offset="75%" stopColor="#B9BFCB" stopOpacity="0" />
            <stop offset="100%" stopColor="#B9BFCB" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="xa-emb" cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E4E7EE" />
          </radialGradient>

          <clipPath id="xa-clipL">
            <path d="M164 208 C168 189 206 187 211 206 C208 223 170 227 164 208 Z" />
          </clipPath>
          <clipPath id="xa-clipR">
            <path d="M276 208 C272 189 234 187 229 206 C232 223 270 227 276 208 Z" />
          </clipPath>
        </defs>

        {/* ---------- WHOLE FIGURE — one transform for parallax, as before.
             Hover handlers sit on this <g> so only the drawn silhouette is
             hoverable. Hover widens the smile. ---------- */}
        <motion.g
          onMouseEnter={() => setIsHappy(true)}
          onMouseLeave={() => setIsHappy(false)}
          style={
            reduced
              ? undefined
              : {
                  rotateY: figureRotateY,
                  rotateX: figureRotateX,
                  x: figureX,
                  y: figureY,
                  transformOrigin: "220px 270px"
                }
          }
        >
          {/* ---------- LAYER 1 — BACK HAIR: the big wavy mass behind the
               shoulders. Two halves swaying on their own timing, attached to
               the head (headSlideX). ---------- */}
          <motion.g style={reduced ? {} : { x: headSlideX }}>
            <motion.g
              style={{ transformOrigin: "220px 70px" }}
              animate={reduced ? undefined : { rotate: [1.4, -1.6, 1.4] }}
              transition={{ duration: 8.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            >
              <path
                d="M220 54 C160 50 112 78 98 128
                   C88 164 94 192 80 216
                   C62 240 50 264 62 288
                   C44 306 38 334 56 354
                   C38 374 40 402 58 420
                   C44 442 50 468 76 478
                   C100 488 130 480 148 466
                   L200 300 C196 250 204 200 210 160
                   C214 120 218 90 220 54 Z"
                fill="url(#xa-hair)"
              />
              {/* Wave sheen tracing the curls down the outer edge. */}
              <path
                d="M150 84 C118 100 104 132 104 168 M84 222 C70 234 66 252 74 268
                   M66 294 C54 306 52 326 62 340 M62 362 C50 374 50 394 62 406
                   M64 428 C56 440 60 458 74 464"
                stroke="#5E4B40" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"
              />
            </motion.g>
            <motion.g
              style={{ transformOrigin: "220px 70px" }}
              animate={reduced ? undefined : { rotate: [-1.5, 1.4, -1.5] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path
                d="M220 54 C280 50 328 78 342 128
                   C352 164 346 192 360 216
                   C378 240 390 264 378 288
                   C396 306 402 334 384 354
                   C402 374 400 402 382 420
                   C396 442 390 468 364 478
                   C340 488 310 480 292 466
                   L240 300 C244 250 236 200 230 160
                   C226 120 222 90 220 54 Z"
                fill="url(#xa-hair)"
              />
              <path
                d="M290 84 C322 100 336 132 336 168 M356 222 C370 234 374 252 366 268
                   M374 294 C386 306 388 326 378 340 M378 362 C390 374 390 394 378 406
                   M376 428 C384 440 380 458 366 464"
                stroke="#5E4B40" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"
              />
            </motion.g>
          </motion.g>

          {/* Static hair behind the neck (not on headSlideX), wider than the
              neck by more than the slide's travel so no gap opens. */}
          <path
            d="M220 200 C160 200 140 240 140 290 L140 470
               C140 495 180 505 220 505 C260 505 300 495 300 470
               L300 290 C300 240 280 200 220 200 Z"
            fill="url(#xa-hair)"
          />

          {/* ---------- LAYER 2 — NECK, KURTA, NECKLACE ---------- */}
          <g id="xa-body">
            <path d="M199 292 L194 354 C206 362 234 362 246 354 L241 292 Z" fill="url(#xa-neck)" />
            {/* Jaw shadow cast onto the neck. */}
            <ellipse cx="220" cy="310" rx="38" ry="14" fill="url(#xa-chinShadow)" />

            {/* Kurta body. */}
            <path
              d="M30 520 C34 446 70 392 132 372 C158 364 180 356 193 348
                 C205 362 235 362 247 348 C260 356 282 364 308 372
                 C370 392 406 446 410 520 Z"
              fill="url(#xa-kurta)"
            />
            <path
              d="M30 520 C34 446 70 392 132 372 C158 364 180 356 193 348
                 C205 362 235 362 247 348 C260 356 282 364 308 372
                 C370 392 406 446 410 520 Z"
              fill="url(#xa-kurtaSide)"
            />
            {/* Collar slit: a narrow skin-toned notch down the centre. */}
            <path d="M216 360 L220 382 L224 360 Z" fill="#A9684A" />
            <path d="M216 360 L220 382 L224 360" stroke="#C6CBD5" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
            {/* Neckline piping. */}
            <path
              d="M193 348 C205 362 235 362 247 348"
              stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none"
            />
            <path
              d="M193 348 C205 362 235 362 247 348"
              stroke="#CBD0DA" strokeWidth="1" strokeLinecap="round" fill="none" transform="translate(0 3)"
            />

            {/* Chikankari: embroidered border along the neckline and slit,
                then floral sprays on the chest and shoulders. */}
            <path
              d="M182 356 C198 376 242 376 258 356"
              stroke="#CDD2DB" strokeWidth="2.2" strokeDasharray="0.1 4.5" strokeLinecap="round" fill="none"
            />
            <path
              d="M170 362 C192 392 248 392 270 362"
              stroke="#D6DAE2" strokeWidth="1.4" strokeLinecap="round" fill="none"
            />
            <path d="M210 368 L216 398" stroke="#CDD2DB" strokeWidth="2" strokeDasharray="0.1 4.5" strokeLinecap="round" />
            <path d="M230 368 L224 398" stroke="#CDD2DB" strokeWidth="2" strokeDasharray="0.1 4.5" strokeLinecap="round" />
            {EMBROIDERY.map((f, i) => (
              <Flower key={i} {...f} />
            ))}
            {EMBROIDERY.map((f, i) => (
              <Flower key={`m${i}`} {...f} x={440 - f.x} rot={-(f.rot || 0)} />
            ))}
            {/* Vines linking the flowers. */}

            {/* Fine silver ball chain with a sapphire pendant. */}
            <path
              d="M201 316 C205 336 212 354 220 362 C228 354 235 336 239 316"
              stroke="#E7EAF0" strokeWidth="2.4" strokeDasharray="0.1 3.2" strokeLinecap="round" fill="none"
            />
            <path
              d="M201 316 C205 336 212 354 220 362 C228 354 235 336 239 316"
              stroke="#8A91A0" strokeWidth="0.6" fill="none" opacity="0.5"
            />
            <circle cx="220" cy="363" r="2.2" fill="url(#xa-silver)" />
            <ellipse cx="220" cy="373" rx="6.5" ry="8.5" fill="url(#xa-silver)" />
            <ellipse cx="220" cy="373" rx="5" ry="7" fill="url(#xa-sapphire)" />
            <ellipse cx="218" cy="370" rx="1.6" ry="2.4" fill="#FFFFFF" opacity="0.75" />
          </g>

          {/* ---------- LAYER 3 — HEAD, FEATURES, EYES ---------- */}
          <motion.g id="xa-head" style={reduced ? {} : { x: headSlideX }}>
            {/* Round, full-cheeked face. Base + side shading = volume. */}
            <path
              id="xa-face"
              d="M220 108 C266 108 298 138 300 186
                 C302 230 292 266 270 290
                 C255 306 238 314 220 314
                 C202 314 185 306 170 290
                 C148 266 138 230 140 186
                 C142 138 174 108 220 108 Z"
              fill="url(#xa-skin)"
            />
            <path
              d="M220 108 C266 108 298 138 300 186
                 C302 230 292 266 270 290
                 C255 306 238 314 220 314
                 C202 314 185 306 170 290
                 C148 266 138 230 140 186
                 C142 138 174 108 220 108 Z"
              fill="url(#xa-faceShade)"
            />
            {/* Forehead, cheek and chin highlights. */}
            <ellipse cx="220" cy="150" rx="44" ry="26" fill="url(#xa-glow)" />
            <ellipse cx="180" cy="236" rx="22" ry="15" fill="url(#xa-glow)" opacity="0.6" />
            <ellipse cx="260" cy="236" rx="22" ry="15" fill="url(#xa-glow)" opacity="0.6" />
            <ellipse cx="220" cy="298" rx="16" ry="8" fill="url(#xa-glow)" opacity="0.6" />
            {/* Rosy cheeks — stronger while smiling wide. */}
            <ellipse cx="176" cy="250" rx="26" ry="17" fill="url(#xa-blush)" opacity={isHappy ? 1 : 0.8} />
            <ellipse cx="264" cy="250" rx="26" ry="17" fill="url(#xa-blush)" opacity={isHappy ? 1 : 0.8} />

            {/* Bindi: small gold ornament with a silver centre. */}
            <circle cx="220" cy="170" r="5.2" fill="url(#xa-gold)" />
            <circle cx="220" cy="170" r="5.2" fill="none" stroke="#9A6A1C" strokeWidth="0.8" strokeDasharray="0.1 1.6" strokeLinecap="round" />
            <circle cx="220" cy="170" r="2.3" fill="url(#xa-silver)" />

            {/* Brows: thick, soft-arched, dark brown. Filled shapes so they
                taper like real brows. */}
            <motion.g style={reduced ? {} : { y: browY }}>
              <path
                d="M158 184 C164 168 190 160 210 168 C211 172 208 174 204 173
                   C188 170 172 174 163 188 Z"
                fill="#2B1A12"
              />
              <path
                d="M282 184 C276 168 250 160 230 168 C229 172 232 174 236 173
                   C252 170 268 174 277 188 Z"
                fill="#2B1A12"
              />
            </motion.g>

            {/* Eyes: large and round-ish, glossy irises, dark lash line with
                a small flick. Pupils still track the cursor. */}
            <g id="xa-eyes">
              <g ref={leftEyeRef}>
                <path d="M164 208 C168 189 206 187 211 206 C208 223 170 227 164 208 Z" fill="#FBF8F4" />
                <path d="M164 208 C168 189 206 187 211 206 C204 200 172 200 164 208 Z" fill="url(#xa-lid)" />
                <g clipPath="url(#xa-clipL)">
                  <g transform={`translate(${leftPupil.x}, ${leftPupil.y})`}>
                    <circle cx="188" cy="208" r="13.5" fill="url(#xa-iris)" />
                    <circle cx="188" cy="208" r="13.5" fill="none" stroke="#0E0704" strokeWidth="1.4" />
                    <circle cx="188" cy="208" r="7.4" fill="#070302" />
                    <circle cx="182.5" cy="202.5" r="4" fill="#FFFFFF" opacity="0.95" />
                    <circle cx="193" cy="213.5" r="1.8" fill="#FFFFFF" opacity="0.7" />
                  </g>
                </g>
                <path d="M158 203 C166 185 205 183 213 204" stroke="#120B08" strokeWidth="4.2" strokeLinecap="round" fill="none" />
                <path d="M169 219 C179 225 199 225 207 218" stroke="#8E5233" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.4" />
                {eyesClosed && (
                  <>
                    {/* Eyelid: solid local skin tone (a gradient here would be re-mapped
                        to this shape and show as a lighter patch). */}
                    <path d="M156 205 C164 180 208 178 216 203 C212 228 165 232 156 205 Z" fill="#CC8B62" />
                    <path d="M162 205 C170 220 204 220 213 204" stroke="#120B08" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                  </>
                )}
              </g>

              <g ref={rightEyeRef}>
                <path d="M276 208 C272 189 234 187 229 206 C232 223 270 227 276 208 Z" fill="#FBF8F4" />
                <path d="M276 208 C272 189 234 187 229 206 C236 200 268 200 276 208 Z" fill="url(#xa-lid)" />
                <g clipPath="url(#xa-clipR)">
                  <g transform={`translate(${rightPupil.x}, ${rightPupil.y})`}>
                    <circle cx="252" cy="208" r="13.5" fill="url(#xa-iris)" />
                    <circle cx="252" cy="208" r="13.5" fill="none" stroke="#0E0704" strokeWidth="1.4" />
                    <circle cx="252" cy="208" r="7.4" fill="#070302" />
                    <circle cx="246.5" cy="202.5" r="4" fill="#FFFFFF" opacity="0.95" />
                    <circle cx="257" cy="213.5" r="1.8" fill="#FFFFFF" opacity="0.7" />
                  </g>
                </g>
                <path d="M282 203 C274 185 235 183 227 204" stroke="#120B08" strokeWidth="4.2" strokeLinecap="round" fill="none" />
                <path d="M271 219 C261 225 241 225 233 218" stroke="#8E5233" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.4" />
                {eyesClosed && (
                  <>
                    <path d="M284 205 C276 180 232 178 224 203 C228 228 275 232 284 205 Z" fill="#CC8B62" />
                    <path d="M278 205 C270 220 236 220 227 204" stroke="#120B08" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                  </>
                )}
              </g>
            </g>

            {/* Nose: soft button nose — lit tip, shaded wings, small nostrils. */}
            <g id="xa-nose">
              <path d="M214 214 C212 226 211 234 212 238" stroke="#A9684A" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.35" />
              <ellipse cx="220" cy="242" rx="14" ry="11" fill="url(#xa-noseTip)" />
              <path d="M207 235 C200 243 203 252 212 252" stroke="#8E4E30" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M233 235 C240 243 237 252 228 252" stroke="#8E4E30" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
              <ellipse cx="214.5" cy="250.5" rx="2.6" ry="1.5" fill="#6A3420" opacity="0.65" />
              <ellipse cx="225.5" cy="250.5" rx="2.6" ry="1.5" fill="#6A3420" opacity="0.65" />
              <ellipse cx="216.5" cy="238" rx="4" ry="2.6" fill="#F4C6A2" opacity="0.75" />
            </g>

            {/* Mouth: open smile showing the top teeth, as in the image.
                Hover makes it a wider, taller grin. */}
            <g id="xa-mouth">
              {isHappy ? (
                <>
                  <path d="M186 266 C196 302 244 302 254 266 C242 273 198 273 186 266 Z" fill="#5E1E1B" />
                  <path d="M189 267 C199 284 241 284 251 267 C240 273 200 273 189 267 Z" fill="#FFFFFF" />
                  <path d="M204 290 C212 295 228 295 236 290 C228 287 212 287 204 290 Z" fill="#C55B57" opacity="0.8" />
                  <path d="M184 265 C195 257 209 257 220 261 C231 257 245 257 256 265 C244 271 196 271 184 265 Z" fill="url(#xa-lipTop)" />
                  <path d="M194 291 C204 305 236 305 246 291 C236 299 204 299 194 291 Z" fill="url(#xa-lipBottom)" />
                </>
              ) : (
                <>
                  <path d="M190 267 C200 295 240 295 250 267 C238 274 202 274 190 267 Z" fill="#5E1E1B" />
                  <path d="M193 268 C203 282 237 282 247 268 C236 274 204 274 193 268 Z" fill="#FFFFFF" />
                  <path d="M206 284 C213 288 227 288 234 284 C227 282 213 282 206 284 Z" fill="#C55B57" opacity="0.7" />
                  <path d="M188 266 C198 259 210 259 220 262 C230 259 242 259 252 266 C240 271 200 271 188 266 Z" fill="url(#xa-lipTop)" />
                  <path d="M197 286 C206 299 234 299 243 286 C234 293 206 293 197 286 Z" fill="url(#xa-lipBottom)" />
                  <ellipse cx="224" cy="293" rx="7" ry="1.8" fill="#F3A39A" opacity="0.6" />
                </>
              )}
            </g>
          </motion.g>

          {/* ---------- LAYER 4 — FRONT HAIR: voluminous crown with a soft
               middle part, and wavy side locks falling over the shoulders.
               Head-attached (headSlideX); side locks sway. ---------- */}
          <motion.g style={reduced ? {} : { x: headSlideX }}>
            {/* Crown — hairline rounds over the forehead into the temples. */}
            <path
              d="M136 232 C114 150 146 54 222 48
                 C298 52 330 146 306 232
                 C300 210 294 190 286 176
                 C278 150 258 130 234 124
                 C226 122 222 125 220 129
                 C214 123 199 121 184 128
                 C164 138 154 160 150 180
                 C144 196 140 214 136 232 Z"
              fill="url(#xa-hairFront)"
            />
            {/* Swoop over the viewer-right side, as in the image. */}
            <path
              d="M222 64 C258 66 292 92 302 136 C296 118 276 100 252 96 C238 94 228 100 222 112 Z"
              fill="#2E2622" opacity="0.8"
            />
            {/* Part and sheen strokes for volume. */}
            <path d="M218 126 C216 110 214 96 212 84" stroke="#060404" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M206 72 C178 82 162 104 156 136" stroke="#6B584C" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M190 92 C174 106 166 126 164 152" stroke="#6B584C" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M234 70 C266 78 288 102 294 140" stroke="#6B584C" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M246 92 C266 104 278 124 282 152" stroke="#6B584C" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.35" />
            {/* A few flyaways off the crown. */}
            <path d="M190 64 C182 58 172 58 166 62" stroke="#2C2522" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M258 62 C268 56 280 58 288 66" stroke="#2C2522" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />

            {/* --- LEFT SIDE LOCK (viewer left) --- */}
            <motion.g
              style={{ transformOrigin: "160px 150px" }}
              animate={reduced ? undefined : { rotate: [-2, 1.8, -2] }}
              transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
            >
              <path
                d="M150 176 C134 196 128 222 132 246
                   C116 262 108 286 120 306
                   C102 322 96 350 112 370
                   C96 388 96 416 114 432
                   C102 452 110 474 132 478
                   C148 482 162 470 164 456
                   C152 440 166 424 160 408
                   C174 392 166 370 172 354
                   C182 334 166 314 162 294
                   C156 270 150 240 152 210
                   C152 196 151 186 150 176 Z"
                fill="url(#xa-hairFront)"
              />
              <path
                d="M140 226 C130 236 128 252 136 262 M126 284 C112 294 110 314 122 324
                   M116 346 C102 356 102 376 114 386 M114 408 C102 420 104 440 116 448
                   M122 458 C114 466 118 476 130 476"
                stroke="#6E5A4E" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.6"
              />
              <path
                d="M156 300 C146 314 158 332 148 346 M162 360 C152 374 164 390 154 404 M158 420 C150 432 160 446 152 458"
                stroke="#050404" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6"
              />
            </motion.g>

            {/* --- RIGHT SIDE LOCK (viewer right) --- */}
            <motion.g
              style={{ transformOrigin: "280px 150px" }}
              animate={reduced ? undefined : { rotate: [2, -1.8, 2] }}
              transition={{ duration: 6.9, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            >
              <path
                d="M290 176 C306 196 312 222 308 246
                   C324 262 332 286 320 306
                   C338 322 344 350 328 370
                   C344 388 344 416 326 432
                   C338 452 330 474 308 478
                   C292 482 278 470 276 456
                   C288 440 274 424 280 408
                   C266 392 274 370 268 354
                   C258 334 274 314 278 294
                   C284 270 290 240 288 210
                   C288 196 289 186 290 176 Z"
                fill="url(#xa-hairFront)"
              />
              <path
                d="M300 226 C310 236 312 252 304 262 M314 284 C328 294 330 314 318 324
                   M324 346 C338 356 338 376 326 386 M326 408 C338 420 336 440 324 448
                   M318 458 C326 466 322 476 310 476"
                stroke="#6E5A4E" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.6"
              />
              <path
                d="M284 300 C294 314 282 332 292 346 M278 360 C288 374 276 390 286 404 M282 420 C290 432 280 446 288 458"
                stroke="#050404" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6"
              />
            </motion.g>
          </motion.g>

          {/* ---------- LAYER 5 — SILVER JHUMKAS: oval engraved stud, domed
               bell with an engraved band, pearl fringe. Swing with the
               cursor, ride the head-slide. ---------- */}
          <motion.g style={reduced ? {} : { x: headSlideX }} id="xa-jhumkas">
            {[
              { cx: 144, rotate: earringLeftRotate },
              { cx: 296, rotate: earringRightRotate },
            ].map(({ cx, rotate }) => (
              <motion.g key={cx} style={reduced ? {} : { rotate, transformOrigin: `${cx}px 240px` }}>
                {/* Engraved oval stud. */}
                <ellipse cx={cx} cy="251" rx="6.5" ry="10" fill="url(#xa-silver)" stroke="#5F6675" strokeWidth="0.8" />
                <ellipse cx={cx} cy="251" rx="3.6" ry="6" fill="none" stroke="#7C8393" strokeWidth="0.8" strokeDasharray="0.1 1.8" strokeLinecap="round" />
                <line x1={cx} y1="261" x2={cx} y2="267" stroke="#98A0B0" strokeWidth="2" />
                <circle cx={cx} cy="268" r="2.4" fill="url(#xa-silver)" />
                {/* Domed bell with two engraved bands. */}
                <path
                  d={`M${cx - 19} 296 C${cx - 19} 270 ${cx + 19} 270 ${cx + 19} 296 Z`}
                  fill="url(#xa-silver)" stroke="#5F6675" strokeWidth="0.9"
                />
                <path
                  d={`M${cx - 13} 283 C${cx - 6} 279 ${cx + 6} 279 ${cx + 13} 283`}
                  stroke="#6E7584" strokeWidth="1.1" strokeDasharray="0.1 2.4" strokeLinecap="round" fill="none"
                />
                <path
                  d={`M${cx - 17} 291 C${cx - 8} 288 ${cx + 8} 288 ${cx + 17} 291`}
                  stroke="#6E7584" strokeWidth="1.1" strokeDasharray="0.1 2.4" strokeLinecap="round" fill="none"
                />
                <ellipse cx={cx - 6} cy="278" rx="3.6" ry="2.4" fill="#FFFFFF" opacity="0.8" />
                <line x1={cx - 20} y1="296" x2={cx + 20} y2="296" stroke="#414A59" strokeWidth="2.2" strokeLinecap="round" />
                {/* Pearl fringe. */}
                {[-16, -12, -8, -4, 0, 4, 8, 12, 16].map((dx) => (
                  <g key={dx}>
                    <line x1={cx + dx} y1="297" x2={cx + dx} y2="300" stroke="#98A0B0" strokeWidth="0.8" />
                    <circle cx={cx + dx} cy="302" r="2" fill="#FFFFFF" stroke="#A6ADBB" strokeWidth="0.6" />
                  </g>
                ))}
              </motion.g>
            ))}
          </motion.g>
        </motion.g>
      </motion.svg>
    </div>
  );
}

/* Chikankari flowers for the left half of the kurta; the right half mirrors
   these (x -> 440 - x). Raised white-on-white, read through soft outlines. */
const EMBROIDERY = [
  // yoke, following the neckline
  { x: 176, y: 372, r: 7, rot: 0 },
  { x: 160, y: 388, r: 8, rot: 15 },
  { x: 198, y: 392, r: 6, rot: -10 },
  // chest sprays
  { x: 146, y: 414, r: 10, rot: 10 },
  { x: 120, y: 446, r: 9, rot: -15 },
  { x: 170, y: 446, r: 10, rot: 20 },
  { x: 146, y: 482, r: 11, rot: 5 },
  { x: 184, y: 494, r: 8, rot: -10 },
  { x: 100, y: 486, r: 8, rot: 30 },
  // shoulder
  { x: 104, y: 404, r: 7, rot: 0 },
  { x: 76, y: 446, r: 8, rot: 15 },
  { x: 64, y: 494, r: 7, rot: -20 },
];

function Flower({ x, y, r = 6, rot = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={-r * 0.62}
          rx={r * 0.32}
          ry={r * 0.62}
          transform={`rotate(${a})`}
          fill="url(#xa-emb)"
          stroke="#C9CED8"
          strokeWidth="0.7"
        />
      ))}
      <circle r={r * 0.28} fill="#FFFFFF" stroke="#BFC5D0" strokeWidth="0.7" />
    </g>
  );
}
