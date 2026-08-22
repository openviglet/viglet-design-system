import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/contexts/user.context";
import { IconBuildingCommunity, IconBuildingSkyscraper, IconKeyboard, IconLogout, IconSparkles, IconUserCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";

/**
 * User avatar + dropdown styled to harmonize with the Bento UI.
 *
 * Uses the same Radix DropdownMenu primitives as the design-system
 * `UserMenu`, but the surface (`.bento-dropdown`) and items
 * (`.bento-dropdown-item`) carry the frosted-glass look and iOS spring
 * easing so it feels like part of the bento language.
 */
export interface BentoUserMenuProps {
  /** Where the account entry leads. */
  accountRoute: string;
  /** Where signing out goes — a full navigation, not a router one. */
  logoutUrl: string;
  /**
   * Where the organizations entry leads. Omit to hide it.
   *
   * A route rather than a feature flag: whether a product has tenancy, and
   * whether this reader may see it, are questions only the product can answer,
   * and answering them by passing or omitting a route means the package never
   * has to mirror a feature model it cannot see.
   */
  organizationsRoute?: string;
  /** Where tenant administration leads. Omit to hide it. */
  tenantAdminRoute?: string;
  /** Open the keyboard-shortcut guide. Omit to hide the entry. */
  onOpenShortcuts?: () => void;
  /** Replay the first-run tour. Omit to hide the entry. */
  onReplayTour?: () => void;
}

export function BentoUserMenu({
  accountRoute,
  logoutUrl,
  organizationsRoute,
  tenantAdminRoute,
  onOpenShortcuts,
  onReplayTour,
}: Readonly<BentoUserMenuProps>) {
  const { user } = useCurrentUser();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.username ||
    "";

  // While the user is still loading (empty state), keep the slot reserved
  // so the header doesn't reflow when the avatar lands.
  if (!user.username) {
    return <div className="h-9 w-9 rounded-full bg-muted/40" aria-hidden />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={fullName || user.username}
          className="bento-tile-clickable cursor-pointer rounded-full p-0.5 ring-1 ring-border/60 outline-none transition-shadow duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] bento-ring hover:ring-2 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar
            givenName={user.firstName}
            familyName={user.lastName}
            name={fullName || user.username}
            src={user.avatarUrl || undefined}
            alt={user.username}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="bento-dropdown min-w-64 p-2"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm">
            <span className="rounded-full p-0.5 ring-1 ring-border/60">
              <UserAvatar
                givenName={user.firstName}
                familyName={user.lastName}
                name={fullName || user.username}
                src={user.avatarUrl || undefined}
                alt={user.username}
              />
            </span>
            <div className="grid flex-1 text-left text-sm leading-tight">
              {fullName && <span className="truncate font-medium">{fullName}</span>}
              {user.email && (
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5 bg-border/50" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => navigate(accountRoute)}
            className="bento-dropdown-item cursor-pointer gap-2 px-3 py-2"
          >
            <IconUserCircle size={18} />
            {t("nav.account")}
          </DropdownMenuItem>
          {organizationsRoute && (
            <DropdownMenuItem
              onSelect={() => navigate(organizationsRoute)}
              className="bento-dropdown-item cursor-pointer gap-2 px-3 py-2"
            >
              <IconBuildingCommunity size={18} />
              {t("nav.organizations", { defaultValue: "Organizations" })}
            </DropdownMenuItem>
          )}
          {tenantAdminRoute && (
            <DropdownMenuItem
              onSelect={() => navigate(tenantAdminRoute)}
              className="bento-dropdown-item cursor-pointer gap-2 px-3 py-2"
            >
              <IconBuildingSkyscraper size={18} />
              {t("nav.tenantAdmin", { defaultValue: "Tenant administration" })}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {(onOpenShortcuts || onReplayTour) && (
          <>
            <DropdownMenuSeparator className="my-1.5 bg-border/50" />
            <DropdownMenuGroup>
              {onReplayTour && (
                <DropdownMenuItem
                  onSelect={() => onReplayTour()}
                  className="bento-dropdown-item cursor-pointer gap-2 px-3 py-2"
                >
                  <IconSparkles size={18} />
                  {t("bento.tour.replay", { defaultValue: "Take the tour" })}
                </DropdownMenuItem>
              )}
              {onOpenShortcuts && (
                <DropdownMenuItem
                  onSelect={() => onOpenShortcuts()}
                  className="bento-dropdown-item cursor-pointer gap-2 px-3 py-2"
                >
                  <IconKeyboard size={18} />
                  {t("bento.shortcuts.title", { defaultValue: "Keyboard shortcuts" })}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator className="my-1.5 bg-border/50" />

        <DropdownMenuItem
          onSelect={() => { globalThis.location.href = logoutUrl; }}
          className="bento-dropdown-item cursor-pointer gap-2 px-3 py-2 bento-item-danger"
        >
          <IconLogout size={18} />
          {t("nav.logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
