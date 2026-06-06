export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en' as const,
    name: 'English',
    nativeName: 'English',
  },
  hi: {
    code: 'hi' as const,
    name: 'Hindi',
    nativeName: 'हिंदी',
  },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES
export const LANGUAGE_CODES: LanguageCode[] = Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]
