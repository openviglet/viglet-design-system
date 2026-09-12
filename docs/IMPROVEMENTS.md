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

### §VDS104 The language list, not just the key list

`initVigI18n` builds its resources by walking `["en", "pt"]`, the two languages this
package ships. A product's bundle is only read at those keys, so a product that passes
`es` or `fr` gets an i18next initialised without it: not a missing translation, but a
language that does not exist in the instance the call returns.

The loop is the whole of it. Nothing rejects the argument, nothing warns, and the
function returns normally — the product's own screens then read their fallback language,
which is the same silent failure VDS94 fixed one level down. VDS94 made the merge per
key rather than per namespace; this is the same shape one level up, per language rather
than per key.

`registerVigTranslations` does not have the problem: it adds bundles to a host instance
the product already initialised with its own languages. Only the door that owns the
`init` call can lose one.

**The fix is the union.** Walk the languages either side declares, and merge as VDS94
already merges: a language only one side has arrives whole, and one both have merges
leaf by leaf with the product winning. `fallbackLng` stays `en`, the one language the
package can promise is complete.

A test passes a bundle in a third language and asserts both that its keys resolve and
that the package's `en` is still there to fall back to.

### §VDS105 The name Radix gives the nav landmark

The pass VDS97 asked for, over the primitives this package wraps, found one more of the
same shape.

`@radix-ui/react-navigation-menu` renders its root as a `nav` carrying a hardcoded
`aria-label="Main"`. `NavigationMenu` here passes none, so the landmark is announced as
"Main" in every product and every language — English a dependency wrote, exactly as
sonner's `Notifications` was.

Nothing else in the wrapped set does it. vaul, react-resizable-panels and the Radix
dialog and select primitives were read the same way and supply no spoken default of
their own: they either require the name or leave the element unnamed. That is worth
recording, because the absence is what makes this a short list rather than a sweep
somebody has to repeat.

Two things make this one different from VDS97, and they argue for a different answer. A
navigation landmark's name is what distinguishes it from the other landmarks on the
page, so the useful word is the product's — "Main" is only wrong, not untranslated, when
a page has a second nav. And `NavigationMenu` spreads `props` onto the root, so a
product can already pass `aria-label` today; what it cannot do is discover that it has
to.

**So the fix is a default plus a gate rather than a default alone.** Name it from
`common.mainNavigation` unless the caller passed one, the way the Toaster now does, and
extend the VDS93 literals gate so a spoken attribute this package *omits* on a wrapped
primitive is reported — which is the half no gate holds.

## Block E — The assistant every product shares

### §VDS103 A gate with a picture on both sides

VDS100 shipped a mascot that was the wrong colour and carried 320 facets where the
design has 180, with every gate green: types, lint, 1029 tests, the size budget, and axe
over the story in a real browser. Nothing in the suite looks at the picture, so nothing
could have failed.

Three defects went through, and each was invisible to a check that reads source rather
than pixels:

- the palette reached the tone curve without the sRGB-to-linear round trip, so
  every lit facet drifted toward cream;
- `IcosahedronGeometry(r, 2)` was read as two subdivision passes; three's
  `detail` cuts each edge into `detail + 1`, which is 180 triangles, not 320;
- the embers drew over the core rather than behind it.

A person holding a screenshot beside the reference found all three.

The machinery for the check mostly exists: there is already a browser project that
renders every story, and a parity digest that reads computed styles. What has never
existed is an image on the other side of the comparison, and `docs/design/` now holds
the original this was derived from.

One thing has to change in the component before any of this can be a gate. The embers
seed themselves from `Math.random`, so no two frames agree and a pixel comparison would
be flake by construction — the avatar needs the treatment VDS54 gave the formulas
backdrop, where the arrangement is derived and a caller that wants novelty passes a
seed.
