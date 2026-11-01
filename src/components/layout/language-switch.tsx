"use client";

import { LOCALES, type Locale } from "@/i18n/locales";
import { useTranslate } from "@/i18n/use-translate";
import { cn } from "@/lib/utils";

const SHORT: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  mfe: "KR",
};

const NAME: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  mfe: "Kreol",
};

export function LanguageSwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { locale, setLocale, t } = useTranslate();

  return (
    <div
      role="group"
      aria-label={t("Language")}
      className={cn(
        "flex rounded-lg border p-0.5",
        tone === "dark" ? "border-white/15 bg-white/5" : "border-slate-200 bg-slate-50"
      )}
    >
      {LOCALES.map((code) => {
        const selected = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            title={NAME[code]}
            onClick={() => setLocale(code)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-semibold tracking-wide",
              selected
                ? tone === "dark"
                  ? "bg-white text-slate-900"
                  : "bg-white text-slate-900 shadow-sm"
                : tone === "dark"
                  ? "text-slate-300 hover:text-white"
                  : "text-slate-500 hover:text-slate-900"
            )}
          >
            {SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}
