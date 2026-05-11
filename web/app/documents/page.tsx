export default function DocumentsPage() {
  const documents = [
    {category: 'Formularze', items: [
      {name: 'Formularz zapisu do szkoły', type: 'PDF'},
      {name: 'Zgoda rodziców na wyjazd', type: 'PDF'},
      {name: 'Regulamin szkoły', type: 'PDF'},
    ]},
    {category: 'Programy nauczania', items: [
      {name: 'Program nauczania — Klasa 1-2', type: 'PDF'},
      {name: 'Program nauczania — Klasa 3-4', type: 'PDF'},
      {name: 'Program nauczania — Klasa 5', type: 'PDF'},
    ]},
    {category: 'Informacje ogólne', items: [
      {name: 'Kalendarz szkolny 2025/2026', type: 'PDF'},
      {name: 'Lista lektur', type: 'PDF'},
    ]},
  ]

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Szkoła</p>
          <h1 className="text-3xl font-bold">Dokumenty Szkolne</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {documents.map((section) => (
          <section key={section.category}>
            <h2 className="text-lg font-bold text-navy border-b-2 border-gold pb-1 mb-4">{section.category}</h2>
            <div className="space-y-2">
              {section.items.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between bg-white border border-gray-100 rounded px-5 py-3 shadow-sm hover:border-gold transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <span className="text-sm font-medium text-navy">{doc.name}</span>
                  </div>
                  <span className="text-xs bg-navy text-white px-2 py-0.5 rounded">{doc.type}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="text-xs text-gray-400 text-center pt-4">
          Jeśli potrzebujesz dokumentu, którego tu nie ma, skontaktuj się ze szkołą.
        </p>
      </div>
    </main>
  )
}
