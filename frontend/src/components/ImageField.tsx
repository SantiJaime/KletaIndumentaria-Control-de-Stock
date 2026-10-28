import { useEffect, useId, useMemo, useState } from 'react'
import { validateSourceImage } from '../lib/images'
import { ImageCropModal } from './ImageCropModal'

interface ImageFieldProps {
  label: string
  /** Foto a mostrar: un archivo elegido (todavía sin subir) o la URL de la foto guardada. */
  value: File | string | null
  /** Se llama con la foto ya recortada (JPEG, formato y tamaño revisados). */
  onSelect: (file: File) => void
  onRemove: () => void
  /** Subiendo o borrando: deshabilita los botones y muestra un spinner. */
  busy?: boolean
  /** Error externo (ej. de la API). */
  error?: string | null
  hint?: string
  /** `inline` (por defecto): miniatura con los botones al lado. `stacked`: foto grande con los botones abajo. */
  layout?: 'inline' | 'stacked'
}

/** Elegir (y recortar), cambiar o quitar la foto de un producto, con vista previa. */
export function ImageField({
  label,
  value,
  onSelect,
  onRemove,
  busy = false,
  error,
  hint,
  layout = 'inline',
}: ImageFieldProps) {
  const stacked = layout === 'stacked'
  const inputId = useId()
  const [localError, setLocalError] = useState<string | null>(null)
  // Foto elegida que todavía se está recortando.
  const [pending, setPending] = useState<File | null>(null)

  // Vista previa de un archivo elegido: URL temporal que se libera al cambiarlo o al desmontar.
  const fileUrl = useMemo(() => (value instanceof File ? URL.createObjectURL(value) : null), [value])
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    },
    [fileUrl],
  )
  const preview = typeof value === 'string' ? value : fileUrl

  const shownError = localError ?? error

  return (
    <div>
      <span className="mb-2 block text-xs font-bold tracking-wider text-kleta-plum uppercase">{label}</span>
      <div className={stacked ? 'space-y-3' : 'flex items-center gap-4'}>
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-kleta-bg ${
            stacked ? 'aspect-square w-full' : 'h-28 w-28'
          }`}
        >
          {preview ? (
            <img src={preview} alt="Foto del producto" className="h-full w-full object-cover" />
          ) : (
            <i className={`fa-solid fa-image text-gray-300 ${stacked ? 'text-6xl' : 'text-3xl'}`} />
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <i className={`fa-solid fa-spinner fa-spin text-kleta-rose ${stacked ? 'text-3xl' : 'text-xl'}`} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className={`flex flex-wrap gap-2 ${stacked ? 'justify-center' : ''}`}>
            <label
              htmlFor={inputId}
              className={`cursor-pointer rounded-xl border-2 border-kleta-sage px-4 py-2 text-xs font-bold text-kleta-sage transition hover:bg-kleta-sage hover:text-white ${
                busy ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <i className="fa-solid fa-upload mr-1.5" />
              {preview ? 'Cambiar foto' : 'Elegir foto'}
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                // Se limpia para poder volver a elegir el mismo archivo.
                e.target.value = ''
                if (!file) return
                const problem = validateSourceImage(file)
                setLocalError(problem)
                if (!problem) setPending(file)
              }}
            />
            {preview && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setLocalError(null)
                  onRemove()
                }}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                <i className="fa-solid fa-trash mr-1.5" />
                Quitar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">{hint ?? 'JPG, PNG o WEBP. Después de elegirla, podés recortarla.'}</p>
          {shownError && (
            <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-500">
              <i className="fa-solid fa-circle-exclamation" />
              {shownError}
            </p>
          )}
        </div>
      </div>

      <ImageCropModal
        file={pending}
        onCancel={() => setPending(null)}
        onConfirm={(cropped) => {
          setPending(null)
          onSelect(cropped)
        }}
      />
    </div>
  )
}
