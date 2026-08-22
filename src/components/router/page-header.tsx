import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { useBreadcrumb } from "@/contexts/breadcrumb.context";
import { IconChevronLeft } from "@tabler/icons-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { ModeToggle } from "../mode-toggle";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";

interface PageHeaderProps {
  icon?: React.ElementType;
  title: string;
  urlBase?: string;
  children?: React.ReactNode;
}

/**
 * The console page header: a tinted icon chip, a title and a row of actions.
 *
 * @deprecated Console-era chrome. Still exported and still supported - the
 * cutover in Shio and Turing is not finished, and removal is its own
 * decision, not a side effect of this notice. New pages should use the
 * bento layer.
 *
 * @see BentoHero - the bento equivalent.
 *
 * `BentoHero` takes the same title/subtitle/icon and adds a tone, so
 * the chip follows the product accent rather than the component.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ icon: PageIcon, title, urlBase, children }) => {
  const { items } = useBreadcrumb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const lastItem = items.length > 0 ? items[items.length - 1] : null;
  const parentItem = items.length > 1 ? items[items.length - 2] : null;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Desktop: sidebar trigger on the left */}
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 hidden md:block"
        />

        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center gap-1">
          {PageIcon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg vg-accent-chip ring-1 mr-1">
              <PageIcon className="size-4.5! vg-accent-text" />
            </div>
          )}
          {urlBase ? (
            <Breadcrumb>
              <BreadcrumbList>
                {items.map((item, index) => (
                  <React.Fragment key={item.label}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <NavLink to={item.href}>{item.label}</NavLink>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <h1 className="text-base font-semibold">{title}</h1>
          )}
        </div>

        {/* Mobile: back button + icon + current page title */}
        <div className="flex md:hidden items-center gap-2 min-w-0 flex-1">
          {parentItem?.href && (
            <button
              type="button"
              title={t("common.goBack")}
              onClick={() => navigate(parentItem.href!)}
              className="shrink-0 flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
            >
              <IconChevronLeft className="size-4" />
            </button>
          )}
          {PageIcon && (
            <div className="flex shrink-0 h-7 w-7 items-center justify-center rounded-lg vg-accent-chip ring-1">
              <PageIcon className="size-3.5! vg-accent-text" />
            </div>
          )}
          <span className="text-sm font-semibold truncate">
            {lastItem?.label ?? title}
          </span>
        </div>

        {/* Right side: mode toggle (desktop only) + sidebar trigger (mobile only) */}
        <div className="ml-auto flex items-center gap-2">
          {children && <div className="hidden md:flex items-center">{children}</div>}
          <div className="hidden md:block">
            <ModeToggle />
          </div>
          <SidebarTrigger className="md:hidden" />
        </div>
      </div>
    </header>
  )
}
