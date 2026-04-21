import { type VariantProps } from "class-variance-authority"
import * as React from "react"
import { NavLink, type To } from "react-router-dom"

import { cn } from "@/lib/utils"
import { gradientButtonVariants } from "../ui/gradient-button"

function GradientButtonLink({
    className,
    variant,
    size,
    to,
    onClick,
    children,
}: Omit<React.ComponentProps<"a">, "href"> &
    VariantProps<typeof gradientButtonVariants> & {
        to: To
    }) {
    const classes = cn(gradientButtonVariants({ variant, size, className }))

    return (
        <NavLink
            to={to}
            data-slot="gradient-button"
            className={classes}
            onClick={(e) => {
                const pathname = typeof to === "string" ? to : (to as { pathname?: string }).pathname
                if (pathname && globalThis.location.pathname === pathname) {
                    globalThis.location.reload()
                }
                if (onClick) onClick(e as unknown as React.MouseEvent<HTMLAnchorElement, MouseEvent>)
            }}
        >
            {children}
        </NavLink>
    )
}

export { GradientButtonLink }
