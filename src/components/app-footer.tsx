import React from "react"

interface FooterLink {
  label: string;
  href: string;
}

interface AppFooterProps {
  logo?: React.ReactNode;
  productName: string;
  version?: string;
  links?: FooterLink[];
}

/**
 * A page footer: a hairline, then the product's mark, name and version, and a
 * few links that open in a new tab.
 *
 * It is `mt-auto`, so it expects a shell that is a flex column whose main grows.
 * No bento shell mounts one yet, and a page does not grow a footer of its own.
 */
export function AppFooter({ logo, productName, version, links = [] }: Readonly<AppFooterProps>) {
  return (
    <footer className="mt-auto">
      <div className="mx-6 border-t" />
      <div className="px-6 py-3 flex items-center justify-center gap-2 flex-wrap">
        {logo}
        <span className="text-xs text-muted-foreground">
          {productName}{version ? ` ${version}` : ""}
        </span>
        {links.map((link) => (
          <React.Fragment key={link.label}>
            <span aria-hidden="true" className="text-xs text-muted-foreground/40">·</span>
            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          </React.Fragment>
        ))}
      </div>
    </footer>
  )
}
