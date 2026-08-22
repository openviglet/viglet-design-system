import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px]",
    {
        variants: {
            variant: {
                // The primary action is the brand accent, so it reads tokens
                // rather than a hue: a product re-keys --vg-accent-from/-to at
                // the root and this button follows. The tokens are already
                // resolved per theme, which is why no dark: twin remains — the
                // three sibling variants below keep their fixed semantic hues,
                // because "destructive" does not change colour with the brand.
                default: [
                    "bg-gradient-to-r from-[var(--vg-accent-fill-from)] to-[var(--vg-accent-fill-to)] text-white",
                    "shadow-md shadow-[var(--vg-accent-shadow)]",
                    "hover:from-[var(--vg-accent-fill-from-hover)] hover:to-[var(--vg-accent-fill-to-hover)]",
                    "hover:shadow-lg hover:shadow-[var(--vg-accent-shadow-hover)]",
                    "focus-visible:ring-[var(--vg-accent-ring)]",
                ].join(" "),
                secondary: [
                    "bg-gradient-to-r from-slate-600 to-slate-700 text-white",
                    "shadow-md shadow-slate-500/25",
                    "hover:from-slate-700 hover:to-slate-800",
                    "hover:shadow-lg hover:shadow-slate-500/30",
                    "focus-visible:ring-slate-500/50",
                    "dark:from-slate-500 dark:to-slate-600",
                    "dark:shadow-slate-500/20",
                    "dark:hover:from-slate-600 dark:hover:to-slate-700",
                    "dark:hover:shadow-slate-500/25",
                    "dark:focus-visible:ring-slate-400/50",
                ].join(" "),
                destructive: [
                    "bg-gradient-to-r from-red-600 to-rose-600 text-white",
                    "shadow-md shadow-red-500/25",
                    "hover:from-red-700 hover:to-rose-700",
                    "hover:shadow-lg hover:shadow-red-500/30",
                    "focus-visible:ring-red-500/50",
                    "dark:from-red-500 dark:to-rose-500",
                    "dark:shadow-red-500/20",
                    "dark:hover:from-red-600 dark:hover:to-rose-600",
                    "dark:hover:shadow-red-500/25",
                    "dark:focus-visible:ring-red-400/50",
                ].join(" "),
                success: [
                    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
                    "shadow-md shadow-emerald-500/25",
                    "hover:from-emerald-700 hover:to-teal-700",
                    "hover:shadow-lg hover:shadow-emerald-500/30",
                    "focus-visible:ring-emerald-500/50",
                    "dark:from-emerald-500 dark:to-teal-500",
                    "dark:shadow-emerald-500/20",
                    "dark:hover:from-emerald-600 dark:hover:to-teal-600",
                    "dark:hover:shadow-emerald-500/25",
                    "dark:focus-visible:ring-emerald-400/50",
                ].join(" "),
                // The same primary action at two lighter weights — accent, not
                // a hue, for the same reason `default` is.
                outline: [
                    "border-2 border-[var(--vg-accent-fg)] text-[var(--vg-accent-fg)] bg-transparent",
                    "hover:bg-[var(--vg-accent-fill-from)] hover:text-white",
                    "shadow-sm hover:shadow-md hover:shadow-[var(--vg-accent-shadow)]",
                    "focus-visible:ring-[var(--vg-accent-ring)]",
                ].join(" "),
                ghost: [
                    "bg-transparent text-[var(--vg-accent-fg)]",
                    "hover:bg-[var(--vg-accent-surface)]",
                    "focus-visible:ring-[var(--vg-accent-ring)]",
                ].join(" "),
            },
            size: {
                default: "h-11 px-5 py-2 has-[>svg]:px-4",
                sm: "h-9 rounded-md gap-1.5 px-4 has-[>svg]:px-3 text-xs",
                lg: "h-12 rounded-md px-8 has-[>svg]:px-6 text-base",
                icon: "size-11",
                "icon-sm": "size-9",
                "icon-lg": "size-12",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function GradientButton({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof gradientButtonVariants> & {
        asChild?: boolean
        loading?: boolean
    }) {
    const classes = cn(gradientButtonVariants({ variant, size, className }))
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="gradient-button"
            className={classes}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {props.children}
                </>
            ) : (
                props.children
            )}
        </Comp>
    )
}

export { GradientButton, gradientButtonVariants }
