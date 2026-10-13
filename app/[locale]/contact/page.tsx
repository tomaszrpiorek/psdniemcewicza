import {getTranslations} from 'next-intl/server'
import Image from 'next/image'
import ContactForm from '@/components/ContactForm'
import {getFeaturedPhoto} from '@/lib/sanity'
import {IconMail, IconPhone, IconMapPin, IconMailbox, IconClock} from '@/components/icons'

export default async function ContactPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Contact'})
  const heroPhoto = await getFeaturedPhoto(6)

  return (
    <main>
      <div className="relative overflow-hidden py-12 px-4">
        {heroPhoto && <Image src={heroPhoto} alt="" fill className="object-cover" />}
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative max-w-4xl mx-auto text-white">
          <p className="text-gold-tint text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12 grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-navy border-b-2 border-gold pb-1 mb-5 inline-block">{t('infoTitle')}</h2>
            <ul className="space-y-5">
              {[
                {Icon: IconMail, label: t('emailLabel'), value: 'psdniemcewicza@gmail.com', href: 'mailto:psdniemcewicza@gmail.com'},
                {Icon: IconPhone, label: t('phoneLabel'), value: '(732) 266-4310', href: 'tel:+17322664310'},
                {Icon: IconMapPin, label: t('addressLabel'), value: '365 Emerson Avenue, Plainfield, NJ 07062'},
                {Icon: IconMailbox, label: t('addressMailLabel'), value: '1232 George Street, Plainfield, NJ 07062'},
                {Icon: IconClock, label: t('hoursLabel'), value: t('hoursVal')},
              ].map(({Icon, ...item}) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="flex-none w-10 h-10 rounded-full bg-cream text-gold flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gold uppercase tracking-wider">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="inline-block py-1 text-navy break-all hover:text-gold transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-navy">{item.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy rounded-xl p-6 text-white">
            <h3 className="font-bold text-gold mb-3">{t('enrollTitle')}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{t('enrollDesc')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 sm:p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-navy mb-6">{t('formTitle')}</h2>
          <ContactForm />
        </div>
      </div>
    </main>
  )
}
