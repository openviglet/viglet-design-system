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
      if (!config.id) {
        // Convention fallback: most product entities carry an `id`. Nothing in T
        // promises one, so it is read as unknown rather than asserted.
        const candidate = (item as { id?: unknown }).id;
        return candidate === null || candidate === undefined
          ? ""
          : String(candidate);
      }
      if (typeof config.id === "function") {
        return String(config.id(item));
      }
      return String(item[config.id]);
    };

    return data.map((item) => ({
      id: resolveId(item),
      name: resolveField(item, config.name),
      description: resolveField(item, config.description),
      url: config.url(item),
      icon: config.icon ? resolveField(item, config.icon) || null : null,
    }));
  }, [data]);
}
