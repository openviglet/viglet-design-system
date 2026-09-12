---
name: audit
description: Full-repository audit of the Viglet Design System — runs the project gates, fans a read-only scanner across seven partitions in parallel, verifies every finding adversarially, then reconciles the roadkeep-governed backlog against the result (closing what is done, retiring what is outdated, rewording what is unclear, filing what is new). Use when asked to audit, sweep, review the whole repo, check the backlog against the code, or find out what the roadmap is missing. Read-only with respect to source code — it files work, it never fixes it.
---

# /audit — scan, verify, reconcile

Seven steps, in order. Do not reorder them and do not skip step 4: an unverified finding
filed as a task is a defect in the roadmap, which costs more than the defect it describes.

**This skill never edits source code.** Its output is a reconciled backlog. If a finding
is a one-line fix, it still gets filed — fixing it is a separate task under
[vds-roadmap-docs](../vds-roadmap-docs/SKILL.md)'s one-task-one-commit rule.

**The three governed docs are written only through `roadkeep`.** A hand-edit to
`docs/ROADMAP.md`, `docs/CHANGELOG.md` or `docs/IMPROVEMENTS.md` is denied by a hook.
Prefer the `mcp__roadkeep__*` tools when the MCP server is connected; the `roadkeep` CLI
on PATH is the same engine and the fallback when it is not.

---

## 1. Run the gates first

Before any agent is spawned. A repository that is already red produces scanner findings
that are just the red, and wastes the whole fan-out.

```
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
roadkeep lint
```

Record each one's exit status. If `lint`, `typecheck` or `build` fails, **stop and report
that** — the tree has to be green before an audit means anything. A failing `pnpm test`
is itself an audit finding: carry it into step 4 as a pre-confirmed one. `pnpm run build`
must succeed before step 4, because it is what makes `dist/` current for
`check:exports` / `check:dist` / `check:size`.

`roadkeep lint` failing is a docs finding, not a blocker; `roadkeep repair` closes in one
call whatever it reports mechanically.

## 2. Fan out one `scanner` per partition, in parallel

Seven `scanner` agents, **all in one message** so they run concurrently. Give each one
its paths and nothing else — no shared summary, no cross-partition context.

| # | Partition | Paths |
|---|---|---|
| 1 | UI primitives A–L | `src/components/ui/[a-l]*` (~48 files) |
| 2 | UI primitives M–Z | `src/components/ui/[m-z]*` (~60 files) |
| 3 | Bento layer | `src/bento/**` (~52 files) |
| 4 | Composite components | `src/components/*.{ts,tsx}`, `src/components/login/**`, `src/components/router/**`, `src/components/startup-first/**` (~54 files) |
| 5 | Runtime core | `src/hooks/**`, `src/lib/**`, `src/contexts/**`, `src/models/**`, `src/i18n/**`, `src/test/**` (~34 files) |
| 6 | Package surface | `src/index.ts`, `src/router.ts`, `src/vite/**`, `src/styles/**`, `src/assets/**`, `package.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tsconfig*.json`, `size-budget.json`, `components.json`, `consumers.json` |
| 7 | Build & CI machinery | `scripts/**`, `.storybook/**`, `.github/**` |

Partition 6 is the contract partition — the `exports` / `vite.config.ts` / `dist`
triangle lives there. Tell that scanner so explicitly.

## 3. Deduplicate

Merge the seven lists yourself. One defect, one finding, reported at its source:

- Same `path:line` from two scanners → keep the better-evidenced wording.
- The same defect at many sites (a token bypassed in nine components, a missing
  `aria-label` on four icon buttons) → **one** finding, at the first site, with the others
  named in `why it matters`. Nine roadmap lines for one habit is how a backlog becomes
  unreadable.
- A finding that restates a gate failure from step 1 → keep the gate's own wording.

Number the survivors `1..n`. Those numbers are the handles used in steps 4–6.

## 4. `verifier`, FINDINGS mode

One `verifier` agent. Prompt it with the literal word **FINDINGS** and the full
deduplicated list, numbered. It runs the real gates and returns
`CONFIRMED` / `FALSE POSITIVE` / `UNVERIFIABLE` per finding, each with evidence and a
`block-hint:`.

Split the result three ways and keep all three — the false positives matter in step 6.

## 5. `verifier`, ROADMAP mode

Read the open backlog **through roadkeep**, never by opening `docs/ROADMAP.md`:

