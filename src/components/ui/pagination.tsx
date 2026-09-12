import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The `nav` landmark for moving between pages of results, composed with
 * `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious` and
 * `PaginationNext`.
 *
 * `BentoDataTable` mounts only the rows in view and needs no pages.
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
    const { t } = useTranslation()
    return (
        <nav
            role="navigation"
            aria-label={t("common.pagination", { defaultValue: "Pagination" })}
            className={cn("mx-auto flex w-full justify-center", className)}
            {...props}
        />
    )
}

/**
 * The list of page links inside `Pagination`.
 */
const PaginationContent = React.forwardRef<
    HTMLOListElement,
    React.ComponentProps<"ol">
>(({ className, ...props }, ref) => (
    <ol
        ref={ref}
        className={cn("flex flex-row items-center gap-1", className)}
        {...props}
    />
))
PaginationContent.displayName = "PaginationContent"

/**
 * One entry in `PaginationContent`.
 */
const PaginationItem = React.forwardRef<
    HTMLLIElement,
    React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

/**
 * A link to one page. `isActive` marks the current one.
 */
function PaginationLink({
    className,
    isActive,
    size = "icon",
    children,
    ...props
}: React.ComponentProps<"a"> & {
    isActive?: boolean
    size?: "default" | "icon"
}) {
    return (
        <a
            aria-current={isActive ? "page" : undefined}
            className={cn(
                buttonVariants({
                    variant: isActive ? "outline" : "ghost",
                    size,
                }),
                isActive && "bg-accent text-accent-foreground",
                className
            )}
            {...props}
        >
            {children}
        </a>
    )
}

/**
 * The link to the previous page, labelled for a screen reader.
 */
function PaginationPrevious({
    className,
    ...props
}: React.ComponentProps<typeof PaginationLink>) {
    const { t } = useTranslation()
    return (
        <PaginationLink
            aria-label={t("common.goToPreviousPage", { defaultValue: "Go to previous page" })}
            size="default"
            className={cn("gap-1 pl-2.5", className)}
            {...props}
        >
            <ChevronLeft className="h-4 w-4" />
            <span>{t("common.previous", { defaultValue: "Previous" })}</span>
        </PaginationLink>
    )
}

/**
 * The link to the next page, labelled for a screen reader.
 */
function PaginationNext({
    className,
    ...props
}: React.ComponentProps<typeof PaginationLink>) {
    const { t } = useTranslation()
    return (
        <PaginationLink
            aria-label={t("common.goToNextPage", { defaultValue: "Go to next page" })}
            size="default"
            className={cn("gap-1 pr-2.5", className)}
            {...props}
        >
            <span>{t("common.next", { defaultValue: "Next" })}</span>
            <ChevronRight className="h-4 w-4" />
        </PaginationLink>
    )
}

/**
 * Stands in for the page numbers left out between two links.
 */
function PaginationEllipsis({
    className,
    ...props
}: React.ComponentProps<"span">) {
    const { t } = useTranslation()
    return (
        <span
            aria-hidden="true"
            className={cn("flex h-9 w-9 items-center justify-center", className)}
            {...props}
        >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t("common.morePages", { defaultValue: "More pages" })}</span>
        </span>
    )
}

export {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
}
