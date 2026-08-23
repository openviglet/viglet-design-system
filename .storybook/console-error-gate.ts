// VDS53 — a React console error is a defect the framework already found for us,
// and the catalogue used to print it and exit 0: a story handed `collapsible` to
// a multiple-type accordion, React refused the DOM attribute, and 742 tests
// passed over it.
//
// The obvious shape — patch console.error in a per-story `beforeEach`, assert in
// its teardown — does not work here, and fails in the direction that matters. In
// concurrent React the commit that sets an invalid attribute is scheduled, so
// the error is logged after the story's own turn has ended: run the whole file
// and the failure lands on whichever story ran next, and run the broken story
// alone and nothing is captured at all. A gate with a false negative is worse
// than no gate.
//
// So the patch is installed once and never lifted, and the assertion happens
// when the file is done, by which point every deferred commit has landed. The
// story file is the unit of blame — coarser than one story, and honest.

type Pattern = string | RegExp;

const captured: string[] = [];
const allowed: Pattern[] = [];

let installed = false;

/** Patch `console.error` for the lifetime of the test file. Idempotent. */
export function installConsoleErrorGate(): void {
  if (installed) return;
  installed = true;

  const original = console.error;
  console.error = (...args: unknown[]) => {
    captured.push(format(args));
    original(...args);
  };
}

/**
 * React logs through a format string — `Received \`%s\` for a non-boolean
 * attribute \`%s\`` — with the values as trailing arguments. Joining them raw
 * leaves the placeholders in the failure message and the values stranded after
 * it, which is the opposite of naming the defect.
 */
function format(args: readonly unknown[]): string {
  const text = (value: unknown) =>
    value instanceof Error ? value.message : String(value);

  const [first, ...rest] = args;
  if (typeof first !== "string" || !/%[sdifoOc]/.test(first)) {
    return args.map(text).join(" ");
  }

  const remaining = [...rest];
  const filled = first.replace(/%[sdifoOc]/g, (placeholder) =>
    remaining.length > 0 ? text(remaining.shift()) : placeholder,
  );
  return [filled, ...remaining.map(text)].join(" ");
}

/**
 * Declare errors this story means to produce. Read from
 * `parameters.expectedConsoleErrors`, which is what separates an asserted error
 * from one nobody meant to ship.
 */
export function allowConsoleErrors(patterns: readonly Pattern[]): void {
  allowed.push(...patterns);
}

function isDeclared(text: string): boolean {
  return allowed.some((pattern) =>
    typeof pattern === "string" ? text.includes(pattern) : pattern.test(text),
  );
}

/** Fail the file if any console error went undeclared. Clears state either way. */
export async function assertNoUndeclaredConsoleErrors(): Promise<void> {
  // One macrotask past the last story, so a commit still in React's queue is
  // counted against this file rather than escaping the run entirely.
  await new Promise((resolve) => setTimeout(resolve, 0));

  const undeclared = [...new Set(captured.filter((text) => !isDeclared(text)))];
  captured.length = 0;
  allowed.length = 0;

  if (undeclared.length > 0) {
    throw new Error(
      `React logged ${undeclared.length} console error(s) no story in this file declared:\n\n` +
        undeclared.map((text) => `  - ${text}`).join("\n\n") +
        `\n\nFix the render, or declare it with parameters.expectedConsoleErrors.`,
    );
  }
}
