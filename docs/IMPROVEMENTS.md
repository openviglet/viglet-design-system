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

### §VDS95 The switcher's own name

`LanguageSwitcher` names its button `t("language.toggle", "Change language")`, and no
locale here ships a `language` namespace. VDS51 reads the namespace list off the
bundles, so it files `language.toggle` beside `llm.title` and `home.title` as a word the
product must supply, and passes.

That test's rule is right for those two: a component asking for the product's own noun.
It is wrong here. The switcher is this package's component naming itself, and nothing
about a product changes what the button does. roadkeep-gui found it from the consumer
side (its RG116) and ships `language.toggle` in its own bundle to stop the English;
every other product still reads "Change language" in Portuguese.

**The fix** ships `language.toggle` in `en` and `pt`, which moves `language` into the
owned namespaces VDS51 reads, so the test then holds both locales to it. A consumer that
already supplies the key keeps its own word once the merge is deep, which is why this
follows the merge line rather than preceding it.

### §VDS96 The word the boot loader says first

The boot loader is HTML the Vite plugin writes into `index.html`: it runs before any
bundle, so it cannot ask i18next for anything. Its status region is named
`aria-label="Loading ${title}"`, and the options take a title, a subtitle and colours
but no word for loading. A screen reader opening a Portuguese product hears English
first, before the app it is waiting for can say a word.

VDS93's gate reads JSX and never sees it: this is a template string in a `.ts` file.

**Two ways out, and the plugin should take both.** A `loadingLabel` option lets a
product that ships one language say it at build time. For one that ships several, the
inline script already runs before paint and can read `navigator.language`, so the plugin
can take a small per-language map and set the label from it, falling back to the option.
Either way the words come from the product's config and not from this file, and a test
over the emitted HTML asserts no English is left in it when a label is given.

### §VDS97 The name sonner gives the notice region

The package's `Toaster` wraps sonner and passes it no `containerAriaLabel`, so the
region every notice lands in keeps sonner's own default: `Notifications`, followed by
its hotkey, `alt+T`. A screen reader says it whenever that region is reached — English,
in every product, in every language.

VDS93's gate cannot see it and should not: there is no literal in this package's source.
The English is a dependency's default, and the omission is the defect. roadkeep-gui
found it from the consumer side when its pseudo-locale run began reading names (its
RG140), and fixed it there by passing a label out of its own catalogue. Every other
product still announces English.

**The fix is the package's own word as the default.** `Toaster` calls `useTranslation`
and passes `containerAriaLabel={t("common.notifications", { defaultValue:
"Notifications" })}` unless the caller passed one, with the key in both locales. The
hotkey sonner appends is a key name and stays as the platform spells it. A unit test
renders the `Toaster` under `pt` and reads the region's name.

The same question is worth one pass over the other wrapped primitives — a default a
dependency supplies in English is invisible to every gate that reads this package.

### §VDS98 English in a prop default

VDS93 claims no shipped component draws or announces a string outside the bundles, and
two still do through destructured prop defaults: `Stepper.Completion` (`readyLabel =
"Ready to submit"`, `pendingLabel = "Complete all steps above"`) and `AppSwitcher`
(`triggerTitle = "Apps"`, `closeLabel = "Close app switcher"`, used as `title` and
`aria-label`).

The literals gate cannot see them: it reads JSX text and spoken attributes, and
`rendered()` follows neither an identifier back to its parameter default nor a literal
wrapped in `as`, `satisfies` or `!`.

**The fix.** The defaults fall back through `t()` in the body (`common.apps` already
exists; new keys in both locales), and the gate flags a string default on a
spoken-looking parameter and unwraps the three type wrappers, with specimens for each.

Found by the adversarial review of VDS93, confirmed by both skeptics.

### §VDS99 The pairs the contrast gate skips

The adversarial review of VDS92 found the contrast gate weaker than its entry says.

- **Muted on the page** is measured as `ratio(muted ?? 0, ground ?? 1)`: an `--vg-background` that stops resolving to an `oklch()` literal is measured as white, and on the light ground the case passes having measured nothing — against the file's own rule that an unreadable value fails.
- **Foreground on background** is never measured: `pairs()` strips `-foreground` to find the surface, `--vg-foreground` maps to `--vg`, which does not exist, and the body-text pair is filtered out in both grounds.
- `docs/reference/grounds.dc.html` still draws light muted text at `#737373` and labels it 4.73:1, the value VDS92 replaced.

**The fix.** Not-null assertions before measuring, the ground pair added explicitly and
to the control assertion, and the canvas redrawn at `oklch(0.52 0 0)` with the ratio the
test computes.

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
