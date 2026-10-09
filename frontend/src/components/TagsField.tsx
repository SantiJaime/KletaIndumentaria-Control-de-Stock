import { useField } from 'formik'
import { useState, type KeyboardEvent } from 'react'
import { normalizeLabel } from '../lib/variants'

interface TagsFieldProps {
  name: string
  label: string
  placeholder?: string
  maxLength?: number
  /** Valores sugeridos (ej. los que ya usa el producto). También fijan la escritura: "m" se guarda como "M". */
  suggestions?: string[]
  /** Grupos de valores que se agregan de una vez (ej. "XS – XL"); desaparecen cuando ya están todos agregados. */
  presets?: { label: string; values: string[] }[]
}

/** Lista de etiquetas en un campo de Formik (`string[]`): Enter o coma agrega, × quita. */
export function TagsField({ name, label, placeholder, maxLength, suggestions = [], presets = [] }: TagsFieldProps) {
  const [field, meta, helpers] = useField<string[]>(name)
  const [draft, setDraft] = useState('')
  const tags = field.value
  const error = meta.touched && typeof meta.error === 'string' ? meta.error : null

  const has = (value: string) => tags.some((t) => normalizeLabel(t) === normalizeLabel(value))

  const add = (values: string[]) => {
    const next = [...tags]
    for (const raw of values) {
      const value = raw.trim()
      if (!value || next.some((t) => normalizeLabel(t) === normalizeLabel(value))) continue
      next.push(suggestions.find((s) => normalizeLabel(s) === normalizeLabel(value)) ?? value)
    }
    void helpers.setValue(next)
    void helpers.setTouched(true, false)
  }

  const commitDraft = () => {
    if (draft.trim()) add([draft])
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Enter no debe enviar el formulario: agrega la etiqueta.
      e.preventDefault()
      commitDraft()
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      void helpers.setValue(tags.slice(0, -1))
    }
  }

  const pendingSuggestions = suggestions.filter((s) => !has(s))
  const pendingPresets = presets.filter((preset) => !preset.values.every(has))

  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-xs font-bold tracking-wider text-kleta-plum uppercase">
        {label}
      </label>
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-xl border bg-kleta-bg p-2 focus-within:ring-2 ${
          error ? 'border-red-300 focus-within:ring-red-400' : 'border-gray-200 focus-within:ring-kleta-rose'
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-kleta-rose px-2.5 py-1 text-xs font-semibold text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => void helpers.setValue(tags.filter((t) => t !== tag))}
              aria-label={`Quitar ${tag}`}
              className="opacity-80 transition hover:opacity-100"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </span>
        ))}
        <input
          id={name}
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
          placeholder={tags.length === 0 ? placeholder : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-sm font-medium outline-none"
        />
      </div>

      {(pendingPresets.length > 0 || pendingSuggestions.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pendingPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => add(preset.values)}
              className="rounded-lg border border-kleta-pink/30 px-2 py-1 text-[11px] font-semibold text-kleta-plum transition hover:bg-kleta-blush"
            >
              <i className="fa-solid fa-plus mr-1" />
              {preset.label}
            </button>
          ))}
          {pendingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add([s])}
              className="rounded-lg bg-kleta-blush px-2 py-1 text-[11px] font-semibold text-kleta-plum transition hover:bg-kleta-pink/30"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p id={`${name}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </p>
      )}
    </div>
  )
}
