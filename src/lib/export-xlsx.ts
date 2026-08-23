import * as XLSX from "xlsx";

/** Excel refuses these in a sheet name, and truncates past 31 characters. */
const FORBIDDEN_IN_SHEET_NAME = /[[\]:*?/\\]/g;
const MAX_SHEET_NAME = 31;

/**
 * A sheet name from whatever the caller gave, or `Sheet1`.
 *
 * "Logging" was hard-coded here, so a model list, an audit trail and a billing
 * export all arrived called that — a word only one screen justifies, in a
 * function generic in every other parameter.
 */
function toSheetName(candidate: string): string {
  const cleaned = candidate.replace(FORBIDDEN_IN_SHEET_NAME, " ").trim();
  return cleaned.slice(0, MAX_SHEET_NAME) || "Sheet1";
}

/** One value as Excel should see it. */
function toCell(value: unknown): unknown {
  if (Array.isArray(value)) return value.join(", ");
  if (value instanceof Date) return value.toISOString();
  return value;
}

/**
 * Write `data` to an .xlsx download, one column per entry in `headers`.
 *
 * @param sheetName Names the sheet. Defaults to `filename`, cleaned of the
 *   characters Excel refuses and cut to the 31 it allows.
 */
export function exportToXlsx<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: string; label: string }[],
  filename: string,
  sheetName?: string,
) {
  const labels = headers.map((h) => h.label);

  // Built as an array of arrays rather than through `json_to_sheet`, which
  // derives its columns from the rows it is given: with no rows it wrote no
  // header row at all, so a table filtered to nothing exported a file with no
  // columns and no titles, indistinguishable from a broken export. The headers
  // are what the caller asked for, so they are what the sheet is built from.
  const body = data.map((item) => headers.map((h) => toCell(item[h.key])));
  const ws = XLSX.utils.aoa_to_sheet([labels, ...body]);

  // Auto-fit column widths, over the same columns in the same order.
  ws["!cols"] = headers.map((h, column) => {
    let max = h.label.length;
    for (const row of body) {
      const len = String(row[column] ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(Math.max(max + 2, 12), 60) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, toSheetName(sheetName ?? filename));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
