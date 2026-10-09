import { useEffect, useState } from 'react'
import { findProductByBarcode, lookupProducts } from '../helpers/products.queries'
import { getApiErrorMessage } from '../lib/api'
import type { FullProduct } from '../types'
import { InputSource } from './useInputSource'

/** Espera entre tecla y tecla antes de consultar al backend cuando se escribe a mano. */
const DEBOUNCE_MS = 300

/** Un lector termina de mandar el código en pocos ms: alcanza con una espera corta para saber que terminó. */
const SCANNER_SETTLE_MS = 80

/** El backend rechaza búsquedas de menos caracteres; con menos no se busca. */
const MIN_SEARCH_LENGTH = 2

/**
 * Búsqueda de productos mientras se escribe. `getSource` (de `useInputSource`) dice cómo se cargó el texto:
 * - lector de código de barras: se busca directo por código;
 * - teclado: el backend prueba primero por código y después por nombre (tolerante a errores de tipeo).
 *
 * `results` es `null` mientras no hay una búsqueda activa (texto vacío o muy corto).
 */
export function useProductSearch(query: string, getSource?: () => InputSource) {
  const trimmed = query.trim()
  const term = trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : ''
  const [state, setState] = useState<{ key: string; results: FullProduct[]; error: string | null } | null>(null)
  // Cambiarlo vuelve a pedir la búsqueda (ej. después de editar o borrar un producto).
  const [reloadKey, setReloadKey] = useState(0)
  const key = `${term}|${reloadKey}`

  useEffect(() => {
    if (!term) return
    const isScanner = getSource?.() === InputSource.Scanner
    const controller = new AbortController()
    const timer = setTimeout(
      () => {
        const request = isScanner
          ? findProductByBarcode(term, controller.signal).then((product) => (product ? [product] : []))
          : lookupProducts(term, controller.signal)
        request
          .then((results) => setState({ key, results, error: null }))
          .catch((err: unknown) => {
            if (!controller.signal.aborted) setState({ key, results: [], error: getApiErrorMessage(err) })
          })
      },
      isScanner ? SCANNER_SETTLE_MS : DEBOUNCE_MS,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term, key, getSource])

  const reload = () => setReloadKey((n) => n + 1)
  if (!term) return { results: null, isSearching: false, error: null, reload }
  // Si la respuesta guardada es de otro texto, todavía se está buscando.
  const current = state?.key === key ? state : null
  return { results: current?.results ?? null, isSearching: current === null, error: current?.error ?? null, reload }
}
