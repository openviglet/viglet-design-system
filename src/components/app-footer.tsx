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

export function AppFooter({ logo, productName, version, links = [] }: Readonly<AppFooterProps>) {
  return (
    <footer className="mt-auto">
      <div className="mx-6 border-t" />
      <div className="px-6 py-3 flex items-center justify-center gap-2 flex-wrap">
        {logo}
        <span className="text-xs text-muted-foreground/70">
          {productName}{version ? ` ${version}` : ""}
        </span>
        {links.map((link) => (
          <React.Fragment key={link.label}>
            <span className="text-xs text-muted-foreground/40">·</span>
            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              {link.label}
            </a>
          </React.Fragment>
        ))}
      </div>
    </footer>
  )
}
