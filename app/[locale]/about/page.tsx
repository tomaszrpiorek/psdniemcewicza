import {getTranslations} from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import {client, urlFor} from '@/lib/sanity'
import {display, sans, script} from '@/lib/fonts'
import Reveal from '@/components/Reveal'
import AlbumGallery from '@/components/AlbumGallery'

export const revalidate = 30

type RawPhoto = {caption?: string; asset?: unknown; _key: string}

async function getLifePhotos() {
  const albums: {photos: RawPhoto[]}[] = await client.fetch(
    `*[_type == "galleryAlbum"] | order(coalesce(date, "1970-01-01") desc) { "photos": photos[defined(asset)] }`
  )
  return albums
    .flatMap((a) => a.photos)
    .slice(0, 6)
    .map((p) => ({
      thumbUrl: urlFor(p).width(500).height(500).fit('crop').url(),
      fullUrl: urlFor(p).width(1600).url(),
      caption: p.caption,
    }))
}

async function getHeroPhoto() {
  const photo: RawPhoto | null = await client.fetch(
    `*[_type == "galleryAlbum"] | order(coalesce(date, "1970-01-01") desc)[0].photos[defined(asset)][0]`
  )
  return photo ? urlFor(photo).width(1800).height(1000).fit('crop').url() : null
}

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'About'})
  const [lifePhotos, heroPhoto] = await Promise.all([getLifePhotos(), getHeroPhoto()])

  const facts = [
    {label: t('statFoundedLabel'), value: t('statFoundedVal')},
    {label: t('statGradesLabel'), value: t('statGradesVal')},
    {label: t('statScheduleLabel'), value: t('statScheduleVal')},
    {label: t('statParishLabel'), value: t('statParishVal')},
  ]

  const teach = [
    {icon: <IconLanguage />, title: t('val1Title'), desc: t('val1Desc')},
    {icon: <IconLandmark />, title: t('val2Title'), desc: t('val2Desc')},
    {icon: <IconSparkle />, title: t('val4Title'), desc: t('val4Desc')},
  ]

  return (
    <main className={sans.className}>
      {/* Motto of the year — shown first, above the hero */}
      <div className="py-6 px-4 text-center">
        <p className="text-navy/60 text-xs font-bold uppercase tracking-[0.2em] mb-1">{t('mottoLabel')}</p>
        <p className={`${script.className} text-4xl sm:text-5xl leading-none`}>
          <span className="text-[#c0392b]">{t('mottoPart1')}</span>
          <span className="text-navy"> – {t('mottoPart2')}</span>
        </p>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden min-h-[62vh] flex items-end">
        {heroPhoto && (
          <Image
            src={heroPhoto}
            alt=""
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/50" />
        <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-14 text-white w-full">
          <Reveal>
            <p className="text-gold-tint text-xs font-bold uppercase tracking-[0.2em] mb-4">{t('tag')}</p>
            <h1 className={`${display.className} text-4xl sm:text-5xl font-bold mb-4 leading-tight`}>
              {t('title')}
            </h1>
            <p className="text-gray-200 text-lg max-w-2xl mb-6">{t('lede')}</p>
            <span className="inline-flex items-center gap-2 border border-gold-tint/50 text-gold-tint text-xs font-bold uppercase tracking-widest rounded-full px-4 py-2">
              {t('statFoundedLabel')} · {t('statFoundedVal')}
            </span>
          </Reveal>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        {/* Mission */}
        <Reveal>
          <section>
            <h2 className={`${display.className} text-3xl font-bold text-navy mb-5`}>{t('missionTitle')}</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>{t.rich('missionP1', {b: (chunks) => <strong className="font-bold text-navy">{chunks}</strong>})}</p>
              <p>{t('missionP2')}</p>
              <p>{t.rich('missionP3', {b: (chunks) => <strong className="font-bold text-navy">{chunks}</strong>})}</p>
              <p>{t('missionP4')}</p>
              <p>{t('missionP5')}</p>
              <p>{t('missionP6')}</p>
              <p>{t('missionP7')}</p>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200 border-y border-gray-200 py-6">
              {facts.map((f) => (
                <div key={f.label} className="px-4 sm:px-6 first:pl-0">
                  <p className="text-gold text-[11px] font-bold uppercase tracking-widest mb-1.5">{f.label}</p>
                  <p className="font-bold text-navy leading-snug">{f.value}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* History timeline */}
        <Reveal>
          <section>
            <h2 className={`${display.className} text-3xl font-bold text-navy mb-8`}>{t('historyTitle')}</h2>
            <div className="relative grid sm:grid-cols-3 gap-8 sm:gap-5">
              <div className="hidden sm:block absolute top-3 left-[calc(16.66%)] right-[calc(16.66%)] h-px bg-gold/40" />
              {[
                {year: t('history1Year'), text: t('history1Text')},
                {year: t('history2Year'), text: t('history2Text')},
                {year: t('history3Year'), text: t('history3Text')},
              ].map((h) => (
                <div key={h.year} className="relative pl-7 sm:pl-0 sm:pt-8 sm:text-center">
                  <span className="absolute left-0 top-1 sm:top-0 sm:left-1/2 sm:-translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gold" />
                  <div className="bg-navy text-white rounded-lg px-3 py-1 text-xs font-bold inline-block mb-3">
                    {h.year}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{h.text}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Patron */}
        <Reveal>
          <section className="bg-cream rounded-2xl p-6 sm:p-10 border border-gray-100">
            <div className="grid sm:grid-cols-[180px_1fr] gap-8 items-start">
              <div className="mx-auto sm:mx-0 w-40 sm:w-full">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gold shadow-md bg-white">
                  <Image
                    src="/patron-niemcewicz-sketch.jpg"
                    alt={t('patronName')}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-2 leading-snug">{t('patronPortraitCredit')}</p>
              </div>
              <div>
                <p className="text-gold text-xs font-bold uppercase tracking-widest mb-1">{t('patronTitle')}</p>
                <h2 className={`${display.className} text-2xl font-bold text-navy mb-1`}>
                  {t('patronName')} <span className="text-gray-400 font-normal text-lg">({t('patronDates')})</span>
                </h2>
                <p className="text-gray-600 leading-relaxed">{t('patronBio')}</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Values */}
        <section>
          <Reveal>
            <h2 className={`${display.className} text-3xl font-bold text-navy mb-8`}>{t('valuesTitle')}</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-5">
            {teach.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="h-full bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-gold transition-colors">
                  <div className="text-navy mb-4">{v.icon}</div>
                  <h3 className="font-bold text-navy mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Class structure */}
        <Reveal>
          <section>
            <h2 className={`${display.className} text-3xl font-bold text-navy mb-3`}>{t('classTitle')}</h2>
            <p className="text-gray-600 mb-8 max-w-2xl">{t('classDesc')}</p>
            <div className="relative grid sm:grid-cols-2 gap-8 sm:gap-5">
              <div className="hidden sm:block absolute top-3 left-[calc(25%)] right-[calc(25%)] h-px bg-gold/40" />
              {[
                {level: t('classPreschoolLevel'), desc: t('classPreschoolDesc')},
                {level: t('classGradesLevel'), desc: t('classGradesDesc')},
              ].map((c) => (
                <div key={c.level} className="relative pl-7 sm:pl-0 sm:pt-8">
                  <span className="absolute left-0 top-1 sm:top-0 sm:left-1/2 sm:-translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gold" />
                  <div className="bg-navy text-white rounded-lg px-3 py-1 text-xs font-bold inline-block mb-3">
                    {c.level}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Life at school */}
        {lifePhotos.length > 0 && (
          <Reveal>
            <section>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
                <div>
                  <h2 className={`${display.className} text-3xl font-bold text-navy mb-2`}>{t('lifeTitle')}</h2>
                  <p className="text-gray-600 max-w-xl">{t('lifeDesc')}</p>
                </div>
                <Link
                  href={`/${locale}/gallery`}
                  className="text-sm font-bold text-navy hover:text-gold transition-colors whitespace-nowrap"
                >
                  {t('lifeCta')} →
                </Link>
              </div>
              <AlbumGallery photos={lifePhotos} />
            </section>
          </Reveal>
        )}
      </div>
    </main>
  )
}

function IconLanguage() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h9M7 3v2m3.5 4c-.5 3-2.5 5.5-5.5 7M6 8.5c1 2 3 4 6 5.5M14 21l4-9 4 9M15.5 18h5" />
    </svg>
  )
}

function IconLandmark() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 21V10m4 11V10m4 11V10m4 11V10m4 11V10M2 10l10-6 10 6M4 10h16" />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  )
}
