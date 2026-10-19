import type {MetadataRoute} from 'next'
import {routing} from '@/i18n/routing'
import {client} from '@/lib/sanity'
import {SCHOOL_GRADES} from '@/lib/grades'
import {SITE_URL} from '@/lib/seo'

export const revalidate = 3600

const PAGES = ['', '/about', '/staff', '/announcements', '/calendar', '/gallery', '/documents', '/contact']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const albums: string[] = await client
    .fetch(`*[_type == "galleryAlbum" && defined(slug.current)].slug.current`)
    .catch(() => [])

  const paths = [
    ...PAGES,
    ...SCHOOL_GRADES.map((g) => `/homework/${g.slug}`),
    ...albums.map((slug) => `/gallery/${slug}`),
  ]

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: path === '' || path === '/announcements' || path === '/calendar' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      },
    }))
  )
}
