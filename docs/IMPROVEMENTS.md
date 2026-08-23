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
