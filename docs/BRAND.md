# How a product on this package writes, and what it shows

The rest of the documentation says what a component accepts and which token a product
claims. This page says how the words read and what goes on screen. It writes down what
the package already does: each rule below is how the shipped strings and components behave,
not a voice invented for this page.

It has two parts. **Part one binds every page built on the package**, because the package
already decides it: the components draw these words and colours whether you follow the
page or not. **Part two is the Viglet family's own**: Turing, Shio, Dumont and the Viglet
sites. A site that only borrows the package (a Roadkeep, Winwright or Polyweave page)
takes part one and keeps its own voice and imagery.

Each rule has one example to follow (✓) and one to avoid (✗).

## Part one: every page on the package

### Casing

Sentence case for everything a reader reads as a label: titles, headings, buttons, menu
items, tabs, table headers, dialog titles, toasts. Capitalise the first word and proper
nouns only. Product names keep their own casing.

- ✓ `Save layout`, `Keyboard shortcuts`, `Unsaved changes`, `Set as default for everyone`
- ✗ `Save Changes`, `General Information`, `Toggle Sidebar`

A button names its action as a verb, with the object when the page has more than one
thing it could act on: `Save`, `Reset to default`, `Delete source`. A heading names a
thing: `Versions`, `Filters`.

### Punctuation

- A label, a button and a heading take no full stop. A sentence does, including a
  one-sentence hint or error: ✓ `Ask a question about what you are working on.`
- An ellipsis is the single character `…`, and it means "more is coming": a placeholder
  (`Search areas…`) or work in flight (`Searching…`). ✗ `Loading...` with three dots.
- No exclamation marks. A success says what happened. ✓ `Copied` ✗ `Copied!`
- The middle dot `·` separates two short facts on one line:
  `Drag tiles to reorder · pick S / M / L to resize`.

### Errors, empty states and confirmations

An error says what happened, what state things are in now, and what to do, in that order,
with no apology and no "please".

- ✓ `The layout could not be saved. Nothing has changed — try again.`
- ✗ `Failed to submit the form. Please try again.`

An empty state says what is not there, plainly: ✓ `Nothing to show`, `No matches`.
✗ `Oops! No data found`. A destructive confirmation names the thing and the consequence:
✓ `This will permanently delete {{name}}. This action cannot be undone.`

### Numbers, units and dates

- Format numbers, dates and times with `Intl` in the reader's language, never by hand.
  `BentoChangeCell` is the pattern: a relative time under a month (`2 days ago`,
  `há 2 dias`), a medium date past it, and the exact instant (long date, short time) as
  the tooltip and what a screen reader says.
- A count goes before its noun and carries the noun: ✓ `{{count}} selected`,
  `{{count}} unchanged lines`. ✗ `Selected: 3`.
- A position reads "of": ✓ `Step 2 of 4`, `Page 1 of 9`.
- Sizes are S / M / L in English and P / M / G in Portuguese.
- A unit follows its number with a space (`44 px`, `12 KB`), except `%`.

### The states a record can be in

There are five, and they are the only colour a row or a list tile carries. Use these
words and no synonyms, in either language:

| state | English | Portuguese | drawn with |
|---|---|---|---|
| `published` | Published | Publicado | `--vg-bento-state-published` (green) |
| `draft` | Draft | Rascunho | `--vg-bento-state-draft` (slate) |
| `scheduled` | Scheduled | Agendado | `--vg-bento-state-scheduled` (violet) |
| `changed` | Changed | Alterado | `--vg-bento-state-changed` (amber) |
| `archived` | Archived | Arquivado | `--vg-bento-state-archived` (grey) |

`BentoStatusMarker state="…"` draws the dot and the word. ✓ a `draft` row reads `Draft`.
✗ a row that says `Pending` in orange because the product had an orange to spare. Two
save cues outrank the state on a form: `Title required` (red, Save disabled) and
`Unsaved changes` (amber, pulsing).

### Colour

- **The gradient names one thing.** The accent gradient goes on the chip of the one thing
  a page is about (an entity's hero, a hub's tiles) and on the primary action
  (`GradientButton`). ✗ a gradient chip on every row, form section or empty state; those
  take the neutral well.
- **"You are here" is `--primary`.** The rail's active marker, focus rings, hover glows and
  the default button fill read it. Claim it through the four `--vg-primary-*-base` inputs
  ([BENTO-AUTHORING §4](BENTO-AUTHORING.md#4-colour--a-tone-is-a-token)).
- **A product area has no colour of its own.** Colour on a list is a state (above). A
  semantic variant keeps its hue whatever the brand: `destructive` is red in every product.
- **Text holds 4.5:1** on both grounds, tinted surfaces included. `viglet-ds-page-lint
  --contrast` measures it.

### Icons

Tabler (`@tabler/icons-react`) is the set: outline glyphs on a 24-unit grid, drawn in
`currentColor` so they take the text colour. Use 16 px inline with text and in table cells,
18 px for an icon-only control, and the size a component sets when it draws one. Lucide is
inside the console-era primitives and stays there; a new screen does not mix the two sets.

- ✓ `<IconTrash size={16} />` beside `Delete`
- ✗ a filled or two-tone glyph, an emoji as an icon, or a coloured icon on a neutral row

An icon-only control carries an `aria-label`; a decorative glyph is `aria-hidden`.

### Motion

Motion says something changed: a tile arriving, a route swapping, a pulse that an answer
waits. It follows the package's two curves, `--bento-spring` for a tile's arrival, press,
hover and route transitions and `--bento-soft` for the shell's entrance and the pulses, so
every surface moves the same way.

- **Reduced motion is the floor, not an option.** Under `prefers-reduced-motion: reduce`
  every animation stops, a morph becomes an instant swap, and the mascot draws one frame.
  A test fails the build for a keyframe the guard does not name.
- ✓ the shell's 380 ms entrance. ✗ a looping animation on something that is not waiting
  for anything.

## Part two: the Viglet family

### Voice and person

Address the reader directly, in the second person and the imperative. Plain words, short
sentences, no marketing register inside a product.

- English: ✓ `Choose a day and press Enter.` ✗ `The user should select a date.`
- Portuguese: `você`, never `tu` or `o usuário`, with the verb in the imperative.
  ✓ `Faça uma pergunta sobre o que você está editando.` ✗ `O usuário deve fazer uma
  pergunta.`

Both languages ship together. A string added in one is added in the other in the same
change, and the Portuguese is written, not machine-translated word for word: ✓
`Navegue sem tirar as mãos do teclado.` for `Move around without leaving the keyboard.`

The system speaks as "Viglet" when it is the one acting (`Talk to Viglet`,
`Open the Viglet assistant`). Otherwise it does not refer to itself.

### Imagery

- **Product marks** come from `./assets` (`productLogos`), never redrawn or recoloured.
  Each product has one mark colour (`--vg-product-turing`, `-shio`, `-dumont`), used for
  that product's mark and nowhere else.
- **The mascot** is `VigletAvatar`, a small sun that shows what the system is doing. It is
  the one figure in the family: ✗ a second character, a stock illustration of a robot.
  When something fails the light goes out; it never turns red.
- **The formula background** (`FloatingFormulasBg`) belongs to the front doors: the login
  and the first-run screens. ✗ behind a working page, where it competes with the content.
- No stock photography in a product. A screenshot of the product is the illustration.

## Held by a test

The package's own strings follow part one in both locales, and `src/i18n/voice.test.ts`
fails on a Title Case label, three dots, an exclamation mark or a "please". Where a string
and this page disagree, the page is the target and the string is the bug.
