import type { VigGridItem } from "@/models/grid-item";
import { useMemo } from "react";
type FieldExtractor<T> = keyof T | ((item: T) => string);

interface GridAdapterConfig<T> {
  id?: keyof T | ((item: T) => string | number);
  name: FieldExtractor<T>;
  description: FieldExtractor<T>;
  url: (item: T) => string;
  icon?: FieldExtractor<T>;
}

export function useGridAdapter<T>(
  data: T[] | undefined | null,
  config: GridAdapterConfig<T>,
): VigGridItem[] {
  // The memo read every one of these and depended on `data` alone, so a `url`
  // builder closing over a route param — or a `description` extractor closing
  // over the active locale — kept handing back the previous array. Depending on
  // `config` itself would be the other error: every call site writes an inline
  // literal, which is a new object each render, and the memo would never hold.
  // The extractors are the real inputs, so they are the dependencies; a caller
  // that keeps them stable keeps the memo, and one that inlines an arrow pays
  // for a recompute rather than reading a stale row.
  const { id, name, description, url, icon } = config;

  return useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const resolveField = (item: T, extractor: FieldExtractor<T>) => {
      if (typeof extractor === "function") {
        return extractor(item);
      }
      const value = item[extractor];
      return value === null || value === undefined ? "" : String(value);
    };

    // VigGridItem.id is declared `string`, and the two `any`s here were what let
    // a numeric primary key reach it as a number — the field lied about its own
    // type at every call site that trusted it. Coerced once, here.
    const resolveId = (item: T): string => {
      if (!id) {
        // Convention fallback: most product entities carry an `id`. Nothing in T
        // promises one, so it is read as unknown rather than asserted.
        const candidate = (item as { id?: unknown }).id;
        return candidate === null || candidate === undefined
          ? ""
          : String(candidate);
      }
      if (typeof id === "function") {
        return String(id(item));
      }
      return String(item[id]);
    };

    return data.map((item) => ({
      id: resolveId(item),
      name: resolveField(item, name),
      description: resolveField(item, description),
      url: url(item),
      icon: icon ? resolveField(item, icon) || null : null,
    }));
  }, [data, id, name, description, url, icon]);
}
