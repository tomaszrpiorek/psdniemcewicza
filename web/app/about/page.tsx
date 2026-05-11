export default function AboutPage() {
  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Kim Jesteśmy</p>
          <h1 className="text-3xl font-bold">O Naszej Szkole</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Mission */}
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-navy mb-4 border-b-2 border-gold pb-1 inline-block">Nasza Misja</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Polska Szkoła im. Adama Mickiewicza jest szkołą społeczną poświęconą nauczaniu języka polskiego,
              literatury, historii i kultury wśród dzieci wychowujących się poza Polską.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Wierzymy, że język jest fundamentem tożsamości. Nasi nauczyciele z pasją
              przekazują wiedzę o polskim dziedzictwie na każdej lekcji.
            </p>
          </div>
          <div className="bg-navy rounded-2xl p-8 text-white text-center">
            <p className="text-6xl font-bold text-gold mb-2">20+</p>
            <p className="text-gray-300">lat służby naszej społeczności</p>
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold text-navy mb-6 border-b-2 border-gold pb-1 inline-block">Nasze Wartości</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {icon: '🏫', title: 'Edukacja', desc: 'Rzetelna i angażująca nauka języka polskiego na wszystkich poziomach.'},
              {icon: '🎭', title: 'Kultura', desc: 'Celebracja polskich tradycji, świąt, historii i sztuki.'},
              {icon: '🤝', title: 'Wspólnota', desc: 'Budowanie więzi między polskimi rodzinami w naszym regionie.'},
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:border-gold transition-colors">
                <p className="text-4xl mb-3">{v.icon}</p>
                <h3 className="font-bold text-navy mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Classes */}
        <section>
          <h2 className="text-2xl font-bold text-navy mb-6 border-b-2 border-gold pb-1 inline-block">Struktura Klas</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {[
              {level: 'Klasa 0 — Przedszkole', ages: '4–6 lat', desc: 'Wprowadzenie do alfabetu, podstawowe słownictwo i piosenki.'},
              {level: 'Klasa 1–2', ages: '6–9 lat', desc: 'Czytanie, pisanie i podstawy gramatyki.'},
              {level: 'Klasa 3–4', ages: '9–12 lat', desc: 'Literatura, historia i kompozycja.'},
              {level: 'Klasa 5 — Zaawansowana', ages: '12+ lat', desc: 'Zaawansowana gramatyka, lektury i przygotowanie do egzaminów.'},
            ].map((c, i) => (
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
