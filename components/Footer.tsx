'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useLocale, useTranslations} from 'next-intl'
import {IconMail, IconPhone, IconMapPin, IconClock} from '@/components/icons'

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
          <h3 className="text-gold-tint font-bold mb-3 text-xs uppercase tracking-widest">{t('school')}</h3>
          <ul className="space-y-2 text-sm">
            {[
              {href: `/${locale}/about`,     label: tNav('about')},
              {href: `/${locale}/staff`,     label: tNav('staff')},
              {href: `/${locale}/gallery`,   label: tNav('gallery')},
              {href: `/${locale}/documents`, label: tNav('documents')},
            ].map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-gold-tint transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-gold-tint font-bold mb-3 text-xs uppercase tracking-widest">{t('info')}</h3>
          <ul className="space-y-2 text-sm">
            {[
              {href: `/${locale}/announcements`,    label: tNav('announcements')},
              {href: `/${locale}/calendar`,         label: tNav('calendar')},
              {href: `/${locale}/homework/klasa-1`, label: tNav('homework')},
              {href: `/${locale}/contact`,          label: tNav('contact')},
            ].map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-gold-tint transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-gold-tint font-bold mb-3 text-xs uppercase tracking-widest">{t('contact')}</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2"><IconMail className="flex-none w-4 h-4 mt-0.5 text-gold-tint" />psdniemcewicza@gmail.com</li>
            <li className="flex items-start gap-2"><IconPhone className="flex-none w-4 h-4 mt-0.5 text-gold-tint" />(732) 266-4310</li>
            <li className="flex items-start gap-2"><IconMapPin className="flex-none w-4 h-4 mt-0.5 text-gold-tint" />365 Emerson Avenue, Plainfield, NJ 07062</li>
            <li className="flex items-start gap-2 pt-1"><IconClock className="flex-none w-4 h-4 mt-0.5 text-gold-tint" />{t('hours')}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-light text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} {t('copyright')}
      </div>
    </footer>
  )
}
