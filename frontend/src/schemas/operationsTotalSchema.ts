import { z } from 'zod'
import { todayIso } from '../lib/format'
import { OperationType } from '../types'

export const operationsTotalSchema = z
  .object({
    from: z
      .iso.date({ error: 'Ingresá una fecha desde válida' })
      .refine((date) => date <= todayIso(), 'La fecha desde no puede ser futura'),
    to: z
      .iso.date({ error: 'Ingresá una fecha hasta válida' })
      .refine((date) => date <= todayIso(), 'La fecha hasta no puede ser futura'),
    type: z.enum(OperationType, { error: 'Seleccioná un tipo de operación' }),
  })
  // Las fechas ISO (yyyy-mm-dd) se pueden comparar como strings.
  .refine((v) => v.to >= v.from, {
    message: 'La fecha hasta no puede ser anterior a la fecha desde',
    path: ['to'],
  })

export type OperationsTotalValues = z.input<typeof operationsTotalSchema>
