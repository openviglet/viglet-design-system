import { IconAlertTriangle, IconLoader2, IconRefresh } from "@tabler/icons-react";
import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GradientButton } from "./ui/gradient-button";

/**
 * Centralized "is the backend reachable" indicator.
 *
 * - Wrap your app in `<BackendStatusProvider>` (with a health endpoint).
 * - From your axios interceptors, call `reportBackendOffline()` when a request
 *   fails with no response, and `reportBackendOnline()` on any success.
 * - The provider polls the health endpoint while offline to detect recovery
 *   and renders a sticky banner at the top of the viewport.
 *
 * @since 2026.2.29
 */

type Status = "online" | "offline" | "checking";

/* ───────── Module-level event bus (lets non-React code talk to the provider) ───────── */

type Listener = (status: Status) => void;

class BackendStatusBus {
  private status: Status = "online";
  private listeners = new Set<Listener>();

  get current(): Status {
    return this.status;
  }

  set(next: Status) {
    if (next === this.status) return;
    this.status = next;
    this.listeners.forEach((l) => l(next));
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}

const bus = new BackendStatusBus();

/** Call from an axios response error handler when `!error.response`. */
export function reportBackendOffline(): void {
  bus.set("offline");
}

/** Call from an axios response success handler (or after a recovered request). */
export function reportBackendOnline(): void {
  bus.set("online");
}

/* ───────── Context + hook ───────── */

interface BackendStatusContextValue {
  status: Status;
  retry: () => void;
}

const BackendStatusContext = createContext<BackendStatusContextValue | null>(null);

export function useBackendStatus(): BackendStatusContextValue {
  const ctx = useContext(BackendStatusContext);
  if (!ctx) {
    throw new Error("useBackendStatus must be used inside <BackendStatusProvider>");
  }
  return ctx;
}

/* ───────── Provider ───────── */

interface BackendStatusProviderProps {
  /** Health endpoint URL polled while offline. Defaults to `/api/v2/ping`. */
  healthEndpoint?: string;
  /** Polling interval in ms while offline. Defaults to 5000. */
  pollInterval?: number;
  /** When true (default), renders the built-in sticky banner. */
  showBanner?: boolean;
  children: React.ReactNode;
}

export function BackendStatusProvider({
  healthEndpoint = "/api/v2/ping",
  pollInterval = 5000,
  showBanner = true,
  children,
}: BackendStatusProviderProps) {
  const [status, setStatus] = useState<Status>(bus.current);
  const cancelledRef = useRef(false);

  // Subscribe to the module bus
  useEffect(() => {
    const unsub = bus.subscribe(setStatus);
    return () => {
      cancelledRef.current = true;
      unsub();
    };
  }, []);

  const ping = useCallback(async () => {
    bus.set("checking");
    try {
      await axios.get(healthEndpoint, { timeout: 4000 });
      if (!cancelledRef.current) bus.set("online");
    } catch {
      if (!cancelledRef.current) bus.set("offline");
    }
  }, [healthEndpoint]);

  // Auto-poll while offline / checking
  useEffect(() => {
    if (status === "online") return;
    const id = setInterval(ping, pollInterval);
    return () => clearInterval(id);
  }, [status, pollInterval, ping]);

  return (
    <BackendStatusContext.Provider value={{ status, retry: ping }}>
      {showBanner && <BackendStatusBanner />}
      {children}
    </BackendStatusContext.Provider>
  );
}

/* ───────── Banner ───────── */

export function BackendStatusBanner() {
  const { status, retry } = useBackendStatus();
  const { t } = useTranslation();

  if (status === "online") return null;

  const isChecking = status === "checking";
  const messageKey = isChecking ? "backendStatus.checking" : "backendStatus.offline";
  const fallback = isChecking ? "Reconnecting to the server..." : "Server unavailable. Retrying...";

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 w-full border-b border-amber-500/30 bg-amber-500/10 backdrop-blur supports-[backdrop-filter]:bg-amber-500/15 text-amber-900 dark:text-amber-100"
    >
      <div className="flex items-center gap-3 px-4 py-2 text-sm">
        {isChecking ? (
          <IconLoader2 className="size-4 animate-spin shrink-0" />
        ) : (
          <IconAlertTriangle className="size-4 shrink-0" />
        )}
        <span className="flex-1">{t(messageKey, fallback)}</span>
        <GradientButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={retry}
          disabled={isChecking}
          className="text-amber-900 dark:text-amber-100 hover:bg-amber-500/20"
        >
          <IconRefresh className={`size-4 ${isChecking ? "animate-spin" : ""}`} />
          {t("backendStatus.retry", "Retry now")}
        </GradientButton>
      </div>
    </div>
  );
}
