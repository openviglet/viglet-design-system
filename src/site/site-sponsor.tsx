import type { ReactNode } from "react"

/**
 * The shape of a product family's `sponsor.json`: who sponsors it and the
 * products it may name. The package holds the schema; the declaration, its copy
 * and its logos stay with the family.
 */
export interface SponsorDeclaration {
  sponsor: {
    name: string
    url: string
    /** Relative to the asset base the page passes. */
    logo: string
    label: string
    summary: string
    siteLabel: string
  }
  products: readonly {
    id: string
    name: string
    url: string
    logo: string
    /** The clause the sponsor block prints under the product's name. */
    inline: string
  }[]
  /** The product ids the sponsor block names, in order. */
  inlineProducts?: readonly string[]
}

/** A logo path under the page's asset base, unless it already names where it lives. */
const join = (base: string, path: string) =>
  base === "" || /^([a-z][a-z\d+.-]*:|\/)/i.test(path) ? path : `${base.replace(/\/$/, "")}/${path}`

/**
 * The sponsor block, rendered with the rest of the page so it is in the served
 * HTML: a sponsor injected after load is one a crawler or an LLM never reads.
 *
 * `assetBase` is where the page serves the declaration's logos from. `products`
 * picks which to name and defaults to the declaration's `inlineProducts`.
 * Product tiles show the real marks, as published, never recoloured. Each mark
 * sits beside its name, so it is decorative and carries an empty `alt`.
 */
export function SiteSponsor({
  declaration,
  assetBase = "",
  products,
  moreLabel,
  note,
}: {
  declaration: SponsorDeclaration
  assetBase?: string
  products?: readonly string[]
  /** The words before the sponsor's site link, e.g. "More at". */
  moreLabel: string
  /** A sentence after the summary, e.g. what the products have in common. */
  note?: ReactNode
}) {
  const { sponsor } = declaration
  const ids = products ?? declaration.inlineProducts ?? declaration.products.map((p) => p.id)
  const named = ids.flatMap((id) => declaration.products.filter((p) => p.id === id))

  return (
    <div className="vg-site-sponsor">
      <img
        className="vg-site-sponsor-mark"
        src={join(assetBase, sponsor.logo)}
        alt=""
        width={42}
        height={42}
        loading="lazy"
        decoding="async"
      />
      <div className="vg-site-sponsor-body">
        <span className="vg-site-sponsor-label">{sponsor.label}</span>
        <a className="vg-site-sponsor-name" href={sponsor.url} target="_blank" rel="noopener">
          {sponsor.name}
        </a>
        <p>
          {sponsor.summary}
          {note ? <> {note}</> : null} {moreLabel}{" "}
          <a href={sponsor.url} target="_blank" rel="noopener">
            {sponsor.siteLabel}
          </a>
          .
        </p>
        {named.length > 0 ? (
          <div className="vg-site-sponsor-products">
            {named.map((product) => (
              <a key={product.id} className="vg-site-sponsor-product" href={product.url} target="_blank" rel="noopener">
                <img
                  src={join(assetBase, product.logo)}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  decoding="async"
                />
                <span>
                  <b>{product.name}</b>
                  <small>{product.inline}</small>
                </span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
