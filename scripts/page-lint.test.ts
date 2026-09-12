import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

// VDS132 — the lint a consumer runs for the two rules BENTO-AUTHORING calls easy
// to get wrong. Every rule is planted in a fixture and the bin must name its
// file and line: a lint wired wrong reports success for the same reason a clean
// tree does, so a passing run proves nothing until a failing one has been seen.

const root = resolve(import.meta.dirname, "..")
const cli = join(root, "scripts", "page-lint.mjs")

let workdir: string

function write(relative: string, source: string) {
  const full = join(workdir, relative)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, source)
}

function run(...args: string[]) {
  // spawnSync keeps stderr on a zero exit too, which is where --warn prints.
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: workdir, encoding: "utf8" })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

type Finding = { file: string; line: number; rule: string; detail: string }

function findings(...args: string[]): Finding[] {
  return (JSON.parse(run("--json", ...args).stdout) as { findings: Finding[] }).findings
}

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), "vds-page-lint-"))
  write("package.json", '{"name":"fixture","version":"1.0.0"}')
})

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
})

describe("viglet-ds-page-lint: page.column", () => {
  it("names a page whose outermost element sets its own width, gutter and rhythm", () => {
    write(
      "src/app/home.page.tsx",
      [
        "export default function HomePage() {",
        "  return (",
        '    <main className="mx-auto max-w-7xl space-y-8 px-6 pb-12">',
        "      <h1>Home</h1>",
        "    </main>",
        "  )",
        "}",
      ].join("\n"),
    )

    const result = run()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("src/app/home.page.tsx:3")
    expect(result.stderr).toContain("page.column")

    const [finding] = findings()
    expect(finding.detail).toContain("max-w-7xl px-6 pb-12")
    // Centring and the space between children are not the column.
    expect(finding.detail).not.toContain("mx-auto")
    expect(finding.detail).not.toContain("space-y-8")
  })

  it("reads classes through cn(), a template, a variant and a fragment", () => {
    write(
      "src/list.page.tsx",
      [
        'import { cn } from "@/lib/utils"',
        "const Page = () => (",
        "  <>",
        '    <div className={cn("grid", wide && "md:max-w-6xl")}>a</div>',
        "    <section className={`py-10 ${tone}`}>b</section>",
        "  </>",
        ")",
        "export default Page",
      ].join("\n"),
    )

    const found = findings()
    expect(found.map((f) => [f.line, f.detail])).toEqual([
      [4, "the page's outermost element sets md:max-w-6xl"],
      [5, "the page's outermost element sets py-10"],
    ])
  })

  it("checks every branch a page returns, and nothing nested inside it", () => {
    write(
      "src/detail.page.tsx",
      [
        "function Inner() {",
        '  return <div className="max-w-md px-4">not the page</div>',
        "}",
        "export default function DetailPage({ loading }) {",
        '  if (loading) return <div className="p-6">loading</div>',
        "  return (",
        "    <section>",
        '      <div className="max-w-sm px-4">deeper than the column</div>',
        "      <Inner />",
        "    </section>",
        "  )",
        "}",
      ].join("\n"),
    )

    expect(findings().map((f) => f.line)).toEqual([5])
  })

  it("leaves a component that is not a page alone, and a page setting nothing", () => {
    write("src/components/empty-state.tsx", 'export default () => <div className="mx-auto max-w-md p-6" />\n')
    write("src/clean.page.tsx", 'export default function Clean() { return <div className="space-y-6">ok</div> }\n')

    const result = run("--json")
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ pages: 1, findings: [] })
  })

  it("honours an exemption with a reason, and refuses one without", () => {
    write(
      "src/kiosk.page.tsx",
      '// viglet-ds-allow-page-column -- a kiosk rendered outside the shell\nexport default () => <div className="p-6" />\n',
    )
    write(
      "src/print.page.tsx",
      '// viglet-ds-allow-page-column\nexport default () => <div className="max-w-3xl" />\n',
    )

    const found = findings()
    expect(found.map((f) => f.file)).toEqual(["src/print.page.tsx"])
    expect(found[0].detail).toContain("gives no reason")
  })

  it("takes which files are pages from --page-pattern, without reading its value as a root", () => {
    write("src/routes/home.tsx", 'export default () => <main className="max-w-7xl" />\n')

    expect(findings()).toEqual([])
    const found = findings("--page-pattern", String.raw`/routes/[^/]+\.tsx$`)
    expect(found.map((f) => f.file)).toEqual(["src/routes/home.tsx"])
  })
})

describe("viglet-ds-page-lint: primary.direct", () => {
  it("names a stylesheet that sets --vg-primary or its foreground directly", () => {
    write(
      "src/index.css",
      [
        ":root {",
        "  --vg-primary-base: oklch(55% 0.2 40);",
        "  --vg-primary: oklch(55% 0.2 40);",
        "  --vg-primary-foreground: white;",
        "  color: var(--vg-primary);",
        "  /* never --vg-primary: here */",
        "}",
      ].join("\n"),
    )

    const found = findings()
    expect(found.map((f) => [f.file, f.line, f.detail])).toEqual([
      ["src/index.css", 3, "sets --vg-primary"],
      ["src/index.css", 4, "sets --vg-primary-foreground"],
    ])
    expect(run().status).toBe(1)
  })

  it("names a style object or setProperty call, and not a read", () => {
    write(
      "src/theme.tsx",
      [
        'export const Swatch = () => <div style={{ "--vg-primary": "red" }} />',
        'document.documentElement.style.setProperty("--vg-primary-foreground", "white")',
        'const current = getComputedStyle(document.body).getPropertyValue("--vg-primary")',
        'const glob = ["src/**"]',
        'const later = { "--vg-primary": "blue" }',
      ].join("\n"),
    )

    expect(findings().map((f) => f.line)).toEqual([1, 2, 5])
  })

  it("honours a reasoned exemption in the file", () => {
    write("src/editor.css", "/* viglet-ds-allow-primary -- the theme editor previews a raw value */\n.preview { --vg-primary: red; }\n")

    expect(run().status).toBe(0)
  })
})

describe("viglet-ds-page-lint: the invocation", () => {
  it("exits zero under --warn with findings, and prints them", () => {
    write("src/a.page.tsx", 'export default () => <div className="max-w-xl" />\n')

    const result = run("--warn")
    expect(result.status).toBe(0)
    expect(result.stderr).toContain("src/a.page.tsx:1")
  })

  it("scans the roots it is given, and refuses one that is not there", () => {
    write("app/a.page.tsx", 'export default () => <div className="max-w-xl" />\n')
    write("src/clean.css", ".x { color: red; }\n")

    expect(run("app").status).toBe(1)
    expect(run("src").status).toBe(0)

    const missing = run("no-such-directory")
    expect(missing.status).toBe(1)
    expect(missing.stderr).toContain("no-such-directory")
  })

  it("refuses a tree with nothing to read rather than passing vacuously", () => {
    mkdirSync(join(workdir, "src"))
    const empty = run()
    expect(empty.status).toBe(1)
    expect(empty.stderr).toContain("vacuously")
  })

  it("is declared as a bin and shipped in files", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      bin: Record<string, string>
      files: string[]
    }
    expect(pkg.bin["viglet-ds-page-lint"]).toBe("./scripts/page-lint.mjs")
    expect(pkg.files).toContain("scripts/page-lint.mjs")
  })
})
