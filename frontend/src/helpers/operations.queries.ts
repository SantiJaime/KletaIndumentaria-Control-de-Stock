import { api } from "../lib/api";
import type { CreatedOperation, NewOperation, OperationFilters, OperationPage, OperationsTotal, OperationType } from "../types";

/** Una página de operaciones entre dos fechas (50 por página, de la más nueva a la más vieja). */
export const getOperations = async (filters: OperationFilters, page = 1) => {
  const { data } = await api.get<OperationPage>("/operations", {
    params: { ...filters, page },
  });
  return data;
};

/** Monto y cantidad de operaciones de un tipo entre dos fechas, calculados en el backend. */
export const getOperationsTotal = async (params: { fromDate: string; toDate: string; type: OperationType }) => {
  const { data } = await api.get<OperationsTotal>("/operations/total", { params });
  return data;
};

/** Registra una venta o compra; devuelve la operación y el producto con el stock actualizado. */
export const createOperation = async (operation: NewOperation) => {
  const { data } = await api.post<CreatedOperation>("/operations", operation);
  return data;
};
