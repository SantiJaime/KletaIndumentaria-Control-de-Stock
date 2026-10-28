import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { cropImage, validateImage } from '../lib/images'
import { Modal } from './Modal'

const ASPECTS = [
  { label: 'Cuadrada', value: 1, icon: 'fa-solid fa-square' },
  { label: 'Libre', value: undefined, icon: 'fa-solid fa-crop-simple' },
] as const

type Aspect = (typeof ASPECTS)[number]['value']

/** Recorte inicial: centrado, lo más grande posible con la proporción elegida (o la foto entera si es libre). */
function initialCrop(width: number, height: number, aspect: Aspect): Crop {
  if (!aspect) return { unit: '%', x: 0, y: 0, width: 100, height: 100 }
  return centerCrop(makeAspectCrop({ unit: '%', width: 100 }, aspect, width, height), width, height)
}

interface ImageCropModalProps {
  /** Foto a recortar; `null` cierra el modal. */
  file: File | null
  onCancel: () => void
  /** Recibe la foto recortada (JPEG), lista para subir. */
  onConfirm: (file: File) => void
}

/** Ajustar el área de la foto antes de subirla: se arrastra el recuadro y sus bordes. */
export function ImageCropModal({ file, onCancel, onConfirm }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [aspect, setAspect] = useState<Aspect>(1)
  const [crop, setCrop] = useState<Crop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // URL temporal de la foto elegida: se libera al cambiarla o al cerrar.
  const src = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(
    () => () => {
      if (src) URL.revokeObjectURL(src)
    },
    [src],
  )

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(initialCrop(width, height, aspect))
  }

  const changeAspect = (next: Aspect) => {
    setAspect(next)
    const img = imgRef.current
    if (img) setCrop(initialCrop(img.width, img.height, next))
  }

  const confirm = async () => {
    const img = imgRef.current
    if (!img || !crop || !file) return
    // El recorte puede estar en %: se pasa a píxeles de la imagen en pantalla.
    const pixelCrop: PixelCrop = convertToPixelCrop(crop, img.width, img.height)
    if (pixelCrop.width < 1 || pixelCrop.height < 1) {
      setError('Elegí un área de la foto')
      return
    }
    setIsProcessing(true)
    setError(null)
    try {
      const cropped = await cropImage(img, pixelCrop, file.name)
      const problem = validateImage(cropped)
      if (problem) setError(problem)
      else onConfirm(cropped)
    } catch {
      setError('No se pudo recortar la foto. Probá con otra.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal open={Boolean(file)} onClose={onCancel} title="Ajustar foto" icon="fa-solid fa-crop" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Arrastrá el recuadro o sus bordes para elegir qué parte de la foto queda.</p>
          <div className="flex gap-1 rounded-xl bg-kleta-bg p-1">
            {ASPECTS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => changeAspect(option.value)}
                aria-pressed={aspect === option.value}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  aspect === option.value ? 'bg-white text-kleta-plum shadow-sm' : 'text-gray-500 hover:text-kleta-plum'
                }`}
              >
                <i className={`${option.icon} mr-1.5`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center rounded-xl bg-gray-100 p-2">
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={aspect}
              keepSelection
              minWidth={40}
              minHeight={40}
              ruleOfThirds
            >
              <img
                ref={imgRef}
                src={src}
                alt="Foto a recortar"
                onLoad={onImageLoad}
                className="max-h-[55vh] w-auto"
              />
            </ReactCrop>
          )}
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={isProcessing || !crop}
            className="flex items-center gap-2 rounded-xl bg-kleta-sage px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-kleta-light-sage disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className={isProcessing ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'} />
            {isProcessing ? 'Procesando…' : 'Usar esta foto'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
