import { useEffect, useState } from 'react'
import { getOperations } from '../helpers/operations.queries'
import { getApiErrorMessage } from '../lib/api'
import type { OperationFilters, OperationPage } from '../types'

/**
 * Una página de operaciones del historial para unos filtros. Sin filtros (`null`) no consulta nada:
 * el rango de fechas es obligatorio.
 */
export function useOperationHistory(filters: OperationFilters | null, page: number) {
  const [state, setState] = useState<{ key: string; result: OperationPage | null; error: string | null } | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Identifica la consulta: si la respuesta guardada es de otra, todavía se está pidiendo.
  const key = filters ? JSON.stringify([filters, page, reloadKey]) : null

  useEffect(() => {
    if (!filters || key === null) return
    let ignore = false
    getOperations(filters, page)
      .then((result) => {
        if (!ignore) setState({ key, result, error: null })
      })
      .catch((err: unknown) => {
        if (!ignore) setState({ key, result: null, error: getApiErrorMessage(err) })
      })
    return () => {
      ignore = true
    }
  }, [filters, page, key])

  const current = key !== null && state?.key === key ? state : null
  return {
    result: current?.result ?? null,
    isLoading: key !== null && current === null,
    error: current?.error ?? null,
    reload: () => setReloadKey((n) => n + 1),
  }
}
