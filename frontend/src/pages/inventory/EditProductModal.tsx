import { Form, Formik, useFormik } from 'formik'
import { useState } from 'react'
import { TextField } from '../../components/FormField'
import { NumberField } from '../../components/NumberField'
import { NumberInput } from '../../components/NumberInput'
import { Modal } from '../../components/Modal'
import { useToast } from '../../context/toastContext'
import * as productsApi from '../../helpers/products.queries'
import { getApiErrorMessage } from '../../lib/api'
import { sanitizeBarcode } from '../../lib/barcode'
import { zodValidate } from '../../lib/zodFormik'
import {
  editProductSchema,
  editVariantsSchema,
  type EditProductFormValues,
  type EditVariantFormValue,
  type EditVariantsFormValues,
} from '../../schemas/editProductSchema'
import type { FullProduct, ProductVariant } from '../../types'

const validateProduct = zodValidate<EditProductFormValues>(editProductSchema)
const variantInputClass =
  'w-full rounded-lg border bg-kleta-bg px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-kleta-rose'

const toRows = (variants: ProductVariant[]): EditVariantFormValue[] =>
  variants.map(({ id, size, color, stock }) => ({ id, size, color, stock }))

/** ¿La fila del formulario es distinta de la variante guardada? */
const isChanged = (row: EditVariantFormValue, saved: ProductVariant | undefined) =>
  Boolean(saved) && (row.size.trim() !== saved?.size || row.color.trim() !== saved?.color || row.stock !== saved?.stock)

const validateVariants = zodValidate<EditVariantsFormValues>(editVariantsSchema)

interface VariantsEditorProps {
  product: FullProduct
  onProductChange: (product: FullProduct) => void
}

