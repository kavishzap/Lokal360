"use client";

import { useCallback } from "react";
import { translate } from "@/i18n/phrases";
import type { Locale } from "@/i18n/locales";
import { useLocaleStore } from "@/store/locale-store";

export function useTranslate() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const t = useCallback((text: string) => translate(locale, text), [locale]);
  return { locale, setLocale, t };
}

export function useLocale(): Locale {
  return useLocaleStore((state) => state.locale);
}
