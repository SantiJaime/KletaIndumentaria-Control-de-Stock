import type { ProductResponseDto } from './product-response.dto.js';

// Respuesta de GET /products: una página del listado con los datos para paginar.
export class PaginatedProductsResponseDto {
  data: ProductResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  constructor(
    data: ProductResponseDto[],
    total: number,
    page: number,
    pageSize: number,
  ) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}
