import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import "./stickerwall.css";

/* ==========================================================================
   Skill sticker wall
   --------------------------------------------------------------------------
   The "Wall" view of the Toolkit section: every tool is a flat sticker that
   drops in under gravity, collides, piles up, and can be grabbed and thrown.

   Physics is Matter.js; *rendering* is plain DOM. Matter only ever owns the
   numbers — each frame we read body.position/body.angle and write a transform
   onto a real <div>. That keeps the logos as crisp SVGs and the shadows as
   real CSS, which a canvas renderer would cost us.

   Matter is loaded with a dynamic import() so its ~25KB gzip lands in its own
   chunk and is only fetched once the section scrolls into view — it stays out
   of the initial bundle entirely.
   ========================================================================== */

/* ---- tunables ---------------------------------------------------------- */
export const PHYSICS = {
  gravity: 1.4,          // world gravity scale (1 = Matter default)
  /* Flat rectangles need more friction and less bounce than round bodies to
     settle into a tight pile instead of sliding off each other and spreading. */
  restitution: 0.30,     // bounciness on impact, 0–1
  friction: 0.52,        // surface friction between stickers
  frictionStatic: 0.9,   // resistance to *starting* to slide — keeps stacks put
  frictionAir: 0.012,    // air drag
  density: 0.0016,       // mass per area — affects throw feel
  throwPower: 1.0,       // multiplier on release velocity when thrown
  /* The decisive control on how long a thrown cube stays airborne. Without a
     cap, hang time scales with however hard the pointer was flicked — a
     full-power throw took ~5.9s to come back. Clamping release speed flattens
     that curve: measured against a headless sim of this exact world, every
     flick from gentle to absurd (vy -12 … -90) now settles in 1.6–2.0s, and a
     plain drop settles in 1.7s. Note that *lowering* frictionAir makes this
     worse, not better — at 0.005 the cube never settles at all. */
  maxThrowSpeed: 22,     // px/step ceiling applied on release
  /* One-time pause after the section scrolls into view before the first cube
     drops, so the wall doesn't burst into motion the instant it appears.
     Unrelated to maxThrowSpeed above, which governs post-throw settle time. */
  entryDelay: 1500,      // ms
  /* Coarse pointers get no drag-and-throw (Matter's touch handlers would eat
     page scrolling), so a tap instead shoves the nearby cubes apart — the
     wall stays playable on a phone without hijacking the scroll.

     The shove is spread over tapDuration rather than applied in a single
     step. A one-frame force is an instantaneous velocity change, which is
     what made the dispersal look like a jerk rather than a push; ramping the
     same impulse up and back down across ~16 steps reads as the cubes being
     shouldered aside. tapImpulse is therefore a *per-step* force now, much
     smaller than the single-hit 0.34 it replaces.

     0.034 was chosen against a headless sim of this world so the cubes travel
     the same distance as before — mean 359px from the tap versus 372px — and
     only the delivery changed: the first step's velocity jump falls from
     109.7 to 1.8, and the peak from 109.7 to 10.6. Same dispersal, no jolt. */
  tapImpulse: 0.034,     // per-step shove strength at the tap point
  tapRadius: 300,        // px falloff around the tap
  tapDuration: 260,      // ms the shove is spread across
  spawnStagger: 95,      // ms between each sticker dropping in
  wallThickness: 400,    // static bound thickness (thick = nothing tunnels out)
};

/* Exact per-tool gradient stops. Rendered at a consistent 135deg (top-left to
   bottom-right) with stops distributed evenly across the ramp, so the 3- and
   5-stop gradients (Axure, Adobe CC) read at the same rate as the 2-stop ones
   rather than being compressed at one end. */
