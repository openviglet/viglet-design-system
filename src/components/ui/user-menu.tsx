import * as React from "react";
import { useTranslation } from "react-i18next";
import { IconLogout, IconUserCircle } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { UserAvatar } from "./user-avatar";

export interface UserMenuUser {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface UserMenuProps {
  /** Current user — fields mirror both Keycloak claims and native Spring Boot users. */
  user: UserMenuUser;
  /** Called when the user clicks the Account/Profile item. Receives no args. */
  onAccount?: () => void;
  /** Called when the user clicks Log out. Receives no args. */
  onSignOut?: () => void;
  /** Extra dropdown items to render between Account and Log out. */
  extraItems?: React.ReactNode;
  /** Additional class for the trigger button. */
  className?: string;
  /** Alignment of the dropdown content. */
  align?: "start" | "center" | "end";
}

/**
 * Shared user menu used in the header of every Viglet product.
 *
 * Renders a {@link UserAvatar} trigger and a dropdown with the user's name,
 * email, an Account item, optional extra items, and a Log out item. The
 * calling app provides the navigation callbacks so behavior is consistent
 * visually while allowing per-app routing/auth logic.
 */
export function UserMenu({
  user,
  onAccount,
  onSignOut,
  extraItems,
  className,
  align = "end",
}: Readonly<UserMenuProps>) {
  const { t } = useTranslation();

  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.username ||
    "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={fullName || user.username}
          className={cn(
            "cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <UserAvatar
            givenName={user.firstName}
            familyName={user.lastName}
            name={fullName || user.username}
            src={user.avatarUrl || undefined}
            alt={user.username}
            className="hover:ring-2 hover:ring-border transition-all"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align={align}
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserAvatar
              givenName={user.firstName}
              familyName={user.lastName}
              name={fullName || user.username}
              src={user.avatarUrl || undefined}
              alt={user.username}
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
              {fullName && (
                <span className="truncate font-medium">{fullName}</span>
              )}
              {user.email && (
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {onAccount && (
            <DropdownMenuItem onSelect={onAccount} className="cursor-pointer">
              <IconUserCircle />
              {t("nav.account")}
            </DropdownMenuItem>
          )}
          {extraItems}
        </DropdownMenuGroup>

        {(onAccount || extraItems) && <DropdownMenuSeparator />}

        {onSignOut && (
          <DropdownMenuItem
            onSelect={onSignOut}
            className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <IconLogout />
            {t("nav.logOut")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
