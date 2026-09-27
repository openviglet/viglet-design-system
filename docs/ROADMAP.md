# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS176** (deps: —) **story tests render without Tailwind utilities, so axe checks contrast on unstyled text at the default size** — The stories project loads no tailwindcss plugin, so the a11y gate passes what the catalogue fails and no story can assert layout. → §VDS176
- 📋 **VDS177** (deps: —) **the README test reads a stale dist/exports.json, so listing a new component fails npm test until a build runs** — The gate order runs tests before the build, so every commit adding an export goes red on a README that is right. → §VDS177

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS173** (deps: —) **the contract has no two-pane page shape, so a form and its preview cannot be read side by side** — Two Shio pages want one, the editor's live preview and the translation workspace (SH1094), and a shape is the contract's decision. → §VDS173
- 📋 **VDS174** (deps: —) **BentoDataTable takes no selection in, so a page cannot select every row or invert the selection** — Its layout is controlled beside onLayoutChange but selection is not, so Shio removed select-all and invert from its table view (SH1148). → §VDS174
- 📋 **VDS175** (deps: —) **the plugin's MCP server cannot start where the package is installed in a workspace, not at the root** — npx --no-install at the project root answers E404 in Shio, Turing and Dumont, which install the package one level down (SH944). → §VDS175

## Done when — VDS176

- **Story tests render with the Tailwind utilities the catalogue has** A story's axe
  pass then measures the text a product author sees.

## Done when — VDS177

- **Adding and listing a component passes npm test before a build** A fixture checkout
  with a stale dist, or a surface read from source, shows the README test green.

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
