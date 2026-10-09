/** Clases de borde/ring según si el campo tiene error. */
export function stateClasses(hasError: boolean, ring = 'focus:ring-kleta-rose') {
  return hasError ? 'border-red-300 focus:ring-red-400' : `border-gray-200 ${ring}`
}
