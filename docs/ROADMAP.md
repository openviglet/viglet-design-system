# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS114** (deps: —) **GlassCard's color and colorDark props set custom properties its stylesheet never reads** — The accent story renders identically to the default, so a documented prop and the example proving it are both inert. → §VDS114
- 📋 **VDS115** (deps: —) **The icon picker's Iconify search runs to completion after the dialog's host unmounts** — Nothing cancels the request, so a route change mid-search still pays for a response nobody reads. → §VDS115
- 📋 **VDS116** (deps: —) **Eight standalone exported components appear in no story, so the axe pass never reaches them** — A published component with no story is absent from the catalogue and outside the only accessibility gate here. → §VDS116
- 📋 **VDS117** (deps: —) **The root entry re-exports the i18n runtime, so a consumer that never asked for it resolves i18next** — Three consumers take the root barrel and no i18n subpath, yet each carries the locale chunk and two peers. → §VDS117
- 📋 **VDS118** (deps: —) **The assets subpath has no size fixture, so the inline-asset cap never measures the entry shipping logos** — The cap was written after a 1.24MB logo reached a bundle, and that entry is the one it has never checked. → §VDS118
- 📋 **VDS119** (deps: —) **No tsc project type-checks the stories, and 49 errors sit in the catalogue with every gate green** — The stories run through Vite, which strips types instead of checking them, so a wrong prop ships unflagged. → §VDS119
- 📋 **VDS120** (deps: —) **The list of entries needing a use client banner is restated in the gate that checks it** — A new build entry added in one file only ships with no directive, and the check never looks at it. → §VDS120
- 📋 **VDS121** (deps: VDS77 ✅) **schools takes the root entry but declares no react-hook-form, which is now a required peer of it** — It pins an older release so nothing breaks today, and the bump that reaches the peer would install it by pnpm's auto-install rather than by declaration. → §VDS121
- 📋 **VDS122** (deps: —) **Two packages install this by caret range and are named in no consumer list, so no guard here reads them** — consumers.json calls itself the one place that set lives, and VDS73 widened it because a consumer nobody wrote down is invisible to every check. → §VDS122
- 📋 **VDS124** (deps: —) **Nothing in the lint config forbids dangerouslySetInnerHTML, so the next one ships with no gate** — VDS107 removed the only one, and a review caught it rather than a check; the prop takes a consumer's content straight to innerHTML and nothing here reads it. → §VDS124

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
