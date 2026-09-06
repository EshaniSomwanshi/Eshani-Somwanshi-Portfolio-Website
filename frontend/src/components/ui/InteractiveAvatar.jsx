import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform, useReducedMotion } from "framer-motion";

// Popup lands just outside the avatar's own box (never over the face/body),
// picked randomly each click from a ring of anchor points around it.
const BUBBLE_SLOTS = [
  { top: -9, left: 12 },
  { top: -9, left: 88 },
  { top: 30, left: -9 },
  { top: 30, left: 109 },
  { top: 68, left: -9 },
  { top: 68, left: 109 },
  { top: 100, left: 22 },
  { top: 100, left: 78 }
];

/**
 * InteractiveAvatar — Loose, Flowing Hair with Face-Framing Waves
 *
 * Design:
 *  - Hair worn down: a soft wavy mass falling behind the shoulders, layered
 *    with lighter under-tones for depth (base mass → mid-tone → highlight,
 *    per standard hair-illustration layering)
 *  - Smooth swept-back crown framing the forehead, unchanged from before
 *  - Four face-framing locks (two back, two front) with varying width and
 *    wavy edges instead of a single uniform tendril, each swaying gently
 *    and independently so the whole head reads as in motion
 *  - Prominent sparkling silver jhumkas dangling with reactive physics
 *  - Real-time cursor tracking eyes & natural blinking
 */
