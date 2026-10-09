import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-kleta-pink/20 pb-4 md:flex-row md:items-center">
      <div>
        <h2 className="font-serif text-2xl font-bold text-kleta-plum md:text-3xl">{title}</h2>
        <p className="mt-1 text-xs text-gray-500 md:text-sm">{subtitle}</p>
      </div>
      {actions}
    </div>
  )
}
