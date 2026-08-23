// VDS53/VDS55 — a React console error is a defect the framework already found
// for us, and the suite used to print it and exit 0: a story handed
// `collapsible` to a multiple-type accordion, React refused the DOM attribute,
// and 742 tests passed over it.
//
// Both test projects install this. They assert at different points, and the
// difference is not a preference:
//
//   stories — a real browser, concurrent React. The commit that sets an invalid
//     attribute is scheduled, so the error is logged after the story's own turn
//     has ended. Asserting per story blames whichever story ran next, and a
//     broken story run alone captures nothing at all. Both were observed. So the
//     story project asserts in `afterAll`, and the file is the unit of blame.
//
//   unit — jsdom, where React Testing Library renders inside `act()` and the
//     commit is synchronous. The error lands in the test that caused it, so the
//     unit project asserts in `afterEach` and blames the test.
//
// A gate with a false negative is worse than no gate, which is why neither of
// those was assumed.

type Pattern = string | RegExp;

/**
 * React logs through a format string — `Received \`%s\` for a non-boolean
 * attribute \`%s\`` — with the values as trailing arguments. Joining them raw
 * leaves the placeholders in the failure message and the values stranded after
 * it, which is the opposite of naming the defect.
 */
export function formatConsoleArgs(args: readonly unknown[]): string {
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
 * One independent gate. A factory rather than module-level state so a test can
 * hold the gate's own behaviour without disturbing the live one that is, at that
 * moment, watching it.
 */
export function createConsoleErrorGate() {
  const captured: string[] = [];
  const allowed: Pattern[] = [];
  let installed = false;

  const isDeclared = (text: string) =>
    allowed.some((pattern) =>
      typeof pattern === "string" ? text.includes(pattern) : pattern.test(text),
    );

  return {
    /** Patch `console.error` for the lifetime of the run. Idempotent. */
    install(): void {
      if (installed) return;
      installed = true;

      const original = console.error;
      console.error = (...args: unknown[]) => {
        captured.push(formatConsoleArgs(args));
        original(...args);
      };
    },

    /** Declare errors this story or test means to produce. */
    allow(patterns: readonly Pattern[]): void {
      allowed.push(...patterns);
    },

    /** Fail if any console error went undeclared. Clears state either way. */
    async assert(): Promise<void> {
      // One macrotask, so a commit still in React's queue is counted here rather
      // than escaping the run entirely.
      await new Promise((resolve) => setTimeout(resolve, 0));

      const undeclared = [...new Set(captured.filter((t) => !isDeclared(t)))];
      captured.length = 0;
      allowed.length = 0;

      if (undeclared.length > 0) {
        throw new Error(
          `React logged ${undeclared.length} console error(s) nothing declared:\n\n` +
            undeclared.map((t) => `  - ${t}`).join("\n\n") +
            `\n\nFix the render, or declare it: a story sets ` +
            `parameters.expectedConsoleErrors, a unit test calls expectConsoleErrors().`,
        );
      }
    },
  };
}

/** The gate the two setup files share. */
const gate = createConsoleErrorGate();

export function installConsoleErrorGate(): void {
  gate.install();
}

/**
 * Declare errors the current test means to produce. The unit project's answer to
 * `parameters.expectedConsoleErrors`, which a test has no way to set.
 *
 * The declaration lasts until the end of the test that made it — `assert` clears
 * it — so a test cannot quietly widen what the next one is allowed to log.
 */
export function expectConsoleErrors(...patterns: Pattern[]): void {
  gate.allow(patterns);
}

/** Storybook's spelling of the same thing, called from preview.tsx. */
export function allowConsoleErrors(patterns: readonly Pattern[]): void {
  gate.allow(patterns);
}

export function assertNoUndeclaredConsoleErrors(): Promise<void> {
  return gate.assert();
}
