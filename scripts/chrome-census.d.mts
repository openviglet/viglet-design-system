/** The shapes `chrome-census.mjs` works in, for the TypeScript that imports it. */

export interface ChromeMeasurement {
  scanned: number
  /** Source files taking each console-era name. */
  files: Record<string, number>
  total: number
}

export interface CensusConsumer {
  id: string
  chrome: string
  entries?: readonly string[]
  sourceRoots?: readonly string[]
  checkout?: string
  offMachine?: boolean
}

export declare function measureConsumer(checkout: string, sourceRoots: readonly string[]): ChromeMeasurement

export declare function chromeFinding(consumer: Pick<CensusConsumer, "id" | "chrome" | "entries">, measured: ChromeMeasurement): string | null

export declare function census(
  register: { consumers: readonly CensusConsumer[] },
  repoRoot: string,
  line: string,
): {
  rows: (ChromeMeasurement & { id: string; chrome: string; finding: string | null })[]
  notMeasured: string[]
  consoles: string[]
}
