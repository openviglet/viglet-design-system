import { Outlet } from "react-router-dom";

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
