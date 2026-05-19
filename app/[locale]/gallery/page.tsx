import {client, urlFor} from '@/lib/sanity'
import Image from 'next/image'
import {getTranslations} from 'next-intl/server'

export const revalidate = 30

async function getGallery() {
  return client.fetch(`*[_type == "galleryImage"] | order(takenAt desc) { _id, image, caption, category }`)
}

export default async function GalleryPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Gallery'})
  const images = await getGallery()

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
        {images.length === 0 && <p className="text-gray-400 text-sm">{t('empty')}</p>}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((item: any) => (
            <div key={item._id} className="group rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white hover:border-gold transition-colors hover:shadow-md">
              <div className="relative aspect-square">
                <Image src={urlFor(item.image).width(500).height(500).fit('crop').url()} alt={item.caption || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              {(item.caption || item.category) && (
                <div className="p-3">
                  {item.category && <span className="text-xs bg-navy text-gold px-2 py-0.5 rounded font-medium">{categoryLabel[item.category] ?? item.category}</span>}
                  {item.caption && <p className="text-xs text-gray-500 mt-1">{item.caption}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
