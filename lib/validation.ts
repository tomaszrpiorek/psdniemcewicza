import {z} from 'zod'

// Deliberately lenient digit-count check (7-15 digits) rather than a strict
// US-only pattern, so it doesn't reject real international numbers in a
// Polish-American community while still catching garbage input.
function digitCount(value: string) {
  return value.replace(/\D/g, '').length
}

export function requiredString(requiredMsg: string, minLength = 1, tooShortMsg?: string) {
  return z.string().trim().min(minLength, minLength > 1 ? (tooShortMsg ?? requiredMsg) : requiredMsg)
}

// Unicode-aware: allows Polish diacritics (ą ć ę ł ń ó ś ź ż), spaces,
// hyphens (Anna-Maria), apostrophes (O'Brien), and periods (Dr., Jr.).
// Must start with a letter so it can't be just punctuation.
const nameRegex = /^\p{L}[\p{L}\s'.-]*$/u

export function requiredName(requiredMsg: string, invalidMsg: string, minLength = 2, tooShortMsg?: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMsg)
    .min(minLength, tooShortMsg ?? invalidMsg)
    .refine((v) => nameRegex.test(v), invalidMsg)
}

export function optionalName(invalidMsg: string, minLength = 2) {
  return z
    .string()
    .trim()
    .optional()
    .default('')
    .refine((v) => !v || (v.length >= minLength && nameRegex.test(v)), invalidMsg)
}

export function requiredPhone(requiredMsg: string, invalidMsg: string) {
  return z.string().trim().min(1, requiredMsg).refine(
    (v) => digitCount(v) >= 7 && digitCount(v) <= 15,
    invalidMsg
  )
}

export function optionalPhone(invalidMsg: string) {
  return z.string().trim().optional().default('').refine(
    (v) => !v || (digitCount(v) >= 7 && digitCount(v) <= 15),
    invalidMsg
  )
}

export function requiredEmail(requiredMsg: string, invalidMsg: string) {
  return z.string().trim().min(1, requiredMsg).pipe(z.email(invalidMsg))
}

// For a combined "City, ST ZIP" free-text field: just confirms a plausible
// 5-digit (or ZIP+4) US zip is present somewhere in the string.
export function requiredCityZip(requiredMsg: string, invalidMsg: string) {
  return z.string().trim().min(1, requiredMsg).refine(
    (v) => /\d{5}(-\d{4})?/.test(v),
    invalidMsg
  )
}
