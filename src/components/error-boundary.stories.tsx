import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorBoundary } from "./error-boundary";

function Exploder({ message = "Something exploded" }: { readonly message?: string }) {
  throw new Error(message);
}

const meta = {
  title: "App/ErrorBoundary",
  component: ErrorBoundary,
  tags: ["autodocs"],
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
