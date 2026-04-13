import { IconAlertTriangleFilled, IconRefresh } from "@tabler/icons-react";
import React, { type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { GradientButton } from "./ui/gradient-button";

/**
 * Top-level boundary that catches React render errors and displays a friendly
 * fallback with a reload button. Logs the stack trace to the console.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @since 2026.2.29
 */

interface Props {
  children: ReactNode;
  /** Custom fallback. Receives the captured error and a `reset()` callback. */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, info);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const error = this.state.error ?? new Error("Unknown error");
    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }
    return <DefaultErrorFallback error={error} />;
  }
}

function DefaultErrorFallback({ error }: { readonly error: Error }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-16">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
        <div className="relative flex flex-col items-center text-center px-8 py-12 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 blur-xl animate-pulse" />
            <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 shadow-lg shadow-red-500/25 ring-4 ring-red-500/10">
              <IconAlertTriangleFilled className="text-white" size={30} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("errorBoundary.title", "Something went wrong")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {t("errorBoundary.description", "An unexpected error occurred. Try reloading the page.")}
            </p>
            {error.message && (
              <pre className="mt-3 text-xs text-left text-muted-foreground bg-muted/40 rounded-md p-3 max-h-32 overflow-auto whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            )}
          </div>
          <GradientButton size="lg" onClick={() => window.location.reload()}>
            <IconRefresh className="size-4" />
            {t("errorBoundary.reload", "Reload page")}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
