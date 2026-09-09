# The page reference

Eight artboards, one per decision that makes two products built from this package stop
looking like one. They are the composition half of the catalogue: a story proves a component
in isolation, and these prove the arrangement.

Read them beside [BENTO-AUTHORING.md](../BENTO-AUTHORING.md), which states the same rules in
prose. Where the two disagree, the contract is right and an artboard is stale.

## What is here

| Page       | Artboard                | The decision                                                              |
| ---------- | ----------------------- | ------------------------------------------------------------------------- |
| The shell  | `shell.dc.html`         | what the header carries, in what order, and what it is not                |
| The shell  | `reading-column.dc.html`| the shell sets the measure once, or every page repeats one and they differ |
| The shell  | `primary.dc.html`       | the four surfaces `--primary` reaches, unclaimed beside claimed           |
| The shapes | `list.dc.html`          | a list screen, and the discriminator between tiles and rows               |
| The shapes | `detail.dc.html`        | a detail screen, and the save-bar morph at both ends of the scroll        |
| The shapes | `form-hero.dc.html`     | a form with no entity behind it yet                                       |
| The shapes | `panel.dc.html`         | the frosted box with no heading, and why it has none                      |
| The shapes | `grounds.dc.html`       | the same components on both grounds, with the ratios                      |

`canvas.json` places them and names the two pages.

## Two rules about the content

**No product data.** Subjects are role labels — "Entity name", "Eyebrow", "Meta". A
reference carrying somebody's routes and entity names is a screenshot of their console, and
the package's non-goals forbid it for the same reason they forbid a nav array.

**The values are the resolved tokens**, not an impression of them. Colour, type, radius,
the rail's width and the header's height come from `src/styles/preset.css`, so an artboard
is checkable against the preset. The accent shown is the one this package ships, because a
product's own is a re-key and `primary.dc.html` is where that is drawn.

## Editing them

Each `.dc.html` is one artboard: a standalone file whose root is a fixed-size element
matching the `w`/`h` this directory's `canvas.json` declares for it. Keep the two in step —
a root larger than its frame is clipped, not scaled.

These files are also vendored into consuming repositories, where they are refreshed from
here on every install. So an artboard is corrected in this directory and nowhere else: a
consumer that edits its copy loses the edit on the next run, the same way a forked component
loses it on the next upgrade.
