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

/** What the badge on a hub shows: its items' counts added up, or nothing at zero. */
function sectionCount(group: BentoNavGroup): number {
  return group.items.reduce((sum, item) => sum + (item.count && item.count > 0 ? item.count : 0), 0);
}

/**
 * The fixed rail down the left edge, with Home and one link per section hub and
 * never the leaf surfaces.
 *
 * Listing hubs rather than surfaces keeps the rail a fixed, small height however
 * many surfaces a product has, so it cannot overflow the viewport the way a flat
 * console sidebar did. Each hub opens its section's area, where the surfaces sit
 * as a bento mosaic, and a surface is reached from there or from the command
 * palette. `BentoShell` takes it as `rail` and reserves its gutter.
 *
 * VDS181 — each link shows its label under the icon, since a glyph alone does
 * not carry an abstract section and the rail was learned by hovering. A section
 * with no `labelKey` keeps the icon alone, with its id in a tooltip. A hub also
 * shows the total of its items' `count`, on the destination that owns it. It
 * stays one level: no groups, no collapse state.
 *
 * Hidden below `md`, where the header's palette trigger and the global shortcut
 * navigate instead. The console era's collapsible `Sidebar` is not for a bento page.
 */
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
        className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center gap-1 overflow-y-auto overflow-x-hidden border-r border-border/40 bg-background/55 pt-20 pb-[calc(1rem+var(--bento-rail-foot,0px))] backdrop-blur-xl backdrop-saturate-150 md:flex"
      >
        <RailLink
          to={homeRoute}
          icon={IconHome}
          label={homeLabel ?? t("home.title", { defaultValue: "Home" })}
          shown
          active={homeActive}
        />

        {hubs.length > 0 && <span aria-hidden className="my-1 h-px w-6 bg-border/60" />}

        {hubs.map((group) => (
          <RailLink
            key={group.section.id}
            to={group.section.areaRoute}
            icon={group.section.icon ?? FALLBACK_HUB_ICON}
            // A section that supplied no key is named by its own id rather than
            // an empty string: the link stays reachable by name, and the name
            // says which section wants labelling. That id is not a label a reader
            // should see, so it stays in the tooltip and the accessible name.
            label={group.section.labelKey ? t(group.section.labelKey) : group.section.id}
            shown={Boolean(group.section.labelKey)}
            count={sectionCount(group)}
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
  shown,
  count = 0,
  active,
}: Readonly<{ to: string; icon: TablerIcon; label: string; shown: boolean; count?: number; active: boolean }>) {
  const { t } = useTranslation();
  const waiting = count > 0 ? t("bento.nav.count", { count, defaultValue: "{{count}} waiting" }) : null;
  const link = (
    <Link
      to={to}
      aria-label={waiting ? `${label}, ${waiting}` : label}
      aria-current={active ? "page" : undefined}
      className={`group flex w-full shrink-0 flex-col items-center gap-1 px-1 py-0.5 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`bento-tile-clickable relative grid h-11 w-11 place-items-center rounded-2xl border transition-colors duration-200 ${
          active
            ? "bento-rail-active"
            : "border-transparent group-hover:border-border/60 group-hover:bg-card/60"
        }`}
      >
        <Icon size={20} />
        {count > 0 && (
          <span
            aria-hidden
            data-slot="bento-rail-count"
            className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[0.6875rem] leading-4 text-primary-foreground"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      {shown && (
        <span aria-hidden title={label} className="w-full truncate text-center text-[0.6875rem] leading-4">
          {label}
        </span>
      )}
    </Link>
  );
  if (shown) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
