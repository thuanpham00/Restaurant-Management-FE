import Http from "src/Helpers/http"
import { DiningTable, SuccessResponse } from "src/Types/utils.type"

/**
 * Dining Table API
 * Manages restaurant table operations
 */
export const diningTableAPI = {
  /**
   * Create a new dining table
   * @param body - Table configuration (number, capacity, active status)
   */
  createDiningTable: (body: { table_number: number; capacity: number; is_active: boolean }) => {
    return Http.post<SuccessResponse<DiningTable>>("/api/auth/dining-tables", body)
  },

  /**
   * Update existing dining table
   * @param idDiningTable - Table ID to update
   * @param body - Updated table configuration
   */
  updateDiningTable: (
    idDiningTable: string,
    body: { table_number: number; capacity: number; is_active: boolean }
  ) => {
    return Http.put<SuccessResponse<DiningTable>>(`/api/auth/dining-tables/${idDiningTable}`, body)
  }
}