export const GRADIENTS = {
  javascript: ["#FFF08D", "#F0CB14"],
  cursor: ["#EDECEC", "#26251E"],
  openai: ["#FFFFFF", "#26251E"],
  react: ["#C0F0FF", "#036483"],
  claude: ["#FFD8CB", "#DE3600"],
  html5: ["#FFBB75", "#E33100"],
  perplexity: ["#FFBBBB", "#208080"],
  vscode: ["#56CAFF", "#005184"],
  photoshop: ["#31A8FF", "#001E36"],
  axure: ["#74BB11", "#009CD9", "#EB2084"],
  wordpress: ["#FFB586", "#217597"],
  illustrator: ["#FF9A00", "#330000"],
  figma: ["#0AD083", "#F24E1E"],
  framer: ["#FFFFFF", "#000000"],
  miro: ["#FFDD33", "#BAEC05"],
  canva: ["#02C2CC", "#7929EB"],
  "after-effects": ["#9999FF", "#00005B"],
  adobe: ["#F80800", "#FBC604", "#44E04D", "#2A88FF", "#F81AB4"],
};

const GRADIENT_ANGLE = "135deg";

function gradientFor(slug) {
  const stops = GRADIENTS[slug] || ["#8D877D", "#4A4A4A"];
  const spread = stops
    .map((c, i) => `${c} ${((i / (stops.length - 1)) * 100).toFixed(2)}%`)
    .join(", ");
  return `linear-gradient(${GRADIENT_ANGLE}, ${spread})`;
}

/* The last stop is the bottom-right end of a 135deg ramp — which is where the
   label sits and where the edge shading lands — so it, not an average, is what
   the icon and label have to read against. */
const deepStopFor = (slug) => (GRADIENTS[slug] || ["#8D877D", "#4A4A4A"]).at(-1);

/* Tools that ship reversed (white) artwork as <slug>-dark.svg. Used on the
   wall wherever the cube itself is dark, now that the mark sits directly on
   the brand colour with no backing chip. */
const REVERSED_LOGOS = new Set(["framer", "openai", "cursor", "axure", "react"]);

/* Marks whose standard asset bakes in its own app-icon tile — a visible box
   inside the cube. These transparent versions are the bare glyph, so the mark
   sits straight on the gradient like every other logo. */
const TRANSPARENT_LOGOS = {
  /* Adobe ships the Creative Cloud mark two ways: inside its app-icon tile,
     and bare. The bare one is what belongs here — the tiled version would put
     a second, differently-coloured box inside the cube, which is the exact
     thing this map exists to avoid. */
  adobe: "adobe-cc.svg",
  "after-effects": "AE-transaprent.svg",
  illustrator: "AI-transparent.svg",
  javascript: "Javascript-transparent.svg",
  miro: "Miro-transparent.svg",
  photoshop: "Photoshop-transparent.svg",
};

/* Single-colour marks whose own hue is the cube's hue, so they vanish against
   it (Claude on Claude, and so on). These get knocked out to solid white or
   solid black depending on the cube — which is exactly the reversed treatment
   these brands publish, just done in CSS instead of needing a second asset.
   Only ever applied to marks that are a single colour: knocking out a
   multi-colour logo (Figma, HTML5, Canva) would destroy it, so those are
   deliberately absent. Adobe left this set when its artwork became the
   reversed Creative Cloud mark, which is already white. */
const KNOCKOUT_LOGOS = new Set([
  "claude", "perplexity", "wordpress", "vscode", "react",
]);

/* WCAG relative luminance — picks the label colour that actually reads on
   each cube, rather than assuming every brand colour is dark. Miro yellow
   and JavaScript yellow need near-black; Photoshop navy needs white. */
function inkFor(hex) {
  const h = hex.replace("#", "");
  const ch = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4));
  return L > 0.42 ? "#191712" : "#FFFFFF";
}

const STICKER = {
  sizeVariance: 0,       // uniform — every cube the same size
  maxTilt: 16,           // degrees of random rotation at spawn
  /* Cube size scales with the container so 18 of them still fit — and still
     read — on a phone. There is deliberately no minimum width that disables
     the engine: the drop-in has to work at every breakpoint. */
  minSize: 62,           // px, floor for the narrowest phones
  sizePerWidth: 0.0833,  // cube edge as a share of container width
  /* The mark is sized from the container too, not as a percentage of the
     cube, so the two can move independently — which is the whole point:
     sizePerWidth came down 15% (0.098 -> 0.0833) to shrink the boxes on
     desktop and laptop, and the marks inside them had to stay exactly the
     size they were. On a phone both values hit their floor, so nothing there
     changed at all.

     The numbers come from measuring what the old `height: 34%` actually
     rendered, which was not 34% of the cube: a percentage there resolves
     against the *padded* content box, so the old size was really
     0.34 x (cube - 19.2px of vertical padding). That fixed subtraction is why
     a plain ratio cannot reproduce it and logoOffset exists — with it the fit
     is exact rather than approximate. Measured old vs. reproduced, in px:
     390->14.6/15, 768->19.0/19, 1024->27.5/27.6, 1280->36.0/36.1,
     1440->41.4/41.5, 1920->57.4/57.4. */
  logoPerWidth: 0.0333,  // mark edge as a share of container width…
  logoOffset: 6.5,       // …less this, see above
  logoMinSize: 15,       // px floor, the phone mark
  frontRatio: 0.4,       // share that render *in front* of the static overlay
};

