import {client, urlFor} from '@/lib/sanity'
import Image from 'next/image'
import Link from 'next/link'
import {getTranslations} from 'next-intl/server'

export const revalidate = 30

async function getAlbums() {
  return client.fetch(`*[_type == "galleryAlbum"] | order(date desc) {
    _id, title, "slug": slug.current, date, category, coverImage, "firstPhoto": photos[defined(asset)][0]
  }`)
}

export default async function GalleryPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Gallery'})
  const albums = await getAlbums()
  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  const categoryLabel: Record<string, string> = {
    events: t('events'), classes: t('classes'), sports: t('sports'), other: t('other'),
  }

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {albums.length === 0 && <p className="text-gray-400 text-sm">{t('empty')}</p>}
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album: any) => {
            const cover = (album.coverImage?.asset ? album.coverImage : null) || album.firstPhoto
            return (
              <Link
                key={album._id}
                href={`/${locale}/gallery/${album.slug}`}
                className="group rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white hover:border-gold transition-colors hover:shadow-md"
              >
                <div className="relative aspect-square bg-cream">
                  {cover && (
                    <Image
                      src={urlFor(cover).width(500).height(500).fit('crop').url()}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-3">
                  {album.category && (
                    <span className="text-xs bg-navy text-gold px-2 py-0.5 rounded font-medium">
                      {categoryLabel[album.category] ?? album.category}
                    </span>
                  )}
                  <p className="text-sm font-bold text-navy mt-1.5 leading-snug">{album.title}</p>
                  {album.date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(album.date).toLocaleDateString(dateLocale, {day: 'numeric', month: 'long', year: 'numeric'})}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
