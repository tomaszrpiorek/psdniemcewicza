import {Inter, Playfair_Display, Yellowtail} from 'next/font/google'

export const sans = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
})

export const display = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

export const script = Yellowtail({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-script',
})
