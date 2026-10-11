import {client, urlFor} from '@/lib/sanity'
import {PortableText} from 'next-sanity'
import type {PortableTextBlock} from '@portabletext/types'
import Link from 'next/link'
import Image from 'next/image'
import {getTranslations} from 'next-intl/server'
import {ENROLLMENT_OPEN} from '@/lib/features'
import {display, script} from '@/lib/fonts'
import Reveal from '@/components/Reveal'
import HeroCarousel from '@/components/HeroCarousel'
import {IconCalendar, IconMapPin, IconMail, IconPhone, IconBook, IconDocument, IconUsers, IconCamera} from '@/components/icons'

export const revalidate = 30

type Announcement = {_id: string; title: string; body?: PortableTextBlock[]; publishedAt: string; pinned?: boolean}
type GalleryPreviewAlbum = {
  _id: string; title: string; slug: string
  coverImage?: Record<string, unknown>; firstPhoto?: Record<string, unknown>
}
type UpcomingEvent = {_id: string; title: string; date: string; location?: string}

async function getAnnouncements(): Promise<Announcement[]> {
  return client.fetch(`*[_type == "announcement"] | order(pinned desc, publishedAt desc)[0...4] {
    _id, title, body, publishedAt, pinned
  }`)
}

async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  return client.fetch(`*[_type == "event" && date >= now()] | order(date asc)[0...4] {
    _id, title, date, location
  }`)
}

async function getGalleryPreview(): Promise<GalleryPreviewAlbum[]> {
  return client.fetch(`*[_type == "galleryAlbum"] | order(coalesce(date, "1970-01-01") desc)[0...3] {
    _id, title, "slug": slug.current, coverImage, "firstPhoto": photos[defined(asset)][0]
  }`)
}

type RawPhoto = {caption?: string; asset?: unknown}

