// One continuous take: scroll progress p ∈ [0, 1] → the visual state of the stage.
// Each scene's state is a pure function of p, so forward and reverse scrolling are identical.

export type Cam = { zoom: number; fx: number; fy: number };

export type SceneState = {
  ink: number; // 1 = monochrome ink wash, 0 = full colour
  cam: Cam;
  mist: number;
  speed: number; // radial streak for forward motion
  parallax: number; // foreground magnification relative to horizon
  light: number; // warm volumetric glow from above
  tone: number; // UI darkness: charcoal UI over light frames, ivory over dark ones
};

export type TransitionMode = 0 | 1 | 2; // 0 ink dissolve · 1 ink rising · 2 cloud lift

export type StageState = {
  a: number;
  b: number;
  mix: number;
  mode: TransitionMode;
  sa: SceneState;
  sb: SceneState;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const r = (p: number, s: number, e: number) => clamp01((p - s) / (e - s));
const ease = (t: number) => t * t * (3 - 2 * t);
const er = (p: number, s: number, e: number) => ease(r(p, s, e));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Subject focus points in image space (top-left origin). */
const FOCUS = {
  villa: { x: 0.55, y: 0.6 },
  road: { x: 0.63, y: 0.62 },
  helipad: { x: 0.5, y: 0.56 },
  aerialHeli: { x: 0.76, y: 0.64 },
};

const scenes: Array<(p: number) => SceneState> = [
  // 0 — Residences: ink wash → colour bloom → push towards the roofline → dissolves to ink
  (p) => {
    const f = er(p, 0.1, 0.3);
    return {
      ink: clamp01(1 - er(p, 0.03, 0.17) + er(p, 0.255, 0.305)),
      cam: {
        zoom: 1.06 + 0.12 * er(p, 0, 0.18) + 0.36 * er(p, 0.16, 0.31),
        fx: lerp(0.5, FOCUS.villa.x, f),
        fy: lerp(0.48, FOCUS.villa.y, f),
      },
      mist: 0.14 + 0.5 * (1 - er(p, 0.02, 0.16)),
      speed: 0,
      parallax: 0.06 + 0.1 * er(p, 0.12, 0.3),
      light: 0.35,
      tone: 0,
    };
  },
  // 1 — Mobility: condenses from ink in mist, mist clears, the drive pushes forward
  (p) => {
    const f = er(p, 0.36, 0.58);
    return {
      ink: clamp01(1 - er(p, 0.345, 0.42) + er(p, 0.57, 0.605)),
      cam: {
        zoom: 1.38 - 0.24 * er(p, 0.33, 0.44) + 0.26 * er(p, 0.44, 0.61),
        fx: lerp(0.52, FOCUS.road.x, f),
        fy: lerp(0.46, FOCUS.road.y, f),
      },
      mist: 0.1 + 0.85 * (1 - er(p, 0.34, 0.47)),
      speed: 0.4 * er(p, 0.44, 0.5) * (1 - er(p, 0.56, 0.6)),
      parallax: 0.05 + 0.22 * er(p, 0.42, 0.58),
      light: 0.2,
      tone: 0,
    };
  },
  // 2 — Experiences (ground): ink rises, golden light, slow push, clouds roll in
  (p) => ({
    ink: clamp01(1 - er(p, 0.635, 0.71)),
    cam: {
      zoom: 1.24 - 0.1 * er(p, 0.62, 0.72) + 0.2 * er(p, 0.72, 0.84),
      fx: FOCUS.helipad.x,
      fy: lerp(0.5, 0.42, er(p, 0.64, 0.8)), // keep open sky above the aircraft for the copy
    },
    mist: 0.12 + 0.3 * (1 - er(p, 0.64, 0.72)) + 0.3 * er(p, 0.79, 0.85),
    speed: 0,
    parallax: 0.04 + 0.08 * er(p, 0.7, 0.84),
    light: 0.75,
    tone: 0,
  }),
  // 3 — Experiences (air): pull up and out to the horizon, settle on the final composition
  (p) => {
    const f = er(p, 0.8, 0.98);
    return {
      ink: 0,
      cam: {
        zoom: 1.75 - 0.67 * f,
        fx: lerp(FOCUS.aerialHeli.x, 0.5, f),
        fy: lerp(FOCUS.aerialHeli.y, 0.5, f),
      },
      mist: 0.08 + 0.75 * (1 - er(p, 0.83, 0.93)),
      speed: 0,
      parallax: 0.05,
      light: 0.8,
      tone: 0.85 * er(p, 0.86, 0.93), // bright golden sky: bookend the opening with dark type
    };
  },
];

const transitions: Array<{ from: number; to: number; start: number; end: number; mode: TransitionMode }> = [
  { from: 0, to: 1, start: 0.3, end: 0.36, mode: 0 },
  { from: 1, to: 2, start: 0.595, end: 0.655, mode: 1 },
  { from: 2, to: 3, start: 0.8, end: 0.88, mode: 2 },
];

export function stateAt(p: number): StageState {
  const q = clamp01(p);
  let current = 0;
  for (const t of transitions) {
    if (q >= t.start && q <= t.end) {
      return {
        a: t.from,
        b: t.to,
        mix: er(q, t.start, t.end),
        mode: t.mode,
        sa: scenes[t.from](q),
        sb: scenes[t.to](q),
      };
    }
    if (q > t.end) current = t.to;
  }
  const s = scenes[current](q);
  return { a: current, b: current, mix: 0, mode: 0, sa: s, sb: s };
}

/** How much of the visible frame is ink wash (drives UI colour: charcoal on paper, ivory on colour). */
export function visibleInk(s: StageState) {
  return lerp(Math.max(s.sa.ink, s.sa.tone), Math.max(s.sb.ink, s.sb.tone), s.mix);
}

/** Navigation targets and progress-rail ranges for the three worlds. */
export const chapters = [
  { id: "residences", target: 0.15, start: 0, end: 0.3 },
  { id: "mobility", target: 0.47, start: 0.3, end: 0.6 },
  { id: "experiences", target: 0.74, start: 0.6, end: 1 },
] as const;

export function chapterAt(p: number) {
  return chapters.findIndex((c) => p < c.end || c.end === 1);
}

export function chapterFill(p: number, i: number) {
  const c = chapters[i];
  return r(p, c.start, c.end);
}
