import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useToast } from '../context/toastContext'
import { cancelOperation } from '../helpers/operations.queries'
import { getApiErrorMessage } from '../lib/api'
import { formatMoney } from '../lib/format'
import { variantLabel } from '../lib/variants'
import { OperationType, type ApiOperation } from '../types'

interface CancelOperationModalProps {
  operation: ApiOperation
  onClose: () => void
  /** Se llama cuando la operación ya se anuló. */
  onCancelled: () => void
}

/** Pide confirmación antes de anular una operación (queda en el historial como anulada y el stock se revierte). */
export function CancelOperationModal({ operation, onClose, onCancelled }: CancelOperationModalProps) {
  const showToast = useToast()
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSale = operation.type === OperationType.Venta
  const units = operation.quantity === 1 ? '1 unidad' : `${operation.quantity} unidades`

  const handleCancel = async () => {
    setIsCancelling(true)
    setError(null)
    try {
      await cancelOperation(operation.id)
      showToast('Operación anulada')
      onCancelled()
    } catch (err) {
      // Ej. una compra cuyas unidades ya se vendieron: no se puede quitar ese stock.
      setError(getApiErrorMessage(err))
      setIsCancelling(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Anular operación" icon="fa-solid fa-ban">
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          ¿Seguro que querés anular la {operation.type} de <strong className="text-kleta-plum">{operation.name}</strong>{' '}
          ({variantLabel(operation)}) por {formatMoney(operation.total)}? Se {isSale ? 'devolverán' : 'quitarán'} {units}{' '}
          {isSale ? 'al' : 'del'} stock. La operación queda en el historial marcada como anulada y deja de contar en los
          montos. No se puede deshacer.
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
            Volver
          </button>
          <button
            type="button"
            onClick={() => void handleCancel()}
            disabled={isCancelling}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-600 disabled:opacity-60"
          >
            {isCancelling ? 'Anulando…' : 'Anular operación'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
