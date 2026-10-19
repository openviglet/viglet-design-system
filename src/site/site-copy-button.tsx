import { useEffect, useRef, useState } from "react"

function fallbackCopy(text: string) {
  const area = document.createElement("textarea")
  area.value = text
  area.style.position = "fixed"
  area.style.opacity = "0"
  document.body.appendChild(area)
  area.select()
  try {
    document.execCommand("copy")
  } catch {
    // Nothing more to try.
  }
  area.remove()
}

/**
 * Copies an install command or a snippet, and says so for a moment.
 *
 * The clipboard API where the page has it, a hidden textarea where it does not
 * (an http preview, an old browser). Nothing touches `navigator` until a click,
 * so the button prerenders. The words are the product's, in its language.
 */
export function SiteCopyButton({
  text,
  label,
  copyLabel,
  copiedLabel,
}: {
  text: string
  /** The accessible name, e.g. "Copy the install command". */
  label: string
  /** The visible word, e.g. "Copy". */
  copyLabel: string
  /** The word shown for a moment after, e.g. "Copied!". */
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onClick = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
      else fallbackCopy(text)
    } catch {
      fallbackCopy(text)
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      className={copied ? "vg-site-copy copied" : "vg-site-copy"}
      onClick={onClick}
      aria-label={label}
    >
      <span className="vg-site-copy-icon" aria-hidden="true">
        {copied ? "✓" : "⧉"}
      </span>
      <span className="vg-site-copy-label">{copied ? copiedLabel : copyLabel}</span>
    </button>
  )
}
