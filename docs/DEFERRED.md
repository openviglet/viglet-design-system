# Set aside

## Block A — The gate the design system never had

- ⏸ **VDS121** (deps: VDS77 ✅) **schools takes the root entry but declares no react-hook-form, which is now a required peer of it** — set aside (a release carrying the peer, then one change in the schools repository): It pins a release that predates the peer, so nothing breaks yet. → §VDS121
- ⏸ **VDS128** (deps: —) **GitHub Pages was never enabled, so the catalogue deploys nowhere and the README's link 404s** — set aside (a repository admin turning Pages on, which its token may not): The workflow builds it and is refused when it asks to create the site. → §VDS128
