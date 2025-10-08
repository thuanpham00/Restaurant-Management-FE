import Http from "src/Helpers/http"
import { DiningTable, SuccessResponse } from "src/Types/utils.type"

export const diningTableAPI = {
  createDiningTable: (body: { table_number: number; capacity: number; is_active: boolean }) => {
    return Http.post<SuccessResponse<DiningTable>>("/api/auth/dining-tables", body)
  },

  updateDiningTable: (idDiningTable: string, body: { table_number: number; capacity: number; is_active: boolean }) => {
    return Http.put<SuccessResponse<DiningTable>>(`/api/auth/dining-tables/${idDiningTable}`, body)
  }
}
