/* ExplorationVectorAvatar — work in progress: the reference portrait rebuilt
   as layered vector shapes, traced from the image by trace_avatar.py
   (output: avatarShapes.js). Static for now; motion gets rigged onto these
   layers once the look is approved.

   Layers (back to front): kurta, hair, skin, chain, pendant, brows, eyes
   (opening + coded iris/pupil/highlights, clipped), lash lines, mouth,
   bindi, earrings. Hair, skin and kurta have a base silhouette plus tonal
   zones, softly blended and clipped to the silhouette for smooth shading. */
import React from "react";
import { SIZE, SHAPES } from "./avatarShapes";

const IRIS = { L: { cx: 362, cy: 388 }, R: { cx: 548, cy: 388 }, r: 28, pupil: 18 };

function Paths({ list }) {
  return (list || []).map((p, i) => <path key={i} d={p.d} fill={p.fill} fillRule="evenodd" />);
}

function Soft({ name, blur }) {
  const list = SHAPES[name] || [];
  if (!list.length) return null;
  const [base, ...rest] = list;
  return (
    <g>
      <clipPath id={`xv-clip-${name}`}>
        <path d={base.d} fillRule="evenodd" />
      </clipPath>
      <path d={base.d} fill={base.fill} fillRule="evenodd" />
      <g clipPath={`url(#xv-clip-${name})`}>
        <g filter={`url(#xv-blur-${blur})`}>
          <Paths list={rest} />
        </g>
      </g>
    </g>
  );
}

function Eye({ side }) {
  const open = SHAPES[`eye${side}Open`][0];
  const { cx, cy } = IRIS[side];
  return (
    <g>
      <clipPath id={`xv-eye-${side}`}>
        <path d={open.d} fillRule="evenodd" />
      </clipPath>
      <g clipPath={`url(#xv-eye-${side})`}>
        <path d={open.d} fill="#f4efee" fillRule="evenodd" />
        <circle cx={cx} cy={cy} r={IRIS.r} fill="url(#xv-iris)" />
        <circle cx={cx} cy={cy} r={IRIS.r} fill="none" stroke="#1d1411" strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r={IRIS.pupil} fill="#0b0605" />
        <circle cx={cx + 15} cy={cy - 11} r="5.5" fill="#ffffff" />
        <circle cx={cx - 9} cy={cy + 12} r="2.2" fill="#ffffff" opacity="0.6" />
      </g>
    </g>
  );
}

export default function ExplorationVectorAvatar({ size = 560 }) {
  return (
    <div
      data-testid="exploration-vector-avatar"
      style={{ width: "100%", maxWidth: `${size}px`, margin: "0 auto" }}
    >
      <svg
        viewBox={`0 0 ${SIZE.w} ${SIZE.h}`}
        role="img"
        aria-label="Eshani's avatar, vector version (work in progress)"
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <defs>
          <filter id="xv-blur-2"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="xv-blur-1"><feGaussianBlur stdDeviation="1" /></filter>
          <filter id="xv-blur-3"><feGaussianBlur stdDeviation="3" /></filter>
          <radialGradient id="xv-iris" cx="50%" cy="60%" r="55%">
            <stop offset="0" stopColor="#8a7a70" />
            <stop offset=".7" stopColor="#4a3c35" />
            <stop offset="1" stopColor="#2a201c" />
          </radialGradient>
          <radialGradient id="xv-gold" cx="38%" cy="32%" r="70%">
            <stop offset="0" stopColor="#ffe7a3" />
            <stop offset=".6" stopColor="#d9a441" />
            <stop offset="1" stopColor="#8e6118" />
          </radialGradient>
        </defs>
        <Soft name="kurta" blur={2} />
        <Soft name="hair" blur={1} />
        <Soft name="skin" blur={3} />
        <Paths list={SHAPES.chain} />
        <Paths list={SHAPES.pendant} />
        <Paths list={SHAPES.browL} />
        <Paths list={SHAPES.browR} />
        <Eye side="L" />
        <Eye side="R" />
        <Paths list={SHAPES.eyeLLash} />
        <Paths list={SHAPES.eyeRLash} />
        <Paths list={SHAPES.mouth} />
        <circle cx="456" cy="311" r="7" fill="url(#xv-gold)" />
        <circle cx="456" cy="311" r="3" fill="#dfe3ea" />
        <Paths list={SHAPES.earL} />
        <Paths list={SHAPES.earR} />
      </svg>
    </div>
  );
}
