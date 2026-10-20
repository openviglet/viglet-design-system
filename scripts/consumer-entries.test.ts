import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

// VDS129 — the bin a consumer runs to hold its entry in consumers.json to its
// own source. It is exercised as a process over files on disk, the way a
// product's suite calls it, because the exit code and the entry it names are
// the whole contract.

const root = resolve(import.meta.dirname, "..")
const cli = join(root, "scripts", "consumer-entries.mjs")
const PKG = "@viglet/viglet-design-system"

let workdir: string
let register: string

function write(relative: string, source: string) {
  const full = join(workdir, relative)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, source)
}

function declare(entries: string[], sourceRoots = ["src"]) {
  writeFileSync(
    register,
    JSON.stringify({
      consumers: [{ id: "fixture", name: "Fixture", package: "fixture-app", sourceRoots, entries }],
    }),
  )
}

function run(...args: string[]) {
  try {
    const stdout = execFileSync(process.execPath, [cli, ...args], {
      cwd: workdir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status: number; stdout: string; stderr: string }
    return { status: failure.status, stdout: failure.stdout, stderr: failure.stderr }
  }
}

function measure() {
  const { stdout } = run("--register", register, "--json")
  return JSON.parse(stdout) as {
    imported: string[]
    undeclared: { entry: string; file: string; line: number }[]
    unused: string[]
  }
}

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), "vds-consumer-entries-"))
  register = join(workdir, "register.json")
  write("package.json", '{"name":"fixture-app","version":"1.0.0"}')
})

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
})

