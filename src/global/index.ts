/**
 * VDS237 — what `dist/viglet-ds.global.js` puts on `window.VigletDS`.
 *
 * The parts a mockup draws, for a page with no bundler: a design canvas, a
 * static prototype. React and ReactDOM come from the page's globals; the
 * `./styles` stylesheet, linked beside it, already carries every class these
 * use. A component that needs a router or an HTTP client stays out.
 *
 * Not an application entry: a consumer with a build imports the ESM entries.
 */
import i18next, { type i18n as I18n } from "i18next"
import { initReactI18next } from "react-i18next"

import { vigDesignSystemTranslations } from "@/i18n"

export { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
export { Badge } from "@/components/ui/badge"
export { Button } from "@/components/ui/button"
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
export { Checkbox } from "@/components/ui/checkbox"
export { GradientButton } from "@/components/ui/gradient-button"
export { Input } from "@/components/ui/input"
export { Progress } from "@/components/ui/progress"
export { Separator } from "@/components/ui/separator"
export { Switch } from "@/components/ui/switch"
export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
export { Textarea } from "@/components/ui/textarea"
export { BentoStatusMarker } from "@/bento/bento-status-marker"

/**
 * The words the subset draws, from the package's own bundles. BentoStatusMarker
 * reads `bento.state.*` with no default, so without this it would print keys.
 * The language is the page's `<html lang>`; `pt-BR` falls back to `pt`, and
 * anything unknown to English. `VigletDS.i18n.changeLanguage` switches it.
 */
const lang = (typeof document === "undefined" ? "" : document.documentElement.lang) || "en"

export const i18n: I18n = i18next.createInstance()

void i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    Object.entries(vigDesignSystemTranslations).map(([code, translation]) => [code, { translation }]),
  ),
  lng: lang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  initAsync: false,
})
