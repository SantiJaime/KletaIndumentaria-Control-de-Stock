import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../context/toastContext'
import { deleteProduct } from '../../helpers/products.queries'
import { getApiErrorMessage } from '../../lib/api'
import type { FullProduct } from '../../types'

interface DeleteProductModalProps {
  product: FullProduct
  onClose: () => void
  /** Se llama cuando el producto ya se eliminó. */
  onDeleted: () => void
}

/** Pide confirmación antes de eliminar un producto (soft delete: se conserva el historial de operaciones). */
export function DeleteProductModal({ product, onClose, onDeleted }: DeleteProductModalProps) {
  const showToast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteProduct(product.id)
      showToast('Producto eliminado')
      onDeleted()
    } catch (err) {
      setError(getApiErrorMessage(err))
      setIsDeleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Eliminar producto" icon="fa-solid fa-trash">
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          ¿Seguro que querés eliminar <strong className="text-kleta-plum">{product.name}</strong> con sus{' '}
          {product.variants.length === 1 ? 'única variante' : `${product.variants.length} variantes`}? Dejará de verse
          en el inventario, pero sus operaciones anteriores se conservan en el historial.
        </p>
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-600 disabled:opacity-60"
          >
            {isDeleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
