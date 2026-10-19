import type {Metadata} from 'next'
import {routing} from '@/i18n/routing'

export const SITE_URL = 'https://psdniemcewicza.org'

// Pages search engines should not index (accounts, forms, admin).
export const PRIVATE_PATHS = [
  '/admin', '/dashboard', '/login', '/register', '/forgot-password', '/verify-email', '/medical', '/enroll',
]

// Canonical + hreflang links for a page that exists in every locale.
// `path` is the part after the locale, e.g. '' for home or '/about'.
export function localeAlternates(locale: string, path: string): Metadata['alternates'] {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
      'x-default': `/${routing.defaultLocale}${path}`,
    },
  }
}

export function pageMetadata(locale: string, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: {title, description, url: `/${locale}${path}`},
  }
}
