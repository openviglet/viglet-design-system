---
description: Run the Viglet Design System's own checks against this repository and report what fails
argument-hint: "[source directory]"
---

Run the checks `@viglet/viglet-design-system` ships against this repository$ARGUMENTS, and
report what is actually true. Run each from the package root of the product that installs
it, through the product's own package manager (`pnpm exec`, `npx`, `yarn`).

1. **The version.** Read the installed version from
   `node_modules/@viglet/viglet-design-system/dist/exports.json` (its `version` field) and
   compare it with the range this plugin supports, the `supportedPackage` entry in the
   plugin's `package.json`. Outside the range, say so first: the checks below may not exist
   in that release, or may disagree with this plugin's skill.
2. `viglet-ds-check-duplicates <src>`: a component the product declares that the package
   already exports. Each finding names the import that replaces it.
3. `viglet-ds-page-lint <dirs>`: a page that sets its own column, and a stylesheet that sets
   `--vg-primary` directly. Point it only at directories whose pages render inside
   `BentoShell`. A product still on console chrome is not held to it.
4. `viglet-ds-page-reference --check`: whether the vendored artboards are current.
5. `viglet-ds-consumer-entries`: whether this product's entry in the package's register
   matches what its source imports. A failure here is fixed in the design system
   repository, not in this one.

Use `--json` where you need to count or group findings. Finish with a short report that
separates **failing** (a check exited non-zero, with the findings), **passing**, and
**not run** (and why). Do not fix anything without asking.
