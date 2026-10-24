import {getTranslations} from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import {getFeaturedPhoto} from '@/lib/sanity'
import {SPONSORS} from '@/lib/sponsors'
import type {Metadata} from 'next'
import {pageMetadata} from '@/lib/seo'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Sponsors'})
  const m = await getTranslations({locale, namespace: 'Metadata'})
  return pageMetadata(locale, '/sponsors', t('title'), m('sponsorsDescription'))
}

export default async function SponsorsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Sponsors'})
  const heroPhoto = await getFeaturedPhoto(7)

  return (
    <main>
      <div className="relative overflow-hidden py-12 px-4">
        {heroPhoto && <Image src={heroPhoto} alt="" fill className="object-cover" />}
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative max-w-5xl mx-auto text-white">
          <p className="text-gold-tint text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        <p className="text-gray-600 leading-relaxed max-w-3xl mb-10">{t('intro')}</p>

        <div className="grid md:grid-cols-3 gap-6">
          {SPONSORS.map((s) => (
            <article key={s.key} className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(`${s.key}Name`)}
                className="flex items-center justify-center h-36 px-4 border-b-4 border-gold bg-white hover:opacity-80 transition-opacity"
              >
                <Image src={s.logo} alt={t(`${s.key}Name`)} width={s.width} height={s.height} className="max-h-24 w-auto max-w-full object-contain rounded" />
              </a>
              <div className="flex flex-col flex-1 p-6">
                <h2 className="font-bold text-navy text-lg leading-snug mb-3">{t(`${s.key}Name`)}</h2>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{t(`${s.key}Desc`)}</p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-5 py-1 text-sm font-bold text-gold hover:text-navy transition-colors"
                >
                  {t('visit')} →
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="bg-navy rounded-xl p-6 sm:p-8 text-white mt-12 sm:flex sm:items-center sm:justify-between gap-8">
          <div>
            <h2 className="font-bold text-gold text-lg mb-2">{t('ctaTitle')}</h2>
            <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{t('ctaDesc')}</p>
          </div>
          <Link
            href={`/${locale}/contact`}
            className="inline-block mt-5 sm:mt-0 shrink-0 bg-gold text-navy font-bold px-6 py-3 rounded hover:bg-gold-light transition-colors text-sm"
          >
            {t('ctaBtn')}
          </Link>
        </div>
      </div>
    </main>
  )
}
