---
name: vds-roadmap-docs
description: How to maintain the Viglet Design System roadmap/docs — the three docs/ files (ROADMAP.md, CHANGELOG.md, IMPROVEMENTS.md), which are owned by the roadkeep CLI and never hand-edited, plus their single-responsibility split, the cross-file update rules, the per-task acceptance criteria ("Done when — VDS<n>"), and the one-task-one-commit rule. Also the per-task consumer-facing decision (README, Storybook story, the exported surface two products install) and the block-completion sweep. Use whenever adding a task, choosing which block a task goes under (reuse an existing block; open a new one only when nothing can hold it, and title it generically), marking a task shipped, shipping, retiring, linting, editing any of those files, picking the next VDS-number, or finishing a block. Covers roadkeep, roadkeep.toml, task numbering, non-goals, criteria, and batching under /loop.
---

# Roadmap & docs maintenance — Viglet Design System

## ⛔ READ FIRST — one task, one commit (non-negotiable)

**You may NOT do more than one task before committing.** This is the single most
violated rule, so it is stated up front and it is absolute:

- **One task → one commit.** The moment a task is complete and validated, do the doc
  sync, then commit — code + `ROADMAP`/`CHANGELOG`/`IMPROVEMENTS` sync in that one
  commit — **before touching the next task.** Finishing a task means *the commit
  landed*.
- **A multi-task request (a block, or a list of `VDS<n>`s) is NOT permission to
  batch.** It is a request to run tasks **one-at-a-time, committing after each**.
  Never implement task 2 while task 1 is uncommitted. A single giant diff spanning
  many tasks with one commit at the end is the failure this rule exists to prevent.
- **For any batch of ≥2 tasks drive it with the `/loop` skill** (self-paced): exactly
  one task per iteration, commit at the end of the iteration, then let the loop
  advance. Do not hand-roll a loop that defers commits.
- **Self-check before starting task N+1:** run `git status` / `git log -1`. If the
  previous task's work is not committed, STOP and commit it first.

The commit + batch mechanics are rules 7–8 below. When a task turns out to be its
**block's last** — `stats` says so, you do not — one more unit of work follows it: see
"[When a block completes](#when-a-block-completes--the-sweep)".

---

## ⛔ READ SECOND — the three files are owned by `roadkeep`

[`roadkeep.toml`](../../../roadkeep.toml) declares this project's format, and the roadkeep
plugin (declared in `.claude/settings.json`, so a clone gets it) carries the rest: a hook
that **denies a hand-edit** to any of the three and names the command, the
`mcp__roadkeep__*` / `mcp__plugin_roadkeep_roadkeep__*` tools whose input schema *is* this
schema, and the [`roadkeep`](../roadkeep/SKILL.md) skill with the whole write path. Start a
task with `brief`, not by reading the files; `lint` is the gate. The rules below are the
reasoning, not the syntax.

`roadkeep` is on PATH here (`python -m roadkeep.cli` otherwise), but **prefer the MCP
tools** — the fields arrive as a schema instead of flags typed from memory.

---

The roadmap is **split across three files in `docs/`** that must be kept in sync. Each
has one job — never duplicate content between them, and when you touch one, check
whether a sibling needs updating:

| File | Single responsibility | Granularity |
|---|---|---|
| [`docs/ROADMAP.md`](../../../docs/ROADMAP.md) | **Task status** — the *only* source of truth for what is unshipped. Active backlog only (📋 designed · 💭 idea · ⏳ partial · 🛠 in-progress), plus the non-goals and the per-task `## Done when — VDS<n>` criteria. | one line per task |
| [`docs/CHANGELOG.md`](../../../docs/CHANGELOG.md) | What has **shipped** — a "Shipped Ledger" indexed by block; `git log` is authoritative for detail. | one entry per shipped task, under its block |
| [`docs/IMPROVEMENTS.md`](../../../docs/IMPROVEMENTS.md) | **Design rationale** (the what/why) for *unshipped* sections only. No status tables, no shipped implementation reports. | one `### §VDS<n>` section per open line |

This project has **no `STRATEGY.md`, no `decisions` file, no `deferred` store and no
`docs/specs/`** — the rationale section a line points at is the whole design. If one of
those roles is genuinely needed, `declare <role>` is the door; do not hand-edit
`roadkeep.toml`.

**Task numbering — `add` derives it**, and `roadkeep next-id` prints it. Ids are
`VDS<n>`, non-contiguous across blocks, and a retired id is never reused. Because the
roadmap is periodically pruned of fully-shipped blocks, **`CHANGELOG.md` (not
`ROADMAP.md`) is authoritative for the highest block letter** — read it before opening a
block.

