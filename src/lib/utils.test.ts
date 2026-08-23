import { describe, expect, it } from "vitest"

import { cn, getFlagEmoji, getHashedColor, parseLocale, truncateMiddle } from "./utils"

// VDS65 — four functions sit on the root barrel and nothing asserted any of
// them. Two mishandled ordinary input: getFlagEmoji read the region as
// split("_")[1], so every hyphenated locale a browser produces answered 🌐, and
// truncateMiddle returned three characters of ellipsis for a maxLength below
// three.

describe("parseLocale", () => {
  it("reads both spellings the same way", () => {
    expect(parseLocale("pt-BR")).toEqual({ language: "PT", region: "BR" })
    expect(parseLocale("pt_BR")).toEqual({ language: "PT", region: "BR" })
  })

  it("normalises case and surrounding space", () => {
    expect(parseLocale("  en-us  ")).toEqual({ language: "EN", region: "US" })
  })

  it("reports no region for a language on its own", () => {
    expect(parseLocale("pt")).toEqual({ language: "PT", region: null })
  })

  it("refuses a region that is not two letters", () => {
    expect(parseLocale("en-latn").region).toBeNull()
    expect(parseLocale("en-1").region).toBeNull()
  })

  it("survives an empty locale", () => {
    expect(parseLocale("")).toEqual({ language: "", region: null })
  })
})

describe("getFlagEmoji", () => {
  it("gives the same flag for either spelling", () => {
    // pt-BR used to answer 🌐, which is the form navigator.language, Intl,
    // i18next and this package's own i18n.language all produce.
    expect(getFlagEmoji("pt-BR")).toBe("🇧🇷")
    expect(getFlagEmoji("pt_BR")).toBe("🇧🇷")
  })

  it("does not mind the case it is given", () => {
    expect(getFlagEmoji("en-us")).toBe("🇺🇸")
  })

  it("answers with the globe when the locale names no region", () => {
    expect(getFlagEmoji("pt")).toBe("🌐")
    expect(getFlagEmoji("")).toBe("🌐")
  })
})

describe("truncateMiddle", () => {
  it("leaves a string that already fits", () => {
    expect(truncateMiddle("short", 10)).toBe("short")
  })

  it("keeps both ends and marks the middle", () => {
    expect(truncateMiddle("abcdefghijklmno", 10)).toBe("abcd...mno")
  })

  it("never returns more than it was asked for", () => {
    for (const max of [0, 1, 2, 3, 4, 5]) {
      expect(truncateMiddle("abcdefghij", max).length).toBeLessThanOrEqual(max)
    }
  })

  it("degrades the ellipsis rather than overrunning", () => {
    // Was "..." — three characters — for every one of these.
    expect(truncateMiddle("abcdefghij", 2)).toBe("..")
    expect(truncateMiddle("abcdefghij", 1)).toBe(".")
    expect(truncateMiddle("abcdefghij", 0)).toBe("")
  })

  it("returns an empty string for no text", () => {
    expect(truncateMiddle("", 10)).toBe("")
  })
})

describe("getHashedColor", () => {
  it("gives the same colour for the same string", () => {
    expect(getHashedColor("viglet")).toEqual(getHashedColor("viglet"))
  })

  it("keeps the hue inside a circle", () => {
    for (const name of ["", "a", "viglet", "a much longer name than that one"]) {
      const { h } = getHashedColor(name)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(360)
    }
  })

  it("carries a light and a dark reading of the same hue", () => {
    const { h, light, dark } = getHashedColor("viglet")
    expect(light.bg).toContain(`${h}`)
    expect(dark.bg).toContain(`${h}`)
  })
})

describe("cn", () => {
  it("lets a later tailwind class win over an earlier one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("drops the falsy branches of a conditional", () => {
    const isActive = false
    expect(cn("a", isActive && "b", undefined, "c")).toBe("a c")
  })
})
