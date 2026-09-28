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

export const revalidate = 30

type Announcement = {_id: string; title: string; body?: PortableTextBlock[]; publishedAt: string; pinned?: boolean}
type GalleryPreviewAlbum = {
  _id: string; title: string; slug: string
  coverImage?: Record<string, unknown>; firstPhoto?: Record<string, unknown>
}

async function getAnnouncements(): Promise<Announcement[]> {
  return client.fetch(`*[_type == "announcement"] | order(pinned desc, publishedAt desc)[0...4] {
    _id, title, body, publishedAt, pinned
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
  const flat = albums.flatMap((a) => a.photos)
  return {
    heroSlides: flat.slice(0, 5).map((p) => urlFor(p).width(1800).height(1000).fit('crop').url()),
    pillars: flat.slice(5, 8).map((p) => urlFor(p).width(600).height(750).fit('crop').url()),
  }
}

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Home'})
  const tAbout = await getTranslations({locale, namespace: 'About'})
  const [announcements, gallery, photos] = await Promise.all([
    getAnnouncements(), getGalleryPreview(), getHomePhotos(),
  ])
  const dateLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

  const pillars = [
    {title: tAbout('val1Title')},
    {title: tAbout('val2Title')},
    {title: tAbout('val4Title')},
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
            {icon: '📅', label: t('schedule'), value: t('scheduleVal')},
            {icon: '📍', label: t('address'), value: '365 Emerson Avenue, Plainfield, NJ 07062'},
            {icon: '📧', label: t('email'), value: 'psdniemcewicza@gmail.com'},
            {icon: '📞', label: t('phone'), value: '(732) 266-4310'},
          ].map((item) => (
            <div key={item.label}>
              <span className="text-lg">{item.icon}</span>
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
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden group">
                  {photos.pillars[i] && (
                    <Image
                      src={photos.pillars[i]}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 33vw, 17vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 text-white font-bold text-sm leading-snug">
                    {p.title}
                  </p>
                </div>
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
            <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1 mb-5">{t('calendarTitle')}</h2>
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <iframe
                src="https://calendar.google.com/calendar/embed?src=psdniemcewicza%40gmail.com&ctz=America%2FNew_York"
                width="100%"
                height="400"
                style={{border: 0}}
                frameBorder={0}
                scrolling="no"
                title="Kalendarz szkolny"
              />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-navy border-b-2 border-gold pb-1 mb-5">{t('quickLinks')}</h2>
            <div className="space-y-2">
              {[
                {href: '/' + locale + '/homework/klasa-1', label: t('link_homework')},
                {href: '/' + locale + '/documents',        label: t('link_documents')},
                {href: '/' + locale + '/staff',            label: t('link_staff')},
                {href: '/' + locale + '/gallery',          label: t('link_gallery')},
                {href: '/' + locale + '/contact',          label: t('link_contact')},
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between bg-white border border-gray-100 rounded px-4 py-3 text-sm text-navy font-medium hover:border-gold hover:text-gold transition-colors shadow-sm">
                  {l.label}<span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {ENROLLMENT_OPEN && (
        <div className="bg-navy py-12 px-4 text-center">
          <div className="max-w-2xl mx-auto">
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