describe("viglet-ds-consumer-entries", () => {
  it("names the entry a consumer imports and does not declare", () => {
    // The planted case: one entry declared, two imported.
    declare(["."])
    write("src/app.tsx", `import { Button } from "${PKG}"\n`)
    write("src/page.tsx", `import { Button } from "${PKG}"\nimport { BentoPanel } from "${PKG}/bento"\n`)

    const result = run("--register", register)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("./bento")
    expect(result.stderr).toContain("src/page.tsx:2")
  })

  it("names the entry a consumer declares and imports nowhere", () => {
    declare([".", "./router"])
    write("src/app.tsx", `import { Button } from "${PKG}"\n`)

    const result = run("--register", register)
    expect(result.status).toBe(1)
    expect(measure().unused).toEqual(["./router"])
  })

  it("exits zero when the declaration and the source agree", () => {
    declare([".", "./styles", "./vite"], ["src", "vite.config.ts"])
    write("src/app.tsx", `import { Button } from "${PKG}"\n`)
    write("src/index.css", `@import "${PKG}/styles";\n`)
    write("vite.config.ts", `import { vigletDesignSystem } from "${PKG}/vite"\n`)

    const result = run("--register", register)
    expect(result.stdout + result.stderr).not.toContain("disagree")
    expect(result.status).toBe(0)
  })

  it("reads every form an entry is taken in", () => {
    declare(["."])
    write(
      "src/forms.ts",
      [
        `import "${PKG}/styles"`,
        `export { Button } from "${PKG}/router"`,
        `const lazy = () => import("${PKG}/bento")`,
        `const cjs = require("${PKG}/i18n")`,
      ].join("\n"),
    )
    write("src/theme.css", `@import url("${PKG}/preset");\n`)

    expect(measure().imported).toEqual(["./bento", "./i18n", "./preset", "./router", "./styles"])
  })

  it("does not count a test, a story or a comment as the product taking an entry", () => {
    declare(["."])
    write("src/app.tsx", `import { Button } from "${PKG}"\n`)
    write("src/app.test.tsx", `import { BentoPanel } from "${PKG}/bento"\n`)
    write("src/app.stories.tsx", `import { PageHeader } from "${PKG}/router"\n`)
    write("src/test/census.ts", `import { BentoShell } from "${PKG}/bento"\n`)
    write(
      "src/documented.ts",
      `/**\n * import { BentoPanel } from "${PKG}/bento"\n */\n// import "${PKG}/styles"\nexport const x = 1\n`,
    )

    expect(run("--register", register).status).toBe(0)
  })

  it("keeps reading after a glob that looks like a comment opening", () => {
    declare([".", "./vite"], ["vite.config.ts"])
    write(
      "vite.config.ts",
      `const content = ["src/**"]\nimport { vigletDesignSystem } from "${PKG}/vite"\nimport "${PKG}"\n`,
    )

    expect(run("--register", register).status).toBe(0)
  })

  it("finds the consumer by its package name, or by --consumer", () => {
    declare(["."])
    write("src/app.tsx", `import { Button } from "${PKG}"\n`)
    expect(run("--register", register).status).toBe(0)

    write("package.json", '{"name":"not-declared","version":"1.0.0"}')
    const unknown = run("--register", register)
    expect(unknown.status).toBe(1)
    expect(unknown.stderr).toContain("not-declared is not a consumer")

    expect(run("--register", register, "--consumer", "fixture").status).toBe(0)
  })

  it("refuses a source root that is not there rather than passing vacuously", () => {
    declare(["."], ["source"])
    const missing = run("--register", register)
    expect(missing.status).toBe(1)
    expect(missing.stderr).toContain("source")

    declare(["."], ["src"])
    mkdirSync(join(workdir, "src"))
    const empty = run("--register", register)
    expect(empty.status).toBe(1)
    expect(empty.stderr).toContain("vacuously")
  })

  describe("VDS217: a page that links the package instead of importing it", () => {
    const CDN = `https://cdn.jsdelivr.net/npm/${PKG}@2026.3.21/dist`

    function pinned() {
      const { stdout } = run("--register", register, "--json")
      return JSON.parse(stdout) as { imported: string[]; pinned: Record<string, string> }
    }

    it("counts a <link> to a file an entry exports, and records the version it pins", () => {
      declare(["./tokens.css", "./site.css"], ["docs"])
      write(
        "docs/index.html",
        `<html data-tone="warm"><head>\n<link rel="stylesheet" href="${CDN}/tokens.css">\n` +
          `<link href='https://unpkg.com/${PKG}@2026.3.21/dist/site.css' rel="stylesheet" />\n</head></html>\n`,
      )

      expect(run("--register", register).status).toBe(0)
      expect(pinned()).toMatchObject({
        imported: ["./site.css", "./tokens.css"],
        pinned: { "./site.css": "2026.3.21", "./tokens.css": "2026.3.21" },
      })
    })

    it("fails when a page stops linking an entry it declares", () => {
      declare(["./tokens.css", "./site.css"], ["docs"])
      write("docs/index.html", `<link rel="stylesheet" href="${CDN}/tokens.css">\n`)

      const result = run("--register", register)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("./site.css")
    })

    it("counts a CSS @import of the same URL", () => {
      declare(["./site.css"], ["docs"])
      write("docs/page.css", `@import url("${CDN}/site.css");\n`)
      expect(pinned().imported).toEqual(["./site.css"])
    })

    it("does not count a snippet the page shows, a commented link, or a bare name in prose", () => {
      declare(["./tokens.css"], ["docs"])
      write(
        "docs/index.html",
        [
          `<link rel="stylesheet" href="${CDN}/tokens.css">`,
          `<pre><code>&lt;link rel="stylesheet" href="${CDN}/site.css"&gt;</code></pre>`,
          `<!-- <link rel="stylesheet" href="${CDN}/site.css"> -->`,
          `<p>Install with npm i ${PKG}, then import "${PKG}/bento".</p>`,
        ].join("\n"),
      )
      expect(pinned().imported).toEqual(["./tokens.css"])
    })

    it("reads an Astro component's frontmatter imports and its template links", () => {
      declare(["./site", "./tokens.css"], ["src"])
      write(
        "src/Layout.astro",
        [
          "---",
          `import { SiteFooter } from "${PKG}/site"`,
          `// import { BentoPanel } from "${PKG}/bento"`,
          "---",
          `<link rel="stylesheet" href="${CDN}/tokens.css">`,
          `<!-- <link rel="stylesheet" href="${CDN}/site.css"> -->`,
        ].join("\n"),
      )
      expect(run("--register", register).status).toBe(0)
      expect(pinned().imported).toEqual(["./site", "./tokens.css"])
    })

    it("ignores a file no entry exports", () => {
      declare(["./tokens.css"], ["docs"])
      write("docs/index.html", `<link rel="stylesheet" href="${CDN}/tokens.css">\n<link href="${CDN}/chunk-abc.css">\n`)
      expect(pinned().imported).toEqual(["./tokens.css"])
    })
  })

  it("reads the register this package ships when none is named", () => {
    // How a consumer calls it: no --register, so the bin reads consumers.json
    // from beside itself, which is where `files` puts it in the tarball.
    const shipped = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8")) as {
      consumers: { id: string; package: string; sourceRoots: string[]; entries: string[] }[]
    }
    const shio = shipped.consumers.find((c) => c.id === "shio")!
    write("package.json", JSON.stringify({ name: shio.package, version: "1.0.0" }))
    const lines = shio.entries.map((entry, i) =>
      entry.endsWith(".css") || entry === "./styles"
        ? `import "${PKG}${entry.slice(1)}"`
        : `import * as m${i} from "${entry === "." ? PKG : PKG + entry.slice(1)}"`,
    )
    for (const sourceRoot of shio.sourceRoots) {
      write(sourceRoot.includes(".") ? sourceRoot : join(sourceRoot, "entry.ts"), `${lines.join("\n")}\n`)
    }

    const result = run()
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })
})
