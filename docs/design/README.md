# Design source material

Originals that a shipped component was derived from, kept because the derivation
loses things and the original is the only place to check them against.

This is not `docs/reference`. That directory holds design *canvases* — the
grounds, the page anatomy, the panel — which describe what the package renders
today and are published to npm with it. What is here describes where something
came from, is read by people and not by products, and ships to nobody.

Nothing here is imported, built, linted or type-checked. A file may name a
dependency this package does not have — with one exception, noted below: a test
reads the reference image, because comparing against it is the whole point of
keeping it.

## Files

### `viglet-avatar-cms.jsx`

The Viglet mascot and assistant as first designed: a CMS screen with the avatar
docked bottom-right, the five states wired to real editor actions (publish,
validation failure, an arriving lead), the typed caption beside the collapsed
orb, and the chat panel it opens into.

It renders the mascot in three.js — an icosahedron subdivided twice, flat-shaded
through a custom shader, inside a glass shell, with an additive halo, an orbit
ring, a pulse and rising embers. Block E ships that picture without the
dependency, so this file is what the drawn version is checked against: the
palette per state, the timing constants, and which gesture belongs to which
state all come from here.

Two things in it are deliberately **not** carried into the package:

- **The Anthropic call.** `askViglet` posts to `api.anthropic.com` from the
  browser with a model id inline. A package six products install cannot hold an
  endpoint or a key, so the shipped dock takes `onSend` and knows no backend.
- **The application around it.** The pages, the leads and the editor are a
  demonstration, not a surface this package exports. No product data in the
  package is a standing non-goal.

Kept verbatim, including its Portuguese comments. Do not tidy it — a file edited
to match what shipped stops being able to say what changed.

### `viglet-avatar-idle.png`

The other side of the comparison: `VigletAvatar` paused at `idle`, 128 square,
read straight off its own canvas. This one **is** read by a test —
`src/components/ui/viglet-avatar.parity.test.tsx` renders the mascot in a real
browser and compares the pixels with it, which is the check that VDS100's three
defects went through a green pipeline for want of.

It is a reviewed image, not a generated one. It was written by that test and
then looked at beside `viglet-avatar-cms.jsx` — the palette per state, and the
180 facets of `IcosahedronGeometry(0.62, 2)` — before being committed.

**To change it deliberately**, delete it and run the parity project. The test
writes a new one from that run and fails, so the replacement has to be opened
and checked against the original before it is committed. Never update it to
make a red gate green: that is the failure mode this whole mechanism exists to
prevent.
