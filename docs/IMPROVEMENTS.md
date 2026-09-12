# Improvements

## Block A — The gate the design system never had

### §VDS77 The form library that is not a peer (VDS77)

`react-hook-form` sits in `dependencies`, while every other library this package shares
state through — `react`, `react-dom`, `react-i18next`, `react-router-dom`,
`next-themes`, `sonner`, `i18next` — is a peer. It is the exception, and it is the one
carrying a React context: `components/ui/form.tsx` re-exports `FormProvider`,
`useFormContext` and `useFormState` straight from it, so a second copy in a consumer's
tree resolves to a different context and `useFormContext` returns null where a form was
expected.

Nothing is broken today. Turing asks `^7.82.0`, dumont `^7.84.0`, this package
`^7.71.2`; the ranges overlap and pnpm dedupes to one copy. That is the arrangement
working by coincidence — the day a consumer pins exact, or either side crosses a major,
the install grows a second copy and a form silently stops seeing its provider. No build
error, no type error, and `check-duplicates` cannot see it because that gate weighs
source, not the tree.

The move is not simply "declare it a peer". Two of the six consumers — cloud-frontend
and cloud-console — declare no `react-hook-form` at all and get it because this package
brings it. Making it a peer without them is how a packaging fix becomes their broken
install, so the order is theirs first, then here.

Acceptance:
- cloud-frontend and cloud-console declare `react-hook-form` themselves.
- It is then a peerDependency and a devDependency here, not a dependency.
- A consumer resolving a different minor still gets exactly one copy.

## Block E — The assistant every product shares

### §VDS106 A budget the sparks are too small for

VDS103 put an image on the other side of the mascot and scored the whole frame: the
fraction of pixels differing from `docs/design/viglet-avatar-idle.png` by more than a
channel tolerance, against a 2% budget. Putting each of VDS100's three defects back
gives 16.9% for the display-encoded palette and 6.7% for the 320-facet ball — and, for
the embers drawn over the core instead of behind it, a figure under the budget. The gate
does not catch it.

The budget is not the thing to lower. The reference is written on one machine and read
on whichever runs CI, and the mascot is a lattice of hairline seams over a sphere, so
most of its pixels are antialiased edges where two rasterisers legitimately disagree. 2%
is what buys that headroom.

What is wrong is the denominator. Thirty-four sparks a pixel across are a fraction of a
percent of a 128-square frame and several percent of the disc the sphere occupies, which
is where they wrongly appear. So score by region: the disc of the core, and the annulus
outside it where the halo, the orbit and the embers live, each with its own budget. The
geometry is already in the component — `unit` is the sphere radius and the centre is the
frame's — so the regions are derived rather than measured off the picture.

On ship: re-measure the three defects and correct the figures in the test's header
comment, which states them.
