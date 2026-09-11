// @vitest-environment node
//
// VDS100 — two of this package's six consumers are Next apps, so the mascot has
// to survive a render with no DOM under it. The environment is the assertion,
// the way theme-provider.ssr.test.tsx makes it: there is no `window`, no
// `document` and no `requestAnimationFrame` here, and a component that reads any
// of them during render rather than inside an effect throws on the first one.
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { VigletAvatar } from "./viglet-avatar"

describe("VigletAvatar, rendered where there is no DOM", () => {
  it("renders without reaching for a window", () => {
    expect(globalThis.window).toBeUndefined()

    const html = renderToString(<VigletAvatar state="working" />)

    expect(html).toContain("<canvas")
    expect(html).toContain('aria-hidden="true"')
  })

  it("sizes itself from the prop rather than from the device", () => {
    // devicePixelRatio is a client-only read, so the markup the server sends has
    // to be the CSS size alone — a server that guessed would hydrate mismatched.
    const html = renderToString(<VigletAvatar size={96} />)

    expect(html).toContain("width:96px")
    expect(html).toContain("height:96px")
  })
})
