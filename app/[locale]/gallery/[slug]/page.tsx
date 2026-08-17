import {client, urlFor} from '@/lib/sanity'
import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import AlbumGallery from '@/components/AlbumGallery'

export const revalidate = 30

async function getAlbum(slug: string) {
  return client.fetch(
    `*[_type == "galleryAlbum" && slug.current == $slug][0] { _id, title, date, category, photos }`,
    {slug}
  )
}

export default async function AlbumPage({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params
  const t = await getTranslations({locale, namespace: 'Gallery'})
  const album = await getAlbum(slug)
  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  const categoryLabel: Record<string, string> = {
    events: t('events'), classes: t('classes'), sports: t('sports'), other: t('other'),
  }

  if (!album) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">{t('notFound')}</h1>
        <Link href={`/${locale}/gallery`} className="text-gold hover:underline">{t('back')}</Link>
      </main>
    )
  }

  const photos = (album.photos || [])
    .filter((photo: any) => photo.asset)
    .map((photo: any) => ({
      thumbUrl: urlFor(photo).width(500).height(500).fit('crop').url(),
      fullUrl: urlFor(photo).width(1600).fit('max').url(),
      caption: photo.caption,
    }))

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href={`/${locale}/gallery`} className="text-gold text-xs font-bold uppercase tracking-widest hover:underline">{t('back')}</Link>
          <h1 className="text-3xl font-bold mt-3">{album.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-300">
            {album.category && (
              <span className="text-xs bg-white/10 text-gold px-2 py-0.5 rounded font-medium">
                {categoryLabel[album.category] ?? album.category}
              </span>
            )}
            {album.date && (
              <span>{new Date(album.date).toLocaleDateString(dateLocale, {day: 'numeric', month: 'long', year: 'numeric'})}</span>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <AlbumGallery photos={photos} />
      </div>
    </main>
  )
}
