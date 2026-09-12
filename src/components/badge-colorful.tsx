import { Badge } from "@/components/ui/badge";
import { cn, getHashedColor } from "@/lib/utils";
import React from "react";

interface BadgeColorfulProps {
    text: string;
    href?: string;
    onClick?: (href: string) => void;
    className?: string;
    prefix?: React.ReactNode;
}

/**
 * `text` is an entity name out of the consumer's own content — `dialog.delete`
 * passes `usage.name` straight in — so nothing here may treat it as markup or
 * as a selector. It is rendered as a text node, and the per-instance colour it
 * hashes to is carried by custom properties on the element rather than by a
 * `<style>` element that spliced the name into `.dark [title="…"]`.
 * `.vg-badge-colorful` in src/styles/index.css reads those properties and is
 * what swaps them for dark mode.
 */
export const BadgeColorful: React.FC<BadgeColorfulProps> = ({
    text,
    href,
    onClick,
    className,
    prefix,
}) => {
    if (!text) return null;

    const colors = getHashedColor(text);

    return (
        <Badge
            variant="outline"
            title={text}
            onClick={() => href && onClick?.(href)}
            className={cn(
                "vg-badge-colorful text-xs font-medium px-2 py-0.5 gap-1.5 cursor-pointer transition-all hover:opacity-80",
                `dynamic-badge-${text.length}`,
                className,
            )}
            style={{
                // Both palettes ride on the element; the stylesheet picks one.
                "--badge-bg": colors.light.bg,
                "--badge-text": colors.light.text,
                "--badge-border": colors.light.border,
                "--badge-dark-bg": colors.dark.bg,
                "--badge-dark-text": colors.dark.text,
                "--badge-dark-border": colors.dark.border,
            } as React.CSSProperties}
        >
            {prefix}
            <span>{text}</span>
        </Badge>
    );
};
