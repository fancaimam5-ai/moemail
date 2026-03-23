export const locales = ['en', 'id'] as const
export type Locale = typeof locales[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
}

// Old locales that should redirect to 'en'
export const LEGACY_LOCALES = ['zh-CN', 'zh-TW', 'ja', 'ko'] as const

export const defaultLocale: Locale = 'en'

export const i18n = {
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
}
