---
name: viglet-ds-pages
description: Building or changing a page with @viglet/viglet-design-system/bento -- the shell, the three page shapes, the panel, and which tokens a product claims. Use when writing a screen, adding a region to one, or choosing between two components of the package, and before the first screen rather than after the fifth.
---

# Pages in the Viglet design system

The contract and the catalogue come from the `viglet-ds` MCP server, which reads the
package this repository has installed, so what it says matches that release.

- **Which component does a job**: `find_component` with the job in plain words. Then
  `read_component` for the one you pick: what it is for, its props, the contract sections
  that govern it, and an import to start from. Do this before writing a component.
- **The contract**: read the resource `viglet-ds://authoring` before the first screen (the
  shell and who owns each region, the page shapes, colour, i18n, accessibility), and
  `viglet-ds://boundary` for what the shared layer holds and what stays in a product.
- **Tokens**: `viglet-ds://tokens`.

## Two rules that are easy to get wrong

- A page sets no max width, no gutters and no vertical rhythm. `BentoShell` sets them once.
- A product claims `--primary` through the four `--vg-primary-*-base` inputs at `:root`,
  never by setting `--vg-primary` itself, which would key the dark ground to the light value.

`viglet-ds-page-lint <dir>` fails on either one. `/viglet-ds-check` runs every check the
package ships. A write that declares a name the package exports is denied, with the import
to use instead.

If the server does not answer, the installed package predates it or is outside the range in
the plugin's `package.json` (`supportedPackage`). The same documents are in
`node_modules/@viglet/viglet-design-system/docs/`.
