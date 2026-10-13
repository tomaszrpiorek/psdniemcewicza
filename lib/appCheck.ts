import {app} from '@/lib/firebase'

let started = false

// Starts Firebase App Check (invisible reCAPTCHA), which proves to the email
// function that a request comes from this website in a real browser. It is
// started only where it is needed, so other pages do not load reCAPTCHA.
export async function ensureAppCheck() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  if (started || typeof window === 'undefined' || !siteKey) return
  started = true

  const {initializeAppCheck, ReCaptchaEnterpriseProvider} = await import('firebase/app-check')
  if (process.env.NODE_ENV !== 'production') {
    // localhost is not an allowed reCAPTCHA domain. This prints a debug token in
    // the browser console; register it under App Check in the Firebase console.
    ;(self as unknown as {FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean}).FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })
}
