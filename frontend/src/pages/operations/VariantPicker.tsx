import { useField } from 'formik'
import type { ReactNode } from 'react'
import { sortedSizes, uniqueColors, variantLabel } from '../../lib/variants'
import type { ProductVariant } from '../../types'

/** Por debajo de este stock se resalta la variante elegida. */
const LOW_STOCK_THRESHOLD = 3

interface VariantPickerProps {
  /** Campo de Formik donde se guarda el id de la variante elegida. */
  name: string
  variants: ProductVariant[]
  /** Deshabilita las variantes sin stock (en ventas). */
  disableOutOfStock: boolean
  /** Contenido a la derecha del título (ej. botón para crear una variante). */
  action?: ReactNode
}

/** Grilla de talles (filas) por colores (columnas) para elegir la variante, con su stock al costado. */
export function VariantPicker({ name, variants, disableOutOfStock, action }: VariantPickerProps) {
  const [field, meta, helpers] = useField<number | ''>(name)
  const error = meta.touched && meta.error ? meta.error : null

  const sizes = sortedSizes(variants)
  const colors = uniqueColors(variants)
  const selected = variants.find((v) => v.id === field.value)

  const select = (variant: ProductVariant) => {
    void helpers.setValue(variant.id)
    void helpers.setTouched(true, false)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-wider text-kleta-plum uppercase">Talle y color</span>
        {action}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="overflow-x-auto rounded-xl border border-kleta-pink/20 md:flex-1">
          <table
            className="w-full border-separate border-spacing-1.5 text-sm"
            aria-describedby={error ? `${name}-error` : undefined}
          >
            <thead>
              <tr>
                <th scope="col" className="px-2 text-left text-xs font-semibold text-gray-400">
                  Talle
                </th>
                {colors.map((color) => (
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
                  {colors.map((color) => {
                    const variant = variants.find((v) => v.size === size && v.color === color)
                    if (!variant) {
                      return (
                        <td key={color} className="text-center text-gray-300" title="Combinación no disponible">
                          —
                        </td>
                      )
                    }

                    const isSelected = variant.id === field.value
                    const isDisabled = disableOutOfStock && variant.stock === 0
                    return (
                      <td key={color}>
                        <button
                          type="button"
                          onClick={() => select(variant)}
                          disabled={isDisabled}
                          aria-pressed={isSelected}
                          aria-label={`Talle ${size}, color ${color}: ${variant.stock} unidades`}
                          className={`w-full min-w-16 rounded-lg border-2 px-3 py-2 text-xs font-bold transition ${
                            isSelected
                              ? 'border-kleta-rose bg-kleta-rose text-white shadow-md'
                              : isDisabled
                                ? 'cursor-not-allowed border-transparent bg-gray-100 text-gray-300 line-through'
                                : 'border-transparent bg-kleta-blush text-kleta-plum hover:border-kleta-pink/50'
                          }`}
                        >
                          {variant.stock} un.
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          aria-live="polite"
          className="flex min-h-28 flex-col justify-center rounded-xl border border-kleta-pink/20 bg-kleta-blush/60 p-4 md:w-56"
        >
          {selected ? (
            <>
              <span className="text-xs text-gray-500">Stock de {variantLabel(selected)}</span>
              <span
                className={`font-serif text-3xl font-bold ${
                  selected.stock < LOW_STOCK_THRESHOLD ? 'text-red-500' : 'text-kleta-plum'
                }`}
              >
                {selected.stock}
              </span>
              <span className="text-xs text-gray-500">{selected.stock === 1 ? 'unidad' : 'unidades'}</span>
            </>
          ) : (
            <span className="text-center text-xs text-gray-400">Elegí un talle y color para ver su stock</span>
          )}
        </div>
      </div>

      {error && (
        <p id={`${name}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </p>
      )}
    </div>
  )
}
