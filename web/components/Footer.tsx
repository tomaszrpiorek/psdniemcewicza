import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 sm:grid-cols-4">

        <div className="sm:col-span-1">
          <Image src="/logo.jpg" alt="Logo" width={70} height={70} className="object-contain mb-3 opacity-90" />
          <p className="text-sm text-gray-400 leading-relaxed">
            Pielęgnujemy język polski, kulturę i tradycję w naszej społeczności.
          </p>
        </div>

        <div>
          <h3 className="text-gold font-bold mb-3 text-xs uppercase tracking-widest">Nasza Szkoła</h3>
          <ul className="space-y-2 text-sm">
            {[
              {href: '/about', label: 'O Szkole'},
              {href: '/staff', label: 'Kadra'},
              {href: '/gallery', label: 'Galeria'},
              {href: '/documents', label: 'Dokumenty'},
            ].map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-gold transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-gold font-bold mb-3 text-xs uppercase tracking-widest">Informacje</h3>
          <ul className="space-y-2 text-sm">
            {[
              {href: '/announcements', label: 'Ogłoszenia'},
              {href: '/calendar', label: 'Kalendarz'},
              {href: '/homework/klasa-1', label: 'Zadania'},
              {href: '/contact', label: 'Kontakt'},
            ].map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-gold transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-gold font-bold mb-3 text-xs uppercase tracking-widest">Kontakt</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📧 info@polskaszkola.com</li>
            <li>📞 (000) 000-0000</li>
            <li>📍 123 School Street</li>
            <li className="pt-1">🕐 Sob. 9:00 – 13:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-light text-center py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} Polska Szkoła im. Adama Mickiewicza. Wszelkie prawa zastrzeżone.
      </div>
    </footer>
  )
}
