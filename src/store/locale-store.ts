import { create } from "zustand";
import { htmlLang, isLocale, type Locale } from "@/i18n/locales";
import { LOCALE_KEY } from "@/lib/constants";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrate: () => void;
}

function apply(locale: Locale) {
  if (typeof document !== "undefined") document.documentElement.lang = htmlLang(locale);
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    set({ locale });
    apply(locale);
    if (typeof window !== "undefined") window.localStorage.setItem(LOCALE_KEY, locale);
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALE_KEY);
    const locale = isLocale(stored) ? stored : "en";
    set({ locale });
    apply(locale);
  },
}));
