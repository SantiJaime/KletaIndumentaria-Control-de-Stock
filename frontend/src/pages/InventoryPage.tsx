import { useState } from 'react'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { useApp } from '../context/appContext'
import { useInputSource } from '../hooks/useInputSource'
import { useProductList } from '../hooks/useProductList'
import { useProductSearch } from '../hooks/useProductSearch'
import { formatMoney } from '../lib/format'
import { sortedSizes, variantLabel } from '../lib/variants'
import { Role, type FullProduct } from '../types'
import { DeleteProductModal } from './inventory/DeleteProductModal'
import { EditProductModal } from './inventory/EditProductModal'

/** Por debajo de este stock se resalta el producto en rojo. */
const LOW_STOCK_THRESHOLD = 5

const baseColumns = [
  { label: 'Código de barras' },
  { label: 'Producto y variantes' },
  { label: 'Precio de Compra' },
  { label: 'Precio de Venta' },
  { label: 'Stock total', align: 'center' as const },
]

export function InventoryPage() {
  const { user } = useApp()
  // Editar y eliminar productos es solo para administradores.
  const canManage = user?.role === Role.Admin
  const columns = canManage ? [...baseColumns, { label: 'Acciones', align: 'center' as const }] : baseColumns
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
        actions={<SearchInput value={query} onChange={setQuery} label="Buscar productos" onTrackInput={input.track} />}
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
                  {p.barcode ?? <span className="font-sans font-normal text-gray-300">Sin código</span>}
                </td>
                <td className="px-6 py-3.5">
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
                </td>
                <td className="px-6 py-3.5 text-gray-600">{formatMoney(p.buyPrice)}</td>
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
