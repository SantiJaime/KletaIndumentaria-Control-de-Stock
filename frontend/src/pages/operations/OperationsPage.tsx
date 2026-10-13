import { useFormik } from 'formik'
import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { useApp } from '../../context/appContext'
import { useToast } from '../../context/toastContext'
import { useInputSource } from '../../hooks/useInputSource'
import { useProductSearch } from '../../hooks/useProductSearch'
import { useProducts } from '../../hooks/useProducts'
import { Role, type FullProduct } from '../../types'
import { zodValidate } from '../../lib/zodFormik'
import { barcodeSchema, type BarcodeValues } from '../../schemas/barcodeSchema'
import { ExistingProductPanel } from './ExistingProductPanel'
import { NewProductPanel } from './NewProductPanel'

interface SearchState {
  code: string
  /** Cambia en cada búsqueda para reiniciar los formularios de los paneles. */
  id: number
}

export function OperationsPage() {
  const showToast = useToast()
  // Solo el administrador puede dar de alta productos.
  const canCreateProducts = useApp().user?.role === Role.Admin
  const { product, status, error, searchByBarcode, selectProduct, createProduct, addVariants, registerOperation, reset } =
    useProducts()
  const [search, setSearch] = useState<SearchState | null>(null)
  const input = useInputSource()
  // Texto con el que ya se buscó por código (Enter): mientras no cambie, no se sugieren productos por nombre.
  const [submittedTerm, setSubmittedTerm] = useState<string | null>(null)
  // El admin pidió el formulario de alta: con el botón "Nuevo producto" o al confirmar el cartel de código inexistente.
  const [isCreating, setIsCreating] = useState(false)

  const runSearch = async (code: string) => {
    setIsCreating(false)
    setSearch((prev) => ({ code, id: (prev?.id ?? 0) + 1 }))
    const result = await searchByBarcode(code)
    if (result.status === 'found') showToast('Producto encontrado en base de datos')
    // Al admin se le pregunta en un cartel si quiere crearlo; el vendedor ve el aviso de abajo.
    else if (result.status === 'not-found' && !canCreateProducts) showToast('Producto no registrado.')
    else if (result.status === 'error') showToast(result.error)
  }

  // Botón "Nuevo producto": abre el formulario de alta sin código (se puede cargar ahí; es opcional).
  const startNewProduct = () => {
    reset()
    setSearch((prev) => ({ code: '', id: (prev?.id ?? 0) + 1 }))
    setSubmittedTerm(null)
    barcodeForm.resetForm()
    setIsCreating(true)
  }

  // "No" en el cartel o "Cancelar creación": se descarta la búsqueda y se cierra el formulario de alta; si había
  // un código escrito, queda en el buscador para poder corregirlo.
  const dismissNotFound = () => {
    reset()
    setIsCreating(false)
    setSearch(null)
  }

  // Enter (lector de códigos o código escrito a mano): se busca por código; si no existe, el admin puede darlo de alta.
  const barcodeForm = useFormik<BarcodeValues>({
    initialValues: { barcode: '' },
    validate: zodValidate(barcodeSchema),
    onSubmit: (values) => {
      setSubmittedTerm(values.barcode.trim())
      return runSearch(barcodeSchema.parse(values).barcode)
    },
  })

  // Sin Enter se está escribiendo un nombre: se sugieren productos (con debounce) para elegir.
  const term = barcodeForm.values.barcode.trim()
  const suggestions = useProductSearch(term === submittedTerm ? '' : term, input.getSource)

  const handleOperationDone = () => {
    reset()
    setIsCreating(false)
    setSearch(null)
    setSubmittedTerm(null)
    barcodeForm.resetForm()
  }

  // El producto ya viene en la lista (puede no tener código de barras): no hace falta volver a pedirlo.
  const pickSuggestion = (picked: FullProduct) => {
    setIsCreating(false)
    setSubmittedTerm(term)
    setSearch((prev) => ({ code: picked.barcode ?? '', id: (prev?.id ?? 0) + 1 }))
    selectProduct(picked)
    showToast('Producto encontrado en base de datos')
  }

  // El formulario de alta está a la vista (solo admin): lo abrió el botón o el "Sí" del cartel.
  const isFormOpen = Boolean(search) && isCreating && canCreateProducts && (status === 'idle' || status === 'not-found')

  const barcodeError = barcodeForm.touched.barcode ? barcodeForm.errors.barcode : undefined

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Generar nueva operación"
        subtitle="Escaneá el código de barras (o escribilo y apretá Enter), o buscá por nombre, para registrar compras o ventas."
        actions={
          canCreateProducts && (
            <button
              type="button"
              onClick={isFormOpen ? dismissNotFound : startNewProduct}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-kleta-rose to-kleta-dark-pink px-4 py-2 text-xs font-semibold text-white shadow-md shadow-kleta-rose/20 transition hover:from-kleta-dark-pink hover:to-kleta-plum"
            >
              <i className={isFormOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-plus'} />
              {isFormOpen ? 'Cancelar creación de producto' : 'Nuevo producto'}
            </button>
          )
        }
      />

      {/* Paso 1: lector de código de barras */}
      <form
        noValidate
        onSubmit={barcodeForm.handleSubmit}
        className="relative rounded-2xl border-2 border-kleta-sage/40 bg-white p-6 shadow-sm"
      >
        <label
          htmlFor="barcode"
          className="mb-2 flex items-center justify-between text-sm font-bold tracking-wider text-kleta-plum uppercase"
        >
          <span>
            <i className="fa-solid fa-barcode mr-2 text-lg text-kleta-sage" />
            Código de barras o nombre del producto
          </span>
          <span className="text-xs font-normal text-gray-400 normal-case">Enter para buscar por código · escribí para buscar por nombre</span>
        </label>
        <div className="relative">
          <input
            id="barcode"
            type="text"
            autoComplete="off"
            placeholder="Ej: C123430404 o Remera oversize"
            aria-invalid={Boolean(barcodeError)}
            {...barcodeForm.getFieldProps('barcode')}
            onChange={(e) => {
              input.track(e.target.value, e.timeStamp)
              barcodeForm.handleChange(e)
            }}
            className={`w-full rounded-xl border bg-kleta-bg py-3.5 pr-10 pl-4 text-base font-semibold text-kleta-plum outline-none focus:border-transparent focus:ring-2 ${
              barcodeError ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-kleta-sage'
            }`}
          />
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-lg text-kleta-sage" />
        </div>
        {barcodeError && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
            <i className="fa-solid fa-circle-exclamation" />
            {barcodeError}
          </p>
        )}

        {suggestions.isSearching && <p className="mt-3 text-xs text-gray-400">Buscando…</p>}
        {suggestions.error && <p className="mt-3 text-xs text-red-500">{suggestions.error}</p>}
        {suggestions.results &&
          (suggestions.results.length === 0 ? (
            <p className="mt-3 text-xs text-gray-400">
              No se encontraron productos.{canCreateProducts && ' Si es un código nuevo, apretá Enter para darlo de alta.'}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
              {suggestions.results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(p)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition hover:bg-kleta-bg"
                  >
                    <span className="font-semibold text-kleta-plum">{p.name}</span>
                    <span className="font-mono text-xs text-kleta-light-plum">{p.barcode ?? 'Sin código'}</span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </form>

      {/* Paneles dinámicos según el resultado de la búsqueda */}
      {search && status === 'loading' && (
        <div className="flex animate-fade-in items-center justify-center gap-3 rounded-2xl border-2 border-kleta-pink/20 bg-white p-8 text-sm font-medium text-gray-500 shadow-sm">
          <i className="fa-solid fa-spinner fa-spin text-kleta-rose" />
          Buscando producto…
        </div>
      )}

      {search && status === 'error' && (
        <div
          role="alert"
          className="flex animate-fade-in flex-col items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 shadow-sm"
        >
          <p className="flex items-center gap-2 font-medium">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </p>
          <button
            type="button"
            onClick={() => void runSearch(search.code)}
            className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
          >
            <i className="fa-solid fa-rotate-right mr-1.5" />
            Reintentar
          </button>
        </div>
      )}

      {search && status === 'found' && product && (
        <ExistingProductPanel
          key={search.id}
          product={product}
          onRegisterOperation={registerOperation}
          onAddVariants={addVariants}
          onDone={handleOperationDone}
        />
      )}

      {/* Alta de producto (solo admin): sin código desde el botón, o con el código buscado que no existía. */}
      {search && isFormOpen && (
        <NewProductPanel key={search.id} barcode={search.code} onCreate={createProduct} />
      )}

      {search && (
        <Modal
          open={status === 'not-found' && canCreateProducts && !isCreating}
          onClose={dismissNotFound}
          title="Producto no encontrado"
          icon="fa-solid fa-circle-question"
        >
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              No existe ningún producto con el código{' '}
              <strong className="font-mono text-kleta-plum">{search.code}</strong>. ¿Querés crearlo?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={dismissNotFound}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100"
              >
                No
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setIsCreating(true)}
                className="rounded-xl bg-kleta-sage px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-kleta-light-sage"
              >
                Sí, crear producto
              </button>
            </div>
          </div>
        </Modal>
      )}

      {search && status === 'not-found' && !canCreateProducts && (
        <div
          role="alert"
          className="animate-fade-in rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700 shadow-sm"
        >
          <p className="flex items-center justify-center gap-2 font-semibold">
            <i className="fa-solid fa-circle-exclamation" />
            No hay ningún producto con el código {search.code}.
          </p>
          <p className="mt-1 text-xs">Revisá el código o pedile a un administrador que dé de alta el producto.</p>
        </div>
      )}
    </div>
  )
}
