import { Form, Formik, type FormikProps } from 'formik'
import { useMemo, useRef, useState } from 'react'
import { SelectField } from '../../components/FormField'
import { NumberField } from '../../components/NumberField'
import { Modal } from '../../components/Modal'
import { useApp } from '../../context/appContext'
import { useToast } from '../../context/toastContext'
import { formatMoney } from '../../lib/format'
import { variantKey } from '../../lib/variants'
import { zodValidate } from '../../lib/zodFormik'
import { createOperationSchema, type OperationFormValues } from '../../schemas/operationSchema'
import type { ActionResult } from '../../hooks/useProducts'
import {
  OperationType,
  Role,
  type ApiOperation,
  type FullProduct,
  type NewOperation,
  type NewVariant,
} from '../../types'
import { NewVariantsForm } from './NewVariantsForm'
import { VariantPicker } from './VariantPicker'

const initialValues: OperationFormValues = {
  variantId: '',
  type: OperationType.Venta,
  quantity: 1,
}

const saleOption = {
  value: OperationType.Venta,
  label: 'Venta (Cliente compra)',
}
const purchaseOption = {
  value: OperationType.Compra,
  label: 'Compra (Ingreso de Proveedor)',
}

interface ExistingProductPanelProps {
  product: FullProduct
  /** Registra la operación en la API; el producto se actualiza con el stock que devuelve. */
  onRegisterOperation: (operation: NewOperation) => Promise<ActionResult<ApiOperation>>
  /** Crea variantes en la API; devuelve el producto actualizado. */
  onAddVariants: (variants: NewVariant[]) => Promise<ActionResult<FullProduct>>
  onDone: () => void
}

export function ExistingProductPanel({
  product,
  onRegisterOperation,
  onAddVariants,
  onDone,
}: ExistingProductPanelProps) {
  const { user, addOperation } = useApp()
  // El vendedor solo puede registrar ventas.
  const operationOptions = user?.role === Role.Admin ? [saleOption, purchaseOption] : [saleOption]
  const showToast = useToast()
  const schema = useMemo(() => createOperationSchema(product.variants), [product.variants])
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  // El modal queda fuera del <Formik> de la operación (sus forms no se anidan), así que se accede a él por ref.
  const operationForm = useRef<FormikProps<OperationFormValues>>(null)

  const handleVariantsCreated = async (variants: NewVariant[]) => {
    const result = await onAddVariants(variants)
    if (!result.ok) {
      // El modal queda abierto para corregir (ej. una variante que ya existe).
      showToast(result.error)
      return
    }
    setVariantModalOpen(false)
    showToast(variants.length === 1 ? 'Variante creada' : `${variants.length} variantes creadas`)

    // Si se creó una sola, se selecciona en la grilla, salvo que quede deshabilitada (venta sin stock).
    const [created] = variants
    const form = operationForm.current
    if (variants.length !== 1 || !form || (form.values.type === OperationType.Venta && created.stock === 0)) return
    // El id lo asignó el backend: se busca en el producto actualizado.
    const key = variantKey(created.size, created.color)
    const id = result.data.variants.find((v) => variantKey(v.size, v.color) === key)?.id
    // Sin validar: el esquema actual todavía no conoce la variante nueva.
    if (id !== undefined) void form.setFieldValue('variantId', id, false)
  }

  return (
    <div className="animate-fade-in space-y-6 rounded-2xl border-2 border-kleta-rose/30 bg-white p-6 shadow-md md:p-8">
      <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600">
          <i className="fa-solid fa-check" />
        </div>
        <div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold tracking-wider text-emerald-600 uppercase">
            Producto encontrado
          </span>
          <p className="mt-1 text-xs text-gray-400">(Se carga solo respecto al código de barras)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-kleta-pink/20 bg-kleta-blush/60 p-4 text-sm md:grid-cols-4">
        <div>
          <span className="block text-xs text-gray-500">Nombre del Producto</span>
          <span className="text-base font-bold text-kleta-plum">{product.name}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500">Código</span>
          <span className="font-mono font-semibold text-kleta-light-plum">
            {product.barcode ?? <span className="font-sans font-normal text-gray-400">Sin código</span>}
          </span>
        </div>
        <div>
          <span className="block text-xs text-gray-500">Stock total</span>
          <span className="text-base font-bold text-gray-800">{product.totalStock} unidades</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500">Precio de Venta</span>
          <span className="text-base font-bold text-kleta-rose">{formatMoney(product.sellPrice)}</span>
        </div>
      </div>

      <Formik<OperationFormValues>
        innerRef={operationForm}
        initialValues={initialValues}
        validate={zodValidate(schema)}
        onSubmit={async (values) => {
          const { variantId, type, quantity } = schema.parse(values)
          const result = await onRegisterOperation({
            variantId,
            type,
            quantity,
          })
          if (!result.ok) {
            // Ej. otra venta dejó la variante sin stock: el producto ya muestra el stock actual si se recarga.
            showToast(result.error)
            return
          }
          addOperation(result.data)
          showToast(`Operación (${type.toUpperCase()}) registrada correctamente`)
          onDone()
        }}
      >
        {({ values, setFieldValue, isSubmitting }) => {
          const isSale = values.type === OperationType.Venta
          return (
            <Form noValidate className="space-y-6">
              <VariantPicker
                name="variantId"
                variants={product.variants}
                disableOutOfStock={isSale}
                action={
                  <button
                    type="button"
                    onClick={() => setVariantModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-kleta-blush px-3 py-1.5 text-xs font-semibold text-kleta-plum transition hover:bg-kleta-pink/30"
                  >
                    <i className="fa-solid fa-plus" />
                    Nuevas variantes
                  </button>
                }
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <SelectField
                  name="type"
                  label="Tipo de operación"
                  options={operationOptions}
                  onChange={(e) => {
                    const type = e.target.value
                    void setFieldValue('type', type)
                    // Al pasar a venta, una variante sin stock elegida queda deshabilitada: se deselecciona.
                    const selected = product.variants.find((v) => v.id === values.variantId)
                    if (type === OperationType.Venta && selected?.stock === 0) void setFieldValue('variantId', '')
                  }}
                />
                <NumberField
                  name="quantity"
                  label="Cantidad (Sumar / restar stock)"
                  inputClassName="p-3.5 pr-36 bg-kleta-bg font-bold text-sm"
                  adornment={
                    <span
                      className={`absolute top-3.5 right-3 text-xs font-semibold ${
                        isSale ? 'text-rose-500' : 'text-emerald-600'
                      }`}
                    >
                      {isSale ? 'Restará del stock' : 'Sumará al stock'}
                    </span>
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-kleta-sage px-8 py-3.5 font-bold text-white shadow-md transition hover:bg-kleta-light-sage md:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i className={isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'} />
                  <span>{isSubmitting ? 'Registrando…' : 'Generar operación'}</span>
                </button>
              </div>
            </Form>
          )
        }}
      </Formik>

      <Modal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        title="Nuevas variantes"
        icon="fa-solid fa-shirt"
        wide
      >
        <NewVariantsForm
          variants={product.variants}
          onSubmit={handleVariantsCreated}
          onCancel={() => setVariantModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
