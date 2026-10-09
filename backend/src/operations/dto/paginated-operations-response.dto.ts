import {
  OperationResponseDto,
  type OperationWithProduct,
} from './operation-response.dto.js';

// Respuesta de GET /operations: una página de operaciones con los datos para paginar.
export class PaginatedOperationsResponseDto {
  data: OperationResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  constructor(
    operations: OperationWithProduct[],
    total: number,
    page: number,
    pageSize: number,
  ) {
    this.data = operations.map((o) => new OperationResponseDto(o));
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}
