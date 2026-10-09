import { Form, Formik, type FormikProps } from 'formik'
import { useRef, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { TextField } from '../components/FormField'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { useOperationHistory } from '../hooks/useOperationHistory'
import { formatDateTime, formatMoney, todayIso } from '../lib/format'
import { variantLabel } from '../lib/variants'
import { zodValidate } from '../lib/zodFormik'
import { historyFilterSchema, type HistoryFilterValues } from '../schemas/historyFilterSchema'
import { OperationType, type OperationFilters } from '../types'
import { OperationsTotalForm } from './OperationsTotalForm'

const columns = [
  { label: 'Fecha & Hora' },
  { label: 'Código de barras' },
  { label: 'Producto' },
  { label: 'Tipo' },
  { label: 'Cantidad', align: 'center' as const },
  { label: 'Monto Total', align: 'right' as const },
]

const initialValues: HistoryFilterValues = { fromDate: '', toDate: '', term: '' }

const validate = zodValidate<HistoryFilterValues>(historyFilterSchema)

/** Fila de mensaje que ocupa todo el ancho de la tabla. */
function MessageRow({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={columns.length} className={`py-6 text-center ${className}`}>
        {children}
      </td>
    </tr>
  )
}

export function HistoryPage() {
  // Los filtros ya enviados: sin ellos no se consulta nada (el rango de fechas es obligatorio).
  const [filters, setFilters] = useState<OperationFilters | null>(null)
  const [page, setPage] = useState(1)
  // Tope de los selectores de fecha: no se pueden elegir días futuros.
  const [today] = useState(todayIso)
  const [totalModalOpen, setTotalModalOpen] = useState(false)
  // Fechas cargadas en la búsqueda al abrir el modal "Calcular monto", para precargarlas ahí.
  const filterForm = useRef<FormikProps<HistoryFilterValues>>(null)
  const [totalDates, setTotalDates] = useState({ from: '', to: '' })
  const { result, isLoading, error, reload } = useOperationHistory(filters, page)

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Lista de operaciones realizadas"
        subtitle="Historial de compras y ventas de Kleta Indumentaria. Elegí un rango de fechas para verlo."
        actions={
          <button
            type="button"
            onClick={() => {
              setTotalDates({ from: filterForm.current?.values.fromDate ?? '', to: filterForm.current?.values.toDate ?? '' })
              setTotalModalOpen(true)
            }}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-kleta-rose to-kleta-dark-pink px-4 py-2 text-xs font-semibold text-white shadow-md shadow-kleta-rose/20 transition hover:from-kleta-dark-pink hover:to-kleta-plum"
          >
            <i className="fa-solid fa-calculator" />
            Calcular monto de operaciones
          </button>
        }
      />

      <Formik<HistoryFilterValues>
        innerRef={filterForm}
        initialValues={initialValues}
        validate={validate}
        onSubmit={(values) => {
          const { fromDate, toDate, term } = historyFilterSchema.parse(values)
          setPage(1)
          setFilters({ fromDate, toDate, ...(term && { term }) })
        }}
      >
        <Form noValidate className="grid grid-cols-1 items-start gap-4 rounded-2xl border border-kleta-pink/20 bg-white p-5 shadow-sm md:grid-cols-4">
          <TextField name="fromDate" type="date" max={today} label="Fecha desde" />
          <TextField name="toDate" type="date" max={today} label="Fecha hasta" />
          <TextField name="term" type="search" label="Producto (opcional)" placeholder="Nombre o código de barras" />
          <button
            type="submit"
            className="mt-0 flex items-center justify-center gap-2 rounded-xl bg-kleta-sage px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-kleta-light-sage md:mt-6.5"
          >
            <i className="fa-solid fa-magnifying-glass" />
            Buscar operaciones
          </button>
        </Form>
      </Formik>

      <DataTable columns={columns}>
        {!filters ? (
          <MessageRow className="text-gray-400">
            <i className="fa-regular fa-calendar mr-2 text-kleta-rose" />
            Elegí un rango de fechas y buscá para ver las operaciones.
          </MessageRow>
        ) : isLoading ? (
          <MessageRow className="text-gray-400">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-kleta-rose" />
            Cargando operaciones…
          </MessageRow>
        ) : error ? (
          <MessageRow className="text-red-500">
            <i className="fa-solid fa-circle-exclamation mr-2" />
            {error}
            <button
              type="button"
              onClick={reload}
              className="ml-3 rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              Reintentar
            </button>
          </MessageRow>
        ) : !result || result.data.length === 0 ? (
          <MessageRow className="text-gray-400">No se encontraron operaciones en ese rango.</MessageRow>
        ) : (
          result.data.map((op) => (
            <tr key={op.id} className="transition hover:bg-kleta-bg/50">
              <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{formatDateTime(new Date(op.createdAt))}</td>
              <td className="px-6 py-3.5 font-mono text-kleta-light-plum">{op.barcode ?? '—'}</td>
              <td className="px-6 py-3.5">
                <span className="font-semibold text-kleta-plum">{op.name}</span>
                <span className="block text-xs text-gray-500">{variantLabel(op)}</span>
              </td>
              <td className="px-6 py-3.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                    op.type === OperationType.Venta ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {op.type}
                </span>
              </td>
              <td className="px-6 py-3.5 text-center font-bold">{op.quantity}</td>
              <td className="px-6 py-3.5 text-right font-bold text-kleta-plum">{formatMoney(op.total)}</td>
            </tr>
          ))
        )}
      </DataTable>

      {result && result.totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Página {result.page} de {result.totalPages} · {result.total} operaciones
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg bg-white px-3 py-1.5 font-semibold text-kleta-plum shadow-sm transition hover:bg-kleta-blush disabled:opacity-40 disabled:hover:bg-white"
            >
              <i className="fa-solid fa-chevron-left mr-1.5" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= result.totalPages}
              className="rounded-lg bg-white px-3 py-1.5 font-semibold text-kleta-plum shadow-sm transition hover:bg-kleta-blush disabled:opacity-40 disabled:hover:bg-white"
            >
              Siguiente
              <i className="fa-solid fa-chevron-right ml-1.5" />
            </button>
          </div>
        </nav>
      )}

      <Modal
        open={totalModalOpen}
        onClose={() => setTotalModalOpen(false)}
        title="Calcular monto de operaciones"
        icon="fa-solid fa-calculator"
      >
        <OperationsTotalForm initialFrom={totalDates.from} initialTo={totalDates.to} />
      </Modal>
    </div>
  )
}
