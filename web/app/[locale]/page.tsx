import {client, urlFor} from '@/lib/sanity'
import {PortableText} from 'next-sanity'
import Link from 'next/link'
import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {getTranslations} from 'next-intl/server'

export const revalidate = 30

async function getAnnouncements() {
  return client.fetch(`*[_type == "announcement"] | order(pinned desc, publishedAt desc)[0...4] {
    _id, title, body, publishedAt, pinned
  }`)
}

async function getEvents() {
  return client.fetch(`*[_type == "event" && date >= now()] | order(date asc)[0...5] {
    _id, title, date, location
  }`)
}

async function getGalleryPreview() {
  return client.fetch(`*[_type == "galleryImage"][0...6] { _id, image, caption }`)
}

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Home'})
  const [announcements, events, gallery] = await Promise.all([
    getAnnouncements(), getEvents(), getGalleryPreview(),
  ])

  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">{t('welcome')}</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            {t('title')}<br />
            <span className="text-gold">{t('subtitle')}</span>
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">{t('description')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${locale}/about`} className="bg-gold text-navy font-bold px-6 py-3 rounded hover:bg-gold-light transition-colors text-sm">
              {t('learnMore')}
            </Link>
            <Link href={`/${locale}/contact`} className="border border-gold text-gold font-bold px-6 py-3 rounded hover:bg-gold hover:text-navy transition-colors text-sm">
              {t('contactBtn')}
            </Link>
          </div>
        </div>
      </section>

      {/* Info bar */}
      <div className="bg-navy-dark text-gray-300 py-4 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
          {[
            {icon: '📅', label: t('schedule'), value: t('scheduleVal')},
            {icon: '📍', label: t('address'), value: '123 School Street'},
            {icon: '📧', label: t('email'), value: 'info@psdniemcewicz.org'},
            {icon: '📞', label: t('phone'), value: '(000) 000-0000'},
          ].map((item) => (
            <div key={item.label}>
              <span className="text-lg">{item.icon}</span>
              <p className="text-gold text-xs font-bold uppercase tracking-wider mt-1">{item.label}</p>
              <p className="text-gray-300 text-xs mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-10">

        {/* Announcements + Gallery */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1">{t('announcementsTitle')}</h2>
              <Link href={`/${locale}/announcements`} className="text-xs text-gold font-semibold hover:underline">{t('viewAll')}</Link>
            </div>
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('noAnnouncements')}</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((a: any) => (
                  <article key={a._id} className={`bg-white border-l-4 ${a.pinned ? 'border-gold' : 'border-navy-light'} rounded-r-lg shadow-sm p-5`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {a.pinned && <span className="text-xs bg-gold text-navy font-bold px-2 py-0.5 rounded">{t('pinned')}</span>}
                        <h3 className="font-bold text-navy text-base">{a.title}</h3>
                      </div>
                      <time className="text-xs text-gray-400 shrink-0">
                        {new Date(a.publishedAt).toLocaleDateString(dateLocale, {day: 'numeric', month: 'long', year: 'numeric'})}
                      </time>
                    </div>
                    {a.body && (
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <PortableText value={a.body} />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {gallery.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1">{t('galleryTitle')}</h2>
                <Link href={`/${locale}/gallery`} className="text-xs text-gold font-semibold hover:underline">{t('viewAll')}</Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((item: any) => (
                  <div key={item._id} className="relative aspect-square rounded overflow-hidden group">
                    <Image
                      src={urlFor(item.image).width(300).height(300).fit('crop').url()}
                      alt={item.caption || ''}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1 mb-5">{t('calendarTitle')}</h2>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('noEvents')}</p>
            ) : (
              <div className="space-y-3">
                {events.map((e: any) => {
                  const d = new Date(e.date)
                  return (
                    <div key={e._id} className="bg-white rounded-lg shadow-sm border border-gray-100 flex gap-3 overflow-hidden">
                      <div className="bg-navy text-white text-center px-3 py-3 min-w-[52px] flex flex-col justify-center">
                        <p className="text-gold text-xs font-bold uppercase">{d.toLocaleDateString(dateLocale, {month: 'short'})}</p>
                        <p className="text-2xl font-bold leading-none">{d.getDate()}</p>
                      </div>
                      <div className="py-3 pr-3">
                        <p className="font-bold text-navy text-sm">{e.title}</p>
                        {e.location && <p className="text-xs text-gray-500 mt-0.5">📍 {e.location}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1 mb-5">{t('quickLinks')}</h2>
            <div className="space-y-2">
              {[
                {href: `/${locale}/homework/klasa-1`, label: t('link_homework')},
                {href: `/${locale}/documents`, label: t('link_documents')},
                {href: `/${locale}/staff`, label: t('link_staff')},
                {href: `/${locale}/gallery`, label: t('link_gallery')},
                {href: `/${locale}/contact`, label: t('link_contact')},
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between bg-white border border-gray-100 rounded px-4 py-3 text-sm text-navy font-medium hover:border-gold hover:text-gold transition-colors shadow-sm">
                  {l.label}<span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-3">{t('ctaTitle')}</h2>
          <p className="text-gray-300 mb-6">{t('ctaDesc')}</p>
          <Link href={`/${locale}/contact`} className="bg-gold text-navy font-bold px-8 py-3 rounded hover:bg-gold-light transition-colors inline-block">
            {t('ctaBtn')}
          </Link>
        </div>
      </div>
    </>
  )
}
