import { Form, Formik } from 'formik'
import { useMemo } from 'react'
import { zodValidate } from '../../lib/zodFormik'
import {
  createVariantMatrixSchema,
  emptyVariantMatrix,
  type VariantMatrixValues,
} from '../../schemas/variantMatrixSchema'
import type { NewVariant, ProductVariant } from '../../types'
import { VariantMatrixField } from './VariantMatrixField'

interface NewVariantsFormProps {
  /** Variantes que ya tiene el producto, para no repetir talle y color. */
  variants: ProductVariant[]
  onSubmit: (variants: NewVariant[]) => void | Promise<void>
  onCancel: () => void
}

/** Formulario del modal "Nuevas variantes": crea varias combinaciones de talle y color de una vez. */
export function NewVariantsForm({ variants, onSubmit, onCancel }: NewVariantsFormProps) {
  const schema = useMemo(() => createVariantMatrixSchema(variants), [variants])

  return (
    <Formik<VariantMatrixValues>
      initialValues={emptyVariantMatrix}
      validate={zodValidate(schema)}
      onSubmit={(values) => onSubmit(schema.parse(values))}
    >
      {({ isSubmitting }) => (
        <Form noValidate className="space-y-5">
          <VariantMatrixField existing={variants} />

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-2 rounded-xl bg-kleta-sage px-6 py-3 font-bold text-white shadow-md transition hover:bg-kleta-light-sage disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className={isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-circle-plus'} />
              <span>{isSubmitting ? 'Creando…' : 'Crear variantes'}</span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  )
}
