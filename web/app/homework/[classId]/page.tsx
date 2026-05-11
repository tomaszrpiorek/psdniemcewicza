import Link from 'next/link'

const classes: Record<string, {label: string; teacher: string; description: string}> = {
  'przedszkole': {label: 'Klasa 0 — Przedszkole', teacher: 'Pani Kowalska', description: 'Wprowadzenie do języka polskiego, piosenki i zabawy.'},
  'klasa-1':     {label: 'Klasa 1', teacher: 'Pani Nowak', description: 'Alfabet, czytanie i pisanie podstawowych słów.'},
  'klasa-2':     {label: 'Klasa 2', teacher: 'Pan Wiśniewski', description: 'Czytanie, gramatyka i słownictwo.'},
  'klasa-3':     {label: 'Klasa 3', teacher: 'Pani Wójcik', description: 'Literatura, dyktanda i pisanie.'},
  'klasa-4':     {label: 'Klasa 4', teacher: 'Pani Kamińska', description: 'Historia Polski, lektury i kompozycja.'},
  'klasa-5':     {label: 'Klasa 5 — Zaawansowana', teacher: 'Pan Kowalski', description: 'Zaawansowana gramatyka, literatura i przygotowanie do egzaminów.'},
}

export default async function HomeworkPage({params}: {params: Promise<{classId: string}>}) {
  const {classId} = await params
  const cls = classes[classId]

  if (!cls) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">Klasa nie znaleziona</h1>
        <Link href="/" className="text-gold hover:underline">Powrót do strony głównej</Link>
      </main>
    )
  }

  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Zadania Domowe</p>
          <h1 className="text-3xl font-bold">{cls.label}</h1>
          <p className="text-gray-300 mt-1 text-sm">Nauczyciel: {cls.teacher}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Class selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(classes).map(([id, c]) => (
            <Link
              key={id}
              href={`/homework/${id}`}
              className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                id === classId
                  ? 'bg-navy text-white border-navy'
                  : 'border-gray-200 text-navy hover:border-gold hover:text-gold bg-white'
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-gray-500 text-sm">{cls.description}</p>
        </div>

        {/* Placeholder — homework will come from Firebase */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-semibold mb-1">Zadania będą dostępne wkrótce</p>
          <p className="text-amber-700 text-sm">Nauczyciel nie dodał jeszcze zadań dla tej klasy. Sprawdź ponownie wkrótce.</p>
        </div>
      </div>
    </main>
  )
}
