import { Form, Formik } from 'formik'
import { useState } from 'react'
import { ImageField } from '../../components/ImageField'
import { TextAreaField, TextField } from '../../components/FormField'
import { TagsField } from '../../components/TagsField'
import { NumberField } from '../../components/NumberField'
import { useToast } from '../../context/toastContext'
import type { ActionResult, CreatedProduct } from '../../hooks/useProducts'
import { sanitizeBarcode } from '../../lib/barcode'
import { zodValidate } from '../../lib/zodFormik'
import { productSchema, type ProductFormValues } from '../../schemas/productSchema'
import { DESCRIPTION_MAX_LENGTH } from '../../schemas/common'
import { emptyVariantMatrix } from '../../schemas/variantMatrixSchema'
import type { NewProduct } from '../../types'
import { VariantMatrixField } from './VariantMatrixField'

/** Margen sugerido sobre el precio de compra. */
const SUGGESTED_MARGIN = 1.6

const validate = zodValidate<ProductFormValues>(productSchema)

interface NewProductPanelProps {
  /** Código buscado (o `''`); se puede corregir o quitar y agregar otros en el formulario. */
  barcode: string
  /** Da de alta el producto en la API (y sube la foto, si se eligió una). */
  onCreate: (product: NewProduct, image: File | null) => Promise<ActionResult<CreatedProduct>>
}

export function NewProductPanel({ barcode, onCreate }: NewProductPanelProps) {
  const showToast = useToast()
  // La foto se sube después del alta (hace falta el id del producto).
  const [image, setImage] = useState<File | null>(null)

  const initialValues: ProductFormValues = {
    barcodes: barcode ? [barcode] : [],
    name: '',
    description: '',
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
          const result = await onCreate(productSchema.parse(values), image)
          if (!result.ok) showToast(result.error)
          else if (result.data.imageError) {
            showToast(`Producto cargado, pero no se pudo subir la foto: ${result.data.imageError}`)
          } else showToast('¡Nuevo producto cargado con éxito!')
        }}
      >
        {({ setFieldValue, isSubmitting }) => (
          <Form noValidate className="space-y-5">
            <TagsField
              name="barcodes"
              label="Códigos de barras (opcional)"
              placeholder="Sin códigos (escaneá o escribí y Enter para agregar)"
              maxLength={50}
              // Solo letras y números: lo demás se descarta al escribir (o pegar).
              sanitize={sanitizeBarcode}
              mono
            />

            <TextField name="name" type="text" label="Nombre del producto" placeholder="Ej: Pantalón Floral Kleta" />

            <TextAreaField
              name="description"
              label="Descripción (opcional)"
              placeholder="Ej: tela, calce, detalles de la prenda…"
              maxLength={DESCRIPTION_MAX_LENGTH}
            />

            <ImageField
              label="Foto del producto (opcional)"
              value={image}
              onSelect={setImage}
              onRemove={() => setImage(null)}
              busy={isSubmitting}
              hint="JPG, PNG o WEBP; después de elegirla podés recortarla. Se sube al cargar el producto."
            />

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
