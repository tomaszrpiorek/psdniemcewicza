export function p(locale: string, path: string) {
  return locale === 'pl' ? path : `/en${path}`
}
