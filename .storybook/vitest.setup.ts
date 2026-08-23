import { afterAll } from "vitest"

import {
  assertNoUndeclaredConsoleErrors,
  installConsoleErrorGate,
} from "../src/test/console-error-gate"

// Storybook 10 applies preview.tsx's decorators and parameters to the story-set
// project on its own, so a story is checked with the i18n provider, the router
// and the theme wrapper it is authored in — and `a11y: { test: "error" }` from
// preview.tsx applies here.

// VDS53 — the console gate. Installed at module scope so the patch is in place
// before the first story renders, and asserted once the file is done, because a
// React commit that logs an invalid prop is scheduled rather than synchronous.
// See console-error-gate.ts for what that rules out.
installConsoleErrorGate()

afterAll(assertNoUndeclaredConsoleErrors)
