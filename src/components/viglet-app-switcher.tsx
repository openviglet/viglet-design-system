import { useTranslation } from "react-i18next";
import { Book, Cloud } from "lucide-react";
import { AppSwitcher, type AppSwitcherItem } from "./app-switcher";
import {
  dumontLogoUrl,
  shioLogoUrl,
  turingLogoUrl,
} from "../assets/products";

export type VigletProduct = "cloud" | "turing" | "shio" | "dumont";

export interface VigletAppSwitcherUrls {
  cloud?: string;
  turing?: string;
  shio?: string;
  dumont?: string;
  docs?: string;
}

const DEFAULT_URLS: Required<VigletAppSwitcherUrls> = {
  cloud: "https://console.viglet.cloud",
  turing: "https://turing.viglet.cloud",
  shio: "https://shio.viglet.cloud",
  dumont: "https://dumont.viglet.cloud",
  docs: "https://docs.viglet.org",
};

export interface VigletAppSwitcherProps {
  open: boolean;
  onToggle: () => void;
  /** Which product is currently running (highlighted + checkmark, renders as a local "/"). */
  activeProduct: VigletProduct;
  /** Override any URL (useful for dev/staging or custom domains). */
  urls?: VigletAppSwitcherUrls;
  /** Tooltip for the trigger button. Default: "Apps" (translated via i18n if key exists). */
  triggerTitle?: string;
  /** Aria label for the close overlay. */
  closeLabel?: string;
  /** Header height in px so the panel sits below the app header. Default 56. */
  headerHeight?: number;
}

/**
 * Pre-configured Viglet app switcher — same list of apps across the entire
 * suite (Cloud, Turing, Shio, Dumont, Docs). Highlights the current product
 * and opens the others in a new tab.
 *
 * Keeping the list hard-coded here ensures the navigation is consistent
 * across every deployment. Apps that need to customize the URLs (custom
 * domain, dev environment) can pass `urls`.
 */
export function VigletAppSwitcher({
  open,
  onToggle,
  activeProduct,
  urls,
  triggerTitle,
  closeLabel,
  headerHeight = 56,
}: Readonly<VigletAppSwitcherProps>) {
  const { t } = useTranslation();
  const u = { ...DEFAULT_URLS, ...urls };

  const apps: AppSwitcherItem[] = [
    {
      id: "cloud",
      name: "Viglet Cloud",
      icon: <Cloud className="h-4 w-4" />,
      iconBg: "bg-linear-to-br from-[#C2410C] to-[#F97316]",
      href: activeProduct === "cloud" ? "/" : u.cloud,
      external: activeProduct !== "cloud",
      active: activeProduct === "cloud",
    },
    {
      id: "turing",
      name: "Turing ES",
      image: turingLogoUrl,
      href: activeProduct === "turing" ? "/" : u.turing,
      external: activeProduct !== "turing",
      active: activeProduct === "turing",
    },
    {
      id: "shio",
      name: "Shio CMS",
      image: shioLogoUrl,
      href: activeProduct === "shio" ? "/" : u.shio,
      external: activeProduct !== "shio",
      active: activeProduct === "shio",
    },
    {
      id: "dumont",
      name: "Dumont DEP",
      image: dumontLogoUrl,
      href: activeProduct === "dumont" ? "/" : u.dumont,
      external: activeProduct !== "dumont",
      active: activeProduct === "dumont",
    },
    {
      id: "docs",
      name: t("common.docs", { defaultValue: "Documentation" }),
      icon: <Book className="h-4 w-4" />,
      iconBg: "bg-linear-to-br from-violet-500 to-purple-600",
      href: u.docs,
      external: true,
    },
  ];

  const title = triggerTitle ?? t("common.apps", { defaultValue: "Apps" });

  return (
    <AppSwitcher
      open={open}
      onToggle={onToggle}
      apps={apps}
      triggerTitle={title}
      closeLabel={closeLabel ?? title}
      headerHeight={headerHeight}
    />
  );
}
