import { useEffect, useRef, type CSSProperties } from "react";

/**
 * VigletAvatar — the Viglet mascot: a small sun, drawn rather than imported.
 *
 * The original design (`docs/design/viglet-avatar-cms.jsx`) builds this in
 * three.js. three is around 170 KB gzipped and this package's whole root entry
 * budget is 86 KB, so the geometry is drawn here instead: an icosahedron
 * subdivided twice is 320 triangles, and flat-shading them into a 2D context is
 * the same picture at the 96-160 px a product renders it at.
 *
 * The mascot is decorative — `aria-hidden`. It says nothing a screen reader can
 * use, and the surface that wraps it owns the accessible name and the words.
 */

export type VigletAvatarState =
  | "idle"
  | "working"
  | "success"
  | "error"
  | "attention";

interface Tone {
  /** Facing the viewer, before the glow is added. */
  center: readonly [number, number, number];
  /** At the limb, where the sphere turns away. */
  rim: readonly [number, number, number];
  /** How much light the core throws into the halo, the embers and the pool. */
  glow: number;
}

/**
 * sRGB to linear light. Every value below is a colour as a designer picked it,
 * which is a display-encoded number, and the shading further down is physics:
 * mixing, scaling and adding have to happen in linear light or the result is
 * not the colour anybody chose.
 *
 * Skipping this was the whole difference between a washed-out tan ball and the
 * design. The tone curve compresses highlights, so feeding it display-encoded
 * values — which are already lifted — pushed every lit facet toward white and
 * flattened the rim's saturation out of existence.
 */
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

/** Linear light back to sRGB, for the byte that actually goes into the canvas. */
const toSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

const rgb = (hex: number): readonly [number, number, number] => [
  toLinear(((hex >> 16) & 255) / 255),
  toLinear(((hex >> 8) & 255) / 255),
  toLinear((hex & 255) / 255),
];

/**
 * Lamplight, not a spotlight: the values are deliberately low and unsaturated,
 * and `error` is the one that goes dark rather than red. A mascot that flashes
 * scarlet competes with the toast that is already saying so.
 */
const PALETTE: Record<VigletAvatarState, Tone> = {
  idle: { center: rgb(0xe39a4a), rim: rgb(0xa8321a), glow: 0.22 },
  working: { center: rgb(0xe8a65a), rim: rgb(0xa8321a), glow: 0.32 },
  success: { center: rgb(0xf1bf7c), rim: rgb(0xc0532a), glow: 0.55 },
  error: { center: rgb(0x6e1e10), rim: rgb(0x2a0704), glow: 0.03 },
  attention: { center: rgb(0xecb46a), rim: rgb(0xb43e1e), glow: 0.42 },
};

/* ------------------------------- geometry -------------------------------- */

/**
 * The sphere, built once for the module and shared by every mounted avatar: the
 * vertices never change, only the matrix they are read through.
 *
 * `detail` is three's, and it is not a count of subdivision passes — that was
 * the first thing this got wrong. `IcosahedronGeometry(r, detail)` cuts every
 * edge of the base solid into `detail + 1` segments, so a face becomes
 * `(detail + 1)²` triangles: 9 at detail 2, and 180 for the whole solid.
 * Halving recursively instead gives 4 per face per pass — 320 after two — and
 * the ball came out visibly finer-grained than the design, which is a mascot
 * with the wrong face.
 */
const DETAIL = 2;

type Point = readonly [number, number, number];

interface Sphere {
  /** A triangle soup on the unit sphere: nine numbers per facet, no shared vertices. */
  points: Float64Array;
  /** A fixed value per facet, so each keeps its own brightness and breathes in its own rhythm. */
  grain: Float64Array;
  /** Facets. */
  count: number;
}

