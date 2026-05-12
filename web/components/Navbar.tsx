'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useState, useRef} from 'react'

type NavItem =
  | {label: string; href: string; children?: never}
  | {label: string; href?: never; children: {label: string; href: string}[]}

const navItems: NavItem[] = [
  {
    label: 'Nasza Szkoła',
    children: [
      {label: 'O Szkole', href: '/about'},
      {label: 'Kadra Pedagogiczna', href: '/staff'},
      {label: 'Galeria', href: '/gallery'},
      {label: 'Dokumenty Szkolne', href: '/documents'},
    ],
  },
  {label: 'Ogłoszenia', href: '/announcements'},
  {
    label: 'Zadania',
    children: [
      {label: 'Klasa 0 — Przedszkole', href: '/homework/przedszkole'},
      {label: 'Klasa 1', href: '/homework/klasa-1'},
      {label: 'Klasa 2', href: '/homework/klasa-2'},
      {label: 'Klasa 3', href: '/homework/klasa-3'},
      {label: 'Klasa 4', href: '/homework/klasa-4'},
      {label: 'Klasa 5 — Zaawansowana', href: '/homework/klasa-5'},
    ],
  },
  {label: 'Kalendarz', href: '/calendar'},
  {label: 'Kontakt', href: '/contact'},
]

function DropdownItem({item}: {item: NavItem}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(true)
  }
  const handleLeave = () => {
    timer.current = setTimeout(() => setOpen(false), 150)
  }

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="px-4 py-2 text-sm font-semibold text-white hover:text-gold transition-colors whitespace-nowrap tracking-wide"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button className="px-4 py-2 text-sm font-semibold text-white hover:text-gold transition-colors flex items-center gap-1 tracking-wide">
        {item.label}
        <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 bg-white shadow-xl border-t-2 border-gold min-w-[220px] z-50 py-1">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block px-4 py-2.5 text-sm text-navy hover:bg-cream hover:text-gold font-medium transition-colors border-b border-gray-50 last:border-0"
              onClick={() => setOpen(false)}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header>
      {/* Top bar */}
      <div className="bg-navy-dark text-gray-300 text-xs py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>📧 info@polskaszkola.com &nbsp;|&nbsp; 📞 (000) 000-0000</span>
          <span>Zajęcia: Soboty 9:00 – 13:00</span>
        </div>
      </div>

      {/* Logo + school name */}
      <div className="bg-cream border-b border-gray-200 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-5">
          <Link href="/">
            <Image src="/logo.png" alt="Polska Szkoła Logo" width={90} height={90} className="object-contain" />
          </Link>
          <div>
            <Link href="/">
              <h1 className="text-xl sm:text-2xl font-bold text-navy leading-tight">Polska Szkoła Dokształcająca</h1>
              <p className="text-sm text-gray-500 mt-0.5">im. Juliana Ursyna Niemcewicza — Plainfield, NJ</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="bg-navy sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Desktop */}
          <div className="hidden md:flex items-center">
            {navItems.map((item) => (
              <DropdownItem key={item.label} item={item} />
            ))}
          </div>

          {/* Teacher login */}
          <Link
            href="/admin"
            className="hidden md:flex items-center gap-2 bg-gold text-navy-dark text-xs font-bold px-4 py-2 my-1.5 rounded hover:bg-gold-light transition-colors"
          >
            🔐 Logowanie
          </Link>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-3"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-navy-dark border-t border-navy-light px-4 py-3 space-y-1">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <p className="text-gold text-xs font-bold uppercase tracking-wider pt-2 pb-1">{item.label}</p>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block text-sm text-gray-300 hover:text-white py-1 pl-2"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-white font-semibold py-2"
                >
                  {item.label}
                </Link>
              )
            )}
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="block text-gold font-bold py-2 text-sm">
              🔐 Logowanie
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
