import { isAxiosError } from "axios";
import { api } from "../lib/api";
import { sanitizeBarcode } from "../lib/barcode";
import type { FullProduct, NewProduct, NewVariant, ProductPage, UpdateProductInput, UpdateVariantInput } from "../types";

/** Página del listado (50 productos por página, ordenados por nombre). */
export const getProducts = async (page = 1) => {
  const { data } = await api.get<ProductPage>("/products", { params: { page } });
  return data;
};

/**
 * Búsqueda cuando no se sabe si se escribió un código o un nombre: el backend prueba primero por
 * código exacto y después por nombre (tolerante a errores de tipeo, de más a menos parecido).
 */
export const lookupProducts = async (term: string, signal?: AbortSignal) => {
  const { data } = await api.get<FullProduct[]>("/products/lookup", {
    params: { term },
    signal,
  });
  return data;
};

export const getProductByBarcode = async (barcode: string) => {
  const { data } = await api.get<FullProduct>(
    `/products/barcode/${encodeURIComponent(sanitizeBarcode(barcode))}`,
  );
  return data;
};

/** Igual que `getProductByBarcode`, pero devuelve `null` si el código no existe (404). */
export const findProductByBarcode = async (barcode: string, signal?: AbortSignal) => {
  try {
    const { data } = await api.get<FullProduct>(
      `/products/barcode/${encodeURIComponent(sanitizeBarcode(barcode))}`,
      { signal },
    );
    return data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
};

export const getProduct = async (id: number) => {
  const { data } = await api.get<FullProduct>(`/products/${id}`);
  return data;
};

export const createProduct = async (product: NewProduct) => {
  const { data } = await api.post<FullProduct>("/products", {
    ...product,
    barcode: product.barcode ? sanitizeBarcode(product.barcode) : undefined,
  });
  return data;
};

/** Devuelve el producto actualizado, con las variantes nuevas. */
export const addVariants = async (
  productId: number,
  variants: NewVariant[],
) => {
  const { data } = await api.post<FullProduct>(
    `/products/${productId}/variants`,
    { variants },
  );
  return data;
};

/** Devuelve el producto actualizado. */
export const updateProduct = async (id: number, product: UpdateProductInput) => {
  const { data } = await api.patch<FullProduct>(`/products/${id}`, product);
  return data;
};

/** Guarda varias variantes en una sola transacción; devuelve el producto actualizado. */
export const updateVariants = async (
  productId: number,
  variants: UpdateVariantInput[],
) => {
  const { data } = await api.patch<FullProduct>(
    `/products/${productId}/variants`,
    { variants },
  );
  return data;
};

/** Soft delete: el backend responde 204 sin contenido. */
export const deleteProduct = async (id: number) => {
  await api.delete(`/products/${id}`);
};

/** Devuelve el producto actualizado, sin la variante borrada. */
export const deleteVariant = async (productId: number, variantId: number) => {
  const { data } = await api.delete<FullProduct>(
    `/products/${productId}/variants/${variantId}`,
  );
  return data;
};
