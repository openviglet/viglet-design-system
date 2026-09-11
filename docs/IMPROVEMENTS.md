# Improvements

## Block A — The gate the design system never had

### §VDS75 The rule that stayed behind

VDS20 brought the bento authoring contract here and Turing's T999 reduced its copy to a
pointer plus what is genuinely about that product's routes, privileges and entities. One
rule would not fit either side of that line and is still sitting in Turing's file,
marked as owed here.

A back-link eyebrow leads with a left arrow, so it reads as the way back to the list
rather than as a label. BentoEntityShell already does it -- it wraps the eyebrow in a
Link to listRoute and puts the arrow in -- so a caller passes just the label. The rule
matters for the other case: a page hand-rolling a BentoHero whose eyebrow is a back-link
has to include the arrow itself, at 14px and aria-hidden, inside an inline-flex
items-center gap-1 Link. And it must not be added to an eyebrow that navigates nowhere,
where an arrow promises a destination.

That is a statement about two components in this package and about how a caller composes
the second one, which is what the contract here is for. It stayed behind only because
nobody moved it. Bringing it over closes the last thing Turing's file says this contract
does not state, and lets that file's section 6 be deleted rather than maintained.

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

### §VDS94 The package's strings merged a namespace at a time

Both ways into i18next merge the package's strings one namespace at a time, whole.

- `initVigI18n(app)` spreads `{ ...ours, ...theirs }` per language, so a product that ships
  its own `common` replaces the package's `common` outright.
- `registerVigTranslations(i18n)` adds a namespace only where the host has none, so a host
  with a `common` of its own gets none of the package's.

Either way every key the package asks for under that namespace falls back to its English
`defaultValue`, and VDS51 and VDS93 cannot see it: they read the package's bundles,
which are complete. The consoles grew their own `common` before this package existed, so
the namespaces most likely to collide are exactly the ones VDS93 just added to.

**The fix is a deep merge with the product winning.** `initVigI18n` merges leaf by leaf,
the product's leaf over the package's; `registerVigTranslations` calls
`addResourceBundle` with `deep` on and `overwrite` off, so a host key is never replaced
and a missing one is filled. A test hands each entry a product bundle that owns
`common.save` and asserts both that its value wins and that `common.next` still resolves
to the package's word.

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

## Block E — The assistant every product shares

### §VDS100 The mascot, drawn rather than imported

The mascot is a brand asset, and a brand asset with no component is one each product
draws again — the failure the non-goals already forbid. The login backdrop lives on
`./floating-formulas-bg` for that reason, and three consumers render it from there
rather than from a copy.

The mockup builds the mascot in three.js, which cannot come from the root entry: three
is around 170 KB gzipped against a whole root budget of 86 KB. Moving it to its own
subpath behind an optional peer would leave the mascot absent from any product that had
not opted in, and its first job is notification feedback — a signal every product gets
by default or gets from nobody.

So the geometry is drawn rather than imported. The shape is an icosahedron subdivided
twice: 320 triangles, flat-shaded, which is the faceted look the mockup gets from
non-indexed normals. At the 104-130 px the dock renders it at, a 2D canvas compositing
radial gradients for the halo, the glass limb and the embers is the same picture, for
about 6 KB and no dependency.

Five states carry the vocabulary — idle, working, success, error, attention — because
those are the outcomes a console already reports through `toast`. They are named for the
toast kinds and not for the mascot's moods, so that the line which later drives one from
the other has nothing to translate.

### §VDS101 The dock, and the backend it must not know

The avatar is a picture. The dock is the surface a person uses, and the mockup carries
three things around the mascot that are not the mascot: a caption that types the
system's last sentence beside the collapsed orb, a transcript, and a composer.

Two of those three are optional, which is why they are one component and not four. A
product that wants only notification feedback mounts the dock and gets a status light
with a caption; a product with an assistant endpoint passes `onSend` and gets the panel.
Chat off is not a disabled button — the composer is not rendered at all, and the orb
stops being a control.

What the package must not hold is the backend. The mockup posts to `api.anthropic.com`
from the browser with a model id inline; shipping that shape from here would put one
product's endpoint, and in time a key, inside a package six products install. So the
dock takes `messages`, `busy` and `onSend` and knows nothing else — the controlled shape
the rest of this package already uses.

The caption is the part that needs care rather than code. It is the only place the
system speaks unprompted, so it is an `aria-live` region, it types nothing when the
reader asked for less motion, and every word it frames comes from the bundles. VDS93
gates that last one; the state names and the two button labels are what it will read
here.

### §VDS102 Read the toasts, do not wrap them

VDS100 gives the avatar a state prop, and a state prop is something a caller has to
remember. Every consumer already reports its outcomes through this package's `Toaster` —
that is the one channel they all share. If the mascot needs a second call beside each
`toast.success`, it will get one in the places somebody remembered and nowhere else, and
the mascot will sit at idle while a red rectangle slides past it. The bug would not look
like a bug; it would look like a mascot that does not react.

So the state is read from the toasts rather than set beside them. sonner exports
`useSonner()`, which returns the live toast list, and its `type` field already carries
the vocabulary VDS100 was named for: `loading` is working, `success` is success, `error`
is error, `warning` and `info` are attention, and an empty list is idle. Nothing wraps
`toast`, so a product calling sonner directly — or calling it from a module that never
imported this hook — still moves the mascot.

Two things fall out of reading rather than wrapping. A toast that outlives its own
dismissal cannot strand the avatar, because the list is the truth and an empty list is
idle. And the caption has a source: the toast's title is the sentence the collapsed orb
types, so a product that already writes good toast copy gets the mascot's voice for free
and translates it once.
