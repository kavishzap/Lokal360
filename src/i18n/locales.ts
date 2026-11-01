export const LOCALES = ["en", "fr", "mfe"] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "fr" || value === "mfe";
}

export function htmlLang(locale: Locale) {
  return locale === "mfe" ? "mfe" : locale;
}
