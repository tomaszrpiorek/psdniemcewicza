import type {MetadataRoute} from 'next'
import {routing} from '@/i18n/routing'
import {SITE_URL, PRIVATE_PATHS} from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: routing.locales.flatMap((l) => PRIVATE_PATHS.map((p) => `/${l}${p}`)),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
