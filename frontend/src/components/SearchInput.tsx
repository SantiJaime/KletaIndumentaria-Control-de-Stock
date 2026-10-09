interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  /** Se llama en cada cambio con el texto y la hora del evento (para detectar un lector de códigos). */
  onTrackInput?: (value: string, timeStamp: number) => void
}

export function SearchInput({ value, onChange, label, placeholder = 'Buscar por nombre o código...', onTrackInput }: SearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => {
        onTrackInput?.(e.target.value, e.timeStamp)
        onChange(e.target.value)
      }}
      placeholder={placeholder}
      aria-label={label}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs shadow-sm outline-none focus:ring-2 focus:ring-kleta-rose md:w-64"
    />
  )
}
