import { useField } from 'formik'
import { stateClasses } from './fieldStyles'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

interface FieldShellProps {
  name: string
  label: ReactNode
  labelClassName?: string
  children: ReactNode
}

const defaultLabelClass = 'mb-2 block text-xs font-bold uppercase tracking-wider text-kleta-plum'

export function FieldShell({ name, label, labelClassName = defaultLabelClass, children }: FieldShellProps) {
  const [, meta] = useField(name)
  const error = meta.touched && meta.error ? meta.error : null

  return (
    <div>
      <label htmlFor={name} className={labelClassName}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  name: string
  label: ReactNode
  labelClassName?: string
  /** Ícono de FontAwesome a la izquierda del input (ej. "fa-regular fa-user"). */
  icon?: string
  /** Contenido absoluto a la derecha del input (pistas, botones). */
  adornment?: ReactNode
  inputClassName?: string
}

export function TextField({
  name,
  label,
  labelClassName,
  icon,
  adornment,
  inputClassName = 'p-3.5 bg-kleta-bg font-medium text-sm',
  ...inputProps
}: TextFieldProps) {
  const [field, meta] = useField(name)
  const hasError = Boolean(meta.touched && meta.error)

  return (
    <FieldShell name={name} label={label} labelClassName={labelClassName}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-kleta-pink">
            <i className={icon} />
          </span>
        )}
        <input
          id={name}
          {...field}
          {...inputProps}
          onChange={inputProps.onChange ?? field.onChange}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-full rounded-xl border outline-none transition focus:border-transparent focus:ring-2 ${
            icon ? 'pl-10 pr-4' : ''
          } ${stateClasses(hasError)} ${inputClassName}`}
        />
        {adornment}
      </div>
    </FieldShell>
  )
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> & {
  name: string
  label: ReactNode
  options: { value: string; label: string }[]
}

export function SelectField({ name, label, options, ...selectProps }: SelectFieldProps) {
  const [field, meta] = useField(name)
  const hasError = Boolean(meta.touched && meta.error)

  return (
    <FieldShell name={name} label={label}>
      <select
        id={name}
        {...field}
        {...selectProps}
        aria-invalid={hasError}
        className={`w-full rounded-xl border bg-kleta-bg p-3.5 text-sm font-medium outline-none focus:ring-2 ${stateClasses(hasError)}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
