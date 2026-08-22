// Storybook 10 applies preview.tsx's decorators and parameters to the story-set
// project on its own, so a story is checked with the i18n provider, the router
// and the theme wrapper it is authored in — and `a11y: { test: "error" }` from
// preview.tsx applies here. The file is kept as the place per-run setup goes if
// this project ever needs any.
export {}
