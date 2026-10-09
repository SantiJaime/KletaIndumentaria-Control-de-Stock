import type { InputHTMLAttributes } from 'react'
import { NumericFormat } from 'react-number-format'
import type { NumberInputValue } from '../schemas/common'

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step'
> & {
  value: NumberInputValue
  /** Se llama solo cuando la persona escribe; `''` si el campo queda vacío. */
  onValueChange: (value: NumberInputValue) => void
  /** Cantidad de decimales permitidos (0 = solo enteros). */
  decimalScale?: number
}

/**
 * Campo numérico en formato argentino: punto para los miles (`1.000`) y coma para los decimales (`1.500,50`).
 * El valor que maneja el formulario sigue siendo un número (o `''`), sin formato.
 */
export function NumberInput({ value, onValueChange, decimalScale = 0, ...inputProps }: NumberInputProps) {
  return (
    <NumericFormat
      {...inputProps}
      value={value}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={decimalScale}
      allowNegative={false}
      inputMode={decimalScale > 0 ? 'decimal' : 'numeric'}
      onValueChange={({ floatValue }, { source }) => {
        // `prop`: el valor cambió desde afuera (ej. un precio sugerido); no es algo que haya escrito la persona.
        if (source === 'event') onValueChange(floatValue ?? '')
      }}
    />
  )
}
