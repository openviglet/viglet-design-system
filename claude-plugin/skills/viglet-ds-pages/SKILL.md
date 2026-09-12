---
name: viglet-ds-pages
description: Building or changing a page with @viglet/viglet-design-system/bento -- the shell, the three page shapes, the panel, and which tokens a product claims. Use when writing a screen, adding a region to one, or choosing between two components of the bento layer, and before the first screen rather than after the fifth.
---

# Pages in the Viglet design system

This skill arrives with the `viglet-ds` plugin, so it updates when the plugin does and no
copy of it lives in this repository. The plugin is written against the package range in its
`package.json` (`supportedPackage`); on a release outside it, the contract below may describe
components the installed package does not have.

## Read first

- **[authoring.md](authoring.md)** -- the contract. The shell and who owns each region, the
  three page shapes, the panel, colour and the tokens a product claims, i18n, accessibility,
  responsive, tests.
- **[boundary.md](boundary.md)** -- which components are the shared layer and which stay in a
  product, and why.

## And look at

The artboards: the contract drawn, every region of a page with an ownership key, the reading
column, what `--primary` reaches, the page shapes, the panel, and both grounds with their
ratios. `viglet-ds-page-reference` writes them into this repository (`docs/design/vds-*.dc.html`
unless it was given `--canvas-dir`). With this plugin enabled it writes the artboards and
leaves the skill to the plugin. An artboard opens in a browser straight from the file tree.

## Two rules that are easy to get wrong

- A page sets no max width, no gutters and no vertical rhythm. `BentoShell` sets them once.
- A product claims `--primary` through the four `--vg-primary-*-base` inputs at `:root`,
  never by setting `--vg-primary` itself, which would key the dark ground to the light value.

`viglet-ds-page-lint <dir>` fails on either one, naming the file and line.

## Before writing a component

Check that the package does not already export it. The plugin denies a write that declares a
name the package exports and names the import to use instead. A deliberate copy says why in
the file: `// viglet-ds-allow-duplicate <Name> -- <reason>`.

## Checking

`/viglet-ds-check` runs the package's own checks against this repository and reports what
fails.
