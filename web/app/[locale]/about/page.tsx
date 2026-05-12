import {getTranslations} from 'next-intl/server'

export const revalidate = 30

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'About'})

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-navy mb-4 border-b-2 border-gold pb-1 inline-block">{t('missionTitle')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('missionP1')}</p>
            <p className="text-gray-600 leading-relaxed">{t('missionP2')}</p>
          </div>
          <div className="bg-navy rounded-2xl p-8 text-white text-center">
            <p className="text-6xl font-bold text-gold mb-2">20+</p>
            <p className="text-gray-300">{t('statYears')}</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy mb-6 border-b-2 border-gold pb-1 inline-block">{t('valuesTitle')}</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {([
              {icon: '🏫', title: t('val1Title'), desc: t('val1Desc')},
              {icon: '🎭', title: t('val2Title'), desc: t('val2Desc')},
              {icon: '🤝', title: t('val3Title'), desc: t('val3Desc')},
            ]).map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:border-gold transition-colors">
                <p className="text-4xl mb-3">{v.icon}</p>
                <h3 className="font-bold text-navy mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy mb-6 border-b-2 border-gold pb-1 inline-block">{t('classTitle')}</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {([
              {ages: t('c1ages'), level: t('c1level'), desc: t('c1desc')},
              {ages: t('c2ages'), level: t('c2level'), desc: t('c2desc')},
              {ages: t('c3ages'), level: t('c3level'), desc: t('c3desc')},
              {ages: t('c4ages'), level: t('c4level'), desc: t('c4desc')},
            ]).map((c, i) => (
              <div key={c.level} className={`flex gap-5 items-start p-5 ${i < 3 ? 'border-b border-gray-100' : ''}`}>
                <div className="bg-navy text-white rounded-lg px-3 py-1 text-xs font-bold shrink-0 mt-0.5">{c.ages}</div>
                <div>
                  <h3 className="font-bold text-navy">{c.level}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
