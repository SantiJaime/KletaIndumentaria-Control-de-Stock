import { setIn, type FormikErrors } from 'formik'
import type { z } from 'zod'

/**
 * Adapta un esquema de Zod a la prop `validate` de Formik.
 * Se queda con el primer error de cada campo.
 */
export function zodValidate<Values>(schema: z.ZodType) {
  return (values: Values): FormikErrors<Values> => {
    const result = schema.safeParse(values)
    if (result.success) return {}

    let errors: FormikErrors<Values> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!path) continue
      const alreadySet = path.split('.').reduce<unknown>(
        (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
        errors,
      )
      if (!alreadySet) errors = setIn(errors, path, issue.message)
    }
    return errors
  }
}

