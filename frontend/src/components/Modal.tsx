import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  title: string
  icon?: string
  /** Más ancho, para contenido como tablas. */
  wide?: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, icon, wide = false, onClose, children }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-kleta-deep-plum/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[90vh] w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} animate-fade-in overflow-y-auto rounded-2xl border border-kleta-pink/20 bg-white p-6 shadow-xl md:p-8`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 id={titleId} className="flex items-center gap-3 font-serif text-xl font-bold text-kleta-plum">
            {icon && <i className={`${icon} text-kleta-rose`} />}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-kleta-blush hover:text-kleta-plum"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
