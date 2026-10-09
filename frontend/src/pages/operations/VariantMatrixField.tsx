import { useFormikContext } from 'formik'
import { useState } from 'react'
import { NumberInput } from '../../components/NumberInput'
import { TagsField } from '../../components/TagsField'
import { sortedSizes, sortSizes, uniqueColors, variantKey } from '../../lib/variants'
import { matrixToVariants, newCombinations, type VariantMatrixValues } from '../../schemas/variantMatrixSchema'
import type { ProductVariant } from '../../types'

const sizePresets = [
  { label: 'XS – XL', values: ['XS', 'S', 'M', 'L', 'XL'] },
  { label: '36 – 46', values: ['36', '38', '40', '42', '44', '46'] },
  { label: 'Único', values: ['Único'] },
]

// Cada color es su propio botón: se agrega de a uno.
const colorPresets = [
  'Negro',
  'Blanco',
  'Gris',
  'Beige',
  'Azul',
  'Celeste',
  'Rojo',
  'Rosa',
  'Verde',
  'Marrón',
  'Amarillo',
  'Violeta',
].map((color) => ({ label: color, values: [color] }))

interface VariantMatrixFieldProps {
  /** Variantes que ya tiene el producto: sus celdas aparecen bloqueadas. */
  existing?: ProductVariant[]
}

/**
 * Generador de variantes: se cargan talles y colores como etiquetas y se arma una tabla
 * talle × color con el stock de cada combinación. Usa los campos `sizes`, `colors` y `stocks`
 * del formulario que lo contiene.
 */
export function VariantMatrixField({ existing = [] }: VariantMatrixFieldProps) {
  const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext<VariantMatrixValues>()
  const [fillValue, setFillValue] = useState<number | ''>('')

  const sizes = sortSizes(values.sizes)
  const existingByKey = new Map(existing.map((v) => [variantKey(v.size, v.color), v]))
  const toCreate = matrixToVariants(values, existing).length
  const stocksError = touched.stocks && typeof errors.stocks === 'string' ? errors.stocks : null

  const setStock = (key: string, stock: number | '') => {
    void setFieldValue('stocks', { ...values.stocks, [key]: stock })
  }

  /** Completa con el mismo stock las combinaciones nuevas que siguen vacías. */
  const fillEmpty = () => {
    if (fillValue === '') return
    const stocks = { ...values.stocks }
    for (const { key } of newCombinations(values, existing)) {
      if (typeof stocks[key] !== 'number') stocks[key] = fillValue
    }
    void setFieldValue('stocks', stocks)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TagsField
          name="sizes"
          label="Talles"
          placeholder="Ej: S, M, 40… (Enter para agregar)"
          maxLength={20}
          presets={sizePresets}
          suggestions={sortedSizes(existing)}
        />
        <TagsField
          name="colors"
          label="Colores"
          placeholder="Ej: Negro, Blanco… (Enter para agregar)"
          maxLength={30}
          presets={colorPresets}
          suggestions={uniqueColors(existing)}
        />
      </div>

      {sizes.length > 0 && values.colors.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <span className="text-xs font-bold tracking-wider text-kleta-plum uppercase">Stock por combinación</span>
            <div className="flex items-center gap-2">
              <NumberInput
                value={fillValue}
                onValueChange={setFillValue}
                aria-label="Stock para completar las vacías"
                placeholder="Stock"
                className="w-20 rounded-lg border border-gray-200 bg-kleta-bg px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-kleta-rose"
              />
              <button
                type="button"
                onClick={fillEmpty}
                className="rounded-lg bg-kleta-blush px-3 py-1.5 text-xs font-semibold text-kleta-plum transition hover:bg-kleta-pink/30"
              >
                Completar vacías
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-kleta-pink/20">
            <table className="w-full border-separate border-spacing-1.5 text-sm">
              <thead>
                <tr>
                  <th scope="col" className="px-2 text-left text-xs font-semibold text-gray-400">
                    Talle
                  </th>
                  {values.colors.map((color) => (
                    <th key={color} scope="col" className="px-2 text-xs font-semibold text-kleta-plum">
                      {color}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => (
                  <tr key={size}>
                    <th scope="row" className="px-2 text-left font-bold text-kleta-plum">
                      {size}
                    </th>
                    {values.colors.map((color) => {
                      const key = variantKey(size, color)
                      const current = existingByKey.get(key)
                      return (
                        <td key={color}>
                          {current ? (
                            <span
                              title="Esta variante ya existe"
                              className="block min-w-16 rounded-lg bg-gray-100 px-2 py-2 text-center text-[11px] font-semibold text-gray-400"
                            >
                              Ya existe ({current.stock})
                            </span>
                          ) : (
                            <NumberInput
                              value={values.stocks[key] ?? ''}
                              onValueChange={(stock) => setStock(key, stock)}
                              onBlur={() => void setFieldTouched('stocks', true)}
                              aria-label={`Stock de talle ${size}, color ${color}`}
                              placeholder="—"
                              className="w-full min-w-16 rounded-lg border border-gray-200 bg-kleta-bg px-2 py-2 text-center text-xs font-bold text-kleta-plum outline-none focus:ring-2 focus:ring-kleta-rose"
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-1.5 text-xs text-gray-400">
            Las celdas vacías no se crean; poné 0 para crear una variante sin stock.{' '}
            <span className="font-semibold text-kleta-plum">
              {toCreate === 1 ? 'Se creará 1 variante.' : `Se crearán ${toCreate} variantes.`}
            </span>
          </p>
        </div>
      )}

      {stocksError && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <i className="fa-solid fa-circle-exclamation" />
          {stocksError}
        </p>
      )}
    </div>
  )
}
