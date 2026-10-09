/** Deja solo letras y números (A-Z, a-z, 0-9): saca espacios, guiones, símbolos y acentos. */
export const sanitizeBarcode = (value: string) => value.replace(/[^A-Za-z0-9]/g, '')
