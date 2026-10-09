import { z } from 'zod'
import { todayIso } from '../lib/format'

const notFuture = (label: string) => ({
  check: (date: string) => date <= todayIso(),
  message: `La fecha ${label} no puede ser futura`,
})

const notFutureFrom = notFuture('desde')
const notFutureTo = notFuture('hasta')

export const historyFilterSchema = z
  .object({
    fromDate: z.iso.date({ error: 'Ingresá la fecha desde' }).refine(notFutureFrom.check, notFutureFrom.message),
    toDate: z.iso.date({ error: 'Ingresá la fecha hasta' }).refine(notFutureTo.check, notFutureTo.message),
    // Opcional: código de barras o nombre del producto.
    term: z
      .string()
      .trim()
      .refine((value) => value === '' || value.length >= 2, 'Ingresá al menos 2 caracteres'),
  })
  // Las fechas ISO (yyyy-mm-dd) se pueden comparar como strings.
  .refine((v) => !v.fromDate || !v.toDate || v.toDate >= v.fromDate, {
    message: 'La fecha hasta no puede ser anterior a la fecha desde',
    path: ['toDate'],
  })

export type HistoryFilterValues = z.input<typeof historyFilterSchema>
