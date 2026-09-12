/** The shapes `check-catalogue.mjs` exports, for the TypeScript that imports it. */

export declare const SAMPLE_JOBS: readonly (readonly [job: string, first: string])[]

export declare function readUndescribed(text: string): string[]

export declare function undescribedFindings(
  components: readonly { name: string; summary: string }[],
  listed: readonly string[],
): string[]
