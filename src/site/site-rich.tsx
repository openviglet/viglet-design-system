import type { ReactNode } from "react"

/** One run of copy: plain text, inline code, bold or italic. */
export type SiteRun = string | { code: string } | { b: string } | { i: string }

/** A sentence as data, so a Markdown twin can walk it instead of parsing HTML. */
export type SiteRichRuns = readonly SiteRun[]

function textOf(run: SiteRun): string {
  if (typeof run === "string") return run
  if ("code" in run) return run.code
  if ("b" in run) return run.b
  return run.i
}

function RunNode({ run, text }: { run: SiteRun; text: string }): ReactNode {
  if (typeof run === "string") return text
  if ("code" in run) return <code>{text}</code>
  if ("b" in run) return <b>{text}</b>
  return <i>{text}</i>
}

/**
 * Renders a run list from a product's content module with no markup parsing.
 *
 * `transform` rewrites each run's text on the way out, for copy that carries a
 * token the page fills in (a published version number, say). The copy declares
 * the token once and no section has to remember it.
 */
export function SiteRich({ runs, transform }: { runs: SiteRichRuns; transform?: (text: string) => string }) {
  return (
    <>
      {runs.map((run, i) => (
        <RunNode key={i} run={run} text={transform ? transform(textOf(run)) : textOf(run)} />
      ))}
    </>
  )
}
