/** A DTCG colour token, with the value a React Native StyleSheet takes. */
export interface ColourToken {
  $type: "color"
  $value: { colorSpace: "oklch"; components: [number, number, number]; alpha: number; hex: string }
  $extensions: { "com.viglet": { reactNative: string } }
}

/** A DTCG dimension token; `reactNative` is px at a 16 px root, `coarse` the touch-screen value. */
export interface DimensionToken {
  $type: "dimension"
  $value: { value: number; unit: "rem" | "px" }
  $extensions: {
    "com.viglet": { reactNative: number; coarse?: { value: number; unit: "rem" | "px"; reactNative: number } }
  }
}

export interface FontToken {
  $type: "fontFamily"
  $value: string[]
  $extensions?: { "com.viglet": { tones: Record<string, string[]> } }
}

export interface TokensJson {
  $description: string
  color: Record<string, { light: Record<string, ColourToken>; dark: Record<string, ColourToken> }>
  dimension: Record<string, DimensionToken>
  font: Record<string, FontToken>
}

/** The tones the preset declares, `cool` first. */
export declare function tonesOf(preset: string): string[]

/** The accent presets the preset declares, in source order. */
export declare function accentsOf(preset: string): string[]

/** `tokens.json` from the preset's source: every token resolved, per tone and ground. */
export declare function tokensJson(preset: string): TokensJson
