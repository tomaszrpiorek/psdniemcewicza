import {getTranslations} from 'next-intl/server'

export const revalidate = 30

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'About'})

  const facts = [
    {label: t('statFoundedLabel'),  value: t('statFoundedVal')},
    {label: t('statGradesLabel'),   value: t('statGradesVal')},
    {label: t('statScheduleLabel'), value: t('statScheduleVal')},
    {label: t('statParishLabel'),   value: t('statParishVal')},
  ]

  const teach = [
    {icon: '🇵🇱', title: t('val1Title'), desc: t('val1Desc')},
    {icon: '📖', title: t('val2Title'), desc: t('val2Desc')},
    {icon: '✝️', title: t('val3Title'), desc: t('val3Desc')},
    {icon: '🎭', title: t('val4Title'), desc: t('val4Desc')},
  ]

  return (
    <main>
      <div className="bg-navy text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-3">{t('tag')}</p>
          <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-gray-300 text-lg max-w-2xl">{t('lede')}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-16">
        <section className="grid md:grid-cols-5 gap-10 items-start">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold text-navy mb-4 border-b-2 border-gold pb-1 inline-block">{t('missionTitle')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('missionP1')}</p>
            <p className="text-gray-600 leading-relaxed">{t('missionP2')}</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            {facts.map((f) => (
              <div key={f.label} className="bg-navy rounded-xl p-4 text-white">
                <p className="text-gold text-xs font-bold uppercase tracking-wider mb-1">{f.label}</p>
                <p className="font-bold leading-snug">{f.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-cream rounded-2xl p-8 sm:p-10 border border-gray-100">
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="w-16 h-16 rounded-full bg-navy text-gold flex items-center justify-center text-3xl shrink-0">🖋️</div>
            <div>
              <p className="text-gold text-xs font-bold uppercase tracking-widest mb-1">{t('patronTitle')}</p>
              <h2 className="text-xl font-bold text-navy mb-1">
                {t('patronName')} <span className="text-gray-400 font-normal text-base">({t('patronDates')})</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">{t('patronBio')}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy mb-6 border-b-2 border-gold pb-1 inline-block">{t('valuesTitle')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {teach.map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-gold transition-colors">
                <p className="text-4xl mb-3">{v.icon}</p>
                <h3 className="font-bold text-navy mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy mb-3 border-b-2 border-gold pb-1 inline-block">{t('classTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('classDesc')}</p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="bg-navy text-white rounded-lg px-3 py-1 text-xs font-bold inline-block mb-3">{t('classPreschoolLevel')}</div>
              <p className="text-sm text-gray-500 leading-relaxed">{t('classPreschoolDesc')}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="bg-navy text-white rounded-lg px-3 py-1 text-xs font-bold inline-block mb-3">{t('classGradesLevel')}</div>
              <p className="text-sm text-gray-500 leading-relaxed">{t('classGradesDesc')}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
