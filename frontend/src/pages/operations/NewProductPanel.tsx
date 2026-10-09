import { Form, Formik } from 'formik'
import { TextField } from '../../components/FormField'
import { NumberField } from '../../components/NumberField'
import { useToast } from '../../context/toastContext'
import type { ActionResult } from '../../hooks/useProducts'
import { sanitizeBarcode } from '../../lib/barcode'
import { zodValidate } from '../../lib/zodFormik'
import { productSchema, type ProductFormValues } from '../../schemas/productSchema'
import { emptyVariantMatrix } from '../../schemas/variantMatrixSchema'
import type { FullProduct, NewProduct } from '../../types'
import { VariantMatrixField } from './VariantMatrixField'

/** Margen sugerido sobre el precio de compra. */
const SUGGESTED_MARGIN = 1.6

const validate = zodValidate<ProductFormValues>(productSchema)

interface NewProductPanelProps {
  /** Código buscado; se puede corregir o quitar en el formulario. */
  barcode: string
  /** Da de alta el producto en la API. */
  onCreate: (product: NewProduct) => Promise<ActionResult<FullProduct>>
}

export function NewProductPanel({ barcode, onCreate }: NewProductPanelProps) {
  const showToast = useToast()

  const initialValues: ProductFormValues = {
    barcode,
    name: '',
    buyPrice: '',
    sellPrice: '',
    ...emptyVariantMatrix,
  }

  return (
    <div className="animate-fade-in space-y-6 rounded-2xl border-2 border-kleta-pink/40 bg-white p-6 shadow-md md:p-8">
      <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-600">
          <i className="fa-solid fa-plus" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-kleta-plum">Formulario de nuevo producto</h3>
          <p className="text-xs text-gray-400">
            El producto no está cargado. Complétalo para registrarlo en el catálogo.
          </p>
        </div>
      </div>

      <Formik<ProductFormValues>
        initialValues={initialValues}
        validate={validate}
        onSubmit={async (values) => {
          // Al crearse, el producto pasa a existir y la página muestra el panel de operación.
          const result = await onCreate(productSchema.parse(values))
          showToast(result.ok ? '¡Nuevo producto cargado con éxito!' : result.error)
        }}
      >
        {({ setFieldValue, isSubmitting, values }) => (
          <Form noValidate className="space-y-5">
            <TextField
              name="barcode"
              type="text"
              autoComplete="off"
              label="Código de barras del producto (opcional)"
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

            <TextField name="name" type="text" label="Nombre del producto" placeholder="Ej: Pantalón Floral Kleta" />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <NumberField
                name="buyPrice"
                decimalScale={2}
                label="Precio al comprar ($)"
                placeholder="0,00"
                onNumberChange={(buyPrice) => {
                  if (typeof buyPrice === 'number' && buyPrice > 0) {
                    void setFieldValue('sellPrice', Math.round(buyPrice * SUGGESTED_MARGIN))
                  }
                }}
              />

              <NumberField
                name="sellPrice"
                decimalScale={2}
                label={
                  <>
                    Precio al vender ($)
                    <span className="block font-sans text-xs font-normal text-kleta-rose lowercase">
                      (se calcula con margen sugerido de +60%)
                    </span>
                  </>
                }
                placeholder="0,00"
                inputClassName="p-3.5 bg-kleta-bg font-bold text-sm text-kleta-plum"
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h4 className="mb-4 font-serif text-lg font-bold text-kleta-plum">Variantes y stock inicial</h4>
              <VariantMatrixField />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-kleta-sage px-8 py-3.5 font-bold text-white shadow-md transition hover:bg-kleta-light-sage md:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className={isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-circle-plus'} />
                <span>{isSubmitting ? 'Cargando…' : 'Cargar producto'}</span>
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
