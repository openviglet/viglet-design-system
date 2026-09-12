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

### §VDS122 Two more consumers nobody wrote down

`consumers.json` says of itself that it is the one place the consumer set lives, and
that prose naming a subset as though it were the whole is a test failure rather than a
style note. VDS73 widened it from three to seven for exactly that reason: cloud-frontend
was a Vite SPA nobody had written down, and being outside the products root that
`use:local` walks is what kept it invisible.

Two more are invisible the same way. `openviglet-website` and `viglet-docs` both declare
`@viglet/viglet-design-system` at `^2026.3.2` — a caret range, where every listed
consumer except `@rk/ui` pins exact — so both receive each release the moment they
install, and neither appears in `consumers.json`, in the README's count of applications,
or in any guard that reads the file.

They are not equivalent, and the answer is probably not the same for both. `viglet-docs`
imports one subpath, `./floating-formulas-bg`, for a decorative background.
`openviglet-website` imports nothing from the package at all in its own source, which
either means the dependency is unused or that the import is somewhere this did not look.

What to settle: whether each is a consumer this package holds itself to. If it is, it
belongs in `consumers.json` with its framework, chrome, accent and entries, and the
README's count moves with it. If it is not — a site taking one decorative entry may
genuinely not be — then say so where the next person looks, because the absence
currently reads as an oversight and cannot be told apart from one.

### §VDS124 The prop that has to stay at zero

`dangerouslySetInnerHTML` is the one React prop that turns a string into markup, and
this package renders strings it did not author: `DialogDelete` passes `usage.name`, an
entity name out of the consumer's own content. VDS107 is what that combination costs — a
delete dialog that ran a name carrying an `onerror` attribute, in three products at
once.

That one is gone, and the package now has none. What it does not have is anything that
keeps the count at zero. The prop reached `main` with no `eslint-disable`, no comment
and no test, so nothing refused it and nothing asked; it was found by reading the file.
The next one arrives the same way.

`eslint.config.js` is where the refusal belongs, and it needs no new plugin —
`eslint-plugin-react` is not installed here and the rule it would bring
(`react/no-danger`) is one `no-restricted-syntax` selector on a JSX attribute name. The
message is the argument, not the ban: the prop is allowed where a human wrote down why,
which is what an `eslint-disable-next-line` with a reason already is.

Scope it to `src/`. The scripts under `scripts/` render nothing, and a story is source
like any other file here.

Acceptance:
- A `dangerouslySetInnerHTML` anywhere under `src/` fails `npm run lint`.
- The failure names what to do instead, not just the rule.
- An author who means it can still write one, with a disable line that states why.

### §VDS126 The attribute the handle still asks for

`ResizableHandle` rotates its grip with
`[&[data-panel-group-direction=vertical]>div]:rotate-90`. Every other orientation rule
on the same class list reads `data-[panel-group-orientation=vertical]`, which is the
attribute react-resizable-panels 4 writes. `direction` is what version 3 wrote.

So in a vertical group the handle is the right shape — one pixel tall, full width,
because those rules use the current attribute — and the grip inside it is still upright,
pointing the way a horizontal handle drags. It is the one part of the component that
says which way this thing moves, and it says the wrong thing.

Nobody met it because nothing rendered a vertical group. The catalogue's own `Vertical`
story passed `direction="vertical"` — the same renamed prop, one layer up — so it
rendered horizontally, and VDS119 is what made it vertical and made this visible.

`withHandle` is what draws the grip, so a consumer only sees it when it asked for one.
Turing's editor is the caller that does.

Acceptance:
- The grip rotates in a vertical group.
- No selector in `resizable.tsx` names an attribute this version of the library
  does not write.
