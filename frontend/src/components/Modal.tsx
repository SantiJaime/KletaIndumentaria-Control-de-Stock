import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  title: string
  icon?: string
  /** Ancho máximo: `md` (por defecto), `lg` para tablas, `xl` para formularios en dos columnas. */
  size?: 'md' | 'lg' | 'xl'
  onClose: () => void
  children: ReactNode
}

const SIZE_CLASSES = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl' } as const

export function Modal({ open, title, icon, size = 'md', onClose, children }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Con un modal encima de otro (ej. recortar la foto dentro de "Editar producto"), Escape cierra solo el de arriba.
      const dialogs = document.querySelectorAll('[role="dialog"]')
      if (dialogs[dialogs.length - 1] === dialogRef.current) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-kleta-deep-plum/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[90vh] w-full ${SIZE_CLASSES[size]} animate-fade-in overflow-y-auto rounded-2xl border border-kleta-pink/20 bg-white p-6 shadow-xl md:p-8`}
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
