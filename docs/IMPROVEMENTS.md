# Improvements

## Block A — The gate the design system never had

### §VDS5 Say what is exported, so a duplicate can fail a build

Nothing in this package declares its own export surface in a form a script can read.
Today the two consumers happen to be honest: all 24 of Shio's components/ui files and 39
of Turing's 59 are one-line re-export shims, and the rest are genuinely
product-specific. That is a good state reached by discipline, and discipline is not an
instrument. The moment a product needs a small variation, the fastest path is a local
copy, and nothing anywhere fails. Emit the export list as a build artefact and ship a
lint that a consumer runs in its own CI: for each locally declared component, if this
package exports that name, fail and name the import that replaces it. Land it before
Block B rather than after, because the instrument is what finds the call site nobody
read.

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

### §VDS76 What SubPage would need to absorb Turing's

Turing still declares SubPage and InternalSidebar locally, and its T1008 cannot shim
them because this package's copies are each narrower in a specific way. All four
differences were read off a diff rather than inferred.

Three are additive and safe, each defaulting to today's behaviour:

- SubPage drops outletContext. Turing passes a form instance through
  Outlet context so the LLM editor's section sub-pages share one useForm; there
  is no other way for a routed child to reach it.
- NavMainItem requires url. Turing deliberately allows none: an item with
  children and no url renders as a SidebarGroupLabel heading them, which is how
  it groups sub-pages without inventing a clickable parent.
- NavMainItem drops showOnNew, which keeps an item visible while an entity is
  being created. Its absence falls back to a url === "/detail" heuristic.

The fourth is a decision, not an addition. The two paddings differ -- this copy pads
px-1 md:px-6 lg:px-8 py-1 md:py-4 where Turing's pads none -- so a product adopting this
component sees its console pages reflow. Either the padding becomes a prop with Turing's
values as one option, or the difference is accepted and stated, but it should not arrive
as a surprise inside a shim.

Worth doing after VDS25's digest is reachable from that product, which is what would
show the reflow rather than describe it.

### §VDS77 The form library that is not a peer (VDS77)

`react-hook-form` sits in `dependencies`, while every other library this package shares
state through — `react`, `react-dom`, `react-i18next`, `react-router-dom`,
`next-themes`, `sonner`, `i18next` — is a peer. It is the exception, and it is the one
that carries a React context: `useFormContext` reads it, so a second copy in a
consumer's tree resolves to a different context and returns null where a form was
expected.

Nothing is broken today. Turing asks for `^7.82.0` and this package for `^7.71.2`, the
ranges overlap, and pnpm dedupes to one copy. That is the arrangement working by
coincidence: the day a consumer pins an exact version, or either side crosses a major,
the install grows a second copy and the failure is a form that silently stops seeing its
own provider — no build error, no type error, no duplicate-export report from the
`check-duplicates` gate, which weighs source and not the tree.

The move is the one already made for the other seven: declare it a peer, keep it a
devDependency so the package still builds and tests itself, and let the consumer own the
version. That is also the smaller surface — a design system that pins a form library for
its consumers is deciding something that is not its to decide.

Acceptance:
- `react-hook-form` is a peerDependency and a devDependency, not a dependency.
- A consumer resolving a different minor still gets exactly one copy.
