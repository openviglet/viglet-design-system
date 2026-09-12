import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorBoundary } from "./error-boundary";

// `: never` is the point, not decoration — a function whose body only throws
// infers `void`, which is not a JSX element type, so this could not be rendered
// as a component under a compiler. Nothing was reading these files (VDS119).
function Exploder({ message = "Something exploded" }: { readonly message?: string }): never {
  throw new Error(message);
}

const meta = {
  title: "App/ErrorBoundary",
  component: ErrorBoundary,
  tags: ["autodocs"],
  parameters: {
    // The thrown error is the subject here, not an accident: the component logs
    // what it caught, and React logs the boundary that caught it. Declared, so
    // the VDS53 gate can still fail every story that did not mean to log one.
    expectedConsoleErrors: [
      // Two logs per throw: React reports the error it handed to the boundary,
      // and the boundary reports what it caught.
      "ErrorBoundary caught an error:",
      "Simulated render error",
      "Custom fallback received this error",
    ],
  },
  // Every story below renders its own tree; this is what the type asks for and
  // what the controls panel shows.
  args: { children: <p>Nothing has gone wrong.</p> },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Happy path — children render untouched. */
export const HappyPath: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-6 rounded-md border bg-card">
        <h3 className="font-medium">All good</h3>
        <p className="text-sm text-muted-foreground">The children render normally.</p>
      </div>
    </ErrorBoundary>
  ),
};

/** Default fallback UI shown when a child throws. */
export const DefaultFallback: Story = {
  render: () => (
    <ErrorBoundary>
      <Exploder message="Simulated render error" />
    </ErrorBoundary>
  ),
};

/** Custom fallback renderer using the captured error. */
export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div className="p-6 rounded-md border border-destructive/30 bg-destructive/5 space-y-2">
          <h3 className="font-medium text-destructive">Custom fallback</h3>
          <pre className="text-xs text-muted-foreground">{error.message}</pre>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
          >
            Reset
          </button>
        </div>
      )}
    >
      <Exploder message="Custom fallback received this error" />
    </ErrorBoundary>
  ),
};
