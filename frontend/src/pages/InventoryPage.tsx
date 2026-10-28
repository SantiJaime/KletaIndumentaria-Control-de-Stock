import { useState } from 'react'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { useApp } from '../context/appContext'
import { useInputSource } from '../hooks/useInputSource'
import { useProductList } from '../hooks/useProductList'
import { useProductSearch } from '../hooks/useProductSearch'
import { formatMoney } from '../lib/format'
import { imageThumbnailUrl } from '../lib/images'
import { sortedSizes, variantLabel } from '../lib/variants'
import { Role, type FullProduct } from '../types'
import { DeleteProductModal } from './inventory/DeleteProductModal'
import { EditProductModal } from './inventory/EditProductModal'

/** Por debajo de este stock se resalta el producto en rojo. */
const LOW_STOCK_THRESHOLD = 5

/** Lo que se muestra en lugar del precio de compra cuando el admin lo oculta. */
const HIDDEN_PRICE = '*****'

const adminColumns = [
  { label: 'Código de barras' },
  { label: 'Producto y variantes' },
  { label: 'Precio de Compra' },
  { label: 'Precio de Venta' },
  { label: 'Stock total', align: 'center' as const },
  { label: 'Acciones', align: 'center' as const },
]

// El vendedor no ve el precio de compra ni las acciones.
const sellerColumns = adminColumns.filter((c) => c.label !== 'Precio de Compra' && c.label !== 'Acciones')

export function InventoryPage() {
  const { user } = useApp()
  // Editar y eliminar productos y ver el precio de compra es solo para administradores.
  const canManage = user?.role === Role.Admin
  const columns = canManage ? adminColumns : sellerColumns
  // El admin puede ocultar el precio de compra (por ejemplo, si un cliente ve la pantalla).
  const [hideBuyPrice, setHideBuyPrice] = useState(false)
  const [editing, setEditing] = useState<FullProduct | null>(null)
  const [deleting, setDeleting] = useState<FullProduct | null>(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const list = useProductList(page)
  const input = useInputSource()
  const search = useProductSearch(query, input.getSource)

  // Con texto en el buscador se muestran los resultados de la búsqueda (sin paginar); si no, la página actual.
  const isSearching = search.results !== null || search.isSearching
  const filtered = (isSearching ? search.results : list.result?.data) ?? []
  const isLoading = isSearching ? search.isSearching : list.isLoading
  const error = isSearching ? search.error : list.error
  const reload = () => {
    list.reload()
    search.reload()
  }
  const totalPages = Math.max(1, list.result?.totalPages ?? 1)

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Inventario de Productos"
        subtitle="Catálogo actual de indumentaria y existencias en tienda."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {canManage && (
              <button
                type="button"
                onClick={() => setHideBuyPrice(!hideBuyPrice)}
                aria-pressed={hideBuyPrice}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-kleta-plum shadow-sm transition hover:bg-kleta-blush"
              >
                <i className={hideBuyPrice ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'} />
                {hideBuyPrice ? 'Mostrar precio de compra' : 'Ocultar precio de compra'}
              </button>
            )}
            <SearchInput value={query} onChange={setQuery} label="Buscar productos" onTrackInput={input.track} />
          </div>
        }
      />

      <DataTable columns={columns}>
        {isLoading ? (
          <tr>
            <td colSpan={columns.length} className="py-6 text-center text-gray-400">
              <i className="fa-solid fa-spinner fa-spin mr-2 text-kleta-rose" />
              Cargando productos…
            </td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={columns.length} className="py-6 text-center text-red-500">
              <i className="fa-solid fa-circle-exclamation mr-2" />
              {error}
              <button
                type="button"
                onClick={reload}
                className="ml-3 rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                Reintentar
              </button>
            </td>
          </tr>
        ) : filtered.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="py-6 text-center text-gray-400">
              No se encontraron productos.
            </td>
          </tr>
        ) : (
          filtered.map((p) => {
            // Variantes ordenadas por talle para que se lean como en la grilla de operaciones.
            const sizes = sortedSizes(p.variants)
            const variants = [...p.variants].sort((a, b) => sizes.indexOf(a.size) - sizes.indexOf(b.size))
            return (
              <tr key={p.id} className="transition hover:bg-kleta-bg/50">
                <td className="px-6 py-3.5 font-mono font-bold text-kleta-light-plum">
                  {p.barcodes.length > 0 ? (
                    p.barcodes.map((code) => (
                      <span key={code} className="block">
                        {code}
                      </span>
                    ))
                  ) : (
                    <span className="font-sans font-normal text-gray-300">Sin código</span>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-start gap-3">
                    {p.imageUrl ? (
                      // Al tocarla se abre la foto completa en otra pestaña.
                      <a href={p.imageUrl} target="_blank" rel="noreferrer" className="shrink-0" title="Ver foto">
                        <img
                          src={imageThumbnailUrl(p.imageUrl, 96)}
                          alt={p.name}
                          loading="lazy"
                          className="h-12 w-12 rounded-lg border border-gray-200 object-cover transition hover:opacity-80"
                        />
                      </a>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-kleta-bg"
                      >
                        <i className="fa-solid fa-image text-gray-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-kleta-plum">{p.name}</span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {variants.map((v) => (
                          <span
                            key={v.id}
                            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                              v.stock === 0 ? 'bg-gray-100 text-gray-400 line-through' : 'bg-kleta-bg text-gray-600'
                            }`}
                          >
                            {variantLabel(v)}: {v.stock}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                {canManage && (
                  <td className="px-6 py-3.5 text-gray-600">
                    {hideBuyPrice || p.buyPrice === undefined ? HIDDEN_PRICE : formatMoney(p.buyPrice)}
                  </td>
                )}
                <td className="px-6 py-3.5 font-bold text-kleta-rose">{formatMoney(p.sellPrice)}</td>
                <td className="px-6 py-3.5 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
                      p.totalStock < LOW_STOCK_THRESHOLD ? 'bg-red-100 text-red-600' : 'bg-kleta-blush text-kleta-plum'
                    }`}
                  >
                    {p.totalStock} un.
                  </span>
                </td>
                {canManage && (
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        title="Editar producto"
                        aria-label={`Editar ${p.name}`}
                        className="rounded-lg px-2.5 py-2 text-kleta-plum transition hover:bg-kleta-blush"
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        title="Eliminar producto"
                        aria-label={`Eliminar ${p.name}`}
                        className="rounded-lg px-2.5 py-2 text-red-500 transition hover:bg-red-50"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )
          })
        )}
      </DataTable>

      {editing && (
        <EditProductModal key={editing.id} product={editing} onClose={() => setEditing(null)} onChanged={reload} />
      )}
      {deleting && (
        <DeleteProductModal
          product={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            // Si era el único producto de la última página, vuelve a la anterior.
            if (!isSearching && page > 1 && filtered.length === 1) setPage(page - 1)
            else reload()
          }}
        />
      )}

      {!isSearching && list.result && (
        <nav aria-label="Paginación" className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Página {page} de {totalPages} · {list.result?.total} productos
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg bg-white px-3 py-1.5 font-semibold text-kleta-plum shadow-sm transition hover:bg-kleta-blush disabled:opacity-40 disabled:hover:bg-white"
            >
              <i className="fa-solid fa-chevron-left mr-1.5" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg bg-white px-3 py-1.5 font-semibold text-kleta-plum shadow-sm transition hover:bg-kleta-blush disabled:opacity-40 disabled:hover:bg-white"
            >
              Siguiente
              <i className="fa-solid fa-chevron-right ml-1.5" />
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
