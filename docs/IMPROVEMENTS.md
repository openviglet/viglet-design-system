# Improvements

## Block A — The gate the design system never had

### §VDS77 The form library that is not a peer (VDS77)

`react-hook-form` sits in `dependencies`, while every other library this package shares
state through — `react`, `react-dom`, `react-i18next`, `react-router-dom`,
`next-themes`, `sonner`, `i18next` — is a peer. It is the exception, and it is the one
carrying a React context: `components/ui/form.tsx` re-exports `FormProvider`,
`useFormContext` and `useFormState` straight from it, so a second copy in a consumer's
tree resolves to a different context and `useFormContext` returns null where a form was
expected.

Nothing is broken today. Turing asks `^7.82.0`, dumont `^7.84.0`, this package
`^7.71.2`; the ranges overlap and pnpm dedupes to one copy. That is the arrangement
working by coincidence — the day a consumer pins exact, or either side crosses a major,
the install grows a second copy and a form silently stops seeing its provider. No build
error, no type error, and `check-duplicates` cannot see it because that gate weighs
source, not the tree.

The move was not simply "declare it a peer": cloud-frontend and cloud-console declared
none of their own and got it because this package brings it, so demoting it first would
have broken their install. **That half has landed.** Both now declare `^7.72.1`, the
version they already resolved, and `npm ls` reports one copy in each tree. Only this
side is left.

Acceptance:
- ~~cloud-frontend and cloud-console declare `react-hook-form` themselves.~~ done
- It is then a peerDependency and a devDependency here, not a dependency.
- A consumer resolving a different minor still gets exactly one copy.
