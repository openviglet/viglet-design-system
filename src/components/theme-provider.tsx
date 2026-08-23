import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps as NextThemesProviderProps,
} from "next-themes"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = Omit<NextThemesProviderProps, "defaultTheme"> & {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

/**
 * The console's theme source, and now the only one.
 *
 * VDS72 — this used to hold its own state, seeded by reading `localStorage`
 * inside a `useState` initialiser. That callback runs during render, so on a
 * server render there is no `localStorage` and the provider threw: a
 * React Server Components consumer failed on the first hook, and one product
 * worked around it by not mounting this provider at all.
 *
 * It was also a second source. The package's own `Toaster` reads `useTheme`
 * from `next-themes`, which is a declared peer dependency, so a consumer
 * mounting both ran two theme systems writing the class from two storage keys
 * and agreeing only by luck.
 *
 * Both are one problem, so this is a thin wrapper over `next-themes` rather
 * than a patched initialiser: one source of truth, SSR-safe because
 * `next-themes` reads storage in an effect and injects a blocking script for
 * the first paint. The props and the `vite-ui-theme` storage key are the ones
 * this package already published, and `useTheme` keeps its shape, because
 * three consoles import it.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: Readonly<ThemeProviderProps>) {
  return (
    <NextThemesProvider
      // The class on <html> is what this package's styles key off, and
      // `enableSystem` is what makes "system" resolve to one of the two —
      // together they are what the old effect did by hand.
      attribute="class"
      enableSystem
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

/**
 * The shape three consoles import: `{ theme, setTheme }`, where `theme` is the
 * setting rather than the resolved colour — "system" stays "system".
 *
 * `next-themes` reports `theme` as `undefined` until it has read storage on the
 * client, and as a plain `string` because a consumer may define its own theme
 * names. Neither is true of this package's contract, so both are narrowed here
 * rather than at every call site.
 *
 * Works with no `ThemeProvider` of ours in the tree, which is deliberate: a
 * consumer that lets `next-themes` own the class mounts its provider directly,
 * and this hook reads that one.
 */
export const useTheme = (): ThemeProviderState => {
  const { theme, setTheme } = useNextTheme()

  return {
    theme: (theme as Theme | undefined) ?? "system",
    setTheme,
  }
}