export default function InteractiveAvatar({
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
  const [isWinking, setIsWinking] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [speechBubble, setSpeechBubble] = useState("");
  const [bubblePos, setBubblePos] = useState(BUBBLE_SLOTS[0]);

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

  const handleClick = () => {
    setIsWinking(true);
    setIsHappy(true);
    const lines = [
      "Hi there! 👋",
      "Welcome to my portfolio! ✨",
      "Designing with clarity & craft 💡",
      "Let's build something great 🚀"
    ];
    setBubblePos(BUBBLE_SLOTS[Math.floor(Math.random() * BUBBLE_SLOTS.length)]);
    setSpeechBubble(lines[Math.floor(Math.random() * lines.length)]);
    setTimeout(() => {
      setIsWinking(false);
      setTimeout(() => setSpeechBubble(""), 2600);
    }, 600);
  };

  const eyesClosed = isBlinking || isWinking;

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
      data-testid="interactive-avatar"
    >
      {/* Speech bubble — pops up just outside the avatar's box (never over
          the face/body) at a random anchor point around it each click. */}
      <AnimatePresence>
        {speechBubble && (
          <motion.div
            key={speechBubble}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="avatar-speech-bubble"
            style={{
              position: "absolute",
              top: `${bubblePos.top}%`,
              left: `${bubblePos.left}%`,
              transform: "translate(-50%, -50%)",
              background: "var(--card, #FFFFFF)",
              color: "var(--ink, #14130F)",
              padding: "7px 14px",
              borderRadius: "16px",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.76rem",
              fontWeight: 600,
              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              border: "1px solid var(--line, #E5E7EB)",
              zIndex: 30,
              whiteSpace: "nowrap",
              pointerEvents: "none"
            }}
          >
            {speechBubble}
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* Continuous Gradients */}
          <linearGradient id="ia-skin" gradientUnits="userSpaceOnUse" x1="220" y1="120" x2="220" y2="310">
            <stop offset="0%" stopColor="#F8D6B8" />
            <stop offset="60%" stopColor="#EEC099" />
            <stop offset="100%" stopColor="#E0A87E" />
          </linearGradient>
          <linearGradient id="ia-neck" gradientUnits="userSpaceOnUse" x1="220" y1="260" x2="220" y2="370">
            <stop offset="0%" stopColor="#D2946C" />
            <stop offset="50%" stopColor="#E4B189" />
            <stop offset="100%" stopColor="#EEC099" />
          </linearGradient>
          <radialGradient id="ia-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EE8264" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#EE8264" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ia-glow" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#FFE7C4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFE7C4" stopOpacity="0" />
          </radialGradient>

          {/* Hair Bun & Strands Gradients */}
          <linearGradient id="ia-bun" gradientUnits="userSpaceOnUse" x1="220" y1="70" x2="220" y2="470">
            <stop offset="0%" stopColor="#32343F" />
            <stop offset="35%" stopColor="#22242D" />
            <stop offset="100%" stopColor="#121319" />
          </linearGradient>
          <linearGradient id="ia-hairFront" gradientUnits="userSpaceOnUse" x1="120" y1="70" x2="330" y2="430">
            <stop offset="0%" stopColor="#353742" />
            <stop offset="55%" stopColor="#22242D" />
            <stop offset="100%" stopColor="#15161D" />
          </linearGradient>
          <linearGradient id="ia-hairLite" gradientUnits="userSpaceOnUse" x1="220" y1="40" x2="220" y2="380">
            <stop offset="0%" stopColor="#585D70" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2A2C36" stopOpacity="0" />
          </linearGradient>

          {/* Eye Gradients */}
          <radialGradient id="ia-iris" cx="38%" cy="34%" r="66%">
            <stop offset="0%" stopColor="#8A4C22" />
            <stop offset="58%" stopColor="#4A2409" />
            <stop offset="100%" stopColor="#1C0E04" />
          </radialGradient>
          <linearGradient id="ia-lid" gradientUnits="userSpaceOnUse" x1="220" y1="193" x2="220" y2="222">
            <stop offset="0%" stopColor="#2A1608" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2A1608" stopOpacity="0" />
          </linearGradient>

          {/* Jewelry & Kurta Gradients */}
          <linearGradient id="ia-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#DCE1EA" />
            <stop offset="100%" stopColor="#98A0B0" />
          </linearGradient>
          <radialGradient id="ia-bindi" cx="34%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="60%" stopColor="#EFA02F" />
            <stop offset="100%" stopColor="#B2650E" />
          </radialGradient>
          <linearGradient id="ia-kurta" gradientUnits="userSpaceOnUse" x1="220" y1="354" x2="220" y2="520">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="80%" stopColor="#F4F5F8" />
            <stop offset="100%" stopColor="#E4E7ED" />
          </linearGradient>

          {/* Eye ClipPaths */}
          <clipPath id="ia-clipL">
            <path d="M166 209 C170 195 202 195 206 209 C204 224 168 224 166 209 Z" />
          </clipPath>
          <clipPath id="ia-clipR">
            <path d="M234 209 C238 195 270 195 274 209 C272 224 236 224 234 209 Z" />
          </clipPath>
        </defs>

        {/* ---------- WHOLE FIGURE — hair, body, head, and jewelry share one
             transform so they move as a single rigid figure and never drift
             apart from each other; only the details nested inside (hair-lock
             sway, eye tracking, jhumka swing) move independently. ---------- */}
        {/* Interactive handlers live here, not on the wrapping <div> — an
            SVG <g> has no paint of its own, so it only receives hover/click
            when the pointer actually lands on a child shape (visiblePainted
            default). Putting them on the outer div instead made the whole
            rectangular bounding box hoverable, including transparent
            padding around the figure, which read as "hover works outside
            her" — this fixes it to the drawn silhouette only. */}
        <motion.g
          onClick={handleClick}
          onMouseEnter={() => setIsHappy(true)}
          onMouseLeave={() => setIsHappy(false)}
          onFocus={() => setIsHappy(true)}
          onBlur={() => setIsHappy(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Say hello"
          data-cursor="Click me"
          style={
            reduced
              ? { cursor: "pointer" }
              : {
                  rotateY: figureRotateY,
                  rotateX: figureRotateX,
                  x: figureX,
                  y: figureY,
                  transformOrigin: "220px 270px",
                  cursor: "pointer"
                }
          }
        >
        {/* ---------- LAYER 1 — LOOSE HAIR FALLING BEHIND THE SHOULDERS ----------
             Two mirrored locks (not one symmetric blob) so each can sway on
             its own timing — real hair never moves as a single rigid mass.
             Each lock is a base-tone shape plus a lighter highlight stroke
             traced just inside its outer edge, the same base → highlight
             layering used for painted hair. Hair is attached to the head, not
             the shoulders, so it rides along with the neck-slide (headSlideX)
             — otherwise the head glides out from under a stationary hairline
             and covers/uncovers the face at the wrong spot. */}
        <motion.g style={reduced ? {} : { x: headSlideX }}>
          <motion.g
            style={{ transformOrigin: "222px 78px" }}
            animate={reduced ? undefined : { rotate: [-1.6, 1.4, -1.6] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Outer edge widens once, smoothly, then rounds into a blunt
                full end (per the reference's rounded outline) instead of
                pinching in and out to a tapered point. */}
            <path
              d="M220 70 C252 68 282 80 300 112
                 C316 144 316 184 308 222
                 C302 256 314 288 322 322
                 C330 354 324 388 306 416
                 C294 434 278 446 260 442
                 C268 424 262 398 266 368
                 C270 334 256 302 262 270
                 C248 238 236 206 240 174
                 C226 140 222 106 220 70 Z"
              fill="url(#ia-bun)"
            />
            <path
              d="M234 84 C268 98 290 130 290 170 C290 204 276 230 282 260
                 C288 292 304 318 300 348 C296 374 284 396 288 418"
              stroke="url(#ia-hairLite)"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.45"
            />
          </motion.g>
          <motion.g
            style={{ transformOrigin: "218px 78px" }}
            animate={reduced ? undefined : { rotate: [1.5, -1.7, 1.5] }}
            transition={{ duration: 8.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          >
            <path
              d="M220 70 C188 68 158 80 140 112
                 C124 144 124 184 132 222
                 C138 256 126 288 118 322
                 C110 354 116 388 134 416
                 C146 434 162 446 180 442
                 C172 424 178 398 174 368
                 C170 334 184 302 178 270
                 C192 238 204 206 200 174
                 C214 140 218 106 220 70 Z"
              fill="url(#ia-bun)"
            />
            <path
              d="M206 84 C172 98 150 130 150 170 C150 204 164 230 158 260
                 C152 292 136 318 140 348 C144 374 156 396 152 418"
              stroke="url(#ia-hairLite)"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.45"
            />
          </motion.g>
        </motion.g>

        {/* Fixed hair backing behind the neck — deliberately NOT attached to
            headSlideX. Layers 1/3/4/5 all ride the head-slide together, but
            the neck below is stationary, so on every slide the moving hair
            pulls away from one side of the (fixed) neck and opens a bare
            gap. This static panel sits behind the neck at all times, wider
            than the neck on both sides by more than the slide's max travel,
            so hair always shows there regardless of head position — as if
            the hair falls straight down behind her, not just from the head. */}
        <path
          d="M220 185 C165 185 148 220 148 270 L148 410
             C148 440 175 455 220 455 C265 455 292 440 292 410
             L292 270 C292 220 275 185 220 185 Z"
          fill="url(#ia-bun)"
        />

        {/* ---------- LAYER 2 — NECK, SHOULDERS, KURTA ---------- */}
        <g id="ia-body">
          <path
            d="M194 258 L180 360 C194 374 246 374 260 360 L246 258 Z"
            fill="url(#ia-neck)"
          />
          <path d="M192 270 C204 295 236 295 248 270 C242 298 198 298 192 270 Z" fill="#A9673C" opacity="0.38" />

          {/* Collar's opening edge now retraces the neck's own boundary
              exactly — (180,360) to (260,360) via the same C194 374 246 374
              curve the neck path uses — so collar and neck share one line
              with no gap and no independent seam. The neck path itself is
              untouched. */}
          <path
            d="M60 520 C68 446 104 398 158 378 C167 371 174 365 180 360 C194 374 246 374 260 360 C266 365 273 371 282 378 C336 398 372 446 380 520 Z"
            fill="url(#ia-kurta)"
          />
          <path d="M60 520 C68 452 98 408 146 386 C126 424 116 470 112 520 Z" fill="#C9CFDC" opacity="0.22" />
          <path d="M380 520 C372 452 342 408 294 386 C314 424 324 470 328 520 Z" fill="#C9CFDC" opacity="0.22" />

          <path d="M192 356 C202 386 212 408 220 416 C228 408 238 386 248 356 Z" fill="url(#ia-neck)" />

          <path
            d="M188 358 C196 388 208 410 220 422 C232 410 244 388 252 358"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M184 356 C193 390 206 414 220 428 C234 414 247 390 256 356"
            stroke="#D9DEE8"
            strokeWidth="1.6"
            strokeDasharray="4 3.5"
            fill="none"
          />

          <path
            d="M200 358 C206 376 213 388 220 395 C227 388 234 376 240 358"
            stroke="url(#ia-silver)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="220" cy="397" r="3.6" fill="#3B6FD4" stroke="#FFFFFF" strokeWidth="1.2" />
        </g>

        {/* ---------- LAYER 3 — HEAD, FEATURES, EYES ---------- */}
        <motion.g id="ia-head" style={reduced ? {} : { x: headSlideX }}>
          {/* Ears */}
          <path d="M150 208 C138 206 133 220 137 234 C140 244 147 250 153 248 Z" fill="url(#ia-skin)" />
          <path
            d="M146 218 C141 222 141 234 147 238"
            stroke="#CE8259"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M290 208 C302 206 307 220 303 234 C300 244 293 250 287 248 Z" fill="url(#ia-skin)" />
          <path
            d="M294 218 C299 222 299 234 293 238"
            stroke="#CE8259"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Symmetrical Face Oval */}
          <path
            d="M168 152 
               C152 185 149 220 153 250 
               C160 276 186 298 220 304 
               C254 298 280 276 287 250 
               C291 220 288 185 272 152 
               C254 138 238 135 220 135 
               C202 135 186 138 168 152 Z"
            fill="url(#ia-skin)"
          />
          <ellipse cx="220" cy="176" rx="50" ry="38" fill="url(#ia-glow)" />
          <ellipse cx="178" cy="236" rx="19" ry="12" fill="url(#ia-blush)" />
          <ellipse cx="262" cy="236" rx="19" ry="12" fill="url(#ia-blush)" />

          {/* Golden Bindi */}
          <circle cx="220" cy="166" r="4" fill="url(#ia-bindi)" />
          <circle cx="218.8" cy="164.8" r="1.1" fill="#FFF3D0" opacity="0.9" />

          {/* Eyebrows */}
          <motion.g style={reduced ? {} : { y: browY }}>
            <path
              d="M167 187 C176 176 199 174 209 182"
              stroke="#1A1B22"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M273 187 C264 176 241 174 231 182"
              stroke="#1A1B22"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>

          {/* Eyes */}
          <g id="ia-eyes">
            {/* Left Eye */}
            <g ref={leftEyeRef}>
              <path d="M166 209 C170 195 202 195 206 209 C204 224 168 224 166 209 Z" fill="#FDFCFA" />
              <path d="M166 209 C170 195 202 195 206 209 C202 202 170 202 166 209 Z" fill="url(#ia-lid)" />
              <g clipPath="url(#ia-clipL)">
                <g transform={`translate(${leftPupil.x}, ${leftPupil.y})`}>
                  <circle cx="186" cy="209" r="10.6" fill="url(#ia-iris)" />
                  <circle cx="186" cy="209" r="10.6" fill="none" stroke="#170A02" strokeWidth="1.3" />
                  <circle cx="186" cy="209" r="5.2" fill="#0B0501" />
                  <circle cx="183" cy="205" r="2.8" fill="#FFFFFF" opacity="0.95" />
                  <circle cx="189.5" cy="212.5" r="1.3" fill="#FFFFFF" opacity="0.6" />
                </g>
              </g>
              <path
                d="M165 208 C171 193 201 193 207 208"
                stroke="#16171D"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M165.5 209 C161 210 158.5 209 157 206"
                stroke="#16171D"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M170 219 C178 223 194 223 202 218"
                stroke="#C98D64"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
              {eyesClosed && (
                <>
                  <ellipse cx="187" cy="211" rx="24" ry="18" fill="url(#ia-skin)" />
                  <path
                    d="M165 205 C171 220 201 220 207 205"
                    stroke="#16171D"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M165.5 206 C161 207 158.5 206 157 203"
                    stroke="#16171D"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}
            </g>

            {/* Right Eye */}
            <g ref={rightEyeRef}>
              <path d="M234 209 C238 195 270 195 274 209 C272 224 236 224 234 209 Z" fill="#FDFCFA" />
              <path d="M234 209 C238 195 270 195 274 209 C270 202 238 202 234 209 Z" fill="url(#ia-lid)" />
              <g clipPath="url(#ia-clipR)">
                <g transform={`translate(${rightPupil.x}, ${rightPupil.y})`}>
                  <circle cx="254" cy="209" r="10.6" fill="url(#ia-iris)" />
                  <circle cx="254" cy="209" r="10.6" fill="none" stroke="#170A02" strokeWidth="1.3" />
                  <circle cx="254" cy="209" r="5.2" fill="#0B0501" />
                  <circle cx="251" cy="205" r="2.8" fill="#FFFFFF" opacity="0.95" />
                  <circle cx="256.5" cy="212.5" r="1.3" fill="#FFFFFF" opacity="0.6" />
                </g>
              </g>
              <path
                d="M233 208 C239 193 269 193 275 208"
                stroke="#16171D"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M274.5 209 C279 210 281.5 209 283 206"
                stroke="#16171D"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M238 218 C246 223 262 223 270 219"
                stroke="#C98D64"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
              {eyesClosed && (
                <>
                  <ellipse cx="253" cy="211" rx="24" ry="18" fill="url(#ia-skin)" />
                  <path
                    d="M233 205 C239 220 269 220 275 205"
                    stroke="#16171D"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M274.5 206 C279 207 281.5 206 283 203"
                    stroke="#16171D"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}
            </g>
          </g>

          {/* Nose */}
          <g id="ia-nose">
            <path
              d="M221 224 C218 234 216 241 217 245"
              stroke="#D89B72"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />
            <ellipse cx="220" cy="248" rx="8" ry="4.5" fill="#E39A6C" opacity="0.28" />
            <path
              d="M212 250 C215 254 225 254 228 250"
              stroke="#B4703F"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Mouth */}
          <g id="ia-mouth">
            {isHappy ? (
              <>
                <path d="M201 266 C209 282 231 282 239 266 Z" fill="#8E2C1C" />
                <path d="M204 267 C211 273 229 273 236 267 Z" fill="#FFFFFF" />
                <path
                  d="M199 265 C209 269 231 269 241 265"
                  stroke="#A8442A"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : (
              <>
                <path
                  d="M203 268 C210 279 230 279 237 268"
                  stroke="#A8442A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M208 274 C213 278 227 278 232 274"
                  stroke="#E08163"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.8"
                />
              </>
            )}
          </g>
        </motion.g>

        {/* ---------- LAYER 4 — SWEPT-BACK CROWN + FOUR FACE-FRAMING WAVES ----------
             Also head-attached — rides along with headSlideX so the crown
             and face-framing locks stay put relative to the face instead of
             covering it as the head glides past. ---------- */}
        <motion.g style={reduced ? {} : { x: headSlideX }}>
          {/* Curtain-bangs crown, per the reference photo — replaced with
              two big rounded lobes per side (real chunky curl pieces, not
              a rippled line). The deep dip of each lobe sits out at the
              temple (x>270 / x<170), clear of the eyes below; only the
              shallower second bump passes over the brow. Outer silhouette
              (head width / top) is unchanged. */}
          <path
            d="M148 192
               C140 110 172 72 220 72
               C268 72 300 110 292 192
               C294 208 282 212 272 194
               C262 178 254 184 246 168
               C234 156 228 152 220 148
               C212 152 206 156 194 168
               C186 184 178 178 168 194
               C158 212 146 208 148 192 Z"
            fill="url(#ia-hairFront)"
          />
          {/* Mid-tone patch under each lobe for depth, same layering the
              rest of the hair uses (base tone → lighter under-layer). */}
          <path
            d="M272 194 C282 206 268 216 254 204 C246 196 248 182 258 176 Z"
            fill="url(#ia-hairLite)"
            opacity="0.3"
          />
          <path
            d="M168 194 C158 206 172 216 186 204 C194 196 192 182 182 176 Z"
            fill="url(#ia-hairLite)"
            opacity="0.3"
          />

          {/* Bold curl strands tracing each lobe's edge — visible loops
              instead of faint lines, so the wave reads clearly. */}
          <path
            d="M284 202 C292 188 286 170 270 158 C282 172 280 190 268 200"
            stroke="url(#ia-hairLite)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.65"
          />
          <path
            d="M250 172 C256 160 250 148 236 140"
            stroke="url(#ia-hairLite)"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M156 202 C148 188 154 170 170 158 C158 172 160 190 172 200"
            stroke="url(#ia-hairLite)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.65"
          />
          <path
            d="M190 172 C184 160 190 148 204 140"
            stroke="url(#ia-hairLite)"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          {/* A couple of loose flyaway hairs at the part — small, thin, real
              hair is never perfectly smooth at the edges. */}
          <path d="M204 78 C198 88 196 100 200 112" stroke="#3A3D49" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M240 80 C246 90 248 102 244 114" stroke="#3A3D49" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />

          {/* =========================================================
              FOUR FACE-FRAMING WAVY LOCKS — two wider ones falling to the
              shoulders, two shorter ones layered in front for depth, each
              swaying on its own timing so the hair reads as loose, not
              like two static tendrils glued to the face.
              ========================================================= */}

          {/* --- LEFT, LONG LOCK --- */}
          <motion.g
            style={{ transformOrigin: "178px 140px" }}
            animate={reduced ? undefined : { rotate: [-2.2, 1.8, -2.2] }}
            transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          >
            {/* Widened well past the old thin-lock silhouette into a full
                panel of hair — outer edge (away from the face) pushed far
                out for real volume, inner edge (bordering the jaw) and the
                crown attachment left as they were, so this reads as hair
                covering that whole side, not a rope-like strand. */}
            <path
              d="M172 136 C152 160 128 200 120 248
                 C112 288 82 314 68 356
                 C58 390 68 416 64 442
                 C60 462 92 470 122 456
                 C126 440 138 414 148 388
                 C158 358 170 322 165 284
                 C160 248 172 208 184 176
                 C190 160 182 146 172 136 Z"
              fill="url(#ia-hairFront)"
            />
            <path
              d="M164 150 C144 186 128 226 118 264
                 C108 296 84 320 72 352"
              stroke="url(#ia-hairLite)"
              strokeWidth="2.3"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            {/* Seam line — traces this lock's own outer edge so it reads as
                a visibly separate section (the curtain bangs) laid over the
                back hair mass, running from the part down to the shoulder. */}
            <path
              d="M172 136 C152 160 128 200 120 248
                 C112 288 82 314 68 356"
              stroke="#15161D"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </motion.g>

          {/* --- RIGHT, LONG LOCK --- */}
          <motion.g
            style={{ transformOrigin: "262px 140px" }}
            animate={reduced ? undefined : { rotate: [2.1, -1.9, 2.1] }}
            transition={{ duration: 6.9, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <path
              d="M268 136 C288 160 312 200 320 248
                 C328 288 358 314 372 356
                 C382 390 372 416 376 442
                 C380 462 348 470 318 456
                 C314 440 302 414 292 388
                 C282 358 270 322 275 284
                 C280 248 268 208 256 176
                 C250 160 258 146 268 136 Z"
              fill="url(#ia-hairFront)"
            />
            <path
              d="M276 150 C296 186 312 226 322 264
                 C332 296 356 320 368 352"
              stroke="url(#ia-hairLite)"
              strokeWidth="2.3"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M268 136 C288 160 312 200 320 248
                 C328 288 358 314 372 356"
              stroke="#15161D"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </motion.g>

        </motion.g>

        {/* ---------- LAYER 5 — JHUMKAS ---------- */}
        {/* Dangle from the earlobes, which are part of the head group — ride
            along with headSlideX so they stay attached to the ears instead
            of floating away from them as the head glides. */}
        <motion.g style={reduced ? {} : { x: headSlideX }} id="ia-jhumkas">
          <motion.g style={reduced ? {} : { rotate: earringLeftRotate, transformOrigin: "152px 252px" }}>
            <circle cx="152" cy="252" r="3.4" fill="url(#ia-silver)" stroke="#5F6675" strokeWidth="0.7" />
            <line x1="152" y1="255" x2="152" y2="261" stroke="#98A0B0" strokeWidth="1.8" />
            <path d="M141 272 C141 261 163 261 163 272 Z" fill="url(#ia-silver)" stroke="#5F6675" strokeWidth="0.9" />
            <line x1="140" y1="272" x2="164" y2="272" stroke="#414A59" strokeWidth="1.8" />
            <circle cx="143" cy="276.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="147.5" cy="277.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="152" cy="278" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="156.5" cy="277.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="161" cy="276.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
          </motion.g>

          <motion.g style={reduced ? {} : { rotate: earringRightRotate, transformOrigin: "288px 252px" }}>
            <circle cx="288" cy="252" r="3.4" fill="url(#ia-silver)" stroke="#5F6675" strokeWidth="0.7" />
            <line x1="288" y1="255" x2="288" y2="261" stroke="#98A0B0" strokeWidth="1.8" />
            <path d="M277 272 C277 261 299 261 299 272 Z" fill="url(#ia-silver)" stroke="#5F6675" strokeWidth="0.9" />
            <line x1="276" y1="272" x2="300" y2="272" stroke="#414A59" strokeWidth="1.8" />
            <circle cx="279" cy="276.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="283.5" cy="277.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="288" cy="278" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="292.5" cy="277.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
            <circle cx="297" cy="276.5" r="1.4" fill="#FFF" stroke="#98A0B0" strokeWidth="0.5" />
          </motion.g>
        </motion.g>
        </motion.g>
      </motion.svg>
    </div>
  );
}