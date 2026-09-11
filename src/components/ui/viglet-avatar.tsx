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

const rgb = (hex: number): readonly [number, number, number] => [
  ((hex >> 16) & 255) / 255,
  ((hex >> 8) & 255) / 255,
  (hex & 255) / 255,
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
 * Subdivided twice — 20 faces to 80 to 320 — which is what `IcosahedronGeometry(r, 2)`
 * produces, and the count the facets in the original are sized by.
 */
const SUBDIVISIONS = 2;

interface Sphere {
  /** Unit-sphere positions, three numbers per vertex. */
  points: Float64Array;
  /** Vertex indices, three per triangle. */
  faces: Uint16Array;
  /** A fixed value per facet, so each one keeps its own brightness and breathes in its own rhythm. */
  grain: Float64Array;
}

function buildSphere(subdivisions: number): Sphere {
  const t = (1 + Math.sqrt(5)) / 2;
  const points: number[] = [
    -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
    0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
    t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1,
  ];
  let faces: number[] = [
    0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
    1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
    3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
    4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
  ];

  const place = (index: number) => {
    const i = index * 3;
    const x = points[i], y = points[i + 1], z = points[i + 2];
    const length = Math.hypot(x, y, z);
    points[i] = x / length;
    points[i + 1] = y / length;
    points[i + 2] = z / length;
  };
  for (let i = 0; i < points.length / 3; i += 1) place(i);

  // An edge is shared by two triangles, so the midpoint is cached: splitting it
  // twice would leave two vertices at one position and a crack between the faces.
  for (let pass = 0; pass < subdivisions; pass += 1) {
    const midpoints = new Map<number, number>();
    const next: number[] = [];

    const midpoint = (a: number, b: number) => {
      const key = a < b ? a * 65536 + b : b * 65536 + a;
      const cached = midpoints.get(key);
      if (cached !== undefined) return cached;

      const ai = a * 3, bi = b * 3;
      points.push(
        (points[ai] + points[bi]) / 2,
        (points[ai + 1] + points[bi + 1]) / 2,
        (points[ai + 2] + points[bi + 2]) / 2,
      );
      const index = points.length / 3 - 1;
      place(index);
      midpoints.set(key, index);
      return index;
    };

    for (let f = 0; f < faces.length; f += 3) {
      const a = faces[f], b = faces[f + 1], c = faces[f + 2];
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    faces = next;
  }

  // Hashed from the facet's own centroid rather than drawn from a generator, so
  // the grain belongs to the geometry and is the same on every mount.
  const grain = new Float64Array(faces.length / 3);
  for (let f = 0; f < faces.length; f += 3) {
    let x = 0, y = 0, z = 0;
    for (let v = 0; v < 3; v += 1) {
      const i = faces[f + v] * 3;
      x += points[i]; y += points[i + 1]; z += points[i + 2];
    }
    const seed = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    grain[f / 3] = seed - Math.floor(seed);
  }

  return { points: Float64Array.from(points), faces: Uint16Array.from(faces), grain };
}

const SPHERE = buildSphere(SUBDIVISIONS);

/* -------------------------------- shading -------------------------------- */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** GLSL's smoothstep, reversed edges included: `smoothstep(0.7, 0, f)` is used below. */
function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * The filmic curve the original renders through (`ACESFilmicToneMapping` at
 * exposure 0.78). Without it the same palette reads as flat poster paint: the
 * highlight never rolls off, so the lit centre clips to a single orange instead
 * of running up to near-white the way the design does.
 */
const EXPOSURE = 0.78;
function tonemap(value: number) {
  const x = value * EXPOSURE;
  return clamp01((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
}

const channel = (value: number) => Math.round(tonemap(value) * 255);

/* ------------------------------- the canvas ------------------------------- */

/**
 * Frames to keep drawing after the last thing worth drawing. A mascot that sits
 * in every product for a whole working day cannot hold a rAF loop open: once the
 * state is idle, the cursor has stopped and nothing is settling, the loop exits
 * and the last frame stays on screen until something wakes it.
 */
const COOLDOWN_FRAMES = 60;

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

    /** Sphere space to screen. `unit` is one sphere radius in CSS pixels. */
    const unit = size * (compact ? 0.335 : 0.3);
    const project = (x: number, y: number, z: number, scale: number) => {
      const perspective = camera / (camera - z * scale);
      return [cx + x * scale * perspective * unit, cy - y * scale * perspective * unit];
    };

    function radial(x: number, y: number, r: number, stops: [number, string][]) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 0.01));
      for (const [offset, color] of stops) gradient.addColorStop(offset, color);
      return gradient;
    }

    /** The ring, split at the horizon so the sphere passes through it. */
    function ring(radius: number, width: number, color: string, alpha: number, arc?: [number, number]) {
      if (alpha <= 0.002) return;
      const STEPS = 96;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";

      for (const half of [-1, 1]) {
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
        // Behind the sphere the ring is occluded, so the back half is dimmer
        // rather than hidden: a ring that vanishes reads as two arcs.
        ctx.globalAlpha = half === -1 ? alpha * 0.32 : alpha;
        ctx.stroke();
      }
      ctx.restore();
    }

    // The rotated copy of the sphere, written over once per frame rather than
    // reallocated: 252 vertices at 60 fps is a lot of short-lived arrays.
    const screen = new Float64Array(SPHERE.points.length);

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
      // this the mascot washes out on a pale ground.
      context.fillStyle = radial(cx, cy, unit * 2.5, [
        [0, "rgba(9,11,15,0.5)"],
        [0.45, "rgba(9,11,15,0.34)"],
        [0.72, "rgba(9,11,15,0.12)"],
        [1, "rgba(9,11,15,0)"],
      ]);
      context.fillRect(0, 0, size, size);

      context.save();
      context.globalCompositeOperation = "lighter";
      const haloR = unit * (1.75 + lit * 0.7) * scale;
      const haloA = 0.16 + lit * 0.55;
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
      ring(1.4 * scale, Math.max(1, size * 0.008), "rgba(255,224,160,1)", orbitA * 0.45);
      if (current === "working") {
        ring(1.4 * scale, Math.max(1, size * 0.012), "rgba(255,236,190,1)", 0.75, [travel, travel + 1.1]);
      }

      /* ---- the core ---- */

      const cosY = Math.cos(spinY + leanY), sinY = Math.sin(spinY + leanY);
      const cosX = Math.cos(0.32 + leanX), sinX = Math.sin(0.32 + leanX);
      const { points, faces, grain } = SPHERE;

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
      for (let f = 0; f < faces.length; f += 3) {
        const a = faces[f] * 3, b = faces[f + 1] * 3, c = faces[f + 2] * 3;

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
        const g = grain[f / 3];
        const breath = 0.9 + 0.14 * g + 0.06 * Math.sin(clock * 0.8 + g * 6.28);
        const toRim = smoothstep(0.1, 0.92, turn);
        const centreLight = smoothstep(0.7, 0, turn) * lit * 0.6;
        const limb = 1 - 0.25 * smoothstep(0.85, 1, turn);

        const r = (lerp(tone.center[0], tone.rim[0], toRim) * breath + centreLight) * limb;
        const g2 = (lerp(tone.center[1], tone.rim[1], toRim) * breath + centreLight * 0.9) * limb;
        const b2 = (lerp(tone.center[2], tone.rim[2], toRim) * breath + centreLight * 0.7) * limb;
        const fill = `rgb(${channel(r)},${channel(g2)},${channel(b2)})`;

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
        // Stroked in its own colour at hairline width. Canvas antialiases each
        // fill independently, so abutting triangles leave a lattice of hairline
        // gaps without this — the facets read as cracked rather than joined.
        context.strokeStyle = fill;
        context.lineWidth = 1;
        context.stroke();
      }

      /* ---- what sits over the core ---- */

      context.save();
      context.globalCompositeOperation = "lighter";

      // The glass shell, as the one thing it actually contributes at this size:
      // a specular highlight up and to the left, where the key light is.
      const specR = unit * 0.62 * scale;
      const specX = cx - unit * 0.34 * scale;
      const specY = cy - unit * 0.42 * scale;
      context.fillStyle = radial(specX, specY, specR, [
        [0, `rgba(255,246,228,${0.1 + lit * 0.16})`],
        [0.55, `rgba(255,240,214,${0.03 + lit * 0.05})`],
        [1, "rgba(255,240,214,0)"],
      ]);
      context.fillRect(0, 0, size, size);

      // Embers, rising and recycling. They carry the core's colour, so the state
      // reaches the edges of the frame and not just the ball.
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
        const r = Math.max(size * 0.006, 1) * (ember.z > 0 ? 1 : 0.7);
        context.beginPath();
        context.arc(px, py, r, 0, Math.PI * 2);
        context.fill();
      }

      // Published: one ring that expands out of the core and fades.
      if (current === "success" && elapsed < 2.6) {
        const k = elapsed / 2.6;
        ring(1.05 + k * 1.5, Math.max(1, size * 0.009), "rgba(255,241,192,1)", 0.65 * (1 - k));
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
