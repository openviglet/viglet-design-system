import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..")
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8")

// react-router-dom is optional for the root entry and required for two
// subpaths, and npm has no way to say that. So the split lives in prose, in
// three places, and prose drifts. These assert the three agree; check-dist
// asserts the built entries agree with them.

const manifest = JSON.parse(read("package.json")) as {
  peerDependencies: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

describe("the router peer says the same thing everywhere", () => {
  it("is declared as a peer at all", () => {
    expect(manifest.peerDependencies["react-router-dom"]).toBeTruthy()
  })

  it("is optional, because the root entry does not need it", () => {
    expect(manifest.peerDependenciesMeta?.["react-router-dom"]?.optional).toBe(true)
  })

  it("is stated as required by the bento subpath's own doc comment", () => {
    expect(read("src/bento/index.ts")).toMatch(/requires\s+`?react-router-dom/i)
  })

  it("is stated as required by the README", () => {
    expect(read("README.md")).toMatch(/`\.\/bento` requires `react-router-dom`/)
  })

  it("names the same two entry points in both places", () => {
    for (const doc of ["src/bento/index.ts", "README.md"]) {
      const text = read(doc)
      expect(text, `${doc} does not name ./router`).toMatch(/\.\/router/)
      expect(text, `${doc} does not name ./bento`).toMatch(/\.\/bento/)
    }
  })

  it("is enforced by the build rather than only described", () => {
    // check-dist fails when an entry other than those two imports the router.
    expect(read("scripts/check-dist.mjs")).toContain("react-router-dom")
  })
})