async function getHomePhotos() {
  const albums: {photos: RawPhoto[]}[] = await client.fetch(
    `*[_type == "galleryAlbum"] | order(coalesce(date, "1970-01-01") desc) { "photos": photos[defined(asset)] }`
  )
  // Photos for the three Nasza Misja cards, chosen in Sanity Studio
  // ("Strona główna — zdjęcia Nasza Misja"); gallery photos fill any empty slot.
  const chosen: Record<'jezykPolski' | 'historia' | 'tradycje', RawPhoto | null> | null = await client.fetch(
    `*[_type == "homePillars"][0]{jezykPolski, historia, tradycje}`
  )
  const flat = albums.flatMap((a) => a.photos)
  const pillarPhotos = [chosen?.jezykPolski, chosen?.historia, chosen?.tradycje]
    .map((p, i) => (p?.asset ? p : flat[5 + i]))
    .filter(Boolean)
  return {
    heroSlides: flat.slice(0, 5).map((p) => urlFor(p).width(1800).height(1000).fit('crop').url()),
    pillars: pillarPhotos.map((p) => urlFor(p).width(600).height(750).fit('crop').url()),
    cta: flat[11] ? urlFor(flat[11]).width(1600).height(700).fit('crop').url() : null,
  }
}

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Home'})
  const tAbout = await getTranslations({locale, namespace: 'About'})
  const [announcements, gallery, photos, upcomingEvents] = await Promise.all([
    getAnnouncements(), getGalleryPreview(), getHomePhotos(), getUpcomingEvents(),
  ])
  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  const pillars = [
    {title: tAbout('val1Title'), short: tAbout('val1Short'), anchor: 'jezyk-polski'},
    {title: tAbout('val2Title'), short: tAbout('val2Short'), anchor: 'historia-i-kultura'},
    {title: tAbout('val4Title'), short: tAbout('val4Short'), anchor: 'tradycje-i-wydarzenia'},
  ]

  return (
    <>
      {/* Motto of the year — shown first, above the hero */}
      <div className="py-6 px-4 text-center">
        <p className="text-navy/60 text-xs font-bold uppercase tracking-[0.2em] mb-1">{t('mottoLabel')}</p>
        <p className={`${script.className} text-4xl sm:text-5xl leading-none`}>
          <span className="text-[#c0392b]">{t('mottoPart1')}</span>
          <span className="text-navy"> – {t('mottoPart2')}</span>
        </p>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden min-h-[70vh] flex items-center">
        <HeroCarousel slides={photos.heroSlides} />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center text-white w-full">
          <Reveal>
            <p className="text-gold-tint text-sm font-bold uppercase tracking-[0.2em] mb-4">{t('welcome')}</p>
            <h1 className={`${display.className} text-4xl sm:text-5xl leading-tight mb-4`}>
              <span className="italic font-semibold">{t('title')}</span>
              <br />
              <span className="font-bold">{t('subtitle')}</span>
            </h1>
            <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto">{t('description')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href={'/' + locale + '/about'} className="bg-gold text-navy font-bold px-6 py-3 rounded hover:bg-gold-light transition-colors text-sm">
                {t('learnMore')}
              </Link>
              <Link href={'/' + locale + '/contact'} className="border border-gold-tint text-gold-tint font-bold px-6 py-3 rounded hover:bg-gold-tint hover:text-navy transition-colors text-sm">
                {t('contactBtn')}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="bg-navy-dark text-gray-300 py-4 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
          {[
            {Icon: IconCalendar, label: t('schedule'), value: t('scheduleVal')},
            {Icon: IconMapPin, label: t('address'), value: '365 Emerson Avenue, Plainfield, NJ 07062'},
            {Icon: IconMail, label: t('email'), value: 'psdniemcewicza@gmail.com'},
            {Icon: IconPhone, label: t('phone'), value: '(732) 266-4310'},
          ].map(({Icon, ...item}) => (
            <div key={item.label}>
              <Icon className="w-6 h-6 mx-auto text-gold-tint" />
              <p className="text-gold-tint text-xs font-bold uppercase tracking-wider mt-1">{item.label}</p>
              <p className="text-gray-300 text-xs mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission / pillars */}
      <div className="bg-cream py-16 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div>
              <Image
                src="/logo-25-lat.png"
                alt="25 lat — Polska Szkoła Dokształcająca im. Juliana Ursyna Niemcewicza w Plainfield, New Jersey"
                width={698}
                height={674}
                className="w-44 sm:w-56 h-auto mb-6 mix-blend-multiply"
              />
              <p className="text-gold text-xs font-bold uppercase tracking-widest mb-3">{t('missionTag')}</p>
              <h2 className={`${display.className} text-4xl font-bold text-navy mb-5 leading-tight`}>
                <span className="italic">{t('missionAccent')}</span> {t('missionRest')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 max-w-md">{t('missionBody')}</p>
              <Link href={'/' + locale + '/about'} className="text-sm font-bold text-navy hover:text-gold transition-colors">
                {t('missionCta')}
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-3 gap-3">
            {photos.pillars.map((src, i) => (
              <Reveal key={src} delay={i * 0.06}>
                {/* Plain <a>, not <Link>: Next 16's client router re-appends the #hash
                    after back-navigation (/about#x#x), so let the browser handle it */}
                <a
                  href={`/${locale}/about#${pillars[i].anchor}`}
                  className="group block relative aspect-[4/5] rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 33vw, 17vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent transition-colors duration-500 group-hover:via-navy/50" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="font-bold text-sm leading-snug">{pillars[i].title}</p>
                    <span className="block h-0.5 w-6 bg-gold mt-1.5 transition-all duration-500 group-hover:w-12" />
                    {/* Teaser: always shown on touch screens wide enough, revealed on hover elsewhere */}
                    <div className="hidden sm:grid grid-rows-[1fr] [@media(hover:hover)]:grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] transition-[grid-template-rows] duration-500">
                      <div className="overflow-hidden">
                        <p className="text-xs text-gray-200 leading-snug pt-2">{pillars[i].short}</p>
                        <p className="text-xs font-bold text-gold-tint pt-1.5">{tAbout('valMore')} →</p>
                      </div>
                    </div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1">{t('announcementsTitle')}</h2>
              <Link href={'/' + locale + '/announcements'} className="text-xs text-gold font-semibold hover:underline">{t('viewAll')}</Link>
            </div>
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('noAnnouncements')}</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <article key={a._id} className={'bg-white border-l-4 ' + (a.pinned ? 'border-gold' : 'border-navy-light') + ' rounded-r-lg shadow-sm p-5'}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {a.pinned && <span className="text-xs bg-gold text-navy font-bold px-2 py-0.5 rounded">{t('pinned')}</span>}
                        <h3 className="font-bold text-navy text-base">{a.title}</h3>
                      </div>
                      <time className="text-xs text-gray-400 shrink-0">
                        {new Date(a.publishedAt).toLocaleDateString(dateLocale, {day: 'numeric', month: 'long', year: 'numeric'})}
                      </time>
                    </div>
                    {a.body && <div className="prose prose-sm max-w-none text-gray-700"><PortableText value={a.body} /></div>}
                  </article>
                ))}
              </div>
            )}
          </div>

          {gallery.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1">{t('galleryTitle')}</h2>
                <Link href={'/' + locale + '/gallery'} className="text-xs text-gold font-semibold hover:underline">{t('viewAll')}</Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {gallery.map((album) => {
                  const cover = album.coverImage || album.firstPhoto
                  return (
                    <Link key={album._id} href={`/${locale}/gallery/${album.slug}`} className="group">
                      <div className="relative aspect-square rounded overflow-hidden bg-cream">
                        {cover && (
                          <Image src={urlFor(cover).width(300).height(300).fit('crop').url()} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-navy mt-1.5 leading-snug group-hover:text-gold transition-colors">{album.title}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1">{t('calendarTitle')}</h2>
              <Link href={'/' + locale + '/calendar'} className="text-xs text-gold font-semibold hover:underline">{t('viewAll')}</Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('noEvents')}</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((e) => {
                  const d = new Date(e.date)
                  return (
                    <div key={e._id} className="bg-white rounded-lg shadow-sm border border-gray-100 flex overflow-hidden">
                      <div className="bg-navy text-white text-center px-3 py-2 min-w-[52px] flex flex-col justify-center shrink-0">
                        <p className="text-gold text-[10px] font-bold uppercase">{d.toLocaleDateString(dateLocale, {month: 'short'})}</p>
                        <p className="text-xl font-bold leading-none">{d.getDate()}</p>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-navy text-sm leading-snug">{e.title}</h3>
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
                {Icon: IconBook,     href: '/' + locale + '/homework/klasa-1', label: t('link_homework')},
                {Icon: IconDocument, href: '/' + locale + '/documents',        label: t('link_documents')},
                {Icon: IconUsers,    href: '/' + locale + '/staff',            label: t('link_staff')},
                {Icon: IconCamera,   href: '/' + locale + '/gallery',          label: t('link_gallery')},
                {Icon: IconMail,     href: '/' + locale + '/contact',          label: t('link_contact')},
              ].map(({Icon, ...l}) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between bg-white border border-gray-100 rounded px-4 py-3 text-sm text-navy font-medium hover:border-gold hover:text-gold transition-colors shadow-sm">
                  <span className="flex items-center gap-3"><Icon className="w-5 h-5 text-gold" />{l.label}</span>
                  <span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {ENROLLMENT_OPEN && (
        <div className="relative overflow-hidden py-16 px-4 text-center">
          {photos.cta && (
            <Image src={photos.cta} alt="" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-navy/85" />
          <div className="relative max-w-2xl mx-auto">
            <h2 className={`${display.className} text-3xl font-bold text-white mb-3`}>{t('ctaTitle')}</h2>
            <p className="text-gray-300 mb-6">{t('ctaDesc')}</p>
            <Link href={'/' + locale + '/enroll'} className="bg-gold text-navy font-bold px-8 py-3 rounded hover:bg-gold-light transition-colors inline-block">
              {t('ctaBtn')}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
