import { z } from 'zod'

/** Valor de un <input type="number"> en Formik: número o '' cuando está vacío. */
export type NumberInputValue = number | ''

/** Número requerido proveniente de un input; '' se trata como "campo vacío". */
export function requiredNumber(requiredMessage: string) {
  return z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.number({ error: requiredMessage }),
  )
}
