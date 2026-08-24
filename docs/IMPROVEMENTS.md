# Improvements

## Block A — The gate the design system never had

### §VDS74 The shim skip is keyed on shape, not on names

The skip exists for a good reason: a one-line re-export is the sanctioned way to keep a
path stable while an implementation moves, and reporting it as a duplicate would make
the gate fight its own migration. But it is written as two shape tests -- the file
imports from this package, and the file contains an export brace -- and a file
satisfying both is skipped whole.

Turing's components/ui/section-card.tsx satisfied both while declaring SectionCard, a
name this package exports, and wrapping ours under it. It was a deliberate wrapper
rather than a fork, so nothing was wrong with that code; what is wrong is that the gate
could not have told the difference. Any real local copy sitting beside a stray re-export
gets the same pass, which is the case the gate exists to catch.

The narrower rule is to skip a name, not a file: a name appearing in an export-from
clause is re-exported and exempt, while a name the file declares is reported whatever
else that file also does. The script already collects those two sets separately, so the
change is in which one the skip consults rather than in how either is read.

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
