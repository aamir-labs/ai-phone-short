// =====================================================================
//  "Your Phone Is Becoming an AI Computer" - 60s vertical Short
//  1080 x 1920, 30 fps. Everything here is original, code-drawn motion
//  graphics. No stock footage, no paid assets.
//
//  Timeline (frames come from timing.json, written by gen_audio.py so
//  visuals + captions always match the real narration length):
//    hook > what > npu > speed > privacy > limits > cost > hybrid > outro
// =====================================================================
import React from "react";
import * as Remotion from "remotion";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {loadFont} from "@remotion/google-fonts/Inter";
import timing from "./timing.json";

const {fontFamily} = loadFont("normal", {
  weights: ["400", "700", "800"],
  subsets: ["latin"],
});
const FONT = `${fontFamily}, "Helvetica Neue", Arial, sans-serif`;

// Newer Remotion 4.x renamed <Audio> to <Html5Audio>; support both names.
const AudioC = ((Remotion as any).Html5Audio ?? (Remotion as any).Audio) as React.ComponentType<{src: string; volume?: number}>;

const W = 1080;
const H = 1920;
const FPS = 30;
const OVERLAP = 14; // frames that neighbouring scenes cross-fade

const C = {
  navy: "#050b1f",
  panel: "rgba(10,22,52,0.85)",
  cyan: "#00e5ff",
  violet: "#8b5cf6",
  pink: "#ff3d81",
  text: "#eaf4ff",
  dim: "#8fa3c7",
};

// ---------------------------------------------------------------- helpers
const ip = (
  f: number,
  a: number,
  b: number,
  x: number,
  y: number,
  easing: (t: number) => number = Easing.out(Easing.cubic),
) =>
  interpolate(f, [a, Math.max(b, a + 1)], [x, y], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const pop = (f: number, delay = 0) =>
  spring({frame: f - delay, fps: FPS, config: {damping: 16, stiffness: 120}});
const smooth = (f: number, delay = 0) =>
  spring({frame: f - delay, fps: FPS, config: {damping: 200}});
const tri = (t: number) => (t < 0.5 ? t * 2 : 2 - t * 2); // 0..1..0
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const gradText: React.CSSProperties = {
  backgroundImage: `linear-gradient(90deg, ${C.cyan}, ${C.violet})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

// Stage-wide SVG (canvas coordinates == pixel coordinates)
const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{position: "absolute", left: 0, top: 0}}
  >
    {children}
  </svg>
);

// Glow without SVG filters: stacked translucent strokes (cheap + reliable)
const Glow: React.FC<{
  d: string;
  color?: string;
  width?: number;
  opacity?: number;
  dash?: string;
  dashOffset?: number;
  fill?: string;
}> = ({d, color = C.cyan, width = 4, opacity = 1, dash, dashOffset = 0, fill = "none"}) => (
  <g opacity={opacity}>
    <path d={d} fill="none" stroke={color} strokeOpacity={0.1} strokeWidth={width + 18} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={width + 8} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={dashOffset} />
  </g>
);

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;

const Dot: React.FC<{x: number; y: number; r?: number; color?: string; opacity?: number}> = ({x, y, r = 8, color = C.cyan, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 2.6} fill={color} opacity={0.12} />
    <circle cx={x} cy={y} r={r * 1.7} fill={color} opacity={0.25} />
    <circle cx={x} cy={y} r={r} fill={color} />
  </g>
);

const Label: React.FC<{x: number; y: number; text: string; size?: number; color?: string; weight?: number; spacing?: number; opacity?: number}> = ({
  x, y, text, size = 30, color = C.text, weight = 700, spacing = 4, opacity = 1,
}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontSize={size} fontWeight={weight} letterSpacing={spacing} fill={color} opacity={opacity}>
    {text}
  </text>
);

// ------------------------------------------------------------ glyph pieces
const MiniPhone: React.FC<{x: number; y: number; s?: number; color?: string; chip?: number; opacity?: number}> = ({
  x, y, s = 1, color = C.cyan, chip = 0.5, opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <path d={rr(-60, -110, 120, 220, 22)} fill="rgba(6,14,38,0.92)" stroke={color} strokeWidth={4} />
    <path d={rr(-66, -116, 132, 232, 28)} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={10} />
    <rect x={-16} y={-98} width={32} height={7} rx={3.5} fill={color} opacity={0.6} />
    <rect x={-26} y={-26} width={52} height={52} rx={9} fill={color} opacity={0.12 + chip * 0.5} stroke={color} strokeWidth={3} />
    <rect x={-12} y={-12} width={24} height={24} rx={4} fill={color} opacity={0.35 + chip * 0.65} />
    {[-16, 0, 16].map((p) => (
      <g key={p} stroke={color} strokeWidth={3} opacity={0.7}>
        <line x1={p} y1={-26} x2={p} y2={-38} />
        <line x1={p} y1={26} x2={p} y2={38} />
        <line x1={-26} y1={p} x2={-38} y2={p} />
        <line x1={26} y1={p} x2={38} y2={p} />
      </g>
    ))}
  </g>
);

const CloudGlyph: React.FC<{x: number; y: number; s?: number; color?: string; opacity?: number}> = ({
  x, y, s = 1, color = C.violet, opacity = 1,
}) => {
  const shapes = (
    <>
      <circle cx={-42} cy={0} r={34} />
      <circle cx={4} cy={-24} r={46} />
      <circle cx={52} cy={2} r={32} />
      <rect x={-76} y={2} width={156} height={34} rx={17} />
    </>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <g fill={color} stroke={color} strokeWidth={14} opacity={0.25}>{shapes}</g>
      <g fill={color} stroke={color} strokeWidth={8}>{shapes}</g>
      <g fill="#0a1433" stroke="none">{shapes}</g>
      <circle cx={-14} cy={6} r={5} fill={color} />
      <circle cx={10} cy={6} r={5} fill={color} />
      <circle cx={34} cy={6} r={5} fill={color} />
    </g>
  );
};

const ServerGlyph: React.FC<{x: number; y: number; s?: number; color?: string; opacity?: number; f?: number}> = ({
  x, y, s = 1, color = C.violet, opacity = 1, f = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    {[-58, 0, 58].map((oy, i) => (
      <g key={oy}>
        <path d={rr(-62, oy - 24, 124, 48, 10)} fill="#0a1433" stroke={color} strokeWidth={4} />
        <circle cx={-38} cy={oy} r={5} fill={i % 2 === 0 ? C.cyan : color} opacity={0.5 + 0.5 * Math.sin((f + i * 7) / 5)} />
        <rect x={-10} y={oy - 3} width={56} height={6} rx={3} fill={color} opacity={0.5} />
      </g>
    ))}
  </g>
);

// ----------------------------------------------------------- global layers
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const particles = Array.from({length: 38}, (_, i) => {
    const x = random(`px${i}`) * W;
    const base = random(`py${i}`) * H;
    const sp = 0.25 + random(`ps${i}`) * 0.9;
    const y = (((base - f * sp) % H) + H) % H;
    const r = 1.5 + random(`pr${i}`) * 3.2;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (20 + i) + i));
    return (
      <div key={i} style={{position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: "50%", background: i % 3 === 0 ? C.violet : C.cyan, opacity: tw * 0.55, boxShadow: `0 0 ${r * 4}px ${i % 3 === 0 ? C.violet : C.cyan}`}} />
    );
  });
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 75% at 50% 28%, #10205a 0%, ${C.navy} 58%, #02040d 100%)`}}>
      <div style={{position: "absolute", width: 1000, height: 1000, left: -140 + Math.sin(f / 90) * 90, top: 40 + Math.cos(f / 110) * 70, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,229,255,0.17), rgba(0,229,255,0) 65%)"}} />
      <div style={{position: "absolute", width: 1100, height: 1100, left: 300 + Math.cos(f / 100) * 90, top: 820 + Math.sin(f / 80) * 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.2), rgba(139,92,246,0) 65%)"}} />
      <div
        style={{
          position: "absolute", left: "-60%", width: "220%", top: 1240, height: 1500,
          transformOrigin: "50% 0", transform: "perspective(650px) rotateX(74deg)",
          backgroundImage: `linear-gradient(rgba(0,229,255,0.30) 2px, transparent 2px), linear-gradient(90deg, rgba(139,92,246,0.30) 2px, transparent 2px)`,
          backgroundSize: "120px 120px", backgroundPosition: `0px ${f * 3}px`,
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0) 75%)",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0) 75%)",
        }}
      />
      {particles}
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: "none", background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)"}} />
);

