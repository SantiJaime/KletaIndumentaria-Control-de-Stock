/** Tipos de operación. Mismos valores que el enum `OperationType` del backend. */
export const OperationType = {
  Venta: 'venta',
  Compra: 'compra',
} as const
export type OperationType = (typeof OperationType)[keyof typeof OperationType]

/** Roles de usuario. Mismos valores que el enum `Role` del backend. */
export const Role = {
  Admin: 'admin',
  Vendedor: 'vendedor',
} as const
export type Role = (typeof Role)[keyof typeof Role]

/** Usuario autenticado, como lo devuelve la API (nunca incluye la contraseña). */
export interface User {
  id: number
  username: string
  role: Role
}

/** Combinación de talle y color de un producto, con su propio stock. */
export interface ProductVariant {
  id: number
  size: string
  color: string
  stock: number
}

/** Prenda. El código de barras y los precios son comunes a todas sus variantes. */
export interface Product {
  /** `null`: producto sin código de barras. */
  barcode: string | null
  name: string
  buyPrice: number
  sellPrice: number
  variants: ProductVariant[]
}

/** Variante a crear: todavía no tiene id (lo asigna el backend). */
export type NewVariant = Omit<ProductVariant, 'id'>

/** Datos para dar de alta un producto: las variantes todavía no tienen id. */
export type NewProduct = Omit<Product, 'variants'> & {
  variants: NewVariant[]
}

export interface Operation {
  id: number
  date: string
  productId: number
  barcode: string | null
  name: string
  size: string
  color: string
  type: OperationType
  quantity: number
  total: number
}

/** Campos a cambiar de un producto (PATCH /products/:id). `barcode: null` le quita el código. */
export interface UpdateProductInput {
  barcode: string | null
  name: string
  buyPrice: number
  sellPrice: number
}

/** Variante a modificar (PATCH /products/:id/variants): su id y los campos que cambian. */
export type UpdateVariantInput = Pick<ProductVariant, 'id'> & Partial<Pick<ProductVariant, 'size' | 'color' | 'stock'>>

/** Respuesta paginada de GET /products. */
export interface ProductPage {
  data: FullProduct[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FullProduct extends Product {
  id: number
  description: string | null
  totalStock: number
}

/** Datos para registrar una venta o compra (POST /operations). */
export interface NewOperation {
  variantId: number
  type: OperationType
  quantity: number
}

/** Operación tal como la devuelve la API. */
export interface ApiOperation {
  id: number
  /** Fecha ISO. */
  createdAt: string
  type: OperationType
  quantity: number
  unitPrice: number
  total: number
  variantId: number
  size: string
  color: string
  productId: number
  barcode: string | null
  name: string
}

/** Respuesta paginada de GET /operations. */
export interface OperationPage {
  data: ApiOperation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Respuesta de GET /operations/total. */
export interface OperationsTotal {
  fromDate: string
  toDate: string
  type: OperationType
  total: number
  /** Cantidad de operaciones (no de unidades). */
  count: number
}

/** Filtros del historial: el rango de fechas es obligatorio. */
export interface OperationFilters {
  /** yyyy-mm-dd */
  fromDate: string
  /** yyyy-mm-dd */
  toDate: string
  /** Código de barras o nombre del producto (opcional). */
  term?: string
}

/** Respuesta de POST /operations: la operación y el producto con el stock ya actualizado. */
export interface CreatedOperation {
  operation: ApiOperation
  product: FullProduct
}
