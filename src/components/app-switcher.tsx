import type { ReactNode } from "react";
import { Check, ExternalLink, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface AppSwitcherItem {
  /** Stable id (used as React key). */
  id: string;
  /**
   * Display name. Either a literal string or an i18n key — strings starting
   * with a letter are treated as i18n keys (passed to `t()`); use the raw
   * `label` prop for literal text.
   */
  name: string;
  /** Image URL for the icon (e.g. product logo). Mutually exclusive with `icon`. */
  image?: string;
  /** Inline icon node (e.g. `<Home className="h-4 w-4" />`). */
  icon?: ReactNode;
  /** Tailwind classes applied to the icon background tile. */
  iconBg?: string;
  /** Destination URL or in-app path. */
  href: string;
  /** Marks this item as the current app (highlighted + checkmark). */
  active?: boolean;
  /** Open in a new tab and show external-link indicator. */
  external?: boolean;
}

export interface AppSwitcherProps {
  /** Whether the panel is open. */
  open: boolean;
  /** Toggle handler (called from trigger button, overlay, and on item click). */
  onToggle: () => void;
  /** Apps to display in the panel. */
  apps: AppSwitcherItem[];
  /** Title for the trigger button (a11y / tooltip). */
  triggerTitle?: string;
  /** Aria label for the close overlay. */
  closeLabel?: string;
  /**
   * If true, the trigger is rendered next to the panel.
   * Set to false if you provide your own trigger and only want the panel.
   */
  showTrigger?: boolean;
  /** Header height in px (so the panel sits below the app header). Default 56. */
  headerHeight?: number;
}

/**
 * Application switcher — a side panel listing related apps in a multi-product
 * suite (e.g. Cloud, Turing, Shio, Dumont). Designed to live in the top-right
 * corner of a sticky header.
 */
export function AppSwitcher({
  open,
  onToggle,
  apps,
  triggerTitle = "Apps",
  closeLabel = "Close app switcher",
  showTrigger = true,
  headerHeight = 56,
}: Readonly<AppSwitcherProps>) {
  const panelStyle = {
    top: `${headerHeight}px`,
    height: `calc(100vh - ${headerHeight}px)`,
  };

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          title={triggerTitle}
          onClick={onToggle}
          className={`inline-flex items-center justify-center rounded-full w-9 h-9 transition-colors ${
            open
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
        </button>
      )}

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-transparent border-none"
          onClick={onToggle}
          onKeyDown={(e) => e.key === "Escape" && onToggle()}
          aria-label={closeLabel}
        />
      )}

      {open && (
        <div
          className="vg-app-switcher-panel fixed right-0 z-50 w-72 border-l border-border bg-card shadow-xl overflow-y-auto"
          style={panelStyle}
        >
          <div className="p-4">
            {apps.map((app) => (
              <AppRow key={app.id} app={app} onToggle={onToggle} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface AppRowProps {
  app: AppSwitcherItem;
  onToggle: () => void;
}

function AppRow({ app, onToggle }: Readonly<AppRowProps>) {
  const { t } = useTranslation();
  // Treat the name as an i18n key if it contains a dot ("cloud.products.turing.name").
  // Otherwise use it as a literal string. This keeps the API ergonomic.
  const label = app.name.includes(".") ? t(app.name, { defaultValue: app.name }) : app.name;

  return (
    <a
      href={app.href}
      target={app.external ? "_blank" : undefined}
      rel={app.external ? "noopener noreferrer" : undefined}
      onClick={onToggle}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        app.active ? "bg-accent font-medium" : "hover:bg-accent"
      }`}
    >
      {app.active && (
        <Check className="h-4 w-4 text-[var(--vg-brand,#C2410C)] shrink-0" />
      )}
      {app.image ? (
        <img
          src={app.image}
          alt={label}
          className={`${app.active ? "" : "ml-7"} shrink-0 w-7 h-7 object-contain`}
        />
      ) : (
        <div
          className={`${app.active ? "" : "ml-7"} shrink-0 w-7 h-7 rounded-[18%] bg-[#f5deb3] dark:bg-amber-900/40 p-0.5`}
        >
          <div
            className={`w-full h-full rounded-[14%] ${app.iconBg ?? "bg-muted"} flex items-center justify-center text-white`}
          >
            {app.icon}
          </div>
        </div>
      )}
      <span className="text-sm flex-1">{label}</span>
      {app.external && (
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </a>
  );
}