/* Deterministic-per-mount jitter so React re-renders never reshuffle sizes. */
function makeLayout(count) {
  return Array.from({ length: count }, () => {
    return {
      scale: 1 + (Math.random() * 2 - 1) * STICKER.sizeVariance,
      tilt: (Math.random() * 2 - 1) * STICKER.maxTilt,
      /* Mixed depth: some cubes pile behind the heading, some in front, so
         the text sits *inside* the pile rather than on top of it. */
      front: Math.random() < STICKER.frontRatio,
    };
  });
}

export default function SkillStickerWall({ tools, replayKey = 0, children }) {
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);
  const nodeRefs = useRef([]);
  const engineRef = useRef(null);
  const rafRef = useRef(0);
  const timersRef = useRef([]);
  /* Whether the wall is on screen right now. Starts true so the very first
     frame after arming is never skipped. */
  const visibleRef = useRef(true);
  /* "static" — flow layout, no engine (also the reduced-motion / narrow case)
     "arming" — physics layout applied but nothing drawn yet, so the wall has
                already resized to its real height when we measure it
     "live"   — engine running, transforms on the nodes
     The arming step exists because .is-static sets height:auto; measuring in
     that state built the floor at the flow height, so cubes stopped partway
     down the section instead of falling its full height. */
  const [phase, setPhase] = useState("static");
  const live = phase === "live";
  const [layout] = useState(() => makeLayout(tools.length));

  /* The mark now sits straight on the cube's own brand colour, so pick the
     reversed white artwork wherever the cube is dark enough to need it and a
     variant exists. inkFor() is the same luminance test the label uses, so
     icon and label always agree about how dark the cube is. */
  const logoSrc = useCallback((slug) => {
    const bare = TRANSPARENT_LOGOS[slug];
    if (bare) return `${process.env.PUBLIC_URL}/Logos/${bare}`;
    const wantsWhite = REVERSED_LOGOS.has(slug) && inkFor(deepStopFor(slug)) === "#FFFFFF";
    return `${process.env.PUBLIC_URL}/Logos/${slug}${wantsWhite ? "-dark" : ""}.svg`;
  }, []);

  /* Tear everything down: rAF, spawn timers, Matter world, listeners. Called
     on unmount and before any replay so nothing leaks between runs. */
  const teardown = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const ctx = engineRef.current;
    if (ctx) {
      const { Matter, engine, mouseConstraint, mouse, onResize, releaseDrag, onTap } = ctx;
      if (onResize) window.removeEventListener("resize", onResize);
      if (onTap && wrapRef.current) wrapRef.current.removeEventListener("pointerdown", onTap);
      if (releaseDrag) {
        window.removeEventListener("mouseup", releaseDrag);
        window.removeEventListener("pointerup", releaseDrag);
        window.removeEventListener("pointercancel", releaseDrag);
        window.removeEventListener("blur", releaseDrag);
        document.removeEventListener("mouseleave", releaseDrag);
      }
      if (mouse?.element && mouse.mousewheel) {
        mouse.element.removeEventListener("wheel", mouse.mousewheel);
        mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
      }
      if (mouseConstraint) Matter.Composite.remove(engine.world, mouseConstraint);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      engineRef.current = null;
    }
    nodeRefs.current.forEach((n) => {
      if (n) n.style.transform = "";
    });
  }, []);

  useEffect(() => teardown, [teardown]);


  /* Build the world. Called from the "arming" phase, so the wall is already
     laid out at its physics height when we measure it. */
  const start = useCallback(async () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    /* A zero/invalid measurement means the wall isn't laid out yet — drop
       back to the static layout rather than stranding the component in
       "arming", where the cube layers are hidden and nothing would render. */
    if (!W || !H || W < 200) {
      setPhase("static");
      return;
    }

    const Matter = await import("matter-js");
    if (!wrapRef.current) return; // unmounted while the chunk loaded

    const engine = Matter.Engine.create();
    engine.gravity.y = PHYSICS.gravity;

    const t = PHYSICS.wallThickness;
    const bound = (x, y, w, h) =>
      Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, friction: PHYSICS.friction });
    /* Floor + side walls only — no ceiling, so a sticker can be thrown up and
       fall back in. Anything that escapes is respawned in the loop below. */
    const floor = bound(W / 2, H + t / 2, W + t * 2, t);
    const leftWall = bound(-t / 2, H / 2, t, H * 4);
    const rightWall = bound(W + t / 2, H / 2, t, H * 4);
    Matter.Composite.add(engine.world, [floor, leftWall, rightWall]);

    /* Cube edge scales with the container, so the wall works on a phone as
       well as a desktop instead of being switched off below a breakpoint. */
    const edge = Math.max(STICKER.minSize, Math.round(W * STICKER.sizePerWidth));
    const logo = Math.max(
      STICKER.logoMinSize,
      Math.round(W * STICKER.logoPerWidth - STICKER.logoOffset),
    );
    const sizes = layout.map((s) => Math.round(edge * s.scale));
    sizes.forEach((px, i) => {
      const n = nodeRefs.current[i];
      if (!n) return;
      n.style.width = `${px}px`;
      n.style.height = `${px}px`;
      /* Absolute, not a share of the cube — see STICKER.logoPerWidth. The CSS
         falls back to a percentage when this is unset (the static layout). */
      n.style.setProperty("--logo", `${logo}px`);
    });

    const bodies = layout.map((s, i) =>
      Matter.Bodies.rectangle(
        W * 0.16 + Math.random() * W * 0.68,
        -200 - i * 40,
        sizes[i],
        sizes[i],
        {
          restitution: PHYSICS.restitution,
          friction: PHYSICS.friction,
          frictionStatic: PHYSICS.frictionStatic,
          frictionAir: PHYSICS.frictionAir,
          density: PHYSICS.density,
          angle: (s.tilt * Math.PI) / 180,
          chamfer: { radius: Math.round(sizes[i] * 0.16) }, // matches the puffy radius
        },
      ),
    );

    /* Drag-and-throw. MouseConstraint carries release momentum natively, so a
       flick genuinely throws. Only on fine pointers — on touch, Matter's own
       listeners preventDefault on touchmove and would eat page scrolling. */
    let mouse = null;
    let mouseConstraint = null;
    let releaseDrag = null;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine) {
      mouse = Matter.Mouse.create(wrap);
      /* Matter binds wheel handlers that swallow scroll over the canvas area.
         This section sits mid-page, so they have to go. */
      mouse.element.removeEventListener("wheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
      mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.16, damping: 0.08, render: { visible: false } },
      });
      Matter.Events.on(mouseConstraint, "enddrag", (e) => {
        const b = e.body;
        if (!b) return;
        let vx = b.velocity.x * PHYSICS.throwPower;
        let vy = b.velocity.y * PHYSICS.throwPower;
        /* Clamp the magnitude, keeping direction, so a hard flick still
           throws but can't buy unbounded hang time. */
        const speed = Math.hypot(vx, vy);
        if (speed > PHYSICS.maxThrowSpeed) {
          const k = PHYSICS.maxThrowSpeed / speed;
          vx *= k;
          vy *= k;
        }
        Matter.Body.setVelocity(b, { x: vx, y: vy });
      });
      Matter.Composite.add(engine.world, mouseConstraint);

      /* Matter only sees mouseup on the element the Mouse is bound to. Release
         the pointer anywhere else — outside the wall, outside the window, or
         by tabbing away mid-drag — and it never learns the button came up, so
         the body stays welded to the cursor. These window-level handlers
         force the constraint to let go in every one of those cases.
         mouse.button = -1 matters as much as clearing the body: without it
         Matter still believes the button is held and re-grabs on the next
         move. */
      releaseDrag = () => {
        if (!mouseConstraint) return;
        mouseConstraint.constraint.bodyB = null;
        mouseConstraint.constraint.pointB = null;
        mouseConstraint.body = null;
        if (mouse) mouse.button = -1;
      };
      window.addEventListener("mouseup", releaseDrag);
      window.addEventListener("pointerup", releaseDrag);
      window.addEventListener("pointercancel", releaseDrag);
      window.addEventListener("blur", releaseDrag);
      document.addEventListener("mouseleave", releaseDrag);
    }

    /* Coarse pointers (phones, tablets): no MouseConstraint, so a tap applies
       a radial impulse instead — cubes near the touch scatter outward, harder
       the closer they are. Desktop is deliberately untouched. */
    let onTap = null;
    if (!fine) {
      onTap = (ev) => {
        const ctx = engineRef.current;
        if (!ctx) return;
        const p = ev.touches?.[0] || ev.changedTouches?.[0] || ev;
        const r = wrap.getBoundingClientRect();
        const px = p.clientX - r.left;
        const py = p.clientY - r.top;

        /* Direction and strength are frozen at the moment of the tap; the
           frame loop then feeds that push in gradually. Recomputing them each
           step as the cube moves away would fight itself — the falloff would
           weaken exactly as the cube picks up speed, which is the jerk we're
           removing. */
        const targets = [];
        for (const b of ctx.bodies) {
          const dx = b.position.x - px;
          const dy = b.position.y - py;
          const d = Math.hypot(dx, dy) || 1;
          if (d > PHYSICS.tapRadius) continue;
          const mag = PHYSICS.tapImpulse * (1 - d / PHYSICS.tapRadius) * b.mass;
          targets.push({
            body: b,
            fx: (dx / d) * mag,
            fy: (dy / d) * mag - mag * 0.45, // bias upward so it reads as a pop
          });
        }
        if (targets.length) ctx.pulses.push({ targets, elapsed: 0 });
      };
      wrap.addEventListener("pointerdown", onTap, { passive: true });
    }

    engineRef.current = {
      Matter, engine, bodies, mouse, mouseConstraint, releaseDrag, onTap,
      floor, leftWall, rightWall, W, H,
      pulses: [], // in-flight tap shoves, drained by the frame loop
    };

    /* Keep the bounds matched to the wall as it resizes — the floor is a
       fixed body, so without this it stays at the old height and cubes
       either hang in mid-air or fall through the visible area. Repositioning
       rather than rebuilding keeps the pile that's already settled. */
    const onResize = () => {
      const ctx = engineRef.current;
      if (!ctx || !wrapRef.current) return;
      const nw = wrapRef.current.clientWidth;
      const nh = wrapRef.current.clientHeight;
      if (nw === ctx.W && nh === ctx.H) return;
      ctx.W = nw;
      ctx.H = nh;
      Matter.Body.setPosition(ctx.floor, { x: nw / 2, y: nh + t / 2 });
      Matter.Body.setPosition(ctx.leftWall, { x: -t / 2, y: nh / 2 });
      Matter.Body.setPosition(ctx.rightWall, { x: nw + t / 2, y: nh / 2 });
    };
    window.addEventListener("resize", onResize, { passive: true });
    engineRef.current.onResize = onResize;

    /* Staggered entry after a one-time settle pause, so the pile builds
       rather than dumping all at once the moment the section appears. */
    bodies.forEach((body, i) => {
      timersRef.current.push(
        setTimeout(() => {
          if (engineRef.current) Matter.Composite.add(engine.world, body);
        }, PHYSICS.entryDelay + i * PHYSICS.spawnStagger),
      );
    });

    /* Fixed timestep, accumulator-driven.

       This used to step the engine by however long the last frame happened to
       take (clamped to 32ms). That is fine at a steady 60fps and quietly
       broken everywhere else: a phone defers rAF while a scroll is in flight,
       so returning to this section delivered one giant frame, which became a
       32ms step — double length, and since displacement goes with dt² the
       cubes moved ~4x as far in it as the solver expects. They ended up deeply
       overlapped, and the next step blew them apart. That was the "glitching
       up" on the way back from About or What I Offer.

       Measured on a settled pile that should not be moving at all: 20 frames
       of 32ms steps drifted it 23.6px and *raised* the fastest body from 0.010
       to 0.022, while the same span in 16.67ms steps drifted 1.8px and brought
       it to a dead stop. Matter warns about this itself — it recommends a
       delta no greater than 16.667ms.

       Stepping only ever by STEP makes the simulation independent of frame
       pacing, and capping the catch-up means a long stall is dropped rather
       than replayed as a burst of motion. */
    const STEP = 1000 / 60;
    const MAX_CATCHUP = 3; // steps per frame; beyond this, time is discarded

    let last = performance.now();
    let acc = 0;
    let painted = false;

    const frame = (now) => {
      const ctx = engineRef.current;
      if (!ctx) return;
      rafRef.current = requestAnimationFrame(frame);

      const elapsed = now - last;
      last = now;

      /* Off screen: hold the world exactly as it is and throw away the
         backlog, so scrolling back finds the pile where it was left rather
         than mid-catch-up. The first frame is exempt — it is what flips the
         wall out of "arming". */
      if (painted && !visibleRef.current) {
        acc = 0;
        return;
      }

      acc = Math.min(acc + elapsed, STEP * MAX_CATCHUP);
      while (acc >= STEP) {
        acc -= STEP;

        /* Tap shoves are fed in here, a slice per step, on a sine ramp: no
           onset edge, no cut-off edge, so the cubes accelerate away instead
           of snapping. */
        for (let p = ctx.pulses.length - 1; p >= 0; p--) {
          const pulse = ctx.pulses[p];
          pulse.elapsed += STEP;
          const t = pulse.elapsed / PHYSICS.tapDuration;
          if (t >= 1) { ctx.pulses.splice(p, 1); continue; }
          const shape = Math.sin(Math.PI * t);
          for (const target of pulse.targets) {
            Matter.Body.applyForce(target.body, target.body.position, {
              x: target.fx * shape,
              y: target.fy * shape,
            });
          }
        }

        Matter.Engine.update(engine, STEP);
      }

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const node = nodeRefs.current[i];
        if (!node) continue;

        /* Anything flung clear out of the frame comes back in at the top
           rather than being lost forever. Read from ctx, not the values
           captured at build time, so this still bounds the right area after a
           resize or an orientation change. */
        const { W: cw, H: ch } = ctx;
        if (b.position.y > ch + 600 || b.position.x < -400 || b.position.x > cw + 400) {
          Matter.Body.setPosition(b, { x: cw * 0.2 + Math.random() * cw * 0.6, y: -160 });
          Matter.Body.setVelocity(b, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(b, 0);
        }

        const { x, y } = b.position;
        /* Transform is the only thing written per frame. There is deliberately
           no motion-driven shadow or glow — a cube looks identical moving and
           at rest. */
        node.style.transform =
          `translate3d(${x - b.__w / 2}px, ${y - b.__h / 2}px, 0) rotate(${b.angle}rad)`;
      }

      /* Only drop the static layout once real transforms are on the nodes.
         Flipping it any earlier leaves a frame where the stickers are
         absolutely positioned but untransformed — all 18 heaped at 0,0. */
      if (!painted) {
        painted = true;
        setPhase("live");
      }
      /* The next frame is already queued at the top of this function, so the
         off-screen early-return keeps the loop alive rather than killing it. */
    };

    bodies.forEach((b, i) => { b.__w = sizes[i]; b.__h = sizes[i]; });
    rafRef.current = requestAnimationFrame(frame);
  }, [layout]);

  /* Arming -> build. useLayoutEffect runs after React has committed the class
     change (.is-static removed, so the wall has grown to its physics height)
     but before paint, and reading clientHeight there forces a synchronous
     reflow — so the measurement is already correct without waiting a frame.
     This previously chained two requestAnimationFrames, which meant the wall
     never initialised at all if rAF was throttled (background tab, low-power
     mode): start() simply never ran and the cubes stayed hidden in "arming". */
  useLayoutEffect(() => {
    if (phase !== "arming") return;
    start();
  }, [phase, start]);

  /* Mount the engine only when the section reaches the viewport, so nothing
     runs while it's still below the fold.

     IntersectionObserver is the primary trigger, but it's backed by a plain
     rect check on scroll: IO callbacks are throttled — sometimes suspended
     entirely — while a tab is backgrounded, and without the backstop the
     wall can stay stuck on its static fallback even once it's plainly on
     screen. Whichever fires first wins; `done` keeps it to one run. */
  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      obs.disconnect();
      window.removeEventListener("scroll", check);
      setPhase("arming");
    };
    const check = () => {
      const r = wrap.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85 && r.bottom > 0) fire();
    };
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fire(); },
      { threshold: 0.25 },
    );
    obs.observe(wrap);
    window.addEventListener("scroll", check, { passive: true });
    check(); // already in view on mount (e.g. switching back from Grid)

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, [reduced, start, replayKey]);

  /* Separate, permanent observer: the one above disconnects after arming, but
     the frame loop needs to know whether the wall is on screen for the whole
     of its life, so it can hold still while the reader is off in About or
     What I Offer and pick up cleanly on the way back. A generous rootMargin
     means it wakes slightly before it is actually visible, so the first frame
     back is already a settled one. */
  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const obs = new IntersectionObserver(
      (entries) => { visibleRef.current = entries[0].isIntersecting; },
      { rootMargin: "200px 0px" },
    );
    obs.observe(wrap);
    return () => { obs.disconnect(); visibleRef.current = true; };
  }, [reduced]);

  /* Replay: rebuild the world from scratch when the key changes. */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduced) return;
    teardown();
    setPhase("arming");
  }, [replayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const staticFallback = reduced || phase === "static";

  return (
    <div
      ref={wrapRef}
      className={`sticker-wall${staticFallback ? " is-static" : ""}${phase === "arming" ? " is-arming" : ""}`}
      data-testid="sticker-wall"
    >
      {/* Cubes that pile *behind* the heading. */}
      <div className="sticker-layer sticker-layer--back" aria-hidden="true">
        {tools.map(([slug], i) =>
          layout[i].front ? null : <Cube key={slug} slug={slug} i={i} layout={layout} nodeRefs={nodeRefs} logoSrc={logoSrc} tools={tools} />,
        )}
      </div>

      {/* Heading, one-liner and the Wall/Grid switch. Static — never a physics
          body, never knocked around. The scrim keeps it legible when cubes
          stack up directly behind it. */}
      <div className="sticker-overlay">
        <div className="sticker-overlay-scrim" aria-hidden="true" />
        <div className="sticker-overlay-inner">{children}</div>
      </div>

      {/* …and the ones that pile in front, so the text sits inside the pile. */}
      <div className="sticker-layer sticker-layer--front" aria-hidden="true">
        {tools.map(([slug], i) =>
          layout[i].front ? <Cube key={slug} slug={slug} i={i} layout={layout} nodeRefs={nodeRefs} logoSrc={logoSrc} tools={tools} /> : null,
        )}
      </div>

      {/* The cubes are decorative here (the Grid view carries the same list as
          real text), so the accessible name lives on one hidden list instead
          of 18 aria-hidden nodes. */}
      <ul className="sr-only">
        {tools.map(([slug, name]) => <li key={slug}>{name}</li>)}
      </ul>
    </div>
  );
}

function Cube({ slug, i, layout, nodeRefs, logoSrc, tools }) {
  const s = layout[i];
  const deep = deepStopFor(slug);
  return (
    <span
      ref={(n) => { nodeRefs.current[i] = n; }}
      className="sticker"
      style={{
        "--tilt": `${s.tilt}deg`,
        "--grad": gradientFor(slug),
        "--brand": deep,
        /* Label colour picked from the cube's own luminance, so it reads on
           Miro yellow and Photoshop navy alike. */
        "--ink": inkFor(deep),
      }}
      data-knockout={
        KNOCKOUT_LOGOS.has(slug)
          ? (inkFor(deep) === "#FFFFFF" ? "light" : "dark")
          : undefined
      }
    >
      <img
        src={logoSrc(slug)}
        alt=""
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
      />
      <span className="sticker-label">{tools[i][1]}</span>
    </span>
  );
}
