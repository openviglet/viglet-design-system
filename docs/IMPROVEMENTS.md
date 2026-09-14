# Improvements

## Block A — The gate the design system never had

### §VDS121 The consumer whose declaration has to wait for its bump

VDS77 made `react-hook-form` a required peer, and six of the seven consumers declare it:
shio `^7.87.0`, turing `^7.82.0`, dumont `^7.86.0`, and cloud-frontend, cloud-console
and `@rk/ui` declared during that work. Schools is the one left.

Nothing is broken today, because schools pins `@viglet/viglet-design-system` to an exact
`2026.3.9` rather than a range, the newest release published. It never sees the peer
until somebody bumps it, and pnpm would then auto-install the missing peer rather than
fail — which is the same arrangement working by coincidence that VDS77 existed to
remove.

It was deliberately not declared during VDS77, and the reason is worth carrying. Schools
is adopting a check of its own — `src/dependencies.test.ts` — that fails any dependency
no file imports and that carries no documented reason, and it cross-checks each
documented peer against the *installed* manifest. Schools imports no form, so declaring
`react-hook-form` against the 2026.3.3 it installs would be a dependency nothing imports
and whose stated reason the check could not confirm, because that release still calls it
a dependency.

**So the declaration belongs in the same change as the version bump**, not before it.
Bump schools to the release carrying the peer, add `react-hook-form`, and add its entry
to that test's allowlist naming this package as the peer it is provided for — all three
together, so each one is true when it lands.

Until then schools is the consumer that does not declare it, and this line is what says
so rather than leaving it to be rediscovered.

### §VDS159 The children the adapter never reads

`AdaptiveSectionCard` reads its children once, looking for two things: a `Header` (or
`StaticHeader`) whose props become the frosted section's heading, and a `Content` whose
children become the fields. Everything else is discarded. A footer node, a second
`Content`, a conditional banner between the header and the fields — each renders
nothing, and nothing says so.

This was survivable while the console branch existed: a section the adapter could not
read fell through to `SectionCard`, which rendered every child it was given. VDS146
removed that branch. The header-less case now keeps its children on the frosted surface,
but the header-present case still drops every sibling that is not `Content` — so the gap
narrowed to one shape and lost its fallback at the same time.

It is the shape `BentoPanel`'s own test describes: a component that silently declines,
found by a browser probe reading computed style rather than by review or `tsc`. Neither
catches this one either. `children` is `ReactNode`, so any node type-checks, and a story
renders what its author remembered to write.

The adapter should render what it was given rather than only what it recognised: the
fields from `Content`, plus any sibling it did not claim, in source order inside the
same section. A `Header` or `StaticHeader` is the one child consumed rather than
rendered, since its props became the heading. What proves it is an assertion that an
unclaimed sibling survives — the assertion a test written only against the recognised
shape never makes.

### §VDS160 The family rule, and the component it hides

`check-readme` covers an export when a listed name is its own, or is one it continues on
a capital: `Accordion` covers `AccordionItem`, `Sidebar` covers twenty parts. Without
that the lists would name 196 exports rather than 78, and a compound's parts are not
what a product author chooses between.

But a prefix is not a family. `Button` covers a `ButtonGroup` nobody listed, `Input` an
`InputMask`, `Table` a `TableVirtual` — each a component an author would look for by
name, each admitted by the gate written to stop exactly that. `ModeToggleSidebar` was
already in that position: its own component rather than a part of `ModeToggle`, listed
today only because a person noticed it while the rule did not.

What makes a part a part is where it is declared. `CardHeader` lives in `card.tsx`
beside `Card`; a `ButtonGroup` worth listing would get a module of its own. So the rule
wants to be: a name is covered by a family head only when the two are declared in the
same source file. That answer already exists here — `scripts/exported-surface.test.ts`
maps every published name back to its declaring module — and is not being asked.

`dist/exports.json` carries no origin, which is why a prefix stood in for one. Either
that emit grows a field naming each value's declaring module, or the gate reads what
`exported-surface` builds from source. The first keeps `check-readme` a reader of one
generated artefact, which is what makes it cheap enough to run in the build.

### §VDS161 The six entries the inventory does not reach

`## What's Included` reads as the package's inventory, and `check-readme` holds it to
one entry of seven. `./bento` publishes more components than the root does, and the
README describes them in prose, with no list anything can check. The other five entries
have sections and no list either.

That is the shape VDS158 closed one level down: a heading that reads as the whole while
covering a part. An author who adds `./bento` to their imports has nowhere in the README
that answers what is in it, and a bento component added tomorrow is named in no place a
gate reads.

The prose is not the defect. A section explaining how `BentoShell`, `BentoHero` and the
rail compose a page is worth more than a list of names, and replacing it with one would
lose the half that teaches. What is missing is the list beside it — the inventory
`check-readme` can hold, the way the root entry now has one.

So: a list under the heading that already describes each entry shipping components, and
`check-readme` reading the other entries of `dist/exports.json` rather than only `.`.
Its `findings` takes the entry as an argument already, so that half is a loop.

Settle first which entries earn a list. `./bento` plainly does. `./assets` publishes
artwork, `./vite` a plugin and `./i18n` a runtime — none of them components an author
picks between — so the check belongs to the entries shipping a component vocabulary, not
to all seven.

## Block F — What a consuming CMS needs from the package next

### §VDS152 The deprecation ends

BentoActionsMenuItem.id shipped optional, with a warning outside production for an item
that has none, so a product that upgrades is told before it breaks. The deprecation only
means something if it ends: until the field is required, a new action without a name
type-checks, renders and escapes every census that reads data-action-id.

Once one release has carried the warning, make id required on BentoActionsMenuItem,
which BentoEntityShell's extraActions and the data table's row actions already pass
through, and delete warnWithoutId and its test. The change note in the ledger names the
release that warned. Before shipping, run viglet-ds-check-duplicates and a type-check in
each declared consumer's checkout, or read their source, and list any menu still built
without ids, so the breaking release is not the first they hear of it.

## Block G — The package knows one chrome
