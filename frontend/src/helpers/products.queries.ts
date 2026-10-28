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
    barcodes: product.barcodes.map(sanitizeBarcode).filter(Boolean),
  });
  return data;
};

/** Vincula un código de barras a un producto existente; devuelve el producto actualizado. */
export const addBarcode = async (productId: number, barcode: string) => {
  const { data } = await api.post<FullProduct>(`/products/${productId}/barcodes`, {
    barcode: sanitizeBarcode(barcode),
  });
  return data;
};

/** Sube (o reemplaza) la foto del producto; devuelve el producto actualizado. */
export const uploadProductImage = async (productId: number, image: File) => {
  const form = new FormData();
  form.append("image", image);
  const { data } = await api.post<FullProduct>(`/products/${productId}/image`, form, {
    // `api` manda JSON por defecto: con multipart el navegador agrega el boundary.
    headers: { "Content-Type": "multipart/form-data" },
    // Subir una foto puede tardar más que un pedido común.
    timeout: 60_000,
  });
  return data;
};

/** Quita la foto del producto; devuelve el producto actualizado. */
export const deleteProductImage = async (productId: number) => {
  const { data } = await api.delete<FullProduct>(`/products/${productId}/image`);
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
