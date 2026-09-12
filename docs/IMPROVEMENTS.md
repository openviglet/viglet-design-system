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

### §VDS128 The site the workflow cannot create

`pages.yml` builds the catalogue and hands it to `actions/configure-pages`, which asks
GitHub for the site and is told `Not Found`. It then tries to create one, with
`enablement: true`, and is refused: `Resource not accessible by integration`. The
workflow's `GITHUB_TOKEN` cannot create a Pages site; only a repository admin can turn
it on.

So the deploy has nowhere to go. `https://openviglet.github.io/viglet-design-system/`
returns 404 today, and the README points a product author at it from its second
paragraph.

VDS127 fixed the half of this that was code: the build itself raised `ENOENT` and never
reached this step, which is what hid it. The catalogue now builds in CI and fails one
step later, on a setting.

This is VDS4's claim unmet rather than a new idea. That line said the catalogue is
"published nowhere a product author can open", and shipped the workflow that would
publish it — the workflow is right and the site was never created.

**What it waits for**: Settings → Pages → Source: *GitHub Actions*, on
`openviglet/viglet-design-system`. One setting, by someone with admin. The next push to
`2026.3` then deploys, and `configure-pages` stops trying to create what already exists.

Acceptance:
- `https://openviglet.github.io/viglet-design-system/` serves the catalogue.
- The Pages workflow completes both jobs, build and deploy.
