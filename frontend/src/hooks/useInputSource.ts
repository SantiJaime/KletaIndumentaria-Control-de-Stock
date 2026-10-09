import { useCallback, useRef } from 'react'

/** Cómo se cargó el texto de un campo: con un lector de código de barras o escribiendo a mano. */
export const InputSource = {
  Scanner: 'scanner',
  Keyboard: 'keyboard',
} as const
export type InputSource = (typeof InputSource)[keyof typeof InputSource]

/** Un lector manda los caracteres con unos pocos ms de diferencia; una persona tarda bastante más. */
const SCANNER_MAX_GAP_MS = 50
/** Los códigos de barras son más largos; evita confundir un par de teclas rápidas con un lector. */
const SCANNER_MIN_LENGTH = 6

interface TypingStats {
  length: number
  lastTime: number
  maxGap: number
  /** `false` si el texto se pegó, se borró o se editó: no lo mandó un lector. */
  charByChar: boolean
}

const freshStats = (): TypingStats => ({ length: 0, lastTime: 0, maxGap: 0, charByChar: true })

/**
 * Detecta por tiempo si el texto de un campo lo escribió un lector de código de barras o una persona.
 * `track` se llama en cada cambio del campo (con `event.timeStamp`) y `getSource` dice el método usado.
 * Se guarda en refs: no provoca renders; se lee desde efectos y handlers.
 */
export function useInputSource() {
  const stats = useRef<TypingStats>(freshStats())

  const track = useCallback((value: string, timeStamp: number) => {
    const s = stats.current
    if (value.length === 0) {
      stats.current = freshStats()
      return
    }
    if (value.length - s.length === 1 && s.charByChar) {
      // Del primer caracter no hay "intervalo": se mide entre los siguientes.
      if (s.length > 0) s.maxGap = Math.max(s.maxGap, timeStamp - s.lastTime)
    } else {
      s.charByChar = false
    }
    s.length = value.length
    s.lastTime = timeStamp
  }, [])

  const getSource = useCallback((): InputSource => {
    const s = stats.current
    return s.charByChar && s.length >= SCANNER_MIN_LENGTH && s.maxGap <= SCANNER_MAX_GAP_MS
      ? InputSource.Scanner
      : InputSource.Keyboard
  }, [])

  return { track, getSource }
}