**The pointer is derived here.** `roadkeep.toml` sets `ref_scheme = "id"`, so a line's
rationale is addressed `→ §VDS<n>` from the id itself: **never pass `--ref`**, and never
hand-number a section. That is the one place this project differs from Shio and Turing,
which number an outline by hand.

**The cross-file update rules — follow these every time:**

1. **When a task ships: `ship <id> --why "<what now works>"`** — one transaction (ledger
   entry, roadmap line deleted, `§VDS<n>` section dropped, the task's `## Done when`
   region removed, dependents re-annotated) or none of it. A follow-up names its shipped
   parent in `(deps: VDS11)`, which `roadkeep deps` resolves. `--why` states the
   **outcome**, not the problem the roadmap line stated. **Then run the consumer-facing
   decision** (below), and **then ask whether that was the block's last task** — `stats`
   answers it.
2. **Adding a task starts with its block — and the block is nearly always one that
   already exists.** `add --block` refuses a label no heading declares, so "which block?"
   is the first decision, and the way it goes wrong is by inventing a letter instead of
   reading the headings. **Reuse is the default; a new block is the exception you have to
   justify — and `block add` is not yours to run unprompted: propose the label and title
   to the user and wait.** A wrong task line is one `amend`; a wrong block is a heading, a
   ledger region that keeps it forever, and a sweep when it empties.
   - **Read the candidates first.** `block list` names every block, its open count and
     whether it is live, finished or empty. `list --block <x>` prints what an
     ambiguously-titled block actually holds. Today: **A** — the gate the design system
     never had; **B** — Bento becomes a design-system layer; **C** — one look across
     products.
   - **Match on the *job*, not the surface.** A block groups work by what it accomplishes,
     not by which directory it edits. A task touching `src/components/ui/` belongs to
     whichever block owns the job, not to a new block opened because the files felt
     unfamiliar.
   - **A new block requires a job no existing heading can honestly hold.** Two tasks of a
     kind is not a block; it is two lines under an existing one. When you must open one,
     name it for the **capability**, not for the task in hand — the test is answerable
     before you type the title: name three plausible *future* tasks the heading would
     hold; if the second and third are the same task worded differently, the title is a
     deliverable and the block is really a line under an existing heading.

   **Then one command, because the pointer is derived.**
   `add --block <x> --symptom "…" --why "…" --section "<title>"` with the prose on stdin
   (or `--section-body-file`) writes the line **and** its `§VDS<n>` rationale in the same
   transaction. An `add` without `--section` leaves a pointer that resolves to nothing and
   the answer tells you the `section add` that closes it — do not leave the turn in that
   state. The `deps:` group and the status marker are `add`'s own flags (`--dep`,
   `--status`); markers live **only** in `ROADMAP.md`.
3. **Every line carries acceptance criteria.** `[criteria]` is declared, so a task states
   what must be **true** for it to be done: `criterion add --task <id> --lead "…" --why
   "…"` writes it under `## Done when — VDS<n>`, and the region leaves with the line at
   `ship`/`retire`. Write them at `add` time — a criterion invented at ship time is a
   description of what happened, not a test the work was held to. `brief` prints them, so
   a task started through it never has to ask.
4. **Status belongs to exactly one file.** If a marker in `IMPROVEMENTS.md` disagrees with
   `ROADMAP.md`/`CHANGELOG.md`, the roadmap files win — fix it.
5. **Keep entries terse.** A roadmap line is **one sentence: symptom + why + `→`
   pointer.** The reasoning belongs in IMPROVEMENTS, which is what the pointer addresses;
   a line that restates it makes the roadmap a history instead of a queue, and lets two
   files disagree about one design. `budget --block <x> --why "<draft>" --body "<draft>"`
   prices the whole transaction **before** the write — reach for it instead of counting,
   and instead of a second refusal.
   **And the same rule about the file, not the line: `ROADMAP.md` holds block headings,
   open task lines, the `## Done when` regions and the non-goals — nothing else.** No
   `> ✅ … shipped` note, no block description, no marker legend. The test is that roadkeep
   has a verb for every kind of content the file may hold (`add`, `block add`,
   `non-goal add`, `criterion add`, `priority add`), so a sentence no verb writes belongs
   in the ledger, at the `→ §` pointer, or in `git log`.
6. **Non-goals are binding.** `non-goal list` is a read that comes **before** a proposal,
   not after it — this project's list forbids forking a shared component inside a product,
   moving a product's commercial chrome into the package, redesigning a component while
   moving it, removing console-era exports before both consoles cut over, and putting
   product data (routes, entity names, nav surfaces) in the package. `delivered <block>
   --near "<the symptom you are about to propose>"` is the duplicate check beside it.
