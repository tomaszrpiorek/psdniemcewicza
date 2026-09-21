import type {FieldErrors, FieldValues, Resolver} from 'react-hook-form'
import type {ZodType} from 'zod'

// @hookform/resolvers pins a zod v3 peer dependency; this repo is on zod v4
// (pulled in by @sanity/cli), so we bridge zod -> react-hook-form ourselves.
export function zodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return {values: result.data, errors: {}}
    }
    const errors: FieldErrors<T> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!errors[path as keyof FieldErrors<T>]) {
        ;(errors as Record<string, unknown>)[path] = {type: issue.code, message: issue.message}
      }
    }
    return {values: {}, errors}
  }
}
