'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useLocale, useTranslations} from 'next-intl'

export default function Footer() {
  const locale = useLocale()
  const t = useTranslations('Footer')
  const tNav = useTranslations('Nav')

  return (
    <footer className="bg-navy text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Image src="/logo.png" alt="Logo" width={70} height={70} className="object-contain mb-3 opacity-90" />
          <p className="text-sm text-gray-400 leading-relaxed">{t('desc')}</p>
        </div>

        <div>
          <h3 className="text-gold font-bold mb-3 text-xs uppercase tracking-widest">{t('school')}</h3>
          <ul className="space-y-2 text-sm">
            {[
              {href: `/${locale}/about`,     label: tNav('about')},
              {href: `/${locale}/staff`,     label: tNav('staff')},
              {href: `/${locale}/gallery`,   label: tNav('gallery')},
              {href: `/${locale}/documents`, label: tNav('documents')},
            ].map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-gold transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-gold font-bold mb-3 text-xs uppercase tracking-widest">{t('info')}</h3>
          <ul className="space-y-2 text-sm">
            {[
              {href: `/${locale}/announcements`,    label: tNav('announcements')},
              {href: `/${locale}/calendar`,         label: tNav('calendar')},
              {href: `/${locale}/homework/klasa-1`, label: tNav('homework')},
              {href: `/${locale}/contact`,          label: tNav('contact')},
            ].map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-gold transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-gold font-bold mb-3 text-xs uppercase tracking-widest">{t('contact')}</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📧 info@psdniemcewicz.org</li>
            <li>📞 (000) 000-0000</li>
            <li>📍 123 School Street, Plainfield, NJ</li>
            <li className="pt-1">🕐 {t('hours')}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-light text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} {t('copyright')}
      </div>
    </footer>
  )
}
