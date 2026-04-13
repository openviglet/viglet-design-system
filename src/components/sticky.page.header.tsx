import { IconDotsVertical, IconPlus } from "@tabler/icons-react";
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { GradientButton } from "./ui/gradient-button";
import { Separator } from "./ui/separator";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";

/**
 * Composite sticky header for sub-pages.
 *
 * Replaces the former `SubPageHeader` + `StickySaveBar` duplication. The root
 * is a sticky flex row with the SidebarTrigger; callers compose the title and
 * any buttons as children.
 *
 * Usage:
 * ```tsx
 * <StickyPageHeader>
 *   <StickyPageHeader.Title icon={IconSettings} feature="..." description="..." />
 *   <StickyPageHeader.Actions>
 *     <StickyPageHeader.Action label="Duplicate" onClick={...} />   // → dropdown item
 *
 *     <GradientButton variant="ghost" size="icon-sm" onClick={handleExport}>
 *       <IconDownload className="size-5!" />
 *     </GradientButton>
 *
 *     <DialogDelete feature="..." name={name} onDelete={...} open={open} setOpen={setOpen} />
 *
 *     <GradientButton type="submit" size="sm" loading={isLoading}>
 *       <IconDeviceFloppy className="size-4" />
 *       {t("forms.formActions.saveChanges")}
 *     </GradientButton>
 *
 *     <GradientButton type="button" variant="outline" size="sm" onClick={...}>
 *       <IconX className="size-4" />
 *       {t("forms.formActions.cancel")}
 *     </GradientButton>
 *   </StickyPageHeader.Actions>
 * </StickyPageHeader>
 * ```
 *
 * Only `Action` (dropdown item marker) has special handling — all other nodes
 * inside `<Actions>` render inline in the order they appear.
 *
 * @since 2026.2.26
 */

/* ───────── Title ───────── */

interface TitleProps {
  icon: React.ElementType;
  feature: string;
  description: string;
  /** When set, wraps the title in a NavLink to this route (desktop only). */
  urlBase?: string;
}

const Title: React.FC<TitleProps> = ({ icon: Icon, feature, description, urlBase }) => {
  const { isMobile, toggleSidebar } = useSidebar();

  const iconElement = (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 ring-1 ring-blue-500/10 dark:ring-blue-400/10 ${isMobile ? "cursor-pointer active:scale-95 transition-transform" : ""}`}
      onClick={isMobile ? toggleSidebar : undefined}
      onKeyDown={isMobile ? (e) => { if (e.key === "Enter" || e.key === " ") toggleSidebar(); } : undefined}
      tabIndex={isMobile ? 0 : undefined}
      role={isMobile ? "button" : undefined}
      title={isMobile ? "Open navigation" : undefined}
    >
      <Icon className="size-5! text-blue-600 dark:text-blue-400" />
    </div>
  );

  const content = (
    <div className="flex items-center gap-3">
      {iconElement}
      <div className="min-w-0">
        <h1 className="text-base font-semibold leading-tight text-foreground truncate">{feature}</h1>
        <p className="hidden md:block text-xs text-muted-foreground leading-relaxed mt-0.5 truncate">{description}</p>
      </div>
    </div>
  );

  if (urlBase && !isMobile) {
    return (
      <div className="min-w-0 flex-1">
        <NavLink to={urlBase} className="group inline-flex max-w-full">{content}</NavLink>
      </div>
    );
  }
  return <div className="min-w-0 flex-1">{content}</div>;
};
Title.displayName = "StickyPageHeaderTitle";

/* ───────── Action (dropdown item marker) ───────── */

interface ActionProps {
  label: string;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Action: React.FC<ActionProps> = () => null;
Action.displayName = "StickyPageHeaderAction";

/* ───────── Actions container ───────── */

interface ActionsProps {
  children: React.ReactNode;
  /** Label shown next to the dropdown trigger. Defaults to "Actions". */
  menuLabel?: string;
}

const Actions: React.FC<ActionsProps> = ({ children, menuLabel = "Actions" }) => {
  const navigate = useNavigate();

  // Split children: Action markers go into a dropdown; everything else renders inline.
  const menuItems: ActionProps[] = [];
  const inlineChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (
      React.isValidElement(child) &&
      (child.type as { displayName?: string })?.displayName === "StickyPageHeaderAction"
    ) {
      menuItems.push(child.props as ActionProps);
    } else {
      inlineChildren.push(child);
    }
  });

  return (
    <div className="flex items-center gap-2 shrink-0">
      {menuItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <GradientButton variant="outline" size="sm" className="gap-1.5">
              <IconDotsVertical className="size-4" />
              <span className="hidden sm:inline">{menuLabel}</span>
            </GradientButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menuItems.map((action) => {
              const ActionIcon = action.icon ?? IconPlus;
              return (
                <DropdownMenuItem
                  key={action.label}
                  disabled={action.disabled}
                  onClick={() => {
                    if (action.href) navigate(action.href);
                    if (action.onClick) action.onClick();
                  }}
                >
                  <ActionIcon className="size-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {inlineChildren}
    </div>
  );
};
Actions.displayName = "StickyPageHeaderActions";

/* ───────── Root ───────── */

interface RootProps {
  children: React.ReactNode;
}

const StickyPageHeaderRoot: React.FC<RootProps> = ({ children }) => (
  <header className="sticky top-0 z-10 -mx-4 lg:-mx-6 mb-5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div className="flex w-full items-center gap-3 px-4 lg:px-6 py-3">
      <div className="hidden md:flex items-center gap-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      </div>
      {children}
    </div>
  </header>
);

export const StickyPageHeader = Object.assign(StickyPageHeaderRoot, {
  Title,
  Actions,
  Action,
});
