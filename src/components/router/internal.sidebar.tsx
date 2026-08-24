import { IconDownload } from "@tabler/icons-react";
import React, { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { DialogDelete } from "./dialog.delete";
import { GradientButton } from "../ui/gradient-button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";

/** One entry in the sidebar's main navigation, optionally with sub-entries. */
export interface NavMainItem {
  title: string;
  /**
   * Navigable URL fragment. VDS76 — optional: an item with `children` and no
   * `url` renders as a `SidebarGroupLabel` heading them, which is how a product
   * groups related sub-pages without inventing a clickable parent.
   */
  url?: string;
  icon?: React.ElementType;
  children?: NavMainItem[];
  /**
   * VDS76 — keeps the item visible while an entity is being created (`isNew`).
   * Omitted, it falls back to the legacy `url === "/detail"` heuristic, so
   * every existing caller behaves as before.
   */
  showOnNew?: boolean;
}

/** An item with children and no url is a heading, not a destination. */
const isGroupLabel = (item: NavMainItem): boolean =>
  !item.url && (item.children?.length ?? 0) > 0;

/**
 * VDS76 — active on segment boundaries only.
 *
 * A plain `startsWith` lights `/field` up when the path is `/field-coverage`,
 * because one is a string prefix of the other. A parent is also active when any
 * of its children is, which is what makes a group label highlight.
 */
const isItemActive = (
  item: NavMainItem,
  urlBase: string | undefined,
  pathname: string,
): boolean => {
  if (item.url) {
    const target = (urlBase ?? "") + item.url;
    if (pathname === target || pathname.startsWith(target + "/")) return true;
  }
  return item.children?.some((c) => isItemActive(c, urlBase, pathname)) ?? false;
};

/**
 * One row of the indexing group: a labelled, formatted count with an optional
 * icon. `count` is optional because a caller renders the row before the number
 * arrives — sub.page.tsx passes this straight through, and the two declared it
 * separately until typing this one showed they disagreed about exactly that.
 */
export interface InternalSidebarCount {
  title: string;
  count?: number;
  icon?: React.ElementType;
}

interface InternalSidebarProps {
  icon: React.ElementType;
  feature: string;
  name: string;
  urlBase?: string;
  isNew?: boolean;
  data?: {
    counts?: InternalSidebarCount[];
    navMain: NavMainItem[];
  };
  onDelete?: () => void;
  onExport?: () => void;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const formatCount = (value?: number) => (value ?? 0).toLocaleString();

const renderNavItems = (
  items: NavMainItem[],
  urlBase: string | undefined,
  pathname: string,
  isCollapsed: boolean,
  onNavigate?: () => void
): ReactNode =>
  items.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isItemActive(item, urlBase, pathname)}
        asChild
      >
        <NavLink to={(urlBase ?? "") + (item.url ?? "")} onClick={onNavigate}>
          {item.icon && <item.icon className="size-5!" />}
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
      {!isCollapsed && item.children && item.children.length > 0 && (
        <SidebarMenu className="ml-4">
          {renderNavItems(item.children, urlBase, pathname, isCollapsed, onNavigate)}
        </SidebarMenu>
      )}
    </SidebarMenuItem>
  ));

/**
 * The console entity sidebar: a header, indexing counts and a nav tree.
 *
 * @deprecated Console-era chrome. Still exported and still supported - the
 * cutover has not started in any of the three consoles, and removal is its own
 * decision, not a side effect of this notice. New pages should use the
 * bento layer.
 *
 * @see BentoNavRail - the bento equivalent.
 *
 * The rail takes its nav array as a prop rather than importing the
 * product's routes, which is what lets one rail serve three products.
 */
export const InternalSidebar: React.FC<InternalSidebarProps> = ({
  icon: Icon,
  feature,
  name,
  urlBase,
  isNew,
  data,
  onDelete,
  onExport,
  open,
  setOpen,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const onNavigate = isMobile ? () => setOpenMobile(false) : undefined;

  return (
    <Sidebar collapsible="icon" variant="inset" position="absolute">
      <SidebarHeader className="pb-3">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center">
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <NavLink to={urlBase ?? "#"} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg vg-accent-chip ring-1">
                  <Icon className="size-5! vg-accent-text" />
                </div>
                {!isCollapsed && (
                  <span className="text-sm font-semibold whitespace-nowrap truncate">
                    {isNew ? t("sidebar.new", { feature }) : name}
                  </span>
                )}
              </NavLink>
            </SidebarMenuButton>
            {!isCollapsed && (
              <div className="flex items-center gap-1 mr-auto">
                {!isNew && onExport && (
                  <GradientButton
                    variant="ghost"
                    size="icon-sm"
                    onClick={onExport}
                  >
                    <IconDownload className="size-5!" />
                  </GradientButton>
                )}
                {!isNew && onDelete && setOpen && (
                  <DialogDelete
                    feature={feature}
                    name={name}
                    onDelete={onDelete}
                    open={open ?? false}
                    setOpen={setOpen}
                  />
                )}
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {data?.counts && data.counts.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.indexing")}</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2 pt-4">
              <SidebarMenu>
                {data.counts.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title + ": " + formatCount(item.count)}
                      variant="outline"
                    >
                      {item.icon && <item.icon className="size-5!" />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {!isCollapsed && (
                      <SidebarMenuBadge>
                        {formatCount(item.count)}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {(() => {
          // VDS76 — items with a url stay in the feature group; items without
          // one are headings and become a group of their own, so a product can
          // section its sub-pages without a clickable parent.
          const allItems = data?.navMain ?? [];
          const visibleItems = isNew
            ? allItems.filter((item) => item.showOnNew ?? item.url === "/detail")
            : allItems;
          const flatItems = visibleItems.filter((item) => !isGroupLabel(item));
          const groupItems = visibleItems.filter(isGroupLabel);
          return (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>{feature}</SidebarGroupLabel>
                <SidebarGroupContent className="flex flex-col gap-2">
                  <SidebarMenu>
                    {renderNavItems(flatItems, urlBase, pathname, isCollapsed, onNavigate)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              {groupItems.map((group) => (
                <SidebarGroup key={group.title}>
                  <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                  <SidebarGroupContent className="flex flex-col gap-2">
                    <SidebarMenu>
                      {renderNavItems(
                        group.children ?? [],
                        urlBase,
                        pathname,
                        isCollapsed,
                        onNavigate,
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </>
          );
        })()}
      </SidebarContent>
    </Sidebar>
  );
};
