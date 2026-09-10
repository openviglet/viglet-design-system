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
