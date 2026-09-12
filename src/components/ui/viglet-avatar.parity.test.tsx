import { render } from "@testing-library/react"
import { commands } from "vitest/browser"
import { describe, expect, it } from "vitest"

import { VigletAvatar } from "./viglet-avatar"

/**
 * VDS103 — a gate with a picture on both sides.
 *
 * VDS100 shipped a mascot that was the wrong colour and carried 320 facets
 * where the design has 180, with every gate green: types, lint, the whole
 * suite, the size budget, and axe over the story in a real browser. Nothing in
 * any of them looks at the picture, so nothing could have failed. A person
 * holding a screenshot beside `docs/design/viglet-avatar-cms.jsx` found all
 * three defects, and that is not a check that runs on a pull request.
 *
 * So: render the mascot in a real browser, read its pixels back, and compare
 * them with an image committed beside the original it was derived from.
 *
 * **What this catches**, measured by putting each defect back and reading what
 * came out, against the budgets below:
 *
 * - the palette reaching the tone curve display-encoded, which made the ball a
 *   washed-out tan — **93% of the core** at 31/255, against a 1% budget;
 * - `detail` read as a count of subdivision passes, so 320 facets instead of
 *   180 — **34% of the core** at 15/255.
 *
 * **And what it does not.** The third of VDS100's defects, the embers drawn
 * over the core rather than behind it, is under budget here however the frame
 * is divided: 34 sparks a pixel across are about half a percent of the sphere's
 * own disc, and no budget that tight would survive a second rasteriser. VDS106
 * measured that rather than assuming it, and put that defect where the evidence
 * says it belongs — on the draw order, in `viglet-avatar.test.tsx`, where the
 * recorded context calls say exactly which layer went down first.
 */

/**
 * The reference lives with the original it was derived from, not in `src`.
 * The path is from the project root: that is where the file commands resolve,
 * and `docs/` is outside what the dev server will serve relative to anything
 * else.
 */
const REFERENCE = "docs/design/viglet-avatar-idle.png"

/**
 * The frame is compared at a fixed 128 square whatever the device pixel ratio
 * is. A developer on a retina display and CI on a headless Linux box otherwise
 * produce images of different sizes from the same component, and the reference
 * would belong to whichever machine wrote it.
 */
const SIZE = 128

/**
 * A pixel counts as different when a channel is this far off, out of 255.
 *
 * Two rasterisers disagree along antialiased edges, and this mascot is a
 * lattice of hairline seams over a sphere, so the edges are most of it. The
 * reference is written on whichever machine first runs this and read on
 * whichever runs CI, so the numbers below are deliberately loose in the
 * direction of that disagreement — and still leave the narrower of the two
 * defects they are here for at 34 times its budget.
 */
const CHANNEL_TOLERANCE = 24

/**
 * VDS106 — scored by region, because the whole frame is the wrong denominator.
 *
 * The mascot lives in the middle sixth of its frame and the rest is ground, so
 * a defect in the sphere is diluted by five parts of dark before it is scored.
 * It showed: the display-encoded palette repainted 93% of the sphere and read
 * as 16.9% of the frame, and the 320-facet ball repainted 34% and read as 6.7%.
 * Both passed a budget the noise floor needs. Dividing first is what puts each
 * number back on the thing it describes.
 *
 * The radius is derived rather than measured off the picture: the component
 * draws the sphere at `size * 0.24` from the frame's centre when it is not
 * compact, and at the limb the perspective divisor is 1, so that is also what
 * it covers on screen.
 */
const CORE_RADIUS = SIZE * 0.24

/**
 * Per region: how much of it may differ past the tolerance, and how far its
 * average may move, out of 255.
 *
 * `around` is the frame outside the sphere — the halo, the orbit, the pool of
 * light and the embers that clear the silhouette. All of it is faint over dark
 * ground, which is why the two defects above barely register there (0.7% and
 * 0.0%): it is not the region that carries the picture, and its budget stays at
 * what the whole frame used to get.
 *
 * `core` is the sphere. It is the tighter of the two despite holding the seam
 * lattice, the noisiest thing in the image, because it is where a defect in the
 * mascot actually lands.
 */
const BUDGETS = {
  core: { mismatch: 0.01, drift: 3 },
  around: { mismatch: 0.02, drift: 3 },
} as const

type RegionName = keyof typeof BUDGETS

/** Which region a pixel belongs to, by its distance from the sphere's centre. */
function regionOf(index: number): RegionName {
  const x = (index % SIZE) + 0.5 - SIZE / 2
  const y = Math.floor(index / SIZE) + 0.5 - SIZE / 2
  return x * x + y * y <= CORE_RADIUS * CORE_RADIUS ? "core" : "around"
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2D context — the browser ran out of them")
  return ctx
}

/**
 * Both sides of the comparison go through here: the mascot's own canvas, and
 * the reference decoded from the committed PNG.
 *
 * Composited over opaque black rather than compared with its alpha, because the
 * mascot clears to transparent and draws additively over it. The colour of a
 * fully transparent pixel is not defined by anything, and comparing it is how a
 * gate fails for a reason nobody can act on.
 */
function normalize(source: CanvasImageSource): ImageData {
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = context2d(canvas)
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.drawImage(source, 0, 0, SIZE, SIZE)
  return ctx.getImageData(0, 0, SIZE, SIZE)
}

function toPng(pixels: ImageData): string {
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  context2d(canvas).putImageData(pixels, 0, 0)
  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "")
}

