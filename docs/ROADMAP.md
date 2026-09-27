# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS176** (deps: —) **story tests render without Tailwind utilities, so axe checks contrast on unstyled text at the default size** — The stories project loads no tailwindcss plugin, so the a11y gate passes what the catalogue fails and no story can assert layout. → §VDS176

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS170** (deps: —) **no component marks an item in a list as created, changed or deleted, so each product draws its own letter and tint** — The list and the comparison it opens should agree on what a change looks like, and BentoDiff already owns those words and tints. → §VDS170
- 📋 **VDS171** (deps: —) **VigletAssistant cannot quiet its mascot, because it does not pass VigletAvatar's paused prop through** — Shio's per-curator quiet-mascot preference (SH971) has nowhere to go, and re-wrapping the dock is a copy the duplicate gate refuses. → §VDS171
- 📋 **VDS172** (deps: —) **no component draws a month or week calendar, so a scheduled-content page can only be a list** — Shio's Scheduled page wants month and week views with drag to reschedule (SH1082), and a grid built in a product is a copy. → §VDS172
- 📋 **VDS173** (deps: —) **the contract has no two-pane page shape, so a form and its preview cannot be read side by side** — Two Shio pages want one, the editor's live preview and the translation workspace (SH1094), and a shape is the contract's decision. → §VDS173
- 📋 **VDS174** (deps: —) **BentoDataTable takes no selection in, so a page cannot select every row or invert the selection** — Its layout is controlled beside onLayoutChange but selection is not, so Shio removed select-all and invert from its table view (SH1148). → §VDS174
- 📋 **VDS175** (deps: —) **the plugin's MCP server cannot start where the package is installed in a workspace, not at the root** — npx --no-install at the project root answers E404 in Shio, Turing and Dumont, which install the package one level down (SH944). → §VDS175

## Done when — VDS170

- **BentoDiff's field chip is BentoChangeMark** FieldRow renders the exported mark, so a
  list and the comparison it opens show one word and one tint for each state.
- **A compact mark says its word, not its letter** The letter's accessible name and
  tooltip are the full word in en and pt, and a locale that sets its own letter key
  draws that letter.

## Done when — VDS176

- **Story tests render with the Tailwind utilities the catalogue has** A story's axe
  pass then measures the text a product author sees.

## Non-goals

- **Do not fork a shared component inside a product** The one-line re-export shim is the
  pattern both consumers already use; a local copy that drifts is the failure this
  package exists to prevent, and VDS5 makes it fail a build.
- **Do not move a product's commercial chrome into the package** Activation, quota and
  no-LLM tiles are Turing's business model rendered as cards; shipping them here would
  make every product import one product's offer.
- **Do not redesign a bento component while moving it** A move whose diff also changes
  behaviour cannot be reviewed against the 118 pages that already depend on it;
  improvements land as their own lines afterwards.
- **No product data in the package** Routes, entity names and nav surfaces belong to the
  product; the package exports the palette and the schema, never the array, or a Shio
  console ends up offering Turing routes.