function buildSphere(detail: number): Sphere {
  const t = (1 + Math.sqrt(5)) / 2;
  const base: number[] = [
    -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
    0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
    t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1,
  ];
  const faces: number[] = [
    0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
    1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
    3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
    4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
  ];

  const corner = (i: number): Point => [base[i * 3], base[i * 3 + 1], base[i * 3 + 2]];
  const between = (a: Point, b: Point, s: number): Point => [
    a[0] + (b[0] - a[0]) * s,
    a[1] + (b[1] - a[1]) * s,
    a[2] + (b[2] - a[2]) * s,
  ];

  const soup: number[] = [];
  const emit = (...corners: Point[]) => {
    for (const [x, y, z] of corners) {
      // Onto the sphere as it is written out: the grid above is built by
      // interpolating across a flat face, so every interior point lands short.
      const length = Math.hypot(x, y, z);
      soup.push(x / length, y / length, z / length);
    }
  };

  const cols = detail + 1;
  for (let f = 0; f < faces.length; f += 3) {
    const a = corner(faces[f]), b = corner(faces[f + 1]), c = corner(faces[f + 2]);

    // A triangular lattice over the face: row `i` runs from the a-c edge to the
    // b-c edge and is one point shorter than the row before it.
    const grid: Point[][] = [];
    for (let i = 0; i <= cols; i += 1) {
      const from = between(a, c, i / cols);
      const to = between(b, c, i / cols);
      const rows = cols - i;
      grid[i] = [];
      for (let j = 0; j <= rows; j += 1) {
        // The apex: one point, and `j / rows` there is 0/0.
        grid[i][j] = rows === 0 ? from : between(from, to, j / rows);
      }
    }

    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < 2 * (cols - i) - 1; j += 1) {
        const k = Math.floor(j / 2);
        if (j % 2 === 0) emit(grid[i][k + 1], grid[i + 1][k], grid[i][k]);
        else emit(grid[i][k + 1], grid[i + 1][k + 1], grid[i + 1][k]);
      }
    }
  }

  const points = Float64Array.from(soup);
  const count = points.length / 9;

  // Hashed from the facet's own centroid rather than drawn from a generator, so
  // the grain belongs to the geometry and is the same on every mount.
  const grain = new Float64Array(count);
  for (let f = 0; f < count; f += 1) {
    const base3 = f * 9;
    const x = points[base3] + points[base3 + 3] + points[base3 + 6];
    const y = points[base3 + 1] + points[base3 + 4] + points[base3 + 7];
    const z = points[base3 + 2] + points[base3 + 5] + points[base3 + 8];
    const seed = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    grain[f] = seed - Math.floor(seed);
  }

  return { points, grain, count };
}

const SPHERE = buildSphere(DETAIL);

/* -------------------------------- shading -------------------------------- */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** GLSL's smoothstep, reversed edges included: `smoothstep(0.7, 0, f)` is used below. */
function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * The filmic curve the original renders through: three's `ACESFilmicToneMapping`
 * at `toneMappingExposure = 0.78`, ported whole rather than approximated.
 *
 * The scalar approximation that usually stands in for this (Narkowicz) is a
 * per-channel curve, and per-channel is the problem: it desaturates as it rolls
 * off, so a lit orange facet slid toward cream and the ball came out the colour
 * of milky tea. The real fit rotates into ACEScg first, shapes there, and
 * rotates back — which is what keeps the hue while compressing the highlight.
 */
const EXPOSURE = 0.78;

// GLSL declares these column-major; written out here as rows.
const ACES_IN = [
  [0.59719, 0.35458, 0.04823],
  [0.076, 0.90834, 0.01566],
  [0.0284, 0.13383, 0.83777],
] as const;
const ACES_OUT = [
  [1.60475, -0.53108, -0.07367],
  [-0.10208, 1.10813, -0.00605],
  [-0.00327, -0.07276, 1.07602],
] as const;

const fit = (v: number) =>
  (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);

/** Linear light in, sRGB bytes out, written into `out` to keep the loop allocation-free. */
function tonemapRgb(out: [number, number, number], r: number, g: number, b: number) {
  const x = r * EXPOSURE, y = g * EXPOSURE, z = b * EXPOSURE;
  for (let i = 0; i < 3; i += 1) {
    const [ar, ag, ab] = ACES_IN[i];
    out[i] = fit(ar * x + ag * y + ab * z);
  }
  const [a, c, d] = out;
  for (let i = 0; i < 3; i += 1) {
    const [br, bg, bb] = ACES_OUT[i];
    out[i] = Math.round(toSrgb(clamp01(br * a + bg * c + bb * d)) * 255);
  }
}

