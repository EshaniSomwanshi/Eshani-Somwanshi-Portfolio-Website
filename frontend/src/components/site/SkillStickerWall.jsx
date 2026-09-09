import React, { useCallback, useEffect, useRef, useState } from "react";
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
  gravity: 1.1,          // world gravity scale (1 = Matter default)
  /* Flat rectangles need more friction and less bounce than round bodies to
     settle into a tight pile instead of sliding off each other and spreading.
     restitution 0.42 -> 0.30 and friction 0.38 -> 0.52. */
  restitution: 0.30,     // bounciness on impact, 0–1
  friction: 0.52,        // surface friction between stickers
  frictionStatic: 0.9,   // resistance to *starting* to slide — keeps stacks put
  frictionAir: 0.014,    // air drag; higher = settles sooner
  density: 0.0016,       // mass per area — affects throw feel
  throwPower: 1.35,      // multiplier on release velocity when thrown
  spawnStagger: 95,      // ms between each sticker dropping in
  wallThickness: 400,    // static bound thickness (thick = nothing tunnels out)
};

/* Dominant brand colour per tool, read off the actual logo artwork. The box
   is built as a *tint* of this rather than the flat colour: a Claude-coloured
   mark on a Claude-coloured box would disappear. See stickerwall.css. */
export const BRAND = {
  figma: "#F24E1E",
  claude: "#D97757",
  vscode: "#0065A9",
  html5: "#E34F26",
  javascript: "#F7DF1E",
  react: "#61DAFB",
  cursor: "#2E2E2E",
  framer: "#0055FF",
  /* The Adobe apps' real icon grounds are the dark tiles, not the letter
     colour — that's the colour "behind the logo" the brief asks for. */
  photoshop: "#001E36",
  illustrator: "#330000",
  "after-effects": "#00005B",
  miro: "#FFDD33",
  adobe: "#EB1000",
  canva: "#00C4CC",
  openai: "#10A37F",
  wordpress: "#21759B",
  axure: "#009CD9",
  perplexity: "#20808D",
};

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
  baseWidth: 116,        // px, before per-sticker variance
  baseHeight: 116,       // square-ish, so the cubes read as cubes
  sizeVariance: 0.11,    // ±11% — organic, not wildly different
  maxTilt: 16,           // degrees of random rotation at spawn
  minWidthForPhysics: 640, // below this container width, fall back to static
  frontRatio: 0.4,       // share that render *in front* of the static overlay
};

