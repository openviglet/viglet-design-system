import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GradientButton } from "./ui/gradient-button";

export interface LanguageOption {
  /** ISO code, e.g. "en", "pt", "pt-BR" */
  code: string;
  /** Display label, e.g. "English", "Português" */
  label: string;
  /** Optional emoji flag */
  flag?: string;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

export interface LanguageSwitcherProps {
  /** Override the language list. Defaults to en + pt. */
  languages?: LanguageOption[];
}

/**
 * Dropdown to switch the active i18next language.
 * Persists via the standard i18next-browser-languagedetector localStorage cache.
 */
export function LanguageSwitcher({
  languages = DEFAULT_LANGUAGES,
}: Readonly<LanguageSwitcherProps>) {
  const { i18n, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <GradientButton variant="outline" size="sm">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("language.toggle", "Change language")}</span>
        </GradientButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={i18n.language === lang.code ? "font-semibold bg-accent" : ""}
          >
            {lang.flag && <span className="mr-2">{lang.flag}</span>}
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
