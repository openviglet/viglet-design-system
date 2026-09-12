# Roadmap (active backlog)

## Block A — The gate the design system never had

- 🛠 **VDS77** (deps: —) **react-hook-form is a dependency, so a consumer can get a second copy of the one library here carrying a context** — Both consumers now declare it themselves, so the demotion here is the remaining half and no install grows a second copy. → §VDS77
- 📋 **VDS107** (deps: —) **BadgeColorful renders a consumer's entity name as raw HTML and splices it into a style selector** — Every product's delete dialog passes a name it did not author, so markup in an entity name runs as script. → §VDS107
- 📋 **VDS108** (deps: —) **Sidebar drops id, data attributes and className on mobile, where its props land on a node that renders nothing** — The desktop branch forwards the same props to a real div, so a test hook or a label works until the viewport narrows. → §VDS108
- 📋 **VDS109** (deps: —) **A bento dialog's inline translation fallback still names Turing, where the locale bundle no longer does** — The i18n gate reads the compiled bundles only, so the one string a host without the bundle sees is the one unchecked. → §VDS109
- 📋 **VDS110** (deps: —) **The bento nav rail asserts an icon and a label key its own type declares optional** — A hub section without an icon throws, and one without a label key gives an icon-only link no accessible name. → §VDS110
- 📋 **VDS111** (deps: —) **AdaptiveSectionCard drops className under bento chrome, the one switch it exists to hide** — A shared form styled through the wrapper loses that styling the moment a console renders it in the other chrome. → §VDS111
- 📋 **VDS112** (deps: —) **Three Popover parts, useSidebarOptional and SectionCard's variant type reach no published subpath** — The catalogue demonstrates parts a consumer cannot import, and the hook written for a remote host is unreachable. → §VDS112
- 📋 **VDS113** (deps: —) **BadgeLocale writes a literal undefined class, and three components splice className instead of merging it** — Every callsite omitting the optional prop ships the broken class, and an override cannot win a merge that never runs. → §VDS113
- 📋 **VDS114** (deps: —) **GlassCard's color and colorDark props set custom properties its stylesheet never reads** — The accent story renders identically to the default, so a documented prop and the example proving it are both inert. → §VDS114
- 📋 **VDS115** (deps: —) **The icon picker's Iconify search runs to completion after the dialog's host unmounts** — Nothing cancels the request, so a route change mid-search still pays for a response nobody reads. → §VDS115
- 📋 **VDS116** (deps: —) **Eight standalone exported components appear in no story, so the axe pass never reaches them** — A published component with no story is absent from the catalogue and outside the only accessibility gate here. → §VDS116
- 📋 **VDS117** (deps: —) **The root entry re-exports the i18n runtime, so a consumer that never asked for it resolves i18next** — Three consumers take the root barrel and no i18n subpath, yet each carries the locale chunk and two peers. → §VDS117
- 📋 **VDS118** (deps: —) **The assets subpath has no size fixture, so the inline-asset cap never measures the entry shipping logos** — The cap was written after a 1.24MB logo reached a bundle, and that entry is the one it has never checked. → §VDS118
- 📋 **VDS119** (deps: —) **No tsc project type-checks the stories, and 49 errors sit in the catalogue with every gate green** — The stories run through Vite, which strips types instead of checking them, so a wrong prop ships unflagged. → §VDS119
- 📋 **VDS120** (deps: —) **The list of entries needing a use client banner is restated in the gate that checks it** — A new build entry added in one file only ships with no directive, and the check never looks at it. → §VDS120

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
- **Do not make bento the only chrome this package knows** Shio migrates behind a
  parallel route and will render both chromes for the length of that migration, so a
  shared form must be able to say which one it is in.
- **Do not remove the console-era exports before every console cuts over** PageHeader,
  SubPage, GridList and InternalSidebar still render live screens in all three; VDS24
  deprecates them, and removal is a separate decision with its own line.
