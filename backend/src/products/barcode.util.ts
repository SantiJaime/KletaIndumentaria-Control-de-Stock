/** Máximo de códigos de barras por producto. */
export const MAX_BARCODES = 20;

/** Deja solo letras y números (A-Z, a-z, 0-9): saca espacios, guiones, símbolos y acentos. */
export const sanitizeBarcode = (value: string) =>
  value.replace(/[^A-Za-z0-9]/g, '');

/**
 * Limpia una lista de códigos: cada uno con `sanitizeBarcode`, sin vacíos y sin repetidos (sin distinguir
 * mayúsculas; queda el primero). Si `value` no es una lista de textos lo devuelve igual, para que lo rechace la
 * validación del DTO.
 */
export const sanitizeBarcodes = (value: unknown): unknown => {
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
    return value;
  }
  const seen = new Set<string>();
  return (value as string[]).map(sanitizeBarcode).filter((code) => {
    const key = code.toLowerCase();
    if (!code || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
