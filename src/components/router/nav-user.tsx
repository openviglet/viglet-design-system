import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { VigUser } from "@/models/user"
import React from "react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"

interface NavUserProps {
  user: VigUser
  accountUrl?: string
  logoutUrl?: string
  onLogout?: () => void
}

export function NavUser({
  user,
  accountUrl,
  logoutUrl,
  onLogout,
}: Readonly<NavUserProps>) {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else if (logoutUrl) {
      globalThis.location.href = logoutUrl
    }
  };
  const initials = React.useMemo(() => {
    const first = user.firstName || '';
    const last = user.lastName || '';

    if (!first && !last) return ' ';

    const fullName = `${first} ${last}`.trim();
    const nameParts = fullName.split(' ').filter(Boolean);

    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return (
      nameParts[0].charAt(0).toUpperCase() +
      (nameParts.at(-1)?.charAt(0).toUpperCase() ?? '')
    );
  }, [user]);

  const avatarSrc = user?.avatarUrl || '';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {avatarSrc && <AvatarImage src={avatarSrc} alt={user.username} />}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.firstName} {user.lastName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={user.username} />}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.firstName} {user.lastName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountUrl && (
              <>
                <DropdownMenuGroup>
                  <NavLink to={accountUrl} className="w-full">
                    <DropdownMenuItem>
                      <IconUserCircle />
                      {t("nav.account")}
                    </DropdownMenuItem>
                  </NavLink>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <IconLogout />
              <span>{t("nav.logOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
