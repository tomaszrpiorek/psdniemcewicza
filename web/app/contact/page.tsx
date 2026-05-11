export default function ContactPage() {
  return (
    <main>
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Kontakt</p>
          <h1 className="text-3xl font-bold">Kontakt z Nami</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12">

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-navy border-b-2 border-gold pb-1 mb-5 inline-block">Dane Szkoły</h2>
            <ul className="space-y-5">
              {[
                {icon: '📧', label: 'Email', value: 'info@polskaszkola.com', href: 'mailto:info@polskaszkola.com'},
                {icon: '📞', label: 'Telefon', value: '(000) 000-0000', href: 'tel:0000000000'},
                {icon: '📍', label: 'Adres', value: '123 School Street, City, State 00000'},
                {icon: '🕐', label: 'Zajęcia', value: 'Soboty 9:00 – 13:00'},
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
            <h3 className="font-bold text-gold mb-3">Zapisy do szkoły</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Przyjmujemy zapisy przez cały rok. Skontaktuj się z nami aby umówić spotkanie wstępne i poznać wymagania dla danego poziomu.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-navy mb-6">Wyślij wiadomość</h2>
          <form className="space-y-4" action="mailto:info@polskaszkola.com" method="get" encType="text/plain">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Imię i Nazwisko</label>
              <input
                type="text"
                name="name"
                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Jan Kowalski"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="jan@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Wiadomość</label>
              <textarea
                name="body"
                rows={5}
                className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                placeholder="Chciałbym dowiedzieć się więcej o zapisach..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-navy text-white font-bold py-3 rounded hover:bg-navy-dark transition-colors"
            >
              Wyślij Wiadomość
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
