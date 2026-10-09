import { useField } from 'formik'
import type { ReactNode } from 'react'
import { stateClasses } from './fieldStyles'
import { FieldShell } from './FormField'
import { NumberInput } from './NumberInput'

interface NumberFieldProps {
  name: string
  label: ReactNode
  labelClassName?: string
  placeholder?: string
  /** Decimales permitidos (0 = solo enteros). */
  decimalScale?: number
  /** Contenido absoluto a la derecha del input (pistas, botones). */
  adornment?: ReactNode
  inputClassName?: string
  /** Además de guardar el valor en el formulario, avisa el nuevo valor (ej. para sugerir otro campo). */
  onNumberChange?: (value: number | '') => void
}

/** Campo numérico de Formik con puntos de miles (`1.000`). Guarda un número, o `''` si está vacío. */
export function NumberField({
  name,
  label,
  labelClassName,
  placeholder,
  decimalScale = 0,
  adornment,
  inputClassName = 'p-3.5 bg-kleta-bg font-medium text-sm',
  onNumberChange,
}: NumberFieldProps) {
  const [field, meta, helpers] = useField<number | ''>(name)
  const hasError = Boolean(meta.touched && meta.error)

  return (
    <FieldShell name={name} label={label} labelClassName={labelClassName}>
      <div className="relative">
        <NumberInput
          id={name}
          name={name}
          value={field.value}
          decimalScale={decimalScale}
          placeholder={placeholder}
          onBlur={field.onBlur}
          onValueChange={(value) => {
            void helpers.setValue(value)
            onNumberChange?.(value)
          }}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-full rounded-xl border outline-none transition focus:border-transparent focus:ring-2 ${stateClasses(hasError)} ${inputClassName}`}
        />
        {adornment}
      </div>
    </FieldShell>
  )
}