/** Todas las variantes editables a la vez: un solo botón guarda las que cambiaron, en una sola transacción. */
function VariantsEditor({ product, onProductChange }: VariantsEditorProps) {
  const showToast = useToast()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useFormik<EditVariantsFormValues>({
    initialValues: { variants: toRows(product.variants) },
    validate: validateVariants,
    onSubmit: async (values) => {
      setError(null)
      const changes = editVariantsSchema.parse(values).variants.filter((row) =>
        isChanged(
          row,
          product.variants.find((v) => v.id === row.id),
        ),
      )
      if (changes.length === 0) return
      try {
        const updated = await productsApi.updateVariants(product.id, changes)
        onProductChange(updated)
        form.resetForm({ values: { variants: toRows(updated.variants) } })
        showToast(changes.length === 1 ? 'Variante actualizada' : `${changes.length} variantes actualizadas`)
      } catch (err) {
        setError(getApiErrorMessage(err))
      }
    },
  })

  const changedCount = form.values.variants.filter((row) =>
    isChanged(
      row,
      product.variants.find((v) => v.id === row.id),
    ),
  ).length

  const handleDelete = async (variantId: number) => {
    setDeletingId(variantId)
    setError(null)
    try {
      onProductChange(await productsApi.deleteVariant(product.id, variantId))
      // Se saca solo esa fila: los cambios sin guardar de las demás se conservan.
      void form.setFieldValue(
        'variants',
        form.values.variants.filter((row) => row.id !== variantId),
      )
      showToast('Variante eliminada')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  const fieldError = (index: number, name: 'size' | 'color' | 'stock') => {
    const touched = form.touched.variants?.[index]?.[name]
    const errors = form.errors.variants
    const rowErrors = Array.isArray(errors) ? errors[index] : undefined
    return touched && rowErrors && typeof rowErrors === 'object' ? rowErrors[name] : undefined
  }

  const input = (index: number, name: 'size' | 'color' | 'stock', label: string) => {
    const message = fieldError(index, name)
    const className = `${variantInputClass} ${message ? 'border-red-300' : 'border-gray-200'}`
    const path = `variants.${index}.${name}`
    return (
      <div>
        {name === 'stock' ? (
          <NumberInput
            aria-label={label}
            aria-invalid={Boolean(message)}
            name={path}
            value={form.values.variants[index].stock}
            onValueChange={(stock) => void form.setFieldValue(path, stock)}
            onBlur={form.getFieldProps(path).onBlur}
            className={className}
          />
        ) : (
          <input
            type="text"
            aria-label={label}
            aria-invalid={Boolean(message)}
            {...form.getFieldProps(path)}
            className={className}
          />
        )}
        {message && <p className="mt-1 text-[11px] font-medium text-red-500">{message}</p>}
      </div>
    )
  }

  return (
    <form noValidate onSubmit={form.handleSubmit}>
      <ul className="space-y-3">
        {form.values.variants.map((row, index) => (
          <li
            key={row.id}
            className="grid grid-cols-2 items-start gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-[1fr_1fr_6rem_auto]"
          >
            {input(index, 'size', 'Talle')}
            {input(index, 'color', 'Color')}
            {input(index, 'stock', 'Stock')}
            <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
              {confirmingId === row.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleDelete(row.id)}
                    disabled={deletingId === row.id}
                    className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                  >
                    {deletingId === row.id ? 'Eliminando…' : 'Confirmar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(row.id)}
                  disabled={form.values.variants.length <= 1}
                  title={
                    form.values.variants.length > 1 ? 'Eliminar variante' : 'El producto necesita al menos una variante'
                  }
                  aria-label="Eliminar variante"
                  className="rounded-lg px-3 py-2 text-xs text-red-500 transition hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          Una variante con operaciones registradas no se puede eliminar. Para agregar variantes nuevas, usá la pantalla
          de operaciones.
        </p>
        <button
          type="submit"
          disabled={form.isSubmitting || changedCount === 0}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-kleta-sage px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-kleta-light-sage disabled:opacity-40"
        >
          <i className={form.isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'} />
          {changedCount > 1 ? `Guardar ${changedCount} variantes` : 'Guardar variantes'}
        </button>
      </div>
    </form>
  )
}

interface EditProductModalProps {
  product: FullProduct
  onClose: () => void
  /** Se llama después de cada cambio guardado, para refrescar el listado de atrás. */
  onChanged: () => void
}

/** Modal para editar un producto (código, nombre, precios) y sus variantes (talle, color, stock). */
export function EditProductModal({ product, onClose, onChanged }: EditProductModalProps) {
  const showToast = useToast()
  // El modal sigue la última versión del producto que devolvió la API.
  const [current, setCurrent] = useState(product)

  const handleProductChange = (updated: FullProduct) => {
    setCurrent(updated)
    onChanged()
  }

  return (
    <Modal open onClose={onClose} title="Editar producto" icon="fa-solid fa-pen" wide>
      <div className="space-y-8">
        <Formik<EditProductFormValues>
          initialValues={{
            barcode: current.barcode ?? '',
            name: current.name,
            buyPrice: current.buyPrice,
            sellPrice: current.sellPrice,
          }}
          validate={validateProduct}
          onSubmit={async (values, { setStatus }) => {
            setStatus(undefined)
            try {
              handleProductChange(await productsApi.updateProduct(current.id, editProductSchema.parse(values)))
              showToast('Producto actualizado')
            } catch (err) {
              setStatus(getApiErrorMessage(err))
            }
          }}
        >
          {({ isSubmitting, status, values, setFieldValue, dirty }) => (
            <Form noValidate className="space-y-5">
              <TextField
                name="barcode"
                type="text"
                autoComplete="off"
                label="Código de barras (opcional)"
                placeholder="Sin código de barras"
                // Solo letras y números: lo demás se descarta al escribir (o pegar).
                onChange={(e) => void setFieldValue('barcode', sanitizeBarcode(e.target.value))}
                inputClassName="p-3.5 pr-24 bg-kleta-bg font-mono font-bold text-kleta-light-plum"
                adornment={
                  values.barcode && (
                    <button
                      type="button"
                      onClick={() => void setFieldValue('barcode', '')}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <i className="fa-solid fa-xmark mr-1" />
                      Quitar
                    </button>
                  )
                }
              />
              <TextField name="name" type="text" label="Nombre del producto" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <NumberField name="buyPrice" decimalScale={2} label="Precio al comprar ($)" />
                <NumberField name="sellPrice" decimalScale={2} label="Precio al vender ($)" />
              </div>

              {status && (
                <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <i className="fa-solid fa-circle-exclamation" />
                  {status}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !dirty}
                  className="flex items-center gap-2 rounded-xl bg-kleta-sage px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-kleta-light-sage disabled:opacity-40"
                >
                  <i className={isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'} />
                  Guardar producto
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <section>
          <h4 className="mb-3 border-t border-gray-100 pt-6 text-xs font-bold tracking-wider text-kleta-plum uppercase">
            Variantes
          </h4>
          <VariantsEditor product={current} onProductChange={handleProductChange} />
        </section>
      </div>
    </Modal>
  )
}
