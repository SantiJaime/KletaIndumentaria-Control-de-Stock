import { isAxiosError } from 'axios'
import { useCallback, useRef, useState } from 'react'
import { createOperation } from '../helpers/operations.queries'
import * as productsApi from '../helpers/products.queries'
import { getApiErrorMessage } from '../lib/api'
import type { ApiOperation, FullProduct, NewOperation, NewProduct, NewVariant } from '../types'

/**
 * Estado de la búsqueda por código de barras:
 * - `idle`: todavía no se buscó (o se reinició).
 * - `found` / `not-found`: resultado de la última búsqueda (`not-found` = hay que dar de alta el producto).
 * - `error`: falló la búsqueda por otro motivo (red, servidor); el detalle está en `error`.
 */
export type ProductSearchStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

/** Resultado de una búsqueda. `stale`: llegó tarde, porque mientras tanto se buscó otro código. */
export type SearchResult =
  | { status: 'found'; product: FullProduct }
  | { status: 'not-found' }
  | { status: 'error'; error: string }
  | { status: 'stale' }

/** Resultado de una acción de escritura: los datos, o el mensaje de error para mostrar. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

const NO_PRODUCT: ActionResult<never> = { ok: false, error: 'No hay un producto seleccionado' }

/**
 * Lógica del producto con el que se trabaja en la pantalla de operaciones: buscarlo por código,
 * darlo de alta, agregar o borrar variantes, registrar operaciones y eliminarlo.
 *
 * Las acciones no lanzan errores: devuelven un `ActionResult` con los datos o el mensaje de error.
 * Las que modifican el producto lo reemplazan con lo que devuelve el backend.
 */
export function useProducts() {
  const [product, setProduct] = useState<FullProduct | null>(null)
  const [status, setStatus] = useState<ProductSearchStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Id de la última búsqueda: si se escanea otro código antes de que llegue la respuesta, la vieja se descarta.
  const lastSearch = useRef(0)

  const searchByBarcode = useCallback(async (barcode: string): Promise<SearchResult> => {
    const searchId = ++lastSearch.current
    setStatus('loading')
    setError(null)

    try {
      const found = await productsApi.getProductByBarcode(barcode)
      if (searchId !== lastSearch.current) return { status: 'stale' }
      setProduct(found)
      setStatus('found')
      return { status: 'found', product: found }
    } catch (err) {
      if (searchId !== lastSearch.current) return { status: 'stale' }
      setProduct(null)
      // 404 no es un error: el código no está cargado y hay que dar de alta el producto.
      if (isAxiosError(err) && err.response?.status === 404) {
        setStatus('not-found')
        return { status: 'not-found' }
      }
      const message = getApiErrorMessage(err)
      setStatus('error')
      setError(message)
      return { status: 'error', error: message }
    }
  }, [])

  /** Usa un producto ya conocido (ej. elegido de una lista), sin volver a pedirlo a la API. */
  const selectProduct = useCallback((selected: FullProduct) => {
    lastSearch.current++
    setProduct(selected)
    setStatus('found')
    setError(null)
  }, [])

  /** Ejecuta una acción de escritura con `isSaving` y convierte los errores en `ActionResult`. */
  const run = useCallback(async <T>(action: () => Promise<T>): Promise<ActionResult<T>> => {
    setIsSaving(true)
    try {
      return { ok: true, data: await action() }
    } catch (err) {
      return { ok: false, error: getApiErrorMessage(err) }
    } finally {
      setIsSaving(false)
    }
  }, [])

  const createProduct = useCallback(
    (newProduct: NewProduct) =>
      run(async () => {
        const created = await productsApi.createProduct(newProduct)
        setProduct(created)
        setStatus('found')
        return created
      }),
    [run],
  )

  const addVariants = useCallback(
    async (variants: NewVariant[]) => {
      if (!product) return NO_PRODUCT
      return run(async () => {
        const updated = await productsApi.addVariants(product.id, variants)
        setProduct(updated)
        return updated
      })
    },
    [product, run],
  )

  const deleteVariant = useCallback(
    async (variantId: number) => {
      if (!product) return NO_PRODUCT
      return run(async () => {
        const updated = await productsApi.deleteVariant(product.id, variantId)
        setProduct(updated)
        return updated
      })
    },
    [product, run],
  )

  /** Registra una venta o compra; el producto queda con el stock que devuelve el backend. */
  const registerOperation = useCallback(
    (operation: NewOperation): Promise<ActionResult<ApiOperation>> =>
      run(async () => {
        const created = await createOperation(operation)
        setProduct(created.product)
        return created.operation
      }),
    [run],
  )

  const deleteProduct = useCallback(async () => {
    if (!product) return NO_PRODUCT
    const result = await run(() => productsApi.deleteProduct(product.id))
    if (result.ok) {
      setProduct(null)
      setStatus('idle')
    }
    return result
  }, [product, run])

  /** Vuelve al estado inicial (ej. después de registrar una operación). */
  const reset = useCallback(() => {
    lastSearch.current++
    setProduct(null)
    setStatus('idle')
    setError(null)
  }, [])

  return {
    product,
    status,
    /** Error de la última búsqueda (las acciones devuelven el suyo en el `ActionResult`). */
    error,
    isLoading: status === 'loading',
    isSaving,
    searchByBarcode,
    selectProduct,
    createProduct,
    addVariants,
    deleteVariant,
    registerOperation,
    deleteProduct,
    reset,
  }
}
