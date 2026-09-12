# viglet-ds — the Viglet Design System plugin for Claude Code

For a repository that installs `@viglet/viglet-design-system`. It gives an agent session
four things the npm package alone does not:

- **A catalogue it can ask.** The `viglet-ds` MCP server answers `find_component` (which
  components do a job) and `read_component` (one component's purpose, props, the contract
  sections that govern it, and an import to start from). The page contract, the boundary and
  the token reference are resources it reads when it needs them. The server runs from the
  package your repository installed, so its answers match that release.
- **A skill that points at it.** `viglet-ds-pages` loads by name when a session builds or
  changes a page, and sends it to the catalogue and the contract instead of carrying a copy.
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

The server is started with `npx --no-install viglet-ds-mcp`, so it needs the package
installed in the repository and never downloads one.

## The artboards stay on disk

`viglet-ds-page-reference` still writes the artboards into your repository, where a person
opens them in a browser. It reads the setting above: with the plugin enabled it writes only
the artboards, and removes a skill it vendored before.

## Which package it supports

The plugin and the npm package release separately, so the plugin names the package range
it is written against in its `package.json`, under `supportedPackage`. The hook does nothing
against an installed version outside that range, and `/viglet-ds-check` says so before
running anything.
