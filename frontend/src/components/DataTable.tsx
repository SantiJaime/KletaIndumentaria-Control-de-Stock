import type { ReactNode } from 'react'

interface Column {
  label: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps {
  columns: Column[]
  children: ReactNode
}

const alignClass = { left: '', center: 'text-center', right: 'text-right' }

export function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-kleta-pink/20 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-kleta-pink/20 bg-kleta-blush/60 text-xs font-semibold tracking-wider text-kleta-plum uppercase">
              {columns.map((col) => (
                <th key={col.label} className={`px-6 py-4 ${alignClass[col.align ?? 'left']}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">{children}</tbody>
        </table>
      </div>
    </div>
  )
}
