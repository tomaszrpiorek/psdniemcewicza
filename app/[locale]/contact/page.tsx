import {getTranslations} from 'next-intl/server'
import ContactForm from '@/components/ContactForm'

export default async function ContactPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Contact'})

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-navy border-b-2 border-gold pb-1 mb-5 inline-block">{t('infoTitle')}</h2>
            <ul className="space-y-5">
              {[
                {icon: '📧', label: t('emailLabel'), value: 'psdniemcewicza@gmail.com', href: 'mailto:psdniemcewicza@gmail.com'},
                {icon: '📞', label: t('phoneLabel'), value: '(732) 266-4310', href: 'tel:+17322664310'},
                {icon: '📍', label: t('addressLabel'), value: '365 Emerson Avenue, Plainfield, NJ 07062'},
                {icon: '✉️', label: t('addressMailLabel'), value: '1232 George Street, Plainfield, NJ 07062'},
                {icon: '🕐', label: t('hoursLabel'), value: t('hoursVal')},
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-gold uppercase tracking-wider">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-navy hover:text-gold transition-colors">{item.value}</a>
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
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-navy mb-6">{t('formTitle')}</h2>
          <ContactForm />
        </div>
      </div>
    </main>
  )
}
