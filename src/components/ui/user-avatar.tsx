import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

export interface UserAvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  /** User's given (first) name. */
  givenName?: string;
  /** User's family (last) name. May contain multiple words. */
  familyName?: string;
  /** Full display name. Used as fallback when givenName/familyName are absent. */
  name?: string;
  /** Optional avatar image URL. */
  src?: string;
  /** Alt text for the avatar image. */
  alt?: string;
}

/**
 * Compute user initials using the first letter of the given name and the
 * first letter of the LAST word of the family name.
 *
 * Example: givenName="Alexandre", familyName="da Silva Oliveira" → "AO"
 *
 * Falls back to parsing a single `name` field the same way
 * (first word + last word initials).
 */
export function getUserInitials({
  givenName,
  familyName,
  name,
}: {
  givenName?: string;
  familyName?: string;
  name?: string;
}): string {
  const first = (givenName ?? "").trim();
  const last = (familyName ?? "").trim();

  if (first || last) {
    const firstInitial = first ? first[0] : "";
    const lastWords = last.split(/\s+/).filter(Boolean);
    const lastInitial =
      lastWords.length > 0 ? lastWords[lastWords.length - 1][0] : "";
    const combined = `${firstInitial}${lastInitial}`.toUpperCase();
    if (combined) return combined;
  }

  const full = (name ?? "").trim();
  if (full) {
    const words = full.split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0][0].toUpperCase();
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return "U";
}

/**
 * UserAvatar — a neutral, brand-agnostic avatar showing user initials.
 *
 * Compatible with both Keycloak OIDC profiles (given_name/family_name claims)
 * and Spring Boot native users (firstName/lastName fields). Falls back to a
 * single `name` prop when only a full name is available.
 *
 * Renders the given image `src` when provided; otherwise shows initials using
 * {@link getUserInitials}.
 */
function UserAvatar({
  className,
  givenName,
  familyName,
  name,
  src,
  alt,
  children,
  ...props
}: UserAvatarProps) {
  const initials = getUserInitials({ givenName, familyName, name });
  const altText = alt ?? name ?? [givenName, familyName].filter(Boolean).join(" ");

  return (
    <AvatarPrimitive.Root
      data-slot="user-avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full size-8",
        "bg-muted text-muted-foreground text-xs font-semibold",
        "ring-1 ring-border",
        className,
      )}
      {...props}
    >
      {src && (
        <AvatarPrimitive.Image
          data-slot="user-avatar-image"
          src={src}
          alt={altText}
          className="aspect-square size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        data-slot="user-avatar-fallback"
        className="flex size-full items-center justify-center"
        delayMs={src ? 600 : 0}
      >
        {children ?? initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { UserAvatar };