```
roadkeep list --json          # every open line: id, block, marker, symptom, why
roadkeep block list           # the live blocks, their titles and open counts
roadkeep non-goal list        # binding constraints a finding may not violate
roadkeep stats                # counts per block and per marker
```

Then one `verifier` agent, prompted with the literal word **ROADMAP**, given **both**
the task list **and** the CONFIRMED findings from step 4, so it can see overlaps. It
returns one line per task: `STILL VALID` / `ALREADY DONE` / `OUTDATED` /
`NEEDS REWORDING`, with evidence and — where it applies — `covers-finding: <n>`.

## 6. Reconcile — every write through `roadkeep`

In this order, so the backlog is clean before anything new lands in it.

**ALREADY DONE → ship.** `--why` is the **outcome**, not the problem the line stated:

```
roadkeep ship <id> --why "<what now works, one sentence ending in a stop.>"
```

**OUTDATED → retire**, with the author's own reason:

```
roadkeep retire <id> --reason "<why this is not being done, ending in a stop.>"
roadkeep retire <id> --superseded-by <other-id> --reason "…"   # when work moved
```

**NEEDS REWORDING → restate and/or amend.** `restate` is the only door to the symptom;
`amend` reaches the `why`, the deps and the pointer:

```
roadkeep restate <id> --symptom "<what does not work — a phrase, never a fix>"
roadkeep amend   <id> --why "<one sentence ending in a stop.>"
```

**STILL VALID → leave it alone.** Do not re-mark, re-order or re-word a line the verifier
passed.

**CONFIRMED findings not already covered → add.** For each one, in this order:

```
roadkeep delivered <block> --near "<the symptom you are about to file>"   # duplicate check
roadkeep budget --block <block> --why "<draft>" --body "<draft section>"  # price it before writing
roadkeep add --block <block> --symptom "<…>" --why "<…>" --section "<title>"   # prose on stdin
roadkeep criterion add --task <id> --lead "<…>" --why "<…>"              # the Done-when test
```

Rules this project binds you to, and the audit is not an exception to any of them:

- **Never pass `--ref`.** `ref_scheme = "id"` derives the `→ §VDS<n>` pointer.
- **Always pass `--section`** in the same `add`. A pointer that resolves to nothing is a
  lint failure you created.
- **Never run `block add`.** If a finding fits no live block (`block-hint: none`), propose
  the label and title to the user and **wait** — do not park the finding under a block
  that does not own the job.
- **Check the non-goals first.** A finding that proposes forking a shared component inside
  a product, moving commercial chrome into the package, redesigning a component while
  moving it, removing console-era exports before both consoles cut over, or putting
  product data in the package is **not filed** — it is dismissed.
- **Limits:** symptom ≤ 120 chars, why ≤ 200, line ≤ 320, section ≤ 250 words. `budget`
  tells you before the refusal does.
- Use `--symptom -` / `--why -` / `--section-body-file` to pass text with an apostrophe or
  a backtick through the shell intact.

**FALSE POSITIVE findings that were genuinely traced → dismiss**, so the next audit does
not re-file them:

```
roadkeep dismiss --block <block> --symptom "<the proposal>" --reason "<why not>" --premise "<the claim that holds while this stays ruled out>"
```

**Then the gate:**

```
roadkeep lint          # exits 1 on any drift
roadkeep repair        # applies every finding whose remedy is one command
```

Re-run `roadkeep lint` until it exits 0.

**Without roadkeep** (a clone where it is not installed, or the engine is unreachable):
write exactly the same reconciliation to `docs/AUDIT.md` — the four task verdicts with
evidence, then the confirmed findings not yet covered — and change none of the three
governed files.

**Commit.** The reconciliation is doc-only, so it is one commit and it carries no code:

```
run-commit.cmd -m "docs(audit): reconcile the backlog against the tree"
```

Never mix an audit reconciliation with a code fix in one commit.

## 7. Report — counts only

The whole report, and nothing beyond it:

```
Gates:     lint <pass|fail> · typecheck <pass|fail> · test <pass|fail> · build <pass|fail> · roadkeep lint <pass|fail>
Findings:  <n> raised · <n> after dedup · <n> confirmed · <n> false · <n> unverifiable
Tasks:     <n> kept · <n> closed · <n> retired · <n> reworded · <n> added · <n> dismissed
```

Add at most three lines after it: anything that needs a **decision from the user** — a
block that would have to be opened, a finding that collides with a non-goal, a gate that
could not run. No narrative, no per-finding recap, no "the codebase is in good shape".
The backlog is the output; the report is a receipt.
