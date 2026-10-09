import { Form, Formik } from 'formik'
import { useState } from 'react'
import { SelectField, TextField } from '../components/FormField'
import { getOperationsTotal } from '../helpers/operations.queries'
import { getApiErrorMessage } from '../lib/api'
import { formatIsoDate, formatMoney, todayIso } from '../lib/format'
import { zodValidate } from '../lib/zodFormik'
import { operationsTotalSchema, type OperationsTotalValues } from '../schemas/operationsTotalSchema'
import { OperationType } from '../types'

const typeOptions = [
  { value: OperationType.Venta, label: 'Venta (monto ganado)' },
  { value: OperationType.Compra, label: 'Compra (monto gastado)' },
]

const validate = zodValidate<OperationsTotalValues>(operationsTotalSchema)

interface TotalResult {
  from: string
  to: string
  type: OperationType
  total: number
  count: number
}

interface OperationsTotalFormProps {
  /** yyyy-mm-dd; vacío si el usuario todavía no eligió la fecha. */
  initialFrom?: string
  initialTo?: string
}

/** Formulario del modal "Calcular monto de operaciones". */
export function OperationsTotalForm({ initialFrom = '', initialTo = '' }: OperationsTotalFormProps) {
  const [today] = useState(todayIso)
  const [result, setResult] = useState<TotalResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Las fechas son las que ya estaban cargadas en la búsqueda de operaciones; si no había, el campo queda vacío.
  const [initialValues] = useState<OperationsTotalValues>({
    from: initialFrom,
    to: initialTo,
    type: OperationType.Venta,
  })

  const isSale = result?.type === OperationType.Venta

  return (
    <div className="space-y-6">
      <Formik<OperationsTotalValues>
        initialValues={initialValues}
        validate={validate}
        onSubmit={async (values) => {
          const { from, to, type } = operationsTotalSchema.parse(values)
          setError(null)
          try {
            const { total, count } = await getOperationsTotal({ fromDate: from, toDate: to, type })
            setResult({ from, to, type, total, count })
          } catch (err) {
            setResult(null)
            setError(getApiErrorMessage(err))
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form noValidate className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField name="from" type="date" max={today} label="Fecha desde" />
              <TextField name="to" type="date" max={today} label="Fecha hasta" />
            </div>
            <SelectField name="type" label="Tipo de operación" options={typeOptions} />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-kleta-sage px-8 py-3.5 font-bold text-white shadow-md transition hover:bg-kleta-light-sage disabled:opacity-60 sm:w-auto"
              >
                <i className={isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-calculator'} />
                <span>{isSubmitting ? 'Calculando…' : 'Calcular monto'}</span>
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm font-medium text-red-500">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </p>
      )}

      {result && (
        <div
          aria-live="polite"
          className={`animate-fade-in rounded-xl border p-5 ${
            isSale ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
          }`}
        >
          <p className={`text-xs font-bold tracking-wider uppercase ${isSale ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isSale ? 'Total ganado en ventas' : 'Total gastado en compras'}
          </p>
          <p className="mt-1 font-serif text-3xl font-bold text-kleta-plum">{formatMoney(result.total)}</p>
          <p className="mt-2 text-xs text-gray-500">
            {result.count === 1 ? '1 operación' : `${result.count} operaciones`} entre el{' '}
            {formatIsoDate(result.from)} y el {formatIsoDate(result.to)}.
          </p>
        </div>
      )}
    </div>
  )
}
