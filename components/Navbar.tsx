'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useState, useRef} from 'react'
import {useLocale, useTranslations} from 'next-intl'
import {usePathname, useRouter} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'

type Child = {label: string; href: string}
type NavItem = {label: string; href?: string; children?: Child[]}

export default function Navbar() {
  const locale = useLocale()
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const {user, role} = useAuth()
  const otherLocale = locale === 'pl' ? 'en' : 'pl'
  const switchLocale = () => {
    router.push(pathname.replace(`/${locale}`, `/${otherLocale}`))
  }

  const navItems: NavItem[] = [
    {
      label: t('school'),
      children: [
        {label: t('about'),     href: `/${locale}/about`},
        {label: t('staff'),     href: `/${locale}/staff`},
        {label: t('gallery'),   href: `/${locale}/gallery`},
        {label: t('documents'), href: `/${locale}/documents`},
      ],
    },
    {label: t('announcements'), href: `/${locale}/announcements`},
    {
      label: t('homework'),
      children: [
        {label: t('preschool'), href: `/${locale}/homework/przedszkole`},
        {label: t('class1'),    href: `/${locale}/homework/klasa-1`},
        {label: t('class2'),    href: `/${locale}/homework/klasa-2`},
        {label: t('class3'),    href: `/${locale}/homework/klasa-3`},
        {label: t('class4'),    href: `/${locale}/homework/klasa-4`},
        {label: t('class5'),    href: `/${locale}/homework/klasa-5`},
      ],
    },
    {label: t('calendar'), href: `/${locale}/calendar`},
    {label: t('contact'),  href: `/${locale}/contact`},
  ]

  return (
    <header>
      <div className="bg-navy-dark text-gray-300 text-xs py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>📧 info@psdniemcewicz.org &nbsp;|&nbsp; 📞 (000) 000-0000</span>
          <span>{t('topbarHours')}</span>
        </div>
      </div>

      <div className="bg-cream border-b border-gray-200 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-5">
          <Link href={`/${locale}`}>
            <Image src="/logo.png" alt="PSD Niemcewicza Logo" width={90} height={90} className="object-contain" />
          </Link>
          <div>
            <Link href={`/${locale}`}>
              <h1 className="text-xl sm:text-2xl font-bold text-navy leading-tight">Polska Szkoła Dokształcająca</h1>
              <p className="text-sm text-gray-500 mt-0.5">im. Juliana Ursyna Niemcewicza — Plainfield, NJ</p>
            </Link>
          </div>
        </div>
      </div>

      <nav className="bg-navy sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center">
            {navItems.map((item) =>
              item.children ? (
                <DropdownItem key={item.label} label={item.label} children={item.children} />
              ) : (
                <Link key={item.href} href={item.href!} className="px-4 py-2 text-sm font-semibold text-white hover:text-gold transition-colors tracking-wide">
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 my-1.5">
            <button onClick={switchLocale} className="flex items-center gap-1.5 border border-white/30 text-white text-xs font-bold px-3 py-2 rounded hover:bg-white/10 transition-colors">
              {locale === 'pl' ? '🇬🇧 EN' : '🇵🇱 PL'}
            </button>
            {user ? (
              <>
                {role === 'parent' && (
                  <>
                    <Link href={'/' + locale + '/enroll'} className="bg-gold text-navy-dark text-xs font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors">
                      ✏️ {t('enroll')}
                    </Link>
                    <Link href={'/' + locale + '/medical'} className="border border-white/30 text-white text-xs font-bold px-4 py-2 rounded hover:bg-white/10 transition-colors">
                      🏥 {t('medicalForm')}
                    </Link>
                  </>
                )}
                <Link href={'/' + locale + (role === 'teacher' ? '/admin' : '/dashboard')} className="border border-white/30 text-white text-xs font-bold px-4 py-2 rounded hover:bg-white/10 transition-colors">
                  {role === 'teacher' ? t('adminPanel') : t('myAccount')}
                </Link>
              </>
            ) : (
              <Link href={'/' + locale + '/login'} className="bg-gold text-navy-dark text-xs font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors">
                🔐 {t('login')}
              </Link>
            )}
          </div>

          <button className="md:hidden text-white p-3" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-navy-dark border-t border-navy-light px-4 py-3 space-y-1">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <p className="text-gold text-xs font-bold uppercase tracking-wider pt-2 pb-1">{item.label}</p>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className="block text-sm text-gray-300 hover:text-white py-1 pl-2">
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link key={item.href} href={item.href!} onClick={() => setMobileOpen(false)} className="block text-sm text-white font-semibold py-2">
                  {item.label}
                </Link>
              )
            )}
            <div className="flex items-center gap-3 pt-2 border-t border-navy-light mt-2 flex-wrap">
              <button onClick={() => { switchLocale(); setMobileOpen(false) }} className="text-xs border border-white/30 text-white px-3 py-1.5 rounded">
                {locale === 'pl' ? '🇬🇧 EN' : '🇵🇱 PL'}
              </button>
              {user ? (
                <>
                  {role === 'parent' && (
                    <>
                      <Link href={'/' + locale + '/enroll'} onClick={() => setMobileOpen(false)} className="text-gold font-bold text-sm">
                        ✏️ {t('enroll')}
                      </Link>
                      <Link href={'/' + locale + '/medical'} onClick={() => setMobileOpen(false)} className="text-white font-bold text-sm">
                        🏥 {t('medicalForm')}
                      </Link>
                    </>
                  )}
                  <Link href={'/' + locale + (role === 'teacher' ? '/admin' : '/dashboard')} onClick={() => setMobileOpen(false)} className="text-white font-bold text-sm">
                    {role === 'teacher' ? t('adminPanel') : t('myAccount')}
                  </Link>
                </>
              ) : (
                <Link href={'/' + locale + '/login'} onClick={() => setMobileOpen(false)} className="text-gold font-bold text-sm">
                  🔐 {t('login')}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

function DropdownItem({label, children}: {label: string; children: Child[]}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <div
      className="relative"
      onMouseEnter={() => { if (timer.current) clearTimeout(timer.current); setOpen(true) }}
      onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 150) }}
    >
      <button className="px-4 py-2 text-sm font-semibold text-white hover:text-gold transition-colors flex items-center gap-1 tracking-wide">
        {label}
        <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 bg-white shadow-xl border-t-2 border-gold min-w-[220px] z-50 py-1">
          {children.map((child) => (
            <Link key={child.href} href={child.href} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-navy hover:bg-cream hover:text-gold font-medium transition-colors border-b border-gray-50 last:border-0">
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
