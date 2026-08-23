import * as XLSX from "xlsx"
import { beforeEach, describe, expect, it, vi } from "vitest"

// VDS64 — the exporter is generic in every parameter and used to ignore two of
// them: every sheet was called "Logging", and the columns came from the rows
// rather than from `headers`, so an empty export wrote no header row at all.

const written: Array<{ wb: XLSX.WorkBook; name: string }> = []

vi.mock("xlsx", async () => {
  const actual = await vi.importActual<typeof import("xlsx")>("xlsx")
  return {
    ...actual,
    writeFile: (wb: XLSX.WorkBook, name: string) => {
      written.push({ wb, name })
    },
  }
})

const headers = [
  { key: "name", label: "Name" },
  { key: "tags", label: "Tags" },
  { key: "seen", label: "Last seen" },
]

/** The sheet of the most recent export, as rows of raw values. */
function lastSheet() {
  const { wb, name } = written[written.length - 1]
  const sheetName = wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
  })
  return { file: name, sheetName, rows, ws: wb.Sheets[sheetName] }
}

let exportToXlsx: typeof import("./export-xlsx").exportToXlsx

beforeEach(async () => {
  written.length = 0
  ;({ exportToXlsx } = await import("./export-xlsx"))
})

describe("exportToXlsx", () => {
  it("writes the header row even when there is nothing to export", () => {
    exportToXlsx([], headers, "empty")

    const { rows } = lastSheet()
    // Was a single empty row: no columns, no titles, and no way to tell that
    // from a broken export.
    expect(rows[0]).toEqual(["Name", "Tags", "Last seen"])
  })

  it("writes a column for a header no row carries a value for", () => {
    exportToXlsx([{ name: "alpha" }], headers, "sparse")

    const { rows } = lastSheet()
    expect(rows[0]).toEqual(["Name", "Tags", "Last seen"])
    expect(rows[1]?.[0]).toBe("alpha")
  })

  it("joins arrays and writes dates as ISO", () => {
    exportToXlsx(
      [{ name: "alpha", tags: ["a", "b"], seen: new Date("2026-08-23T10:00:00Z") }],
      headers,
      "mapped",
    )

    const { rows } = lastSheet()
    expect(rows[1]).toEqual(["alpha", "a, b", "2026-08-23T10:00:00.000Z"])
  })

  it("names the sheet after the file when the caller says nothing", () => {
    exportToXlsx([], headers, "audit-trail")

    // Not "Logging", which is one screen's word and was every sheet's name.
    expect(lastSheet().sheetName).toBe("audit-trail")
  })

  it("lets the caller name the sheet", () => {
    exportToXlsx([], headers, "audit-trail", "Audit")

    expect(lastSheet().sheetName).toBe("Audit")
  })

  it("makes a name Excel will accept out of one it will not", () => {
    exportToXlsx([], headers, "a/b:c*d?e[f]g that runs well past thirty-one")

    const { sheetName } = lastSheet()
    expect(sheetName).not.toMatch(/[[\]:*?/\\]/)
    expect(sheetName.length).toBeLessThanOrEqual(31)
  })

  it("still writes the file the caller asked for", () => {
    exportToXlsx([], headers, "audit-trail")

    expect(lastSheet().file).toBe("audit-trail.xlsx")
  })

  it("sizes one column per header, in the same order", () => {
    exportToXlsx([{ name: "a-considerably-longer-value" }], headers, "widths")

    const cols = lastSheet().ws["!cols"]
    expect(cols).toHaveLength(headers.length)
    expect(cols?.[0]?.wch).toBeGreaterThan(cols?.[1]?.wch ?? 0)
  })
})
