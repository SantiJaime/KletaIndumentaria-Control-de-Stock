import type { OperationType } from '../../generated/prisma/client.js';

// Respuesta de GET /operations/total: monto y cantidad de operaciones de un tipo en un rango de fechas.
export class OperationsTotalResponseDto {
  fromDate: string;
  toDate: string;
  type: OperationType;
  /** Suma de los montos de las operaciones. */
  total: number;
  /** Cantidad de operaciones (no de unidades). */
  count: number;

  constructor(
    range: { fromDate: string; toDate: string; type: OperationType },
    total: number,
    count: number,
  ) {
    this.fromDate = range.fromDate;
    this.toDate = range.toDate;
    this.type = range.type;
    this.total = total;
    this.count = count;
  }
}