/** The same curve for a lone value — the halo and the embers, which have no hue to hold. */
function channel(value: number) {
  const x = value * EXPOSURE;
  return Math.round(toSrgb(clamp01(fit(x))) * 255);
}

/* ------------------------------- the canvas ------------------------------- */

/**
 * Frames to keep drawing after the last thing worth drawing. A mascot that sits
 * in every product for a whole working day cannot hold a rAF loop open: once the
 * state is idle, the cursor has stopped and nothing is settling, the loop exits
 * and the last frame stays on screen until something wakes it.
 */
const COOLDOWN_FRAMES = 60;

/** The light along a facet edge. Warm, and faint enough to read as a crease. */
const SEAM = "rgba(255,214,150,0.34)";

interface Ember {
  x: number;
  y: number;
  z: number;
  speed: number;
}

export interface VigletAvatarProps {
  /** What the system is doing. Named for the toast kinds, not for moods. */
  state?: VigletAvatarState;
  /** Rendered size in CSS pixels, square. */
  size?: number;
  /** Pull the camera in and drop the ground: the form for a collapsed dock. */
  compact?: boolean;
  /**
   * Bump this to make the mascot react — a short flare, as though it heard
   * something. A counter rather than a boolean so repeated events each land.
   */
  activity?: number;
  /** Hold a slow orbit, for an answer waiting behind a collapsed dock. */
  unread?: boolean;
  /** Freeze on a single frame, for a host that offers its own motion switch. */
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function VigletAvatar({
  state = "idle",
  size = 128,
  compact = false,
  activity = 0,
  unread = false,
  paused = false,
  className,
  style,
}: Readonly<VigletAvatarProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Every animated input is read through a ref inside one long-lived loop. The
  // alternative — re-running the effect per prop — tears the canvas down and
  // rebuilds it on a state change, which is exactly when the mascot is supposed
  // to be moving.
  const stateRef = useRef(state);
  const stateSince = useRef(0);
  const compactRef = useRef(compact);
  const unreadRef = useRef(unread);
  const pausedRef = useRef(paused);
  const activityAt = useRef(Number.NEGATIVE_INFINITY);
  const wake = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    stateSince.current = typeof performance === "undefined" ? 0 : performance.now();
    wake.current?.();
  }, [state]);

  useEffect(() => {
    compactRef.current = compact;
    wake.current?.();
  }, [compact]);

  useEffect(() => {
    unreadRef.current = unread;
    wake.current?.();
  }, [unread]);

  useEffect(() => {
    pausedRef.current = paused;
    wake.current?.();
  }, [paused]);

  useEffect(() => {
    if (!activity) return;
    activityAt.current = performance.now();
    wake.current?.();
  }, [activity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // jsdom has no 2D context, and neither does a browser that has run out of
    // them. Either way there is nothing to draw on and nothing to fall back to:
    // the canvas stays blank rather than the component throwing inside a product.
    const maybeContext = canvas.getContext("2d");
    if (!maybeContext) return;
    // Re-declared with the type rather than leaning on the narrowing above: the
    // drawing helpers below are function declarations, which hoist above this
    // guard, and a narrowing they are hoisted past does not reach them.
    const ctx: CanvasRenderingContext2D = maybeContext;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    ctx.scale(ratio, ratio);

    const cx = size / 2;
    const cy = size / 2;

    const embers: Ember[] = Array.from({ length: 34 }, () => ({
      x: (Math.random() - 0.5) * 1.9,
      y: Math.random() * 2.8 - 0.4,
      z: (Math.random() - 0.5) * 1.9,
      speed: 0.05 + Math.random() * 0.09,
    }));

    // The palette the frame is drawn with, eased toward the state's tone rather
    // than set to it: a state change is a sunrise, not a switch.
    const tone = {
      center: [...PALETTE[state].center] as [number, number, number],
      rim: [...PALETTE[state].rim] as [number, number, number],
      glow: PALETTE[state].glow,
    };

    let frame = 0;
    let cooldown = COOLDOWN_FRAMES;
    let clock = 0;
    let energy = 0;
    let last = performance.now();
    let spinY = 0;
    let tiltX = 0.34;
    let camera = compact ? 7.4 : 9;
    let pointerAt = Number.NEGATIVE_INFINITY;
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };

    const onPointerMove = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
      pointerAt = performance.now();
      cooldown = COOLDOWN_FRAMES;
      if (!frame) frame = requestAnimationFrame(draw);
    };

    // One sphere radius in CSS pixels. The ball is deliberately well short of
    // filling the frame: the halo, the orbit and the embers all live outside it,
    // and a sphere drawn edge to edge leaves them nowhere to be.
    const unit = size * (compact ? 0.27 : 0.24);

    /** Sphere space to screen. */
    const project = (x: number, y: number, z: number, scale: number) => {
      const perspective = camera / (camera - z * scale);
      return [cx + x * scale * perspective * unit, cy - y * scale * perspective * unit];
    };

    function radial(x: number, y: number, r: number, stops: [number, string][]) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 0.01));
      for (const [offset, color] of stops) gradient.addColorStop(offset, color);
      return gradient;
    }

    /**
     * One half of the orbit, split at the horizon. The caller draws the far half
     * before the core and the near half after it, which is the whole reason the
     * ring reads as going around the sphere rather than as a circle painted on
     * top of it.
     */
    function ring(
      half: -1 | 1,
      radius: number,
      width: number,
      color: string,
      alpha: number,
      arc?: [number, number],
    ) {
      if (alpha <= 0.002) return;
      const STEPS = 96;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";

      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i <= STEPS; i += 1) {
        const angle = (i / STEPS) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const flat = Math.sin(angle) * radius;
        const y = flat * Math.cos(tiltX);
        const z = flat * Math.sin(tiltX);
        const front = z >= 0 ? 1 : -1;
        const inArc = !arc || (angle >= arc[0] && angle <= arc[1]);

        if (front !== half || !inArc) {
          drawing = false;
          continue;
        }
        const [px, py] = project(x, y, z, 1);
        if (drawing) ctx.lineTo(px, py);
        else {
          ctx.moveTo(px, py);
          drawing = true;
        }
      }
      // The far half is dimmed rather than hidden: light bending round a body is
      // what the design draws, and a half that vanishes reads as two arcs.
      ctx.globalAlpha = half === -1 ? alpha * 0.32 : alpha;
      ctx.stroke();
      ctx.restore();
    }

    // The rotated copy of the sphere, written over once per frame rather than
    // reallocated: 252 vertices at 60 fps is a lot of short-lived arrays.
    const screen = new Float64Array(SPHERE.points.length);
    /** Scratch for one facet's tone-mapped colour, for the same reason. */
    const shade: [number, number, number] = [0, 0, 0];

    function draw(now: number) {
      frame = 0;
      const context = ctx;

      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      const current = stateRef.current;
      const target = PALETTE[current];
      const elapsed = (now - stateSince.current) / 1000;
      const sinceActivity = (now - activityAt.current) / 1000;
      const isCompact = compactRef.current;
      const frozen = pausedRef.current || reduced;

      // Ambient motion runs on energy, which the pointer supplies and which
      // decays a second or so after it stops. System events — a state change, an
      // activity bump — bypass it: those have to be seen whether or not anybody
      // is moving a mouse.
      const moving = !frozen && now - pointerAt < 1200;
      energy = frozen ? 0 : lerp(energy, moving ? 1 : 0, moving ? 0.05 : 0.02);
      if (!frozen) clock += delta * (0.25 + energy * 0.75);

      const wantCamera = isCompact ? 7.4 : 9;
      const settling = Math.abs(camera - wantCamera) > 0.01;
      camera = lerp(camera, wantCamera, 0.12);

      const busy =
        current !== "idle" ||
        sinceActivity < 2.2 ||
        unreadRef.current ||
        energy > 0.004 ||
        settling;
      if (busy) cooldown = COOLDOWN_FRAMES;

      /* ---- the frame's tone, eased toward the state's ---- */

      for (let i = 0; i < 3; i += 1) {
        tone.center[i] = lerp(tone.center[i], target.center[i], 0.06);
        tone.rim[i] = lerp(tone.rim[i], target.rim[i], 0.06);
      }

      let glow = target.glow;
      let swell = 1;
      glow += Math.sin(clock * 0.9) * 0.05 * energy;
      // A short flare when the product reports activity: the mascot heard it.
      const heard = sinceActivity < 1.8 ? Math.sin(clamp01(sinceActivity / 1.8) * Math.PI) * 0.14 : 0;
      glow += heard;

      if (current === "working") glow += Math.sin((now / 1000) * 2.2) * 0.06;
      if (current === "success") {
        const k = clamp01(elapsed / 1.4);
        swell = 1 + Math.sin((1 - (1 - k) ** 3) * Math.PI) * 0.06;
        if (elapsed > 1.4) {
          glow = lerp(target.glow, PALETTE.idle.glow + 0.25, clamp01((elapsed - 1.4) / 2));
        }
      }
      if (current === "error") swell = 0.94;

      tone.glow = lerp(tone.glow, glow, 0.08);
      const lit = tone.glow;

      if (!frozen) {
        spinY += delta * (0.06 + energy * 0.1);
        tiltX = 0.34 + Math.sin(clock * 0.6) * 0.12;
        eased.x = lerp(eased.x, pointer.x, 0.02);
        eased.y = lerp(eased.y, pointer.y, 0.02);
      }
      const leanY = frozen ? 0 : Math.sin(clock * 0.35) * 0.05 + eased.x * 0.12;
      const leanX = frozen ? 0 : -eased.y * 0.08;
      const scale = swell * (1 + heard * 0.08);

      /* ---- the layers ---- */

      context.clearRect(0, 0, size, size);

      // Gas: a dark, soft cloud behind the sun. Everything above it is drawn
      // additively, and additive light needs something to be added to — without
      // this the mascot washes out on a pale ground. Kept tight and dark: spread
      // wide and pale it reads as a grey smudge rather than as depth.
      context.fillStyle = radial(cx, cy, unit * 1.95, [
        [0, "rgba(9,11,15,0.5)"],
        [0.52, "rgba(9,11,15,0.3)"],
        [0.8, "rgba(9,11,15,0.08)"],
        [1, "rgba(9,11,15,0)"],
      ]);
      context.fillRect(0, 0, size, size);

      // The halo is a rumour of light, not a second sun. The design sets the ball
      // against the dark cloud above and lets that carry the contrast; an orange
      // glow wide enough to see competes with the ball and greys the ground
      // between them.
      context.save();
      context.globalCompositeOperation = "lighter";
      const haloR = unit * (1.5 + lit * 0.5) * scale;
      const haloA = 0.06 + lit * 0.24;
      context.fillStyle = radial(cx, cy, haloR, [
        [0, `rgba(${channel(tone.center[0])},${channel(tone.center[1])},${channel(tone.center[2])},${haloA * 0.5})`],
        [0.34, `rgba(${channel(tone.rim[0] * 1.4)},${channel(tone.rim[1] * 1.4)},${channel(tone.rim[2] * 1.4)},${haloA * 0.2})`],
        [1, "rgba(160,50,10,0)"],
      ]);
      context.fillRect(0, 0, size, size);
      context.restore();

      // The orbit: steady while working, a slow low hold while an answer waits.
      const orbitA = current === "working" ? 0.55 : unreadRef.current ? 0.26 + Math.sin((now / 1000) * 0.8) * 0.07 : 0;
      const travel = ((now / 1000) * 1.6) % (Math.PI * 2);
      const orbitR = 1.5 * scale;
      const orbitW = Math.max(1, size * 0.007);
      const arcW = Math.max(1, size * 0.011);
      const drawOrbit = (half: -1 | 1) => {
        ring(half, orbitR, orbitW, "rgba(255,224,160,1)", orbitA * 0.45);
        if (current === "working") {
          ring(half, orbitR, arcW, "rgba(255,236,190,1)", 0.75, [travel, travel + 1.1]);
        }
      };

      drawOrbit(-1);

      // Embers, rising and recycling, drawn before the core so the sphere
      // occludes them. Over the top they were white specks sitting on the ball —
      // the one thing a sun's sparks must not look like. What survives is the
      // few that clear the silhouette, which is all the design ever showed.
      context.save();
      context.globalCompositeOperation = "lighter";
      const drift = frozen ? 0 : current === "success" || current === "attention" ? 1 : Math.max(energy, 0.12);
      const emberA = 0.08 + lit * 0.4;
      context.fillStyle = `rgba(${channel(tone.center[0])},${channel(tone.center[1])},${channel(tone.center[2])},${emberA})`;
      for (const ember of embers) {
        ember.y += ember.speed * delta * (0.4 + lit) * drift;
        if (ember.y > 2.4) {
          ember.y = -0.4;
          ember.x = (Math.random() - 0.5) * 1.9;
          ember.z = (Math.random() - 0.5) * 1.9;
        }
        const [px, py] = project(ember.x, ember.y, ember.z, 1);
        const r = Math.max(size * 0.005, 1) * (ember.z > 0 ? 1 : 0.7);
        context.beginPath();
        context.arc(px, py, r, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      /* ---- the core ---- */

      const cosY = Math.cos(spinY + leanY), sinY = Math.sin(spinY + leanY);
      const cosX = Math.cos(0.32 + leanX), sinX = Math.sin(0.32 + leanX);
      const { points, grain, count } = SPHERE;

      for (let i = 0; i < points.length; i += 3) {
        const x0 = points[i], y0 = points[i + 1], z0 = points[i + 2];
        // Yaw, then pitch. The pitch is nearly fixed: the sun leans, it does not tumble.
        const x1 = x0 * cosY + z0 * sinY;
        const z1 = -x0 * sinY + z0 * cosY;
        const y2 = y0 * cosX - z1 * sinX;
        const z2 = y0 * sinX + z1 * cosX;
        screen[i] = x1;
        screen[i + 1] = y2;
        screen[i + 2] = z2;
      }

      // No depth sort: the sphere is convex, so the front-facing triangles that
      // survive the cull below never overlap one another on screen.
      for (let f = 0; f < count; f += 1) {
        const a = f * 9, b = a + 3, c = a + 6;

        const ux = screen[b] - screen[a];
        const uy = screen[b + 1] - screen[a + 1];
        const uz = screen[b + 2] - screen[a + 2];
        const vx = screen[c] - screen[a];
        const vy = screen[c + 1] - screen[a + 1];
        const vz = screen[c + 2] - screen[a + 2];

        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        if (nz <= 0) continue;

        const facing = nz / Math.hypot(nx, ny, nz);
        // 0 head-on, 1 at the limb — the shader's `1 - dot(N, V)`.
        const turn = 1 - facing;
        const g = grain[f];
        const breath = 0.9 + 0.14 * g + 0.06 * Math.sin(clock * 0.8 + g * 6.28);
        // Close to the original shader's `smoothstep(0.1, 0.92)`, pulled in a
        // little because the core there sits inside a glass shell whose Fresnel
        // darkens the silhouette and nothing here refracts. Only a little: run
        // in as far as 0.62 and most of the ball reaches the full rim value,
        // which is a dark brick, and the mascot turns to burnt umber. The
        // washed-out ball this was first blamed for was the white core light
        // below, not the ramp.
        const toRim = smoothstep(0.08, 0.82, turn);
        const centreLight = smoothstep(0.66, 0, turn) * lit * 0.62;
        const limb = 1 - 0.18 * smoothstep(0.82, 1, turn);

        // The core's own light is warm, not white. The original adds
        // `vec3(1.0, 0.9, 0.7)`, which looks warm as a hex triplet and is not:
        // in linear light those weights lift blue by more than half again what
        // they lift red, and the lit middle of the ball went the colour of sand.
        tonemapRgb(
          shade,
          (lerp(tone.center[0], tone.rim[0], toRim) * breath + centreLight) * limb,
          (lerp(tone.center[1], tone.rim[1], toRim) * breath + centreLight * 0.72) * limb,
          (lerp(tone.center[2], tone.rim[2], toRim) * breath + centreLight * 0.3) * limb,
        );
        const fill = `rgb(${shade[0]},${shade[1]},${shade[2]})`;

        const [ax, ay] = project(screen[a], screen[a + 1], screen[a + 2], scale);
        const [bx, by] = project(screen[b], screen[b + 1], screen[b + 2], scale);
        const [cx2, cy2] = project(screen[c], screen[c + 1], screen[c + 2], scale);

        context.beginPath();
        context.moveTo(ax, ay);
        context.lineTo(bx, by);
        context.lineTo(cx2, cy2);
        context.closePath();
        context.fillStyle = fill;
        context.fill();
        // The seam, which is also the join. Canvas antialiases each fill
        // independently, so abutting triangles leave a lattice of hairline gaps
        // without a stroke over them; drawing that stroke in warm light rather
        // than in the facet's own colour is what makes the facets read as facets
        // instead of as a smooth ball. Faint, and constant, so it shows on the
        // saturated limb without bleaching the lit centre.
        context.strokeStyle = SEAM;
        context.lineWidth = 1;
        context.stroke();
      }

      /* ---- what sits over the core ---- */

      drawOrbit(1);

      context.save();
      context.globalCompositeOperation = "lighter";

      // The glass shell, as the one thing it actually contributes at this size:
      // a specular highlight up and to the left, where the key light is. Small
      // and weak on purpose — spread across the ball it is additive white over
      // every facet, which is desaturation by another name.
      const specR = unit * 0.34 * scale;
      const specX = cx - unit * 0.38 * scale;
      const specY = cy - unit * 0.44 * scale;
      context.fillStyle = radial(specX, specY, specR, [
        [0, `rgba(255,246,228,${0.05 + lit * 0.09})`],
        [0.5, `rgba(255,240,214,${0.015 + lit * 0.03})`],
        [1, "rgba(255,240,214,0)"],
      ]);
      context.fillRect(0, 0, size, size);

      // Published: one ring that expands out of the core and fades. Both halves
      // over the top — a shockwave has already left the sphere behind.
      if (current === "success" && elapsed < 2.6) {
        const k = elapsed / 2.6;
        const radius = 1.05 + k * 1.5;
        const width = Math.max(1, size * 0.009);
        const alpha = 0.65 * (1 - k);
        ring(-1, radius, width, "rgba(255,241,192,1)", alpha);
        ring(1, radius, width, "rgba(255,241,192,1)", alpha);
      }

      context.restore();

      // Attention: a ring that rises from below and holds, then releases. The
      // one gesture that comes from outside the sphere, because the thing it
      // reports came from outside the product.
      if (current === "attention") {
        const k = clamp01(elapsed / 2.4);
        const y = lerp(-1.9, 0.25, 1 - (1 - k) ** 2);
        const alpha = k < 1 ? 0.7 : 0.7 * Math.max(0, 1 - (elapsed - 2.4) / 2.5);
        if (alpha > 0.002) {
          context.save();
          context.globalCompositeOperation = "lighter";
          context.globalAlpha = alpha;
          context.strokeStyle = "rgba(255,230,160,1)";
          context.lineWidth = Math.max(1, size * 0.009);
          const [, ringY] = project(0, y, 0, 1);
          context.beginPath();
          context.ellipse(cx, ringY, unit * 1.6, unit * 0.42, 0, 0, Math.PI * 2);
          context.stroke();
          context.restore();
        }
      }

      // The ground the sun stands on. Dropped when compact: a collapsed dock is
      // a light in the corner, not an object on a surface.
      if (!isCompact) {
        const poolY = cy + unit * 1.5;
        context.save();
        context.globalCompositeOperation = "lighter";
        context.fillStyle = radial(cx, poolY, unit * 1.5, [
          [0, `rgba(220,140,60,${0.1 + lit * 0.2})`],
          [1, "rgba(220,140,60,0)"],
        ]);
        context.fillRect(0, 0, size, size);
        context.restore();
      }

      // A reader who asked for less motion gets this one frame and no loop.
      if (frozen) return;
      cooldown -= 1;
      if (cooldown > 0) frame = requestAnimationFrame(draw);
    }

    wake.current = () => {
      cooldown = COOLDOWN_FRAMES;
      last = performance.now();
      if (!frame) frame = requestAnimationFrame(draw);
    };

    if (!reduced) window.addEventListener("mousemove", onPointerMove, { passive: true });
    draw(performance.now());

    return () => {
      wake.current = null;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onPointerMove);
    };
    // `size` rebuilds the canvas backing store, and the rest is read through
    // refs by the loop this sets up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-state={state}
      className={className}
      style={{ width: size, height: size, display: "block", ...style }}
    />
  );
}
