import { readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

// VDS6 — the reduced-motion guard, as a rule the gate holds rather than a
// comment in a stylesheet.
//
// axe cannot see this one: it inspects a rendered page under whatever motion
// preference the browser is set to, and it has nothing to say about a stylesheet
// that never asks. So this is asserted over the source instead. Every stylesheet
// this package ships that animates must also say what it does for a reader who
// asked for less motion — and each is checked separately, because the standalone
// ones (the formulas backdrop, the pulse ring) are imported on their own and a
// guard in the main stylesheet never reaches them.

const srcRoot = resolve(import.meta.dirname, "..")

function stylesheets(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) stylesheets(full, found)
    else if (entry.name.endsWith(".css")) found.push(full)
  }
  return found
}

const ANIMATES = /(^|[\s;{])(animation|animation-name|transition)\s*:/m

const files = stylesheets(srcRoot).map((file) => ({
  file,
  name: relative(srcRoot, file).replace(/\\/g, "/"),
  source: readFileSync(file, "utf8"),
}))

describe("prefers-reduced-motion", () => {
  it("finds the stylesheets to check", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  const animating = files.filter(({ source }) => ANIMATES.test(source))

  it("has stylesheets that animate, so the rule has something to hold", () => {
    expect(animating.length).toBeGreaterThan(0)
  })

  it.each(animating.map(({ name }) => name))(
    "%s declares animation and answers prefers-reduced-motion",
    (name) => {
      const { source } = files.find((f) => f.name === name)!
      expect(
        source,
        `${name} animates but never asks for the reader's motion preference. ` +
          "Add an @media (prefers-reduced-motion: reduce) block that stops what it starts.",
      ).toMatch(/@media[^{]*prefers-reduced-motion\s*:\s*reduce/)
    },
  )
})
