/** The shapes `look-census.mjs` works in, for the TypeScript that imports it. */

export type Owner = "package" | "product" | "unknown"

export interface Frame {
  url: string
  line: number
  column: number
}

export interface Sample {
  figure: string
  value: string
  owner: Owner
}

export interface Reading {
  route: string
  /** The page's path, and the router match the probe found there, which name it (VDS193). */
  path?: string
  match?: string | null
  view: string
  samples: Sample[]
  primaries: number
  overlaps: Owner[]
  /** List mosaics on the route (VDS187). */
  tiles?: number
  /** Package-drawn `.bento-grid` mosaics, marked or not. */
  mosaics?: number
}

export interface Tally {
  figures: Record<string, Record<string, { package: number; product: number; unknown: number; routes: Set<string> }>>
  crowded: Record<string, number>
  dock: Record<string, number>
  tiles: Record<string, number>
}

export interface Allowance {
  figures: Record<
    string,
    {
      distinct: number
      byOwner: Record<Owner, number>
      values: Record<string, Record<Owner, number>>
      offenders: Record<string, string[]>
    }
  >
  crowded: Record<string, number>
  dock: Record<string, number>
  /** Absent in a reading taken before the census counted it; then not gated. */
  tiles?: Record<string, number>
}

export declare const VIEWS: readonly { id: string; width: number; height: number; theme: "dark" | "light" }[]
export declare const FIGURES: Record<string, string>

export declare function routePattern(pathname: string): string
export declare function fits(pattern: string, pathname: string): boolean
export declare function routeOf(pathname: string, patterns: Iterable<string>): string
export declare function walkable(href: string, start: string): boolean

export declare function decodeMappings(mappings: string): [number, number][][]
export declare function sourceAt(
  map: { sources: string[] },
  decoded: [number, number][][],
  line: number,
  column: number,
): string | null
export declare function makeClassifier(
  loadMap: (url: string) => Promise<{ sources: string[]; mappings: string } | null>,
): (frame: Frame) => Promise<"package" | "product" | "react" | "third">
export declare function ownerOf(
  chain: number[],
  stacks: Frame[][],
  classify: (frame: Frame) => Promise<"package" | "product" | "react" | "third">,
): Promise<Owner>

export declare function probe(): unknown
export declare function agree(
  first: [string, string, number][],
  second: [string, string, number][],
): { samples: [string, string, number][]; unstable: string[] }
export declare function unmarked(readings: Pick<Reading, "tiles" | "mosaics">[]): boolean
export declare function tally(readings: Reading[]): Tally
export declare function allowanceOf(tallied: Tally): Allowance
export declare function gaps(readings: Reading[]): Record<string, string[]>
export declare function complete(readings: Reading[]): Reading[]
export declare function compare(
  id: string,
  allowed: Allowance,
  current: Allowance,
  holes?: Record<string, string[]>,
): { grew: string[]; lowered: string[] }
export interface Failure {
  route: string
  view: string
  error: string
}

export declare function nameRoute(path: string, match: string | null, patterns: Iterable<string>): string
export declare function whyMissing(route: string, view: string, readings: Reading[], failures: Failure[]): string
export declare function describeGaps(
  id: string,
  holes: Record<string, string[]>,
  readings?: Reading[],
  failures?: Failure[],
): string[]