7. **Commit the instant a task finishes — before starting the next.** A task is not
   "done" until the commit landed. Do the doc sync (rules 1–3) **in the same commit** as
   the code so the docs never drift from what shipped. Conventional-commits title, ASCII.
   The gates to run first, all of them cheap:
   ```
   npm run lint && npm run typecheck && npm test && npm run build
   ```
   plus `npm run build-storybook` when the task touched a story or a component's public
   props. `roadkeep lint` is the docs gate and runs at the end of the turn either way;
   `roadkeep repair` closes in one call whatever it reports mechanically.
   `claim <id> --path <p> …` declares what this commit owns, and `ship` reads it back and
   prints the `git add --` line for it — reach for that instead of `git add -A`, which
   sweeps up a second session's work.
8. **A batch of ≥2 tasks MUST run under `/loop`** — self-paced, exactly one task per
   iteration, commit at the end of that iteration (rule 7), then advance. Only a
   genuinely single-task ask skips `/loop`.

## Starting and picking work

`roadkeep brief --claim` picks, briefs and takes the line in one call: the line, its
rationale, its criteria, the deps resolved, the blocker chain and the non-goals. Add
`--designed` when you asked to *execute* rather than to plan — it sets aside the lines
whose design is still to write. `brief <id> --claim` takes a line you were told to work
on. Never start by reading `docs/ROADMAP.md`: the guard denies the edit that would follow
anyway, and the brief is bounded where the file is not.

## The consumer-facing decision — every ship, after the doc sync

This package is installed from npm by **Turing, Shio and Dumont**, so its "end-user
documentation" is not a separate docs repo — it is three surfaces inside this repo:

1. **Is it consumer-facing?** Would a product author importing
   `@viglet/viglet-design-system` do something differently because this shipped — a new
   export, a changed prop, a new subpath, a token, a CSS entry? If **no** (a lint, a test
   harness, a CI workflow, an internal refactor), it gets no doc edit. Do not invent thin
   sections for internal work.
2. **If yes, the export is the contract.** A new entry point is an `exports` row in
   `package.json` **and** a build input in `vite.config.ts` — the two disagree silently,
   and a consumer finds out at install time. State the subpath the way the README's
   existing sections state one.
3. **[`README.md`](../../../README.md) is the front door** — installation, the styles/
   preset import, i18n setup and the exported surface. Fold into the closest existing
   section; a new section is what a genuinely new subpath earns.
4. **A component nobody can see gets re-invented.** A new or materially changed component
   takes a Storybook story in the same commit — that catalogue is the reason a product
   author finds a component instead of writing a fourth version of it, which is how the
   bento scaffold grew inside one product in the first place.
5. **Never paste `IMPROVEMENTS.md` prose into the README or a story.** The rationale stays
   internal; the public text says what a consumer can now do.

## When a block completes — the sweep

The per-task decision keeps a *section* honest. It cannot keep the **shape** of the
package honest, because what a consumer meets first — the README's surface, the Storybook
catalogue — describes a *block*, not a task.

**The trigger is measured, not remembered.** After every `ship`, ask whether the block is
now empty:

```
roadkeep stats          # or: block list
```

A block printing **0** with no markers has no open lines left — that is the signal. Do
not infer completion from "I finished the tasks the user listed": a block routinely holds
lines nobody named in this session. Two corollaries:

- **`block drop <x>` is the roadkeep half** — the only thing allowed to remove a heading
  standing over nothing; the guard denies the hand-edit. Do it in the same commit as the
  sweep. `CHANGELOG.md` keeps the block forever, which is why it is authoritative for the
  highest letter.
- **A block emptied by `retire` still completes.** The sweep is about what the package
  claims, and a retired line changes that claim as much as a shipped one.

Then, in this order:

1. **README.md** — the installation and setup sections, and any list of exports or
   subpaths the block changed. Read them; nothing derives them.
2. **Storybook** — every component the block moved or added has a story, and the catalogue
   reads as one system rather than as two eras side by side. `npm run build-storybook` is
   the gate.
3. **The consumers** — Turing, Shio and Dumont install this by caret range. A block that
   deprecated or renamed an export leaves a migration note in the ledger entry (or, for a
   removal, its own line under the block that owns the cutover); do **not** edit a
   consumer repo as part of this commit.
4. **Commit** — README + stories + `block drop <x>`, one commit:
   `git commit -m "docs(block-<x>): <ascii title>"`.

### What the sweep is not

- **Not permission to batch.** Rule 8 still holds: the block's *tasks* ran one per `/loop`
  iteration with a commit each. The sweep is a **separate, final** unit of work.
- **Not a rewrite of shipped docs.** Fold into existing sections; the new text a block
  earns is usually a paragraph and a story, not a new document.
- **Not a place for rationale.** The block's *why* stays in the ledger and in `git log`.
