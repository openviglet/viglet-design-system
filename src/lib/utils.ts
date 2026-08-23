import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The language and region of a locale, in either spelling anything writes it.
 *
 * `pt_BR` is the Java and POSIX form; `pt-BR` is what BCP 47, `Intl`,
 * `navigator.language`, i18next and this package's own `i18n.language` produce.
 * Reading only the first was why `getFlagEmoji("pt-BR")` answered with a globe.
 *
 * Kept here rather than in `badge-locale.tsx`, where the other half of this
 * lived: that file carries the language-to-country and country-override maps and
 * pulls in React, and neither belongs on the path of a string utility.
 */
export function parseLocale(locale: string): {
  language: string;
  region: string | null;
} {
  const [language = "", region] = locale
    .trim()
    .replaceAll("-", "_")
    .toUpperCase()
    .split("_");

  return {
    language,
    region: region?.length === 2 ? region : null,
  };
}

export const truncateMiddle = (
  text: string,
  maxLength: number = 10,
): string => {
  if (!text || text.length <= maxLength) return text ?? "";

  const dots = "...";
  // Below the width of the ellipsis the arithmetic below goes negative and
  // `substring` clamps it away, so this used to return three characters for a
  // maxLength of two, one or zero — longer than the limit it was handed.
  if (maxLength < dots.length) return dots.slice(0, Math.max(maxLength, 0));

  const charsToShow = maxLength - dots.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return (
    text.substring(0, frontChars) +
    dots +
    text.substring(text.length - backChars)
  );
};

/**
 * The flag for a locale's region, or 🌐 when it names none.
 *
 * A locale with no region — `pt` — still answers 🌐 rather than guessing a
 * country from the language. `BadgeLocale` does make that guess, deliberately,
 * from a table of its own; this is the strict reading and stays one.
 */
export const getFlagEmoji = (locale: string) => {
  const { region } = parseLocale(locale);

  if (!region) return "🌐";

  return region
    .split("")
    .map((char) => String.fromCodePoint((char.codePointAt(0) ?? 0) + 127397))
    .join("");
};

export const getHashedColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (str.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    h,
    light: {
      bg: `hsl(${h}, 70%, 95%)`,
      text: `hsl(${h}, 70%, 20%)`,
      border: `hsl(${h}, 70%, 90%)`,
    },
    dark: {
      bg: `hsl(${h}, 50%, 15%)`,
      text: `hsl(${h}, 80%, 80%)`,
      border: `hsl(${h}, 50%, 25%)`,
    },
  };
};
