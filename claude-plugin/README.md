# viglet-ds — the Viglet Design System plugin for Claude Code

For a repository that installs `@viglet/viglet-design-system`. It gives an agent session
three things the npm package cannot:

- **The page contract as a skill.** `viglet-ds-pages` loads by name when a session builds or
  changes a bento page: the shell and who owns each region, the three page shapes, the panel,
  and the tokens a product claims. It updates when the plugin does, so no copy of it lives in
  your repository.
- **`/viglet-ds-check`.** Runs the package's own checks against the working tree: duplicates,
  the page lint, the vendored artboards and your entry in the package's register. It reports
  what fails and fixes nothing without asking.
- **A duplicate guard.** Before a component file is written, the hook runs the installed
  package's duplicate check on what the file would contain. A write that declares a name the
  package already exports is denied, with the import to use instead. A deliberate copy says
  why in the file: `// viglet-ds-allow-duplicate <Name> -- <reason>`.

## Install

```
/plugin marketplace add openviglet/viglet-design-system
/plugin install viglet-ds@viglet-design-system
```

To enable it for everyone working in a repository, commit it in `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "viglet-design-system": {
      "source": { "source": "github", "repo": "openviglet/viglet-design-system" }
    }
  },
  "enabledPlugins": { "viglet-ds@viglet-design-system": true }
}
```

## The artboards stay on disk

`viglet-ds-page-reference` still writes the artboards into your repository, where a person
opens them in a browser. It reads the setting above: with the plugin enabled it writes only
the artboards, and removes a skill it vendored before.

## Which package it supports

The plugin and the npm package release separately, so the plugin names the package range
it is written against in its `package.json`, under `supportedPackage`. The hook does nothing
against an installed version outside that range, and `/viglet-ds-check` says so before
running anything.
