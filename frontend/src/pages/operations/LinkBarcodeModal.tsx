import { useState } from 'react'
import { Modal } from '../../components/Modal'
import * as productsApi from '../../helpers/products.queries'
import { useProductSearch } from '../../hooks/useProductSearch'
import { getApiErrorMessage } from '../../lib/api'
import type { FullProduct } from '../../types'

interface LinkBarcodeModalProps {
  /** Código escaneado que no pertenece a ningún producto. */
  code: string
  /** "Volver" en el buscador: regresa al cartel con las opciones. */
  onBack: () => void
  /** Cierra todo sin vincular. */
  onClose: () => void
  /** El código quedó vinculado: recibe el producto actualizado. */
  onLinked: (product: FullProduct) => void
}

/**
 * Vincula un código de barras nuevo a un producto existente (solo admin), en dos carteles: primero se busca y
 * elige el producto, después se confirma.
 */
export function LinkBarcodeModal({ code, onBack, onClose, onLinked }: LinkBarcodeModalProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FullProduct | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const search = useProductSearch(query)

  const confirm = async () => {
    if (!selected) return
    setIsSaving(true)
    setError(null)
    try {
      onLinked(await productsApi.addBarcode(selected.id, code))
    } catch (err) {
      setError(getApiErrorMessage(err))
      setIsSaving(false)
    }
  }

  const backToSearch = () => {
    setSelected(null)
    setError(null)
  }

  const codeLabel = <strong className="font-mono text-kleta-plum">{code}</strong>

  return (
    <>
      <Modal open={!selected} onClose={onClose} title="Vincular a un producto" icon="fa-solid fa-link">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Buscá el producto al que querés agregarle el código {codeLabel}.</p>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o código del producto"
            aria-label="Buscar producto"
            className="w-full rounded-xl border border-gray-300 bg-kleta-bg px-4 py-3 text-sm font-semibold text-kleta-plum outline-none focus:border-transparent focus:ring-2 focus:ring-kleta-sage"
          />

          {search.results === null && !search.isSearching && (
            <p className="text-xs text-gray-400">Escribí al menos 2 caracteres.</p>
          )}
          {search.isSearching && <p className="text-xs text-gray-400">Buscando…</p>}
          {search.error && <p className="text-xs text-red-500">{search.error}</p>}
          {search.results &&
            !search.error &&
            (search.results.length === 0 ? (
              <p className="text-xs text-gray-400">No se encontraron productos.</p>
            ) : (
              <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
                {search.results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(p)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-kleta-bg"
                    >
                      <span className="font-semibold text-kleta-plum">{p.name}</span>
                      <span className="shrink-0 font-mono text-xs text-kleta-light-plum">
                        {p.barcodes.join(', ') || 'Sin código'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          <div className="flex justify-start">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100"
            >
              <i className="fa-solid fa-arrow-left mr-1.5" />
              Volver
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(selected)} onClose={onClose} title="Confirmar vínculo" icon="fa-solid fa-circle-question">
        {selected && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de vincular el código de barras {codeLabel} con el producto{' '}
              <strong className="text-kleta-plum">{selected.name}</strong>?
            </p>
            {selected.barcodes.length > 0 && (
              <p className="text-xs text-gray-400">
                Códigos actuales: <span className="font-mono">{selected.barcodes.join(', ')}</span>
              </p>
            )}
            {error && (
              <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                <i className="fa-solid fa-circle-exclamation" />
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={backToSearch}
                disabled={isSaving}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 disabled:opacity-60"
              >
                No, elegir otro
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => void confirm()}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-kleta-sage px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-kleta-light-sage disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className={isSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-link'} />
                {isSaving ? 'Vinculando…' : 'Sí, vincular'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
