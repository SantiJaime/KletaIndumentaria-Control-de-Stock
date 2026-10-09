export function formatMoney(value: number): string {
  return `$${value.toLocaleString('es-AR')}`
}

const pad = (n: number) => n.toString().padStart(2, '0')

export function formatDateTime(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Fecha local en formato ISO (yyyy-mm-dd), como la usan los <input type="date">. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Fecha de hoy en formato ISO (yyyy-mm-dd). */
export const todayIso = () => toIsoDate(new Date())

/** Convierte la fecha de una operación ("dd/mm/yyyy hh:mm") a "yyyy-mm-dd". */
export function operationDayIso(operationDate: string): string {
  const [day, month, year] = operationDate.split(' ')[0].split('/')
  return `${year}-${month}-${day}`
}

/** "yyyy-mm-dd" → "dd/mm/yyyy" */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}
