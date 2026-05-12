import {getTranslations} from 'next-intl/server'

export default async function DocumentsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Documents'})

  const documents = [
    {category: t('cat1'), items: [t('doc1'), t('doc2'), t('doc3')]},
    {category: t('cat2'), items: [t('doc4'), t('doc5'), t('doc6')]},
    {category: t('cat3'), items: [t('doc7'), t('doc8')]},
  ]

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{t('tag')}</p>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {documents.map((section) => (
          <section key={section.category}>
            <h2 className="text-lg font-bold text-navy border-b-2 border-gold pb-1 mb-4">{section.category}</h2>
            <div className="space-y-2">
              {section.items.map((doc) => (
                <div key={doc} className="flex items-center justify-between bg-white border border-gray-100 rounded px-5 py-3 shadow-sm hover:border-gold transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <span className="text-sm font-medium text-navy">{doc}</span>
                  </div>
                  <span className="text-xs bg-navy text-white px-2 py-0.5 rounded">PDF</span>
                </div>
              ))}
            </div>
          </section>
        ))}
        <p className="text-xs text-gray-400 text-center pt-4">{t('footer')}</p>
      </div>
    </main>
  )
}
