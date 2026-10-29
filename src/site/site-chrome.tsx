import type { AnchorHTMLAttributes, ReactNode } from "react"

/** A link in the nav or the footer. */
export interface SiteLink {
  href: string
  label: string
}

/**
 * How a product's image is drawn: `tile` is a square app icon, sized square
 * with a corner radius; `mark` is a shape that carries its own silhouette,
 * sized by height alone, unrounded, its shadow following the alpha channel.
 */
export type SiteLogoShape = "tile" | "mark"

/** The product's mark and name, linking home. */
export interface SiteBrand {
  href: string
  name: string
  /** Drawn at 32 px; a square tile with a corner radius unless `logoShape` is `mark`. */
  logo?: string
  logoShape?: SiteLogoShape
}

const shapeClass = (shape: SiteLogoShape | undefined) => (shape === "mark" ? "vg-site-mark" : undefined)

/**
 * A call to action drawn as a button: `primary` is the brand fill, `ghost` the
 * panel beside it. An anchor, because on a static page every action is a link.
 */
export function SiteButton({
  variant = "primary",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: "primary" | "ghost" }) {
  return <a {...props} className={["vg-site-btn", `vg-site-btn-${variant}`, className].filter(Boolean).join(" ")} />
}

function BrandLink({ brand, className }: { brand: SiteBrand; className: string }) {
  return (
    <a className={className} href={brand.href}>
      {brand.logo ? <img className={shapeClass(brand.logoShape)} src={brand.logo} alt="" /> : null}
      <span className="vg-site-brand-name">{brand.name}</span>
    </a>
  )
}

/**
 * The sticky top bar of a product site: the brand, an optional chip linking the
 * family the product belongs to, the section links and the actions (a download,
 * the repository, the theme toggle). The links hide below 1180 px and the
 * actions stay, because a reader who cannot reach the download has lost more.
 * On a phone (620 px) the chip and the ghost actions go too, the primary
 * action tightens and the brand name truncates, so the bar fits a 320 px screen.
 */
export function SiteNav({
  brand,
  parent,
  links = [],
  actions,
}: {
  brand: SiteBrand
  /** The family chip, e.g. "part of alegauss". `pre` is the short lead-in. */
  parent?: { href: string; name: string; title?: string; pre?: string }
  links?: readonly SiteLink[]
  actions?: ReactNode
}) {
  return (
    <nav className="vg-site-nav">
      <div className="vg-site-wrap">
        <div className="vg-site-nav-left">
          <BrandLink brand={brand} className="vg-site-brand" />
          {parent ? (
            <a className="vg-site-parent" href={parent.href} title={parent.title}>
              {parent.pre ? <span className="vg-site-parent-pre">{parent.pre}</span> : null}
              <b>{parent.name}</b>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </a>
          ) : null}
        </div>
        <div className="vg-site-nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          {actions}
        </div>
      </div>
    </nav>
  )
}

/**
 * The landing hero: the product tile (or mark, by `icon.logoShape`), a badge, a two-part headline whose second
 * half takes the brand gradient, the lead sentence, the actions, the `feature`,
 * a meta line and the pills. `children` renders after the content, inside the
 * header, for a decoration the product draws itself.
 *
 * The actions carry `data-twin="omit"`: a Markdown twin made from this markup
 * drops the call to action, which converts a reader and costs an agent words.
 * The `feature` does not: what a product shows under its call to action (a
 * session, a demo) is content, and the twin keeps it.
 */
export function SiteHero({
  icon,
  badge,
  title,
  titleAccent,
  sub,
  actions,
  feature,
  meta = [],
  pills = [],
  id = "top",
  children,
}: {
  icon?: { src: string; alt: string; logoShape?: SiteLogoShape }
  badge?: ReactNode
  title: ReactNode
  titleAccent?: ReactNode
  sub?: ReactNode
  actions?: ReactNode
  feature?: ReactNode
  meta?: readonly ReactNode[]
  pills?: readonly ReactNode[]
  id?: string
  children?: ReactNode
}) {
  return (
    <header className="vg-site-hero" id={id}>
      <div className="vg-site-wrap">
        {icon ? (
          <img className={["vg-site-hero-icon", shapeClass(icon.logoShape)].filter(Boolean).join(" ")} src={icon.src} alt={icon.alt} />
        ) : null}
        {badge ? (
          <div className="vg-site-badge">
            <span className="vg-site-dot" /> {badge}
          </div>
        ) : null}
        <h1>
          {title}
          {titleAccent ? (
            <>
              <br />
              <span className="vg-site-grad">{titleAccent}</span>
            </>
          ) : null}
        </h1>
        {sub ? <p className="vg-site-sub">{sub}</p> : null}
        {actions ? (
          <div className="vg-site-hero-actions" data-twin="omit">
            {actions}
          </div>
        ) : null}
        {feature ? <div className="vg-site-hero-feature">{feature}</div> : null}
        {meta.length > 0 ? (
          <div className="vg-site-hero-meta">
            {meta.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        ) : null}
        {pills.length > 0 ? (
          <div className="vg-site-pills">
            {pills.map((pill, i) => (
              <span className="vg-site-pill" key={i}>
                {pill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </header>
  )
}

/** The heading block a section opens with: an eyebrow, the title and a lead. */
export function SiteSectionHead({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="vg-site-sec-head">
      {eyebrow ? <div className="vg-site-eyebrow">{eyebrow}</div> : null}
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  )
}

/**
 * The index of a product's depth pages, one card per page. The cards come from
 * the same records the pages are built from, so the two cannot disagree; each
 * is keyed by its `href`, which is what makes it a page. `goLabel` is the line
 * at the foot of every card, e.g. "Read the page →".
 */
export function SiteFeatureIndex({
  items,
  eyebrow,
  title,
  description,
  goLabel,
  id = "features-index",
}: {
  items: readonly { href: string; heading: ReactNode; description: ReactNode }[]
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  goLabel: ReactNode
  id?: string
}) {
  return (
    <section className="vg-site-section" id={id}>
      <div className="vg-site-wrap">
        <SiteSectionHead eyebrow={eyebrow} title={title}>
          {description}
        </SiteSectionHead>
        <div className="vg-site-feature-index">
          {items.map((item) => (
            <a className="vg-site-feature-card" href={item.href} key={item.href}>
              <h3>{item.heading}</h3>
              <p>{item.description}</p>
              <span className="vg-site-feature-card-go">{goLabel}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * The footer: the brand, the links, the sponsor and the disclaimer. `before`
 * renders above the footer and outside it (a house ad belongs to the end of the
 * content, not to the chrome); `children` renders inside it, before the content,
 * for a decoration the product draws itself.
 */
export function SiteFooter({
  brand,
  links = [],
  sponsor,
  disclaimer,
  before,
  children,
}: {
  brand: SiteBrand
  links?: readonly SiteLink[]
  /** Usually a `SiteSponsor`. */
  sponsor?: ReactNode
  disclaimer?: ReactNode
  before?: ReactNode
  children?: ReactNode
}) {
  return (
    <>
      {before}
      <footer className="vg-site-footer">
        {children}
        <div className="vg-site-wrap">
          <div className="vg-site-foot-grid">
            <BrandLink brand={brand} className="vg-site-foot-brand" />
            <div className="vg-site-foot-links">
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          {sponsor}
          {disclaimer ? <p className="vg-site-disclaimer">{disclaimer}</p> : null}
        </div>
      </footer>
    </>
  )
}