/* Deterministic-per-mount jitter so React re-renders never reshuffle sizes. */
function makeLayout(count) {
  return Array.from({ length: count }, () => {
    const scale = 1 + (Math.random() * 2 - 1) * STICKER.sizeVariance;
    return {
      width: Math.round(STICKER.baseWidth * scale),
      height: Math.round(STICKER.baseHeight * scale),
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

  /* Always the standard logo, never the reversed -dark variant: every icon
     sits on a light backing chip (see .sticker-chip), so the mark is always
     against a pale ground regardless of how dark the cube is. The Grid view
     still swaps per theme. */
  const logoSrc = useCallback(
    (slug) => `${process.env.PUBLIC_URL}/Logos/${slug}.svg`,
    [],
  );

  /* Tear everything down: rAF, spawn timers, Matter world, listeners. Called
     on unmount and before any replay so nothing leaks between runs. */
  const teardown = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const ctx = engineRef.current;
    if (ctx) {
      const { Matter, engine, mouseConstraint, mouse, onResize } = ctx;
      if (onResize) window.removeEventListener("resize", onResize);
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
    if (W < STICKER.minWidthForPhysics) return; // static fallback handles it

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

    const bodies = layout.map((s, i) =>
      Matter.Bodies.rectangle(
        W * 0.16 + Math.random() * W * 0.68,
        -200 - i * 40,
        s.width,
        s.height,
        {
          restitution: PHYSICS.restitution,
          friction: PHYSICS.friction,
          frictionStatic: PHYSICS.frictionStatic,
          frictionAir: PHYSICS.frictionAir,
          density: PHYSICS.density,
          angle: (s.tilt * Math.PI) / 180,
          chamfer: { radius: 18 }, // matches the puffy corner radius
        },
      ),
    );

    /* Drag-and-throw. MouseConstraint carries release momentum natively, so a
       flick genuinely throws. Only on fine pointers — on touch, Matter's own
       listeners preventDefault on touchmove and would eat page scrolling. */
    let mouse = null;
    let mouseConstraint = null;
    if (window.matchMedia("(pointer: fine)").matches) {
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
        Matter.Body.setVelocity(b, {
          x: b.velocity.x * PHYSICS.throwPower,
          y: b.velocity.y * PHYSICS.throwPower,
        });
      });
      Matter.Composite.add(engine.world, mouseConstraint);
    }

    engineRef.current = { Matter, engine, bodies, mouse, mouseConstraint, floor, leftWall, rightWall, W, H };

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

    /* Staggered entry so the pile builds rather than dumping all at once. */
    bodies.forEach((body, i) => {
      timersRef.current.push(
        setTimeout(() => {
          if (engineRef.current) Matter.Composite.add(engine.world, body);
        }, i * PHYSICS.spawnStagger),
      );
    });

    let last = performance.now();
    let painted = false;
    const frame = (now) => {
      const ctx = engineRef.current;
      if (!ctx) return;
      const dt = Math.min(32, now - last);
      last = now;
      Matter.Engine.update(engine, dt);

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const node = nodeRefs.current[i];
        if (!node) continue;

        /* Anything flung clear out of the frame comes back in at the top
           rather than being lost forever. */
        if (b.position.y > H + 600 || b.position.x < -400 || b.position.x > W + 400) {
          Matter.Body.setPosition(b, { x: W * 0.2 + Math.random() * W * 0.6, y: -160 });
          Matter.Body.setVelocity(b, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(b, 0);
        }

        const { x, y } = b.position;
        node.style.transform =
          `translate3d(${x - b.__w / 2}px, ${y - b.__h / 2}px, 0) rotate(${b.angle}rad)`;

        /* Shadow depth tracks speed — airborne/fast stickers cast a deeper,
           softer shadow; settled ones sit almost flat on the pile. */
        const speed = Math.min(1, Math.hypot(b.velocity.x, b.velocity.y) / 14);
        node.style.setProperty("--lift", speed.toFixed(3));
      }

      /* Only drop the static layout once real transforms are on the nodes.
         Flipping it any earlier leaves a frame where the stickers are
         absolutely positioned but untransformed — all 18 heaped at 0,0. */
      if (!painted) {
        painted = true;
        setPhase("live");
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    bodies.forEach((b, i) => {
      b.__w = layout[i].width;
      b.__h = layout[i].height;
    });
    rafRef.current = requestAnimationFrame(frame);
  }, [layout]);

  /* Arming -> build. Two rAFs so the browser has committed the layout change
     (.is-static removed, so height goes from auto to calc(100vh - 60px))
     before start() measures the wall. Measuring any earlier is exactly the
     bug that put the floor partway up the section. */
  useEffect(() => {
    if (phase !== "arming") return;
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => start());
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
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
      className={`sticker-wall${staticFallback ? " is-static" : ""}`}
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
  const brand = BRAND[slug] || "#8D877D";
  return (
    <span
      ref={(n) => { nodeRefs.current[i] = n; }}
      className="sticker"
      style={{
        width: s.width,
        height: s.height,
        "--tilt": `${s.tilt}deg`,
        "--brand": brand,
        /* Label colour picked from the cube's own luminance, so it reads on
           Miro yellow and Photoshop navy alike. */
        "--ink": inkFor(brand),
      }}
    >
      {/* Backing chip: keeps every mark on a pale ground so the cube can stay
          full brand colour instead of being diluted to a pastel. */}
      <span className="sticker-chip">
        <img
          src={logoSrc(slug)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
        />
      </span>
      <span className="sticker-label">{tools[i][1]}</span>
    </span>
  );
}
