/** The shapes `contrast.mjs` works in, for the TypeScript that imports it. */

export declare const AA_TEXT: number

export type Ground = "light" | "dark"

/** A stylesheet, named the way a finding should name it. */
export interface Sheet {
  name: string
  css: string
}

/** A colour in OKLab, with alpha. */
export interface Colour {
  L: number
  a: number
  b: number
  alpha: number
}

export interface MeasuredPair {
  ground: Ground
  surface: string
  foreground: string
  /** Null where either side does not resolve to an opaque colour. */
  ratio: number | null
  /** The side or sides that could not be read. */
  unread: string[]
  /** Every stylesheet the pair's tokens were declared in along the way. */
  origin: string[]
  /** Which token each of those stylesheets declared. */
  declared: { token: string; sheet: string }[]
}

export declare function ruleBlocks(
  css: string,
): { selectors: string[]; atRules: string[]; declarations: Map<string, string> }[]

export declare function groundTokens(
  sheets: readonly Sheet[],
  ground: Ground,
): { tokens: Map<string, string>; origin: Map<string, string> }

export declare function resolveToken(tokens: Map<string, string>, value: string, depth?: number): string

export declare function parseColour(value: string, tokens?: Map<string, string>): Colour | null

export declare function luminance(colour: Colour | null): number | null

export declare function ratio(front: number, behind: number): number

export declare function pairsOf(tokens: Map<string, string>): [surface: string, foreground: string][]

export declare function measurePairs(sheets: readonly Sheet[], ground: Ground): MeasuredPair[]
