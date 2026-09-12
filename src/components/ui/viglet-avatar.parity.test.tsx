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
 * **What this catches, and what it does not**, each measured by putting the
 * defect back and reading what came out, against the 2% budget below:
 *
 * - the palette reaching the tone curve display-encoded — **16.9%** of the
 *   frame, the defect that made the ball a washed-out tan;
 * - `detail` read as a count of subdivision passes, so 320 facets instead of
 *   180 — **6.7%**;
 * - the embers drawn over the core rather than behind it — **under budget, and
 *   this gate does not catch it**. 34 sparks a pixel across are a fraction of
 *   a percent of the frame, below any budget loose enough to survive a second
 *   rasteriser. The denominator is what is wrong rather than the budget, and
 *   VDS106 carries the region-scored answer.
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
 * whichever runs CI, so the pair of numbers below is deliberately loose in the
 * direction of that disagreement and still has 3x headroom over the narrower
 * of the two defects it is here for.
 */
const CHANNEL_TOLERANCE = 24

/** How much of the frame may differ by that much before this is a failure. */
const MISMATCH_BUDGET = 0.02

/**
 * And the whole-frame average, which no amount of edge noise moves far. It is
 * the half of this that a wholesale colour shift cannot get past, however the
 * shift is distributed.
 */
const DRIFT_BUDGET = 3

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
  /** Fraction of pixels with a channel past {@link CHANNEL_TOLERANCE}. */
  mismatch: number
  /** Mean absolute channel difference across the whole frame, out of 255. */
  drift: number
}

function compare(a: ImageData, b: ImageData): Difference {
  let past = 0
  let total = 0
  const pixels = SIZE * SIZE

  for (let i = 0; i < pixels; i += 1) {
    const at = i * 4
    const dr = Math.abs(a.data[at] - b.data[at])
    const dg = Math.abs(a.data[at + 1] - b.data[at + 1])
    const db = Math.abs(a.data[at + 2] - b.data[at + 2])
    total += dr + dg + db
    if (Math.max(dr, dg, db) > CHANNEL_TOLERANCE) past += 1
  }

  return { mismatch: past / pixels, drift: total / (pixels * 3) }
}

describe("the mascot still looks like the design it was drawn from", () => {
  it("draws the same frame twice for the same inputs", () => {
    // The ember field seeded itself from `Math.random`, at setup and again on
    // every recycle, so this was false by construction and every comparison
    // below was impossible. A caller that wants a different field per visit
    // passes `seed`.
    const first = drawn()
    const second = drawn()

    expect(compare(first, second)).toEqual({ mismatch: 0, drift: 0 })
  })

  it("draws a different one for a different seed, so the seed is real", () => {
    const { mismatch } = compare(drawn(), drawn({ seed: 7 }))
    expect(mismatch, "the seed reached nothing — the embers are elsewhere").toBeGreaterThan(0)
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

    const { mismatch, drift } = compare(mascot, reference)

    expect(
      mismatch,
      `${(mismatch * 100).toFixed(2)}% of the frame differs from the reference`,
    ).toBeLessThan(MISMATCH_BUDGET)
    expect(
      drift,
      `the whole frame is ${drift.toFixed(2)}/255 away from the reference`,
    ).toBeLessThan(DRIFT_BUDGET)
  })

  it("compares something — the reference is not a blank square", async () => {
    // Every threshold above is satisfied by two black frames, and a mascot that
    // failed to draw produces one. So: the picture has a lit sun in it.
    const mascot = drawn()
    let lit = 0
    for (let i = 0; i < SIZE * SIZE; i += 1) {
      if (mascot.data[i * 4] > 96) lit += 1
    }
    expect(lit, "nothing bright was drawn — the mascot did not render").toBeGreaterThan(200)
  })
})
