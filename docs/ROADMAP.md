# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS165** (deps: —) **the chrome census counts nothing for a console-era name imported under an alias** — Turing imported SubPage as SharedSubPage, the census read zero on the reading VDS147 removed it on, and Turing's build broke on 2026.3.11. → §VDS165
- 📋 **VDS166** (deps: —) **the census test walks nine checkouts under a five-second default and timed out once on a cold disk** — Every assertion held and the next two runs passed, so the census gate reads as flaky while it is only slow. → §VDS166

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS168** (deps: —) **BentoDiff compares a source file word by word with no line numbers, and past its ceiling draws it as a rewrite** — An agent's change under review is most often a file, which every review tool reads by line, and VDS140 promised one comparison for every place. → §VDS168
- 📋 **VDS169** (deps: VDS168) **a lines comparison draws one column, so a file cannot be read before and after side by side as VS Code shows it** — A reviewer at a wide screen reads the original beside the change, and aligning the two is the part a product would get wrong alone. → §VDS169
- 📋 **VDS170** (deps: —) **no component marks an item in a list as created, changed or deleted, so each product draws its own letter and tint** — The list and the comparison it opens should agree on what a change looks like, and BentoDiff already owns those words and tints. → §VDS170
- 📋 **VDS171** (deps: —) **VigletAssistant cannot quiet its mascot, because it does not pass VigletAvatar's paused prop through** — Shio's per-curator quiet-mascot preference (SH971) has nowhere to go, and re-wrapping the dock is a copy the duplicate gate refuses. → §VDS171
- 📋 **VDS172** (deps: —) **no component draws a month or week calendar, so a scheduled-content page can only be a list** — Shio's Scheduled page wants month and week views with drag to reschedule (SH1082), and a grid built in a product is a copy. → §VDS172
- 📋 **VDS173** (deps: —) **the contract has no two-pane page shape, so a form and its preview cannot be read side by side** — Two Shio pages want one, the editor's live preview and the translation workspace (SH1094), and a shape is the contract's decision. → §VDS173
- 📋 **VDS174** (deps: —) **BentoDataTable takes no selection in, so a page cannot select every row or invert the selection** — Its layout is controlled beside onLayoutChange but selection is not, so Shio removed select-all and invert from its table view (SH1148). → §VDS174
- 📋 **VDS175** (deps: —) **the plugin's MCP server cannot start where the package is installed in a workspace, not at the root** — npx --no-install at the project root answers E404 in Shio, Turing and Dumont, which install the package one level down (SH944). → §VDS175

## Done when — VDS165

- **A console-era name imported under an alias counts as taken** A fixture holding only
  an aliased import measures one file, not zero, and the shim-follow case still counts
  its pages.

## Done when — VDS166

- **The register census case is sized for the loaded suite** Its timeout carries a
  comment giving the measured cold and warm walk, and the case passes beside the other
  script tests on a cold disk.

## Done when — VDS168

- **One edit in a long file draws one numbered hunk, not a rewrite** A 5,000-line file
  with one line changed draws that pair word by word, both numbers beside it, three
  lines around it and the rest folded; past the ceiling the field says it did not
  compare.
- **A created or deleted file draws whole, numbered on its one side** A null before
  draws every line added under the created sentence and a null after every line removed
  under the deleted one, each marked in text as well as tinted.

## Done when — VDS169

- **Split keeps the unchanged lines level on both sides** A hunk that removes two lines
  and adds five draws five rows with the left padded, and the next unchanged line sits
  on one row in both columns, each with its own number.
- **Split under the container width draws as inline** A BentoDiff in a narrow container
  asked for split draws the same rows inline, measured on the container and not the
  window.

## Done when — VDS170

- **BentoDiff's field chip is BentoChangeMark** FieldRow renders the exported mark, so a
  list and the comparison it opens show one word and one tint for each state.
- **A compact mark says its word, not its letter** The letter's accessible name and
  tooltip are the full word in en and pt, and a locale that sets its own letter key
  draws that letter.

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
