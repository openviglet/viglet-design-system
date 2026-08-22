import { Outlet } from "react-router-dom";

/**
 * The console page's outlet wrapper.
 *
 * @deprecated Console-era chrome. Still exported and still supported - the
 * cutover has not started in any of the three consoles, and removal is its own
 * decision, not a side effect of this notice. New pages should use the
 * bento layer.
 *
 * Part of the console shell; see `Page`.
 */
export const PageContent: React.FC = () => {
  return (
    <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-2 px-1 py-1 md:gap-3 md:px-2 md:py-2">
            <Outlet />
          </div>
        </div>
      </div>
  )
}