async function fromPng(base64: string): Promise<ImageData> {
  const image = new Image()
  image.src = `data:image/png;base64,${base64}`
  await image.decode()
  return normalize(image)
}

/** The mascot, drawn once and read back. `paused` is what makes it one frame. */
function drawn(props: Parameters<typeof VigletAvatar>[0] = {}): ImageData {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const view = render(<VigletAvatar paused size={SIZE} {...props} />, { container: host })

  const canvas = host.querySelector("canvas")
  if (!canvas) throw new Error("the mascot rendered no canvas")
  const pixels = normalize(canvas)

  view.unmount()
  host.remove()
  return pixels
}

interface Difference {
  /** Fraction of the region's pixels with a channel past {@link CHANNEL_TOLERANCE}. */
  mismatch: number
  /** Mean absolute channel difference over the region, out of 255. */
  drift: number
}

function compare(a: ImageData, b: ImageData): Record<RegionName, Difference> {
  const past: Record<RegionName, number> = { core: 0, around: 0 }
  const total: Record<RegionName, number> = { core: 0, around: 0 }
  const count: Record<RegionName, number> = { core: 0, around: 0 }

  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const at = i * 4
    const dr = Math.abs(a.data[at] - b.data[at])
    const dg = Math.abs(a.data[at + 1] - b.data[at + 1])
    const db = Math.abs(a.data[at + 2] - b.data[at + 2])

    const region = regionOf(i)
    count[region] += 1
    total[region] += dr + dg + db
    if (Math.max(dr, dg, db) > CHANNEL_TOLERANCE) past[region] += 1
  }

  const score = (region: RegionName): Difference => ({
    mismatch: past[region] / count[region],
    drift: total[region] / (count[region] * 3),
  })

  return { core: score("core"), around: score("around") }
}

/** Every region's score as one line, so a failure names where the change is. */
const report = (seen: Record<RegionName, Difference>) =>
  (Object.keys(BUDGETS) as RegionName[])
    .map((r) => `${r} ${(seen[r].mismatch * 100).toFixed(2)}% at ${seen[r].drift.toFixed(2)}/255`)
    .join(", ")

describe("the mascot still looks like the design it was drawn from", () => {
  it("draws the same frame twice for the same inputs", () => {
    // The ember field seeded itself from `Math.random`, at setup and again on
    // every recycle, so this was false by construction and every comparison
    // below was impossible. A caller that wants a different field per visit
    // passes `seed`.
    const first = drawn()
    const second = drawn()

    expect(compare(first, second)).toEqual({
      core: { mismatch: 0, drift: 0 },
      around: { mismatch: 0, drift: 0 },
    })
  })

  it("draws a different one for a different seed, so the seed is real", () => {
    const seen = compare(drawn(), drawn({ seed: 7 }))
    expect(
      seen.core.mismatch + seen.around.mismatch,
      "the seed reached nothing — the embers are elsewhere",
    ).toBeGreaterThan(0)
  })

  it("matches the reference image committed beside the original", async () => {
    const mascot = drawn()

    let reference: ImageData
    try {
      reference = await fromPng(await commands.readFile(REFERENCE, "base64"))
    } catch {
      // Written rather than demanded, so a deliberate change to the mascot is
      // one deleted file away from a new reference — and never a silent pass:
      // the run fails here, and what it wrote has to be looked at before it is
      // committed. In CI the file is present, so this branch is a missing
      // commit and the failure is the right answer.
      await commands.writeFile(REFERENCE, toPng(mascot), "base64")
      throw new Error(
        `no reference at ${REFERENCE}, so one was written from this run. ` +
          "Open it beside docs/design/viglet-avatar-cms.jsx, check the colour " +
          "and the facets against the original, and commit it.",
      )
    }

    const seen = compare(mascot, reference)
    const scores = report(seen)

    for (const region of Object.keys(BUDGETS) as RegionName[]) {
      expect(
        seen[region].mismatch,
        `the ${region} differs from the reference — ${scores}`,
      ).toBeLessThan(BUDGETS[region].mismatch)
      expect(
        seen[region].drift,
        `the ${region} has moved away from the reference — ${scores}`,
      ).toBeLessThan(BUDGETS[region].drift)
    }
  })

  it("compares something — the reference is not a blank square", async () => {
    // Every threshold above is satisfied by two black frames, and a mascot that
    // failed to draw produces one. So: the picture has a lit sun in it, and it
    // is in the region the tight budget covers.
    const mascot = drawn()
    let lit = 0
    let litInCore = 0
    for (let i = 0; i < SIZE * SIZE; i += 1) {
      if (mascot.data[i * 4] <= 96) continue
      lit += 1
      if (regionOf(i) === "core") litInCore += 1
    }
    expect(lit, "nothing bright was drawn — the mascot did not render").toBeGreaterThan(200)
    expect(litInCore / lit, "the sphere is not inside the core region").toBeGreaterThan(0.8)
  })

  it("divides the frame into two regions that each hold enough to score", () => {
    // A radius that drifted out of step with the component would leave one
    // region empty, and an empty region's ratio is NaN — which fails, but says
    // nothing about the mascot. It is cheaper to say it here.
    const counts = { core: 0, around: 0 }
    for (let i = 0; i < SIZE * SIZE; i += 1) counts[regionOf(i)] += 1

    expect(counts.core, "the core region is too small to score").toBeGreaterThan(2000)
    expect(counts.around, "the region outside the core is too small to score").toBeGreaterThan(2000)
  })
})
