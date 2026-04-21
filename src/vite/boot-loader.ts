import type { IndexHtmlTransformResult, Plugin } from "vite";

/**
 * Options for {@link vigletBootLoader}.
 *
 * Only `title`, `subtitle` and `color` are required. Everything else has a
 * sensible Viglet default so most products can keep their `vite.config.ts`
 * short:
 *
 * ```ts
 * vigletBootLoader({
 *   title: "Viglet Turing ES",
 *   subtitle: "Enterprise Search Intelligence",
 *   color: "#4169E1",
 *   prefix: "turing",
 * });
 * ```
 */
export interface VigletBootLoaderOptions {
  /** Product title shown under the orb, e.g. `"Viglet Turing ES"`. */
  title: string;
  /** Uppercase subtitle under the title, e.g. `"Enterprise Search Intelligence"`. */
  subtitle: string;
  /** Accent hex color (light mode), e.g. `"#4169E1"`. */
  color: string;
  /** Accent hex color in dark mode. Defaults to `color`. */
  colorDark?: string;
  /**
   * CSS class prefix applied to every rule and keyframe to avoid collisions
   * (rings, mark, molecules, gas, progress, etc). Default: `"viglet"`.
   *
   * Must be a valid CSS identifier fragment — letters, digits and `-`.
   */
  prefix?: string;
  /** `localStorage` key used to detect the stored theme. Default: `"vite-ui-theme"`. */
  storageKey?: string;
  /**
   * Global variable name read by the app's `main.tsx` to bail out of
   * `createRoot().render()` when `?loading=1` is present, which holds the
   * loader visible for design/regression testing.
   *
   * Default: `"__VIGLET_LOADING_TEST__"`.
   */
  testFlag?: string;
  /**
   * HTML comment that the plugin replaces with the boot-loader markup. Put
   * it inside `<div id="root">` in your `index.html` (or `marketing.html`).
   *
   * Default: `"<!--viglet-boot-loader-->"`. If not found, the plugin falls
   * back to injecting right after the opening `<div id="root">` tag.
   */
  placeholder?: string;
}

/**
 * Vite plugin that injects the shared Viglet boot loader into `index.html` at
 * build/dev time. Every product (Turing, Shio, Dumont, Cloud Marketing)
 * consumes this plugin so the loader visuals stay identical across the
 * ecosystem and there's a single place to evolve the design.
 *
 * What the plugin injects:
 *
 *   1. A `<style>` tag in `<head>` with every rule and keyframe used by the
 *      loader (rings, orb, gas cloud, molecule cycle, progress, fade-in,
 *      reduced-motion fallback, test-mode badge).
 *   2. A `<script>` tag in `<head>` that runs BEFORE the React module and:
 *        - Picks the light/dark theme from `localStorage`.
 *        - Sets `globalThis.<testFlag> = true` if the URL has `?loading=1`.
 *        - Injects a visible "TEST MODE" badge when the flag is on.
 *   3. The loader markup (rings + mark + 6-molecule SVG + title + subtitle +
 *      progress) wherever the `<!--viglet-boot-loader-->` placeholder sits
 *      inside `<div id="root">`.
 *
 * The consuming app's `main.tsx` should look at `globalThis.<testFlag>` and
 * skip mounting React when the flag is set — this is what keeps the loader
 * visible indefinitely during testing.
 */
