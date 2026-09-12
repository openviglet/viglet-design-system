import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconHome, IconLayoutGrid } from "@tabler/icons-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import type { BentoNavGroup, BentoNavSection } from "./bento-nav";

/**
 * VDS110 — a section that reaches the rail. `areaRoute` is what the filter below
 * tests, and saying so in the type is what lets the rail read it without a
 * non-null assertion; `icon` and `labelKey` stay optional, because the product
 * supplies the array and both are documented as omittable.
 */
type BentoNavHub = BentoNavGroup & {
  section: BentoNavSection & { areaRoute: string };
};

/**
 * What a hub with no icon of its own shows. A hub is a mosaic of its section's
 * surfaces, so the grid is what the link actually leads to — and dropping the
 * section from the rail instead would make a route the product asked for
 * unreachable because a decoration was missing.
 */
const FALLBACK_HUB_ICON = IconLayoutGrid;

/** A route is active when it (or a descendant of it) is the current path. */
function isWithin(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * Is the current path inside this section — either on its hub page or on one
 * of its already-migrated leaf surfaces? Lets the hub icon light up while the
 * user is deep inside e.g. `/bento/ai-agent/instance/:id`.
 */
function isSectionActive(pathname: string, group: BentoNavGroup): boolean {
  if (group.section.areaRoute && isWithin(pathname, group.section.areaRoute)) return true;
  return group.items.some((i) => i.bentoRoute && isWithin(pathname, i.bentoRoute));
}

/**
 * The persistent Bento navigation rail (T549, restructured in T573) — a slim,
 * fixed, frosted icon strip on the left (desktop only). It lists **Home + the
 * three section hubs** (Generative AI · Enterprise Search · Management), never
 * the ~22 leaf surfaces. That keeps the rail at a fixed, small height no matter
 * how many surfaces migrate, so it can never overflow the viewport the way the
 * flat console sidebar did. Each hub opens an area page that groups every
 * surface of that section as a bento mosaic; individual surfaces are reached
 * from the hub or jumped to directly via the `⌘K` command palette.
 *
 * Hidden below `md` — on mobile the header's command button + global `⌘K`
 * provide navigation without the rail eating horizontal space.
 */
export interface BentoNavRailProps {
  /**
   * The sections a product decided this reader may see, already filtered.
   * Privileges and licences are the product's to know; the rail renders.
   */
  groups: BentoNavGroup[];
  /** Where the Home button leads. */
  homeRoute: string;
  /**
   * Extra paths that should also light the Home button — a product whose bento
   * root and home page are different routes passes both.
   */
  homeAliases?: string[];
  /** Label for the Home button. Defaults to the `home.title` translation. */
  homeLabel?: string;
}

export function BentoNavRail({
  groups,
  homeRoute,
  homeAliases,
  homeLabel,
}: Readonly<BentoNavRailProps>) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  // Only sections that expose a hub route appear as area icons on the rail.
  const hubs = useMemo(
    () => groups.filter((g): g is BentoNavHub => Boolean(g.section.areaRoute)),
    [groups],
  );

  const homeActive =
    pathname === homeRoute || (homeAliases?.includes(pathname) ?? false);

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label={t("bento.nav.label", { defaultValue: "Primary" })}
        className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center gap-1 overflow-y-auto overflow-x-hidden border-r border-border/40 bg-background/55 pt-20 pb-4 backdrop-blur-xl backdrop-saturate-150 md:flex"
      >
        <RailLink
          to={homeRoute}
          icon={IconHome}
          label={homeLabel ?? t("home.title", { defaultValue: "Home" })}
          active={homeActive}
        />

        {hubs.length > 0 && <span aria-hidden className="my-1 h-px w-6 bg-border/60" />}

        {hubs.map((group) => (
          <RailLink
            key={group.section.id}
            to={group.section.areaRoute}
            icon={group.section.icon ?? FALLBACK_HUB_ICON}
            // A rail link is an icon and nothing else, so its label is the only
            // thing naming it. A section that supplied no key falls back to its
            // own id rather than to an empty string: the link stays reachable by
            // name, and the name says which section wants labelling.
            label={group.section.labelKey ? t(group.section.labelKey) : group.section.id}
            active={isSectionActive(pathname, group)}
          />
        ))}
      </nav>
    </TooltipProvider>
  );
}

function RailLink({
  to,
  icon: Icon,
  label,
  active,
}: Readonly<{ to: string; icon: TablerIcon; label: string; active: boolean }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className={`bento-tile-clickable grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition-colors duration-200 ${
            active
              ? "bento-rail-active"
              : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/60 hover:text-foreground"
          }`}
        >
          <Icon size={20} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
