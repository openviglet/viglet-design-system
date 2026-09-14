/** The shapes `check-readme.mjs` exports, for the TypeScript that imports it. */

export interface ReadmeList {
  /** The `###` heading the list sits under, as written. */
  heading: string
  names: string[]
  /** The count the heading claims in parentheses, where it claims one. */
  claimed: number | null
}

export interface ExportedSurface {
  entries: Record<
    string,
    {
      values: string[]
      /** Value name -> the module that declared it, as `emit-exports` writes it. */
      declaredIn?: Record<string, string>
    }
  >
}

export declare function namesIn(item: string): string[]

export declare function inventory(readme: string): ReadmeList[]

export declare function moduleOf(name: string, declaredIn: Record<string, string>): string | null

export declare function covered(
  name: string,
  listed: ReadonlySet<string>,
  declaredIn: Record<string, string>,
): boolean

export declare function ships(
  name: string,
  declaredIn: Record<string, string>,
  exported: ReadonlySet<string>,
): boolean

export declare function componentEntries(
  exports: ExportedSurface,
): [subpath: string, names: string[]][]

export declare function findings(sections: readonly ReadmeList[], exports: ExportedSurface): string[]
