import {client} from '@/lib/sanity'
import {PortableText} from 'next-sanity'
import {getTranslations} from 'next-intl/server'

export const revalidate = 30

async function getAnnouncements() {
  return client.fetch(`*[_type == "announcement"] | order(pinned desc, publishedAt desc) {
    _id, title, body, publishedAt, pinned
  }`)
}

export default async function AnnouncementsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Announcements'})
  const announcements = await getAnnouncements()
  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        {announcements.length === 0 && <p className="text-gray-400 text-sm">{t('empty')}</p>}
        {announcements.map((a: any) => (
          <article key={a._id} className={`bg-white border-l-4 ${a.pinned ? 'border-gold' : 'border-navy-light'} rounded-r-lg shadow-sm p-6`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {a.pinned && <span className="text-xs bg-gold text-navy font-bold px-2 py-0.5 rounded">{t('pinned')}</span>}
                <h2 className="text-lg font-bold text-navy">{a.title}</h2>
              </div>
              <time className="text-xs text-gray-400 shrink-0">
                {new Date(a.publishedAt).toLocaleDateString(dateLocale, {day: 'numeric', month: 'long', year: 'numeric'})}
              </time>
            </div>
            {a.body && <div className="prose prose-sm max-w-none text-gray-700"><PortableText value={a.body} /></div>}
          </article>
        ))}
      </div>
    </main>
  )
}
