'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useState, useRef} from 'react'
import {useLocale, useTranslations} from 'next-intl'
import {usePathname, useRouter} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {ENROLLMENT_OPEN, MEDICAL_FORM_OPEN} from '@/lib/features'
import {SCHOOL_GRADES} from '@/lib/grades'
import {IconMail, IconPhone, IconLock, IconPencil, IconMedical} from '@/components/icons'

type Child = {label: string; href: string; external?: boolean}
type NavItem = {label: string; href?: string; children?: Child[]}

export default function Navbar() {
  const locale = useLocale()
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

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
        {label: t('church'),    href: 'https://www.bestchurch.net/', external: true},
      ],
    },
    {label: t('announcements'), href: `/${locale}/announcements`},
    {
      label: t('homework'),
      children: SCHOOL_GRADES.map((g) => ({
        label: t(g.navKey),
        href: `/${locale}/homework/${g.slug}`,
      })),
    },
    {label: t('calendar'), href: `/${locale}/calendar`},
    {label: t('contact'),  href: `/${locale}/contact`},
    {label: t('sponsors'), href: `/${locale}/sponsors`},
  ]

  return (
    <header>
      <div className="bg-navy-dark text-gray-300 text-xs py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center sm:justify-between items-center gap-x-4 gap-y-1">
          <span className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
            <a href="mailto:psdniemcewicza@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <IconMail className="w-3.5 h-3.5 text-gold-tint" /> psdniemcewicza@gmail.com
            </a>
            <a href="tel:+17322614276" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <IconPhone className="w-3.5 h-3.5 text-gold-tint" /> (732) 261-4276
            </a>
          </span>
          <span className="text-center">{t('topbarHours')}</span>
        </div>
      </div>

      <div className="bg-cream border-b border-gray-200 py-3 sm:py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-5">
          <Link href={`/${locale}`} className="shrink-0">
            <Image src="/logo.png" alt="PSD Niemcewicza Logo" width={90} height={90} className="object-contain w-16 h-16 sm:w-[90px] sm:h-[90px]" />
          </Link>
          <div>
            <Link href={`/${locale}`}>
              <h1 className="text-lg sm:text-2xl font-bold text-navy leading-tight">Polska Szkoła Dokształcająca</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">im. Juliana Ursyna Niemcewicza — Plainfield, NJ</p>
            </Link>
          </div>
        </div>
      </div>

      <nav ref={navRef} className="bg-navy sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="hidden lg:flex items-center">
            {navItems.map((item) =>
              item.children ? (
                <DropdownItem key={item.label} label={item.label} children={item.children} />
              ) : (
                <Link key={item.href} href={item.href!} className="px-4 py-2 text-sm font-semibold text-white hover:text-gold-tint transition-colors tracking-wide">
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 my-1.5">
            <button onClick={switchLocale} className="flex items-center gap-1.5 border border-white/30 text-white text-xs font-bold px-3 py-2 rounded hover:bg-white/10 transition-colors">
              {locale === 'pl' ? '🇬🇧 EN' : '🇵🇱 PL'}
            </button>
            {user ? (
              <>
                {ENROLLMENT_OPEN && (
                  <Link href={'/' + locale + '/enroll'} className="flex items-center gap-1.5 bg-gold text-navy text-xs font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors">
                    <IconPencil className="w-4 h-4" /> {t('enroll')}
                  </Link>
                )}
                {MEDICAL_FORM_OPEN && (
                  <Link href={'/' + locale + '/medical'} className="flex items-center gap-1.5 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded hover:bg-white/10 transition-colors">
                    <IconMedical className="w-4 h-4" /> {t('medicalForm')}
                  </Link>
                )}
                {role === 'teacher' && (
                  <Link href={'/' + locale + '/admin'} className="border border-white/30 text-white text-xs font-bold px-4 py-2 rounded hover:bg-white/10 transition-colors">
                    {t('adminPanel')}
                  </Link>
                )}
                <Link href={'/' + locale + '/dashboard'} className="border border-white/30 text-white text-xs font-bold px-4 py-2 rounded hover:bg-white/10 transition-colors">
                  {t('myAccount')}
                </Link>
              </>
            ) : (
              <Link href={'/' + locale + '/login'} className="flex items-center gap-1.5 bg-gold text-navy text-xs font-bold px-4 py-2 rounded hover:bg-gold-light transition-colors">
                <IconLock className="w-4 h-4" /> {t('login')}
              </Link>
            )}
          </div>

          <button className="lg:hidden text-white p-3 -ml-3" aria-label="Menu" aria-expanded={mobileOpen} onClick={() => {
            // Bring the bar to the top of the screen first, so the whole menu fits below it
            if (!mobileOpen) navRef.current?.scrollIntoView()
            setMobileOpen(!mobileOpen)
          }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-navy-dark border-t border-navy-light px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-1 max-h-[calc(100dvh-3rem)] overflow-y-auto">
            {/* Language and account buttons first, so they are never below the fold */}
            <div className="flex items-center gap-2 pt-1 pb-3 border-b border-navy-light mb-2 flex-wrap">
              <button onClick={() => { switchLocale(); setMobileOpen(false) }} className="text-sm border border-white/30 text-white px-4 py-2.5 rounded">
                {locale === 'pl' ? '🇬🇧 EN' : '🇵🇱 PL'}
              </button>
              {user ? (
                <>
                  {ENROLLMENT_OPEN && (
                    <Link href={'/' + locale + '/enroll'} onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 bg-gold text-navy font-bold text-sm px-4 py-2.5 rounded">
                      <IconPencil className="w-4 h-4" /> {t('enroll')}
                    </Link>
                  )}
                  {MEDICAL_FORM_OPEN && (
                    <Link href={'/' + locale + '/medical'} onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 border border-white/30 text-white font-bold text-sm px-4 py-2.5 rounded">
                      <IconMedical className="w-4 h-4" /> {t('medicalForm')}
                    </Link>
                  )}
                  {role === 'teacher' && (
                    <Link href={'/' + locale + '/admin'} onClick={() => setMobileOpen(false)} className="border border-white/30 text-white font-bold text-sm px-4 py-2.5 rounded">
                      {t('adminPanel')}
                    </Link>
                  )}
                  <Link href={'/' + locale + '/dashboard'} onClick={() => setMobileOpen(false)} className="border border-white/30 text-white font-bold text-sm px-4 py-2.5 rounded">
                    {t('myAccount')}
                  </Link>
                </>
              ) : (
                <Link href={'/' + locale + '/login'} onClick={() => setMobileOpen(false)} className="flex items-center gap-1.5 bg-gold text-navy font-bold text-sm px-4 py-2.5 rounded">
                  <IconLock className="w-4 h-4" /> {t('login')}
                </Link>
              )}
            </div>
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <p className="text-gold-tint text-xs font-bold uppercase tracking-wider pt-2 pb-1">{item.label}</p>
                  <div className={item.children.length > 6 ? 'grid grid-cols-2 sm:grid-cols-3 gap-x-4' : ''}>
                  {item.children.map((child) => (
                    <Link
                      key={child.href} href={child.href} onClick={() => setMobileOpen(false)}
                      {...(child.external && {target: '_blank', rel: 'noopener noreferrer'})}
                      className="block text-sm text-gray-300 hover:text-white py-2.5 pl-2"
                    >
                      {child.label}{child.external && ' ↗'}
                    </Link>
                  ))}
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href!} onClick={() => setMobileOpen(false)} className="block text-sm text-white font-semibold py-3">
                  {item.label}
                </Link>
              )
            )}
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
      <button className="px-4 py-2 text-sm font-semibold text-white hover:text-gold-tint transition-colors flex items-center gap-1 tracking-wide">
        {label}
        <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 bg-white shadow-xl border-t-2 border-gold min-w-[220px] z-50 py-1">
          {children.map((child) => (
            <Link
              key={child.href} href={child.href} onClick={() => setOpen(false)}
              {...(child.external && {target: '_blank', rel: 'noopener noreferrer'})}
              className="block px-4 py-2.5 text-sm text-navy hover:bg-cream hover:text-gold font-medium transition-colors border-b border-gray-50 last:border-0"
            >
              {child.label}{child.external && ' ↗'}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