export function vigletBootLoader(options: VigletBootLoaderOptions): Plugin {
  const {
    title,
    subtitle,
    color,
    colorDark = color,
    prefix = "viglet",
    storageKey = "vite-ui-theme",
    testFlag = "__VIGLET_LOADING_TEST__",
    placeholder = "<!--viglet-boot-loader-->",
  } = options;

  const rgb = hexToRgbTriplet(color) ?? "37, 99, 235";
  const rgbDark = hexToRgbTriplet(colorDark) ?? rgb;

  const ctx = { pfx: prefix, title, subtitle, color, colorDark, rgb, rgbDark, storageKey, testFlag };
  const styleTag = renderStyle(ctx);
  const scriptBody = renderScript(ctx);
  const markup = renderMarkup(ctx);

  return {
    name: "viglet-boot-loader",
    transformIndexHtml(html): IndexHtmlTransformResult {
      const withMarkup = html.includes(placeholder)
        ? html.replace(placeholder, markup)
        : html.replace(
            /(<div\b[^>]*\bid=["']root["'][^>]*>)/,
            (m) => `${m}\n${markup}\n`,
          );
      return {
        html: withMarkup,
        tags: [
          { tag: "style", attrs: { "data-viglet-boot-loader": "" }, children: styleTag, injectTo: "head" },
          { tag: "script", children: scriptBody, injectTo: "head" },
        ],
      };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — kept local so the plugin ships as a single module.

function hexToRgbTriplet(hex: string | undefined): string | null {
  if (!hex) return null;
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex.trim());
  if (m3) {
    const [, r, g, b] = m3;
    return `${Number.parseInt(r + r, 16)}, ${Number.parseInt(g + g, 16)}, ${Number.parseInt(b + b, 16)}`;
  }
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (m6) {
    const [, r, g, b] = m6;
    return `${Number.parseInt(r, 16)}, ${Number.parseInt(g, 16)}, ${Number.parseInt(b, 16)}`;
  }
  return null;
}

interface Ctx {
  pfx: string;
  title: string;
  subtitle: string;
  color: string;
  colorDark: string;
  rgb: string;
  rgbDark: string;
  storageKey: string;
  testFlag: string;
}

function renderStyle({ pfx, color, colorDark, rgb }: Ctx): string {
  // `rgbDark` is computed in the Ctx but currently unused — the template
  // keeps the same alpha-stacked RGB for both color schemes. Left in Ctx so
  // future dark-mode-specific tints can wire in without threading a new arg.
  return `
    html, body { margin: 0; padding: 0; height: 100%; }
    body {
      background:
        radial-gradient(1200px 600px at 20% 10%, rgba(${rgb}, 0.18), transparent 60%),
        radial-gradient(900px 500px at 80% 90%, rgba(${rgb}, 0.18), transparent 60%),
        #0a0a0f;
      color: #e5e7eb;
      font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body.${pfx}-light-boot {
      background:
        radial-gradient(1200px 600px at 20% 10%, rgba(${rgb}, 0.10), transparent 60%),
        radial-gradient(900px 500px at 80% 90%, rgba(${rgb}, 0.10), transparent 60%),
        #fafafa;
      color: #0f172a;
    }
    #${pfx}-boot-loader {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center; flex-direction: column;
      z-index: 9999;
      animation: ${pfx}-boot-fade-in 0.4s ease-out;
    }
    .${pfx}-boot-stage {
      position: relative; width: 160px; height: 160px;
      display: flex; align-items: center; justify-content: center;
    }
    .${pfx}-boot-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 2px solid rgba(${rgb}, 0.55); opacity: 0;
      animation: ${pfx}-boot-ring-pulse 2.4s cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
    }
    .${pfx}-boot-ring.delay-1 { animation-delay: 0.6s; }
    .${pfx}-boot-ring.delay-2 { animation-delay: 1.2s; }
    .${pfx}-boot-ring.delay-3 { animation-delay: 1.8s; }
    .${pfx}-boot-logo-mark {
      position: relative; width: 110px; height: 110px;
      color: #FFDEAD;
      display: flex; align-items: center; justify-content: center;
      -webkit-user-select: none; user-select: none;
      animation: ${pfx}-boot-breathe 2.2s ease-in-out infinite;
    }
    .${pfx}-boot-logo-mark::before {
      content: ""; position: absolute; inset: 0; border-radius: 50%;
      background: linear-gradient(135deg, ${color}, ${colorDark}, ${color});
      background-size: 300% 300%;
      z-index: -2; filter: blur(18px); opacity: 0.5;
      animation: ${pfx}-boot-glow 6s linear infinite;
    }
    .${pfx}-boot-logo-mark::after {
      content: ""; position: absolute; inset: 8px; border-radius: 50%;
      background: radial-gradient(circle at center, ${color} 0%, rgba(${rgb},0.6) 55%, rgba(${rgb},0) 100%);
      filter: blur(5px); z-index: -1;
      animation: ${pfx}-boot-gas 4s ease-in-out infinite;
    }
    @keyframes ${pfx}-boot-gas {
      0%, 100% { transform: scale(1);    opacity: 0.85; }
      50%      { transform: scale(1.08); opacity: 1;    }
    }
    .${pfx}-boot-molecules { width: 62px; height: 62px; overflow: visible; }
    .${pfx}-boot-molecules line, .${pfx}-boot-molecules path {
      stroke: #FFDEAD; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none;
    }
    .${pfx}-boot-molecules circle { fill: #FFDEAD; }
    .${pfx}-boot-molecule {
      opacity: 0; transform-origin: center;
      animation: ${pfx}-boot-molecule-cycle 10s ease-in-out infinite both;
    }
    .${pfx}-boot-molecule.m-2 { animation-delay: -1.667s; }
    .${pfx}-boot-molecule.m-3 { animation-delay: -3.333s; }
    .${pfx}-boot-molecule.m-4 { animation-delay: -5.000s; }
    .${pfx}-boot-molecule.m-5 { animation-delay: -6.667s; }
    .${pfx}-boot-molecule.m-6 { animation-delay: -8.333s; }
    @keyframes ${pfx}-boot-molecule-cycle {
      0%   { opacity: 0; transform: scale(0.7); }
      3%   { opacity: 1; transform: scale(1);    }
      14%  { opacity: 1; transform: scale(1);    }
      17%  { opacity: 0; transform: scale(0.7); }
      100% { opacity: 0; transform: scale(0.7); }
    }
    .${pfx}-boot-text { margin-top: 2rem; text-align: center; }
    .${pfx}-boot-title {
      font-size: 1.15rem; font-weight: 700; letter-spacing: 0.01em;
      background: linear-gradient(90deg, ${color}, ${colorDark});
      background-size: 200% auto;
      -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: ${pfx}-boot-shimmer 3s linear infinite;
    }
    .${pfx}-boot-subtitle {
      margin-top: 0.35rem; font-size: 0.8rem;
      opacity: 0.55; letter-spacing: 0.05em; text-transform: uppercase;
    }
    .${pfx}-boot-progress {
      margin-top: 1.5rem; width: 180px; height: 3px;
      border-radius: 999px; background: rgba(148, 163, 184, 0.15);
      overflow: hidden; position: relative;
    }
    .${pfx}-boot-progress::after {
      content: ""; position: absolute; top: 0; left: 0;
      width: 40%; height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, transparent, ${color} 30%, ${colorDark} 70%, transparent);
      transform: translateX(-100%); will-change: transform;
      animation: ${pfx}-boot-slide 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes ${pfx}-boot-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ${pfx}-boot-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
    @keyframes ${pfx}-boot-glow { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
    @keyframes ${pfx}-boot-ring-pulse {
      0%   { transform: scale(0.55); opacity: 0.7;  border-width: 2px; }
      70%  { opacity: 0.05; }
      100% { transform: scale(1.25); opacity: 0;    border-width: 1px; }
    }
    @keyframes ${pfx}-boot-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
    @keyframes ${pfx}-boot-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(450%); } }
    @media (prefers-reduced-motion: reduce) {
      .${pfx}-boot-ring,
      .${pfx}-boot-logo-mark,
      .${pfx}-boot-logo-mark::before,
      .${pfx}-boot-logo-mark::after,
      .${pfx}-boot-molecule,
      .${pfx}-boot-title,
      .${pfx}-boot-progress::after { animation: none !important; }
      .${pfx}-boot-ring { opacity: 0.2; transform: scale(1); }
      .${pfx}-boot-molecule { opacity: 0; }
      .${pfx}-boot-molecule.m-1 { opacity: 1; transform: scale(1); }
    }
    .${pfx}-boot-test-badge {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      padding: 6px 12px; font-size: 11px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; color: #fff;
      background: linear-gradient(135deg, #dc2626, #ea580c);
      border-radius: 999px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
      z-index: 10000;
    }
  `.trim();
}

function renderScript({ pfx, storageKey, testFlag }: Ctx): string {
  // IIFE so it runs synchronously in the head without polluting globals.
  return `
    (function () {
      try {
        var stored = localStorage.getItem(${JSON.stringify(storageKey)});
        var prefersLight = stored === "light"
          || (stored === "system" && globalThis.matchMedia("(prefers-color-scheme: light)").matches)
          || (!stored && globalThis.matchMedia("(prefers-color-scheme: light)").matches);
        if (prefersLight) {
          document.documentElement.classList.remove("dark");
          document.addEventListener("DOMContentLoaded", function () {
            document.body.classList.add(${JSON.stringify(pfx + "-light-boot")});
          });
        }
      } catch (e) { /* ignore */ }
      try {
        if (new URLSearchParams(globalThis.location.search).has("loading")) {
          globalThis[${JSON.stringify(testFlag)}] = true;
          document.addEventListener("DOMContentLoaded", function () {
            var badge = document.createElement("div");
            badge.className = ${JSON.stringify(pfx + "-boot-test-badge")};
            badge.textContent = "Loading \xb7 Test Mode \xb7 ?loading=1";
            document.body.appendChild(badge);
          });
        }
      } catch (e) { /* ignore */ }
    })();
  `.trim();
}

function renderMarkup({ pfx, title, subtitle }: Ctx): string {
  return `
<div id="${pfx}-boot-loader" role="status" aria-live="polite" aria-label="Loading ${escapeHtml(title)}">
  <div class="${pfx}-boot-stage">
    <div class="${pfx}-boot-ring"></div>
    <div class="${pfx}-boot-ring delay-1"></div>
    <div class="${pfx}-boot-ring delay-2"></div>
    <div class="${pfx}-boot-ring delay-3"></div>
    <div class="${pfx}-boot-logo-mark" aria-label="${escapeHtml(title)}">
      <svg class="${pfx}-boot-molecules" viewBox="0 0 100 100" aria-hidden="true">
        <g class="${pfx}-boot-molecule m-1">
          <line x1="28" y1="50" x2="72" y2="50" />
          <circle cx="28" cy="50" r="7" />
          <circle cx="72" cy="50" r="7" />
        </g>
        <g class="${pfx}-boot-molecule m-2">
          <path d="M28,68 L50,38 L72,68" />
          <circle cx="28" cy="68" r="5" />
          <circle cx="50" cy="38" r="8" />
          <circle cx="72" cy="68" r="5" />
        </g>
        <g class="${pfx}-boot-molecule m-3">
          <line x1="50" y1="50" x2="25" y2="28" />
          <line x1="50" y1="50" x2="75" y2="28" />
          <line x1="50" y1="50" x2="25" y2="72" />
          <line x1="50" y1="50" x2="75" y2="72" />
          <circle cx="50" cy="50" r="7" />
          <circle cx="25" cy="28" r="4.5" />
          <circle cx="75" cy="28" r="4.5" />
          <circle cx="25" cy="72" r="4.5" />
          <circle cx="75" cy="72" r="4.5" />
        </g>
        <g class="${pfx}-boot-molecule m-4">
          <path d="M50,28 L28,68 L72,68 Z" />
          <circle cx="50" cy="28" r="7" />
          <circle cx="28" cy="68" r="5" />
          <circle cx="72" cy="68" r="5" />
        </g>
        <g class="${pfx}-boot-molecule m-5">
          <line x1="18" y1="50" x2="82" y2="50" />
          <circle cx="18" cy="50" r="5.5" />
          <circle cx="39.3" cy="50" r="5.5" />
          <circle cx="60.6" cy="50" r="5.5" />
          <circle cx="82" cy="50" r="5.5" />
        </g>
        <g class="${pfx}-boot-molecule m-6">
          <path d="M50,22 L74,36 L74,64 L50,78 L26,64 L26,36 Z" />
          <circle cx="50" cy="22" r="4.5" />
          <circle cx="74" cy="36" r="4.5" />
          <circle cx="74" cy="64" r="4.5" />
          <circle cx="50" cy="78" r="4.5" />
          <circle cx="26" cy="64" r="4.5" />
          <circle cx="26" cy="36" r="4.5" />
        </g>
      </svg>
    </div>
  </div>
  <div class="${pfx}-boot-text">
    <div class="${pfx}-boot-title">${escapeHtml(title)}</div>
    <div class="${pfx}-boot-subtitle">${escapeHtml(subtitle)}</div>
  </div>
  <div class="${pfx}-boot-progress" aria-hidden="true"></div>
</div>
  `.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
