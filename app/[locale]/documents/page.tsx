import {getTranslations} from 'next-intl/server'

type Doc = {label: string; href?: string; ext?: string}
type Section = {category: string; items: Doc[]}

export default async function DocumentsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'Documents'})

  const documents: Section[] = [
    {
      category: t('cat1'),
      items: [
        {label: t('doc_registration'),   href: '/documents/formularz-rejestracji-2026-2027.docx',    ext: 'DOCX'},
        {label: t('doc_medical'),        href: '/documents/medical-parental-release-2026-2027.docx', ext: 'DOCX'},
        {label: t('doc_id_student'),     href: '/documents/wniosek-legitymacja-uczen.pdf',           ext: 'PDF'},
        {label: t('doc_id_teacher'),     href: '/documents/wniosek-legitymacja-nauczyciel.pdf',      ext: 'PDF'},
        {label: t('doc3')},
      ],
    },
    {
      category: t('cat2'),
      items: [
        {label: t('doc4')},
        {label: t('doc5')},
        {label: t('doc6')},
      ],
    },
    {
      category: t('cat3'),
      items: [
        {label: t('doc7')},
        {label: t('doc8')},
      ],
    },
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
                <div key={doc.label} className="flex items-center justify-between bg-white border border-gray-100 rounded px-5 py-3 shadow-sm hover:border-gold transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <span className="text-sm font-medium text-navy">{doc.label}</span>
                  </div>
                  {doc.href ? (
                    <a
                      href={doc.href}
                      download
                      className="text-xs bg-gold text-navy font-bold px-3 py-1 rounded hover:bg-gold-light transition-colors"
                    >
                      {t('download')} {doc.ext}
                    </a>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">{t('comingSoon')}</span>
                  )}
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
