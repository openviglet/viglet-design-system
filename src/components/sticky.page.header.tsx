import { IconDeviceFloppy, IconDotsVertical, IconPlus, IconX } from "@tabler/icons-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { DialogDelete } from "./dialog.delete";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { GradientButton } from "./ui/gradient-button";
import { Separator } from "./ui/separator";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";

/* ── Composite marker sub-component (mirrors SubPageHeader.Action) ── */

interface ActionProps {
  label: string;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const StickyPageHeaderAction: React.FC<ActionProps> = () => null;
StickyPageHeaderAction.displayName = "StickyPageHeaderAction";

/* ── Main component ── */

interface Props {
  icon: React.ElementType;
  feature: string;
  /** Longer description rendered below the feature title. */
  description: string;
  /** Entity name passed to the DialogDelete confirmation. */
  name?: string;
  /** Base route used as a link on the title when not on mobile. */
  urlBase?: string;
  /** When true, renders a Save button (type=submit) alongside Cancel. */
  showSave?: boolean;
  /** When provided, renders a Cancel button calling this handler. */
  onCancel?: () => void;
  /** Disables the Save button and shows a loading state. */
  loading?: boolean;
  /** Disables the Save button. */
  disabled?: boolean;
  /** Delete-dialog wiring (optional). */
  onDelete?: () => void;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  /** StickyPageHeader.Action children to populate the "Actions" dropdown. */
  children?: React.ReactNode;
}

/**
 * Sticky header for sub-pages that unifies the former `SubPageHeader`
 * (icon + feature title + description + sidebar trigger) with the former
 * `StickySaveBar` (Save / Cancel actions) into a single sticky bar.
 *
 * @since 2026.2.4
 */
const StickyPageHeaderComponent: React.FC<Props> = ({
  icon: Icon,
  feature,
  description,
  name,
  urlBase,
  showSave,
  onCancel,
  loading,
  disabled,
  onDelete,
  open,
  setOpen,
  children,
}) => {
  const { isMobile, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Extract actions from marker children
  const actions: ActionProps[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && (child.type as { displayName?: string })?.displayName === "StickyPageHeaderAction") {
      actions.push(child.props as ActionProps);
    }
  });

  const iconElement = Icon && (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 ring-1 ring-blue-500/10 dark:ring-blue-400/10 ${isMobile ? "cursor-pointer active:scale-95 transition-transform" : ""}`}
      onClick={isMobile ? toggleSidebar : undefined}
      onKeyDown={isMobile ? (e) => { if (e.key === "Enter" || e.key === " ") toggleSidebar(); } : undefined}
      tabIndex={isMobile ? 0 : undefined}
      title={isMobile ? "Open navigation" : undefined}
    >
      <Icon className="size-5! text-blue-600 dark:text-blue-400" />
    </div>
  );

  const headerContent = (
    <div className="flex items-center gap-3">
      {iconElement}
      <div className="min-w-0">
        <h1 className="text-base font-semibold leading-tight text-foreground truncate">{feature}</h1>
        <p className="hidden md:block text-xs text-muted-foreground leading-relaxed mt-0.5 truncate">{description}</p>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-10 -mx-4 lg:-mx-6 mb-5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6 py-3">
        <div className="hidden md:flex items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
        </div>
        <div className="min-w-0 flex-1">
          {urlBase && !isMobile ? (
            <NavLink to={urlBase} className="group inline-flex max-w-full">
              {headerContent}
            </NavLink>
          ) : (
            headerContent
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <GradientButton variant="outline" size="sm" className="gap-1.5">
                  <IconDotsVertical className="size-4" />
                  <span className="hidden sm:inline">Actions</span>
                </GradientButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action) => {
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
          {open !== undefined && onDelete !== undefined && setOpen !== undefined && name !== undefined && (
            <DialogDelete feature={feature} name={name} onDelete={onDelete} open={open} setOpen={setOpen} />
          )}
          {showSave && (
            <>
              <GradientButton type="submit" size="sm" loading={loading} disabled={disabled}>
                <IconDeviceFloppy className="size-4" />
                {t("forms.formActions.saveChanges")}
              </GradientButton>
              {onCancel && (
                <GradientButton type="button" variant="outline" size="sm" onClick={onCancel}>
                  <IconX className="size-4" />
                  {t("forms.formActions.cancel")}
                </GradientButton>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export const StickyPageHeader = Object.assign(StickyPageHeaderComponent, {
  Action: StickyPageHeaderAction,
});