const Scene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const inn = ip(f, 0, 16, 0, 1);
  const out = ip(f, dur - OVERLAP, dur, 1, 0, Easing.in(Easing.cubic));
  const blur = (1 - inn) * 14 + (1 - out) * 10;
  const scale = 0.965 + 0.035 * inn + (1 - out) * 0.05;
  return (
    <AbsoluteFill style={{opacity: Math.min(inn, out), transform: `scale(${scale})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

const Sweep: React.FC = () => {
  const f = useCurrentFrame();
  const x = ip(f, 0, 22, -500, 1500, Easing.inOut(Easing.cubic));
  const o = ip(f, 0, 6, 0, 1) * ip(f, 14, 22, 1, 0);
  return (
    <AbsoluteFill style={{pointerEvents: "none", opacity: o}}>
      <div style={{position: "absolute", top: -200, height: 2400, width: 280, left: x, transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(0,229,255,0), rgba(0,229,255,0.35), rgba(255,255,255,0.6), rgba(139,92,246,0.35), rgba(139,92,246,0))"}} />
    </AbsoluteFill>
  );
};

const Headline: React.FC<{eyebrow: string; lines: {t: string; grad?: boolean}[]; y?: number; size?: number}> = ({eyebrow, lines, y = 180, size = 100}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: FONT}}>
      <div style={{fontSize: 30, letterSpacing: 10, color: C.cyan, fontWeight: 700, opacity: ip(f, 2, 14, 0, 1), transform: `translateY(${ip(f, 2, 14, 12, 0)}px)`}}>{eyebrow}</div>
      {lines.map((l, i) => {
        const s = smooth(f, 8 + i * 6);
        return (
          <div key={i} style={{fontSize: size, fontWeight: 800, lineHeight: 1.04, marginTop: i === 0 ? 16 : 0, opacity: s, transform: `translateY(${(1 - s) * 44}px)`, letterSpacing: -2, ...(l.grad ? gradText : {color: C.text})}}>
            {l.t}
          </div>
        );
      })}
    </div>
  );
};

const Pill: React.FC<{x: number; y: number; text: string; color?: string; w?: number; opacity?: number; scale?: number; size?: number}> = ({
  x, y, text, color = C.cyan, w = 640, opacity = 1, scale = 1, size = 32,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <path d={rr(-w / 2, -36, w, 72, 36)} fill="rgba(8,18,46,0.9)" stroke={color} strokeWidth={3} />
    <path d={rr(-w / 2 - 5, -41, w + 10, 82, 41)} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={8} />
    <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} letterSpacing={2} fill={color === C.cyan ? C.text : color}>{text}</text>
  </g>
);

// =====================================================================
//  SCENES
// =====================================================================

// 1. HOOK -------------------------------------------------------------
const HookScene: React.FC = () => {
  const f = useCurrentFrame();
  const phoneIn = pop(f, 6);
  const cx = 540, cy = 900;
  const nodes = [
    [-42, -82], [0, -90], [42, -82], [-46, -50], [46, -50], [-46, 50], [46, 50], [-42, 82], [0, 90], [42, 82],
  ];
  return (
    <AbsoluteFill>
      <Headline eyebrow="SCIENCE + FUTURE TECH" lines={[{t: "YOUR PHONE"}, {t: "IS BECOMING"}, {t: "AN AI COMPUTER", grad: true}]} size={96} />
      <Stage>
        {[0, 1, 2].map((i) => {
          const t = ((f * 1.6 + i * 40) % 120) / 120;
          return <circle key={i} cx={cx} cy={cy} r={120 + t * 380} fill="none" stroke={i % 2 ? C.violet : C.cyan} strokeWidth={3} opacity={(1 - t) * 0.5 * phoneIn} />;
        })}
        <g transform={`translate(${cx} ${cy}) scale(${1.95 * phoneIn}) translate(${-cx} ${-cy})`}>
          <MiniPhone x={cx} y={cy} s={1} chip={0.5 + 0.5 * Math.sin(f / 6)} />
          <g transform={`translate(${cx} ${cy})`}>
            {nodes.map(([nx, ny], i) => nodes.slice(i + 1).map(([mx, my], j) => {
              const show = ip(f, 22 + i * 3, 50 + i * 3, 0, 1);
              if (Math.hypot(nx - mx, ny - my) > 70) return null;
              return <line key={`${i}-${j}`} x1={nx} y1={ny} x2={mx} y2={my} stroke={C.violet} strokeWidth={1.6} opacity={0.8 * show} />;
            }))}
            {nodes.map(([nx, ny], i) => <circle key={`n${i}`} cx={nx} cy={ny} r={3.5} fill={C.cyan} opacity={ip(f, 22 + i * 3, 40 + i * 3, 0, 1)} />)}
          </g>
        </g>
        {[-120, 120].map((dx, i) => (
          <Glow key={i} d={`M${cx + dx * 0.65} ${cy} H${cx + dx * 2.9}`} color={i ? C.violet : C.cyan} width={3} opacity={ip(f, 30, 60, 0, 0.8)} dash="14 12" dashOffset={-f * 2} />
        ))}
      </Stage>
    </AbsoluteFill>
  );
};

// 2. WHAT IT MEANS -------------------------------------------------------
const WhatScene: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const bIn = smooth(f, Math.round(dur * 0.42));
  const aFade = 1 - 0.5 * bIn;
  const t = ((f - 14) % 70) / 70;
  const px = lerp(250, 820, tri(Math.max(0, t)));
  const orb = f / 9;
  return (
    <AbsoluteFill>
      <Headline eyebrow="ON-DEVICE AI" lines={[{t: "WHERE THE"}, {t: "AI RUNS", grad: true}]} />
      <Stage>
        <g opacity={aFade * smooth(f, 10)}>
          <Label x={540} y={540} text="CLOUD AI" size={28} color={C.dim} />
          <MiniPhone x={160} y={640} s={0.62} color={C.dim} chip={0.2} />
          <CloudGlyph x={920} y={640} s={0.85} />
          <Glow d="M240 640 H820" color={C.violet} width={3} opacity={0.7} dash="12 12" dashOffset={-f * 1.5} />
          <Dot x={px} y={640} r={9} color={C.violet} />
          <Label x={540} y={742} text="Request travels to a remote data center" size={29} color={C.dim} weight={400} spacing={1} />
        </g>
        <g opacity={bIn} transform={`translate(0 ${(1 - bIn) * 40})`}>
          <Label x={540} y={850} text="ON-DEVICE AI" size={30} color={C.cyan} />
          <MiniPhone x={540} y={1010} s={1.05} chip={0.5 + 0.5 * Math.sin(f / 5)} />
          <circle cx={540} cy={1010} r={100} fill="none" stroke={C.cyan} strokeWidth={3} strokeDasharray="6 14" opacity={0.7} />
          <Dot x={540 + Math.cos(orb) * 100} y={1010 + Math.sin(orb) * 100} r={8} />
          <Dot x={540 + Math.cos(orb + Math.PI) * 100} y={1010 + Math.sin(orb + Math.PI) * 100} r={6} color={C.violet} />
          <Label x={540} y={1168} text="Runs on the phone's own chip" size={31} color={C.text} weight={700} spacing={1} />
        </g>
      </Stage>
    </AbsoluteFill>
  );
};

// 3. THE NPU --------------------------------------------------------------
const NpuScene: React.FC = () => {
  const f = useCurrentFrame();
  const cx = 540, cy = 800, size = 440;
  const grid = 6, cell = 50, gap = 10;
  const span = grid * cell + (grid - 1) * gap;
  const x0 = cx - span / 2, y0 = cy - span / 2;
  const chipIn = pop(f, 4);
  const wave = (f * 0.11) % 6.5;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const d = Math.hypot(c - 2.5, r - 2.5);
      const b = Math.exp(-((d - wave) ** 2) / 0.9);
      const x = x0 + c * (cell + gap), y = y0 + r * (cell + gap);
      cells.push(
        <g key={`${r}-${c}`}>
          <rect x={x} y={y} width={cell} height={cell} rx={9} fill={C.cyan} opacity={0.07 + b * 0.85} />
          <rect x={x} y={y} width={cell} height={cell} rx={9} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.35 + b * 0.6} />
        </g>,
      );
    }
  }
  const pins = Array.from({length: 8}, (_, i) => -size / 2 + 46 + i * ((size - 92) / 7));
  return (
    <AbsoluteFill>
      <Headline eyebrow="THE HARDWARE" lines={[{t: "NEURAL"}, {t: "PROCESSOR", grad: true}]} />
      <Stage>
        <g transform={`translate(${cx} ${cy}) scale(${chipIn}) translate(${-cx} ${-cy})`}>
          {pins.map((p, i) => (
            <g key={i} stroke={C.violet} strokeWidth={5} strokeLinecap="round" opacity={0.85}>
              <line x1={cx + p} y1={cy - size / 2} x2={cx + p} y2={cy - size / 2 - 38} />
              <line x1={cx + p} y1={cy + size / 2} x2={cx + p} y2={cy + size / 2 + 38} />
              <line x1={cx - size / 2} y1={cy + p} x2={cx - size / 2 - 38} y2={cy + p} />
              <line x1={cx + size / 2} y1={cy + p} x2={cx + size / 2 + 38} y2={cy + p} />
            </g>
          ))}
          <path d={rr(cx - size / 2, cy - size / 2, size, size, 40)} fill="rgba(6,14,38,0.95)" />
          <Glow d={rr(cx - size / 2, cy - size / 2, size, size, 40)} width={5} />
          {cells}
        </g>
        <Pill x={540} y={1150} text="MANY SMALL CALCULATIONS AT ONCE" w={800} size={27} opacity={smooth(f, 40)} scale={0.9 + 0.1 * smooth(f, 40)} />
      </Stage>
    </AbsoluteFill>
  );
};

// 4. LESS WAITING (illustrative) -------------------------------------------
const SpeedScene: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const t1 = ((f - 10) % 84) / 84;
  const x1 = lerp(190, 890, tri(Math.max(0, t1)));
  const bIn = smooth(f, Math.round(dur * 0.3));
  const t2 = (f % 20) / 20;
  const a2 = t2 * Math.PI * 2;
  const offIn = smooth(f, Math.round(dur * 0.62));
  return (
    <AbsoluteFill>
      <Headline eyebrow="BENEFIT 01" lines={[{t: "LESS"}, {t: "WAITING", grad: true}]} />
      <Stage>
        <g opacity={smooth(f, 8) * (1 - 0.45 * bIn)}>
          <Label x={540} y={528} text="VIA THE CLOUD" size={26} color={C.dim} />
          <MiniPhone x={140} y={640} s={0.55} color={C.dim} chip={0.2} />
          <ServerGlyph x={935} y={640} s={0.62} f={f} />
          <Glow d="M215 640 H860" color={C.violet} width={3} dash="10 12" dashOffset={-f * 1.4} opacity={0.7} />
          {[0.33, 0.66].map((p, i) => (
            <circle key={i} cx={lerp(215, 860, p)} cy={640} r={10} fill="#0a1433" stroke={C.dim} strokeWidth={3} />
          ))}
          <Dot x={x1} y={640} r={9} color={C.violet} />
        </g>
        <g opacity={bIn} transform={`translate(0 ${(1 - bIn) * 30})`}>
          <Label x={540} y={800} text="ON THE DEVICE" size={26} color={C.cyan} />
          <MiniPhone x={540} y={915} s={0.8} chip={0.5 + 0.5 * Math.sin(f / 3)} />
          <circle cx={540} cy={915} r={72} fill="none" stroke={C.cyan} strokeOpacity={0.6} strokeWidth={3} strokeDasharray="5 11" />
          <Dot x={540 + Math.cos(a2) * 72} y={915 + Math.sin(a2) * 72} r={7} />
        </g>
        <g opacity={offIn} transform={`translate(0 ${(1 - offIn) * 24})`}>
          <Pill x={540} y={1100} text="SOME FEATURES WORK OFFLINE" color={C.cyan} w={760} size={28} />
          <g transform="translate(246 1100)" stroke={C.cyan} strokeWidth={3.5} fill="none" strokeLinecap="round">
            <path d="M-14 -4 Q0 -14 14 -4" />
            <path d="M-8 4 Q0 -2 8 4" />
            <circle cx={0} cy={11} r={2} fill={C.cyan} />
            <line x1={-18} y1={-16} x2={18} y2={18} stroke={C.pink} />
          </g>
        </g>
        <Label x={540} y={1192} text="Illustrative - real results vary" size={27} color={C.dim} weight={400} spacing={1} opacity={smooth(f, 30)} />
      </Stage>
    </AbsoluteFill>
  );
};

// 5. PRIVACY ----------------------------------------------------------------
const PrivacyScene: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const cx = 540, cy = 860;
  const ph = pop(f, 6);
  const ring = ip(f, 10, 50, 0, 1);
  const badge = smooth(f, Math.round(dur * 0.5));
  const dots = Array.from({length: 7}, (_, i) => {
    const a = f / (24 + i * 3) + i * 1.7;
    const rad = 70 + (i % 3) * 22;
    return <Dot key={i} x={cx + Math.cos(a) * rad * 0.8} y={cy + Math.sin(a * 1.3) * rad * 1.3} r={5} color={i % 2 ? C.violet : C.cyan} opacity={ph} />;
  });
  const esc = tri(((f - 20) % 90) / 90);
  return (
    <AbsoluteFill>
      <Headline eyebrow="BENEFIT 02" lines={[{t: "POSSIBLY"}, {t: "MORE PRIVATE", grad: true}]} />
      <Stage>
        <Glow d={`M${cx - 300} ${cy} A300 300 0 1 1 ${cx + 300} ${cy} A300 300 0 1 1 ${cx - 300} ${cy}`} color={C.cyan} width={3} dash="16 12" dashOffset={-f * 1.2} opacity={0.75 * ring} />
        <MiniPhone x={cx} y={cy} s={1.8 * ph} chip={0.5} />
        {dots}
        {/* shield + lock */}
        <g transform={`translate(${cx} ${cy}) scale(${ph * 1.2})`} opacity={ip(f, 18, 34, 0, 1)}>
          <path d="M0 -42 L36 -28 V6 Q36 34 0 50 Q-36 34 -36 6 V-28 Z" fill="rgba(0,229,255,0.12)" stroke={C.cyan} strokeWidth={4} />
          <rect x={-14} y={-6} width={28} height={22} rx={5} fill={C.cyan} />
          <path d="M-8 -6 V-14 A8 8 0 0 1 8 -14 V-6" fill="none" stroke={C.cyan} strokeWidth={4} />
        </g>
        {/* a packet that sometimes leaves - privacy depends on the app */}
        <Dot x={lerp(cx + 100, cx + 380, esc)} y={lerp(cy - 60, cy - 250, esc)} r={7} color={C.violet} opacity={badge} />
        <CloudGlyph x={880} y={580} s={0.55} color={C.dim} opacity={0.55 * badge} />
        <Pill x={540} y={1186} text="DEPENDS ON THE APP" color={C.violet} w={600} size={30} opacity={badge} scale={0.9 + 0.1 * badge} />
      </Stage>
    </AbsoluteFill>
  );
};

// 6. SMALLER MODELS (illustrative) -----------------------------------------------
const NetBall: React.FC<{cx: number; cy: number; r: number; n: number; f: number; color: string; show: number}> = ({cx, cy, r, n, f, color, show}) => {
  const pts = Array.from({length: n}, (_, i) => {
    const a = random(`na${n}${i}`) * Math.PI * 2;
    const d = Math.sqrt(random(`nd${n}${i}`)) * r * 0.92;
    return [cx + Math.cos(a + f / 160) * d, cy + Math.sin(a + f / 160) * d] as const;
  });
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < r * 0.5) {
        lines.push(<line key={`${i}-${j}`} x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]} stroke={color} strokeWidth={1.4} opacity={0.5 * show} />);
      }
    }
  }
  return (
    <g opacity={show}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(8,18,46,0.7)" stroke={color} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={10} />
      {lines}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={r > 100 ? 4.5 : 3.5} fill={color} />)}
    </g>
  );
};

const Bar: React.FC<{x: number; y: number; w: number; frac: number; color: string; label: string}> = ({x, y, w, frac, color, label}) => (
  <g>
    <text x={x} y={y - 12} fontFamily={FONT} fontSize={26} fontWeight={700} letterSpacing={3} fill={C.dim}>{label}</text>
    <rect x={x} y={y} width={w} height={20} rx={10} fill="rgba(143,163,199,0.18)" />
    <rect x={x} y={y} width={Math.max(2, w * frac)} height={20} rx={10} fill={color} />
  </g>
);

const LimitsScene: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = smooth(f, 8);
  const b = smooth(f, Math.round(dur * 0.4));
  const g1 = ip(f, 14, 50, 0, 1);
  const g2 = ip(f, Math.round(dur * 0.4), Math.round(dur * 0.4) + 36, 0, 1);
  return (
    <AbsoluteFill>
      <Headline eyebrow="LIMIT 01" lines={[{t: "SMALLER"}, {t: "MODELS", grad: true}]} />
      <Stage>
        <NetBall cx={235} cy={720} r={150} n={46} f={f} color={C.violet} show={a} />
        <Label x={235} y={920} text="DATA CENTER" size={26} color={C.dim} spacing={3} opacity={a} />
        <g opacity={a}>
          <Bar x={440} y={690} w={540} frac={g1} color={C.violet} label="REASONING" />
          <Bar x={440} y={770} w={540} frac={g1 * 0.95} color={C.violet} label="KNOWLEDGE" />
        </g>
        <NetBall cx={235} cy={1040} r={70} n={14} f={f} color={C.cyan} show={b} />
        <Label x={235} y={1150} text="PHONE" size={26} color={C.cyan} spacing={3} opacity={b} />
        <g opacity={b}>
          <Bar x={440} y={1010} w={540} frac={g2 * 0.34} color={C.cyan} label="REASONING" />
          <Bar x={440} y={1090} w={540} frac={g2 * 0.28} color={C.cyan} label="KNOWLEDGE" />
        </g>
        <Label x={540} y={1210} text="Illustrative scale - not a measurement" size={27} color={C.dim} weight={400} spacing={1} opacity={b} />
      </Stage>
    </AbsoluteFill>
  );
};

// 7. BATTERY / MEMORY / HEAT ---------------------------------------------------------
const CostScene: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const p = ip(f, 10, dur - 20, 0, 1, Easing.inOut(Easing.quad));
  const cy = 790;
  const battery = lerp(0.9, 0.42, p);
  const mem = Math.round(lerp(2, 7, p));
  const heat = lerp(0.2, 0.92, p);
  const hot = heat > 0.65 ? C.pink : C.cyan;
  const th = ip(f, Math.round(dur * 0.55), Math.round(dur * 0.55) + 24, 0, 1);
  const perf = lerp(1, 0.55, th);
  const colX = [200, 540, 880];
  const show = (i: number) => smooth(f, 6 + i * 8);
  return (
    <AbsoluteFill>
      <Headline eyebrow="LIMIT 02" lines={[{t: "POWER"}, {t: "& HEAT", grad: true}]} />
      <Stage>
        {/* battery */}
        <g transform={`translate(${colX[0]} ${cy})`} opacity={show(0)}>
          <rect x={-18} y={-132} width={36} height={14} rx={4} fill={C.cyan} />
          <path d={rr(-62, -118, 124, 236, 18)} fill="rgba(6,14,38,0.9)" stroke={C.cyan} strokeWidth={4} />
          <rect x={-50} y={106 - 212 * battery} width={100} height={212 * battery} rx={10} fill={C.cyan} opacity={0.85} />
        </g>
        {/* memory */}
        <g transform={`translate(${colX[1]} ${cy})`} opacity={show(1)}>
          {Array.from({length: 8}, (_, i) => {
            const filled = i >= 8 - mem;
            return <rect key={i} x={-62} y={-118 + i * 30} width={124} height={22} rx={6} fill={C.violet} opacity={filled ? 0.9 : 0.14} stroke={C.violet} strokeWidth={2} />;
          })}
        </g>
        {/* heat */}
        <g transform={`translate(${colX[2]} ${cy})`} opacity={show(2)}>
          <path d={rr(-20, -125, 40, 200, 20)} fill="rgba(6,14,38,0.9)" stroke={hot} strokeWidth={4} />
          <circle cx={0} cy={92} r={40} fill="rgba(6,14,38,0.9)" stroke={hot} strokeWidth={4} />
          <rect x={-9} y={80 - 190 * heat} width={18} height={190 * heat + 20} rx={9} fill={hot} />
          <circle cx={0} cy={92} r={27} fill={hot} />
        </g>
        {["BATTERY", "MEMORY", "HEAT"].map((t, i) => (
          <Label key={t} x={colX[i]} y={990} text={t} size={28} color={i === 2 ? hot : i === 1 ? C.violet : C.cyan} opacity={show(i)} spacing={5} />
        ))}
        {/* throttling */}
        <g opacity={ip(f, Math.round(dur * 0.5), Math.round(dur * 0.5) + 14, 0, 1)}>
          <Label x={540} y={1070} text="PERFORMANCE" size={24} color={C.dim} spacing={5} />
          <rect x={190} y={1092} width={700} height={22} rx={11} fill="rgba(143,163,199,0.18)" />
          <rect x={190} y={1092} width={700 * perf} height={22} rx={11} fill={perf < 0.9 ? C.pink : C.cyan} />
          <Label x={540} y={1160} text="THROTTLING TO STAY SAFE" size={26} color={C.pink} spacing={4} opacity={th} />
        </g>
      </Stage>
    </AbsoluteFill>
  );
};

// 8. HYBRID ---------------------------------------------------------------------------
const HybridScene: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const cloudX = 540, cloudY = 600, phoneX = 540, phoneY = 985;
  const a = smooth(f, 6);
  const t1 = ((f - 8) % 70) / 70;
  const heavy = tri(Math.max(0, t1));
  const quick = (((f - 4) % 36) / 36);
  const chipsIn = smooth(f, Math.round(dur * 0.3));
  return (
    <AbsoluteFill>
      <Headline eyebrow="THE REALITY" lines={[{t: "HYBRID"}, {t: "AI", grad: true}]} />
      <Stage>
        <g opacity={a}>
          <CloudGlyph x={cloudX} y={cloudY} s={1.25} />
          <MiniPhone x={phoneX} y={phoneY} s={1.45} chip={0.5 + 0.5 * Math.sin(f / 5)} />
          <Glow d={`M${cloudX} ${cloudY + 70} V${phoneY - 170}`} color={C.violet} width={4} dash="12 12" dashOffset={-f * 1.6} opacity={0.8} />
          <Dot x={cloudX} y={lerp(phoneY - 175, cloudY + 75, heavy)} r={13} color={C.violet} />
        </g>
        <g opacity={chipsIn} transform={`translate(${(1 - chipsIn) * -40} 0)`}>
          <Pill x={255} y={785} text="QUICK + PERSONAL" color={C.cyan} w={420} size={26} />
          <Glow d="M330 823 Q400 900 452 955" color={C.cyan} width={3} opacity={0.8} />
          <Dot x={lerp(330, 452, quick)} y={lerp(823, 955, quick)} r={6} />
        </g>
        <g opacity={chipsIn} transform={`translate(${(1 - chipsIn) * 40} 0)`}>
          <Pill x={850} y={800} text="HEAVY WORK" color={C.violet} w={320} size={26} />
          <Glow d="M850 765 Q850 640 700 610" color={C.violet} width={3} opacity={0.8} />
        </g>
        <Label x={540} y={1190} text="LOCAL WHERE IT HELPS - CLOUD WHEN NEEDED" size={25} color={C.dim} spacing={2} opacity={chipsIn} />
      </Stage>
    </AbsoluteFill>
  );
};

// 9. OUTRO -----------------------------------------------------------------------------
const OutroScene: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = smooth(f, 8);
  const merge = ip(f, Math.round(dur * 0.35), Math.round(dur * 0.35) + 40, 0, 1, Easing.inOut(Easing.cubic));
  const part = smooth(f, Math.round(dur * 0.4));
  const cta = pop(f, Math.round(dur * 0.68));
  const phoneY = lerp(1010, 945, merge);
  const cloudY = lerp(660, 715, merge);
  return (
    <AbsoluteFill>
      <Headline eyebrow="THE TAKEAWAY" lines={[{t: "NOT REPLACING"}, {t: "THE CLOUD", grad: true}]} />
      <Stage>
        <g opacity={a}>
          <CloudGlyph x={540} y={cloudY} s={1.15} color={merge > 0.6 ? C.cyan : C.violet} />
          <MiniPhone x={540} y={phoneY} s={1.15} chip={0.5 + 0.5 * Math.sin(f / 5)} />
          <Glow d={`M540 ${cloudY + 50} V${phoneY - 135}`} color={C.cyan} width={4} dash="10 10" dashOffset={-f * 1.8} opacity={0.4 + 0.5 * merge} />
          <circle cx={540} cy={(cloudY + phoneY) / 2} r={300 * merge} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.35 * (1 - merge) + 0.1} />
        </g>
        <Label x={540} y={1138} text="BECOMING PART OF IT" size={44} color={C.text} weight={800} spacing={3} opacity={part} />
        <Pill x={540} y={1214} text="FOLLOW FOR MORE FUTURE TECH" color={C.cyan} w={820} size={30} opacity={cta} scale={0.8 + 0.2 * cta + 0.02 * Math.sin(f / 6)} />
      </Stage>
    </AbsoluteFill>
  );
};

// =====================================================================
//  CAPTIONS - word-by-word, timed from the real narration length
// =====================================================================
type Word = {text: string; start: number; end: number};
type Chunk = {words: Word[]; start: number; end: number};

const buildChunks = (): Chunk[] => {
  const chunks: Chunk[] = [];
  timing.scenes.forEach((s) => {
    const toks = s.text.split(/\s+/).filter(Boolean);
    const weights = toks.map((t) => t.replace(/[^\w']/g, "").length + 2 + (/[,.:;!?]$/.test(t) ? 4 : 0));
    const total = weights.reduce((x, y) => x + y, 0);
    let cur = s.start + s.speechStart;
    const words: Word[] = toks.map((t, i) => {
      const d = (s.speechFrames * weights[i]) / total;
      const w = {text: t, start: cur, end: cur + d};
      cur += d;
      return w;
    });
    let group: Word[] = [];
    const flush = () => {
      if (group.length) {
        chunks.push({words: group, start: group[0].start, end: group[group.length - 1].end});
        group = [];
      }
    };
    words.forEach((w) => {
      group.push(w);
      if (group.length >= 4 || /[,.:;!?]$/.test(w.text)) flush();
    });
    flush();
  });
  return chunks;
};
const CHUNKS = buildChunks();

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  let idx = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (CHUNKS[i].start - 1 <= f) idx = i;
  if (idx < 0) return null;
  const ch = CHUNKS[idx];
  if (f > ch.end + 12) return null;
  const local = f - ch.start;
  const enter = spring({frame: local + 1, fps: FPS, config: {damping: 18, stiffness: 220}});
  return (
    <div style={{position: "absolute", left: 60, right: 60, top: 1290, height: 210, display: "flex", alignItems: "center", justifyContent: "center"}}>
      <div style={{padding: "22px 36px", borderRadius: 36, background: "rgba(3,8,24,0.62)", border: "2px solid rgba(0,229,255,0.25)", boxShadow: "0 0 50px rgba(0,229,255,0.12)", opacity: Math.min(1, enter) * ip(f, ch.end + 4, ch.end + 12, 1, 0), transform: `translateY(${(1 - enter) * 22}px) scale(${0.96 + 0.04 * enter})`, textAlign: "center", fontFamily: FONT, fontSize: 68, fontWeight: 800, lineHeight: 1.12}}>
        {ch.words.map((w, i) => {
          const active = f >= w.start && f < w.end;
          const spoken = f >= w.start;
          return (
            <span key={i} style={{display: "inline-block", marginRight: i < ch.words.length - 1 ? 26 : 0, color: active ? C.cyan : C.text, opacity: spoken ? 1 : 0.35, transform: `scale(${active ? 1.1 : 1})`, textShadow: active ? `0 0 28px ${C.cyan}` : "0 4px 18px rgba(0,0,0,0.7)"}}>
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// =====================================================================
//  MAIN COMPOSITION
// =====================================================================
const byId = Object.fromEntries(timing.scenes.map((s) => [s.id, s]));
const order = timing.scenes.map((s) => s.id);

const renderScene = (id: string, dur: number) => {
  switch (id) {
    case "hook": return <HookScene />;
    case "what": return <WhatScene dur={dur} />;
    case "npu": return <NpuScene />;
    case "speed": return <SpeedScene dur={dur} />;
    case "privacy": return <PrivacyScene dur={dur} />;
    case "limits": return <LimitsScene dur={dur} />;
    case "cost": return <CostScene dur={dur} />;
    case "hybrid": return <HybridScene dur={dur} />;
    default: return <OutroScene dur={dur} />;
  }
};

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  const total = timing.totalFrames;
  const camScale = 1 + 0.06 * (f / total);
  const camX = Math.sin(f / 140) * 14;
  const camY = Math.cos(f / 170) * 10;
  const bedVol = Math.min(ip(f, 0, 30, 0, 0.2, Easing.linear), ip(f, total - 50, total, 0.2, 0, Easing.linear));
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <AbsoluteFill style={{transform: `translate(${camX}px, ${camY}px) scale(${camScale})`}}>
        <Background />
        {order.map((id, i) => {
          const s = byId[id];
          const last = i === order.length - 1;
          const dur = s.dur + (last ? 0 : OVERLAP);
          return (
            <Sequence key={id} from={s.start} durationInFrames={dur}>
              <Scene dur={dur}>{renderScene(id, s.dur)}</Scene>
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {order.slice(1).map((id) => (
        <Sequence key={`sw-${id}`} from={Math.max(0, byId[id].start - 8)} durationInFrames={24}>
          <Sweep />
        </Sequence>
      ))}
      <Vignette />
      <Captions />

      {/* ---------------- audio ---------------- */}
      <AudioC src={staticFile("bed.wav")} volume={bedVol} />
      <AudioC src={staticFile("narration.wav")} volume={1} />
      <Sequence from={0} layout="none"><AudioC src={staticFile("hit.wav")} volume={0.55} /></Sequence>
      {order.slice(1).map((id) => (
        <Sequence key={`wh-${id}`} from={Math.max(0, byId[id].start - 10)} layout="none">
          <AudioC src={staticFile("whoosh.wav")} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={Math.max(0, byId["hybrid"].start - 55)} layout="none"><AudioC src={staticFile("riser.wav")} volume={0.22} /></Sequence>
      <Sequence from={byId["outro"].start + 2} layout="none"><AudioC src={staticFile("hit.wav")} volume={0.45} /></Sequence>
      <Sequence from={byId["speed"].start + Math.round(byId["speed"].dur * 0.62)} layout="none"><AudioC src={staticFile("tick.wav")} volume={0.5} /></Sequence>
      <Sequence from={byId["privacy"].start + Math.round(byId["privacy"].dur * 0.5)} layout="none"><AudioC src={staticFile("tick.wav")} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={timing.totalFrames} fps={FPS} width={W} height={H} />
);
