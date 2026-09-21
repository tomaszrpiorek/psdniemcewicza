import {Inter, Playfair_Display} from 'next/font/google'

export const sans = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
})

export const display = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  variable: '--font-display',
})
