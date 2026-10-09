import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '../helpers/products.queries'
import { getApiErrorMessage } from '../lib/api'
import type { ProductPage } from '../types'

/** Una página del listado de productos de la API (inventario). `reload` vuelve a pedirla. */
export function useProductList(page: number) {
  const [result, setResult] = useState<ProductPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Cambiarlo vuelve a ejecutar el efecto que pide el listado.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    // Si el componente se desmonta (o se recarga) antes de la respuesta, se ignora.
    let ignore = false
    getProducts(page)
      .then((data) => {
        if (ignore) return
        setResult(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!ignore) setError(getApiErrorMessage(err))
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [page, reloadKey])

  const reload = useCallback(() => {
    setIsLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  // Al cambiar de página, hasta que llega la nueva se muestra como cargando.
  return { result, isLoading: isLoading || result?.page !== page, error, reload }
}
