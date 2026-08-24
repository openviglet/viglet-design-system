import React, { type Dispatch, type SetStateAction } from "react";
import { Outlet } from "react-router-dom";
import {
  InternalSidebar,
  type InternalSidebarCount,
  type NavMainItem,
} from "./internal.sidebar";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";

// `data` is handed straight to InternalSidebar, so its shape is that
// component's to declare. Re-declaring it here is how the two came to disagree
// about whether a count is optional.
interface DataType {
  navMain: NavMainItem[];
  counts?: InternalSidebarCount[];
}

interface Props {
  icon: React.ElementType
  feature: string;
  name: string;
  urlBase?: string;
  isNew?: boolean;
  data?: DataType;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>
  onDelete?: () => void;
  onExport?: () => void;
  /**
   * VDS76 — value handed to the nested `<Outlet context={...}>`, which child
   * routes read with `useOutletContext()`. There is no other way for a routed
   * child to reach it, and it is what lets an editor's section sub-pages share
   * one form instance instead of each mounting its own.
   */
  outletContext?: unknown;
  /**
   * VDS76 — how much room the shell takes around the page.
   *
   * `comfortable` is what this component has always rendered and stays the
   * default, so no existing console moves. `compact` removes the outer padding
   * and tightens the inset, which is the spacing a console that already fills
   * its own viewport needs; adopting the shared component should not reflow it.
   */
  density?: "comfortable" | "compact";
}

const DENSITY = {
  comfortable: {
    outer: "px-1 md:px-6 lg:px-8 py-1 md:py-4",
    inset: "md:mr-1.5 md:my-1.5",
    main: "pt-2 md:pt-4",
  },
  compact: {
    outer: "px-0 py-0",
    inset: "min-w-0 md:mx-1.5",
    main: "pt-1 md:pt-2",
  },
} as const;

/**
 * The console entity page: sidebar, header and outlet in one.
 *
 * @deprecated Console-era chrome. Still exported and still supported - the
 * cutover has not started in any of the three consoles, and removal is its own
 * decision, not a side effect of this notice. New pages should use the
 * bento layer.
 *
 * @see BentoEntityShell - the bento equivalent.
 *
 * The shell renders through a render prop, so a product supplies the
 * body without the shell knowing what an entity is.
 */
export const SubPage: React.FC<Props> = ({
  outletContext,
  density = "comfortable",
  ...props
}) => {
  const spacing = DENSITY[density];
  return (
    <div className={`w-full ${spacing.outer} min-h-[calc(100svh-10.5rem)]`}>
      <div className="flex min-h-full w-full md:rounded-xl md:border md:bg-sidebar md:shadow-sm">
        <SidebarProvider
          defaultOpen={true}
          className="min-h-0!"
          style={{
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
            minHeight: 0,
          } as React.CSSProperties}
        >
          <InternalSidebar {...props} />
          <SidebarInset className={`${spacing.inset} md:rounded-xl md:border bg-background md:shadow-sm`}>
            <main className={`flex flex-1 flex-col ${spacing.main} max-md:[&_.px-6]:px-2`}>
              <Outlet context={outletContext} />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
};
