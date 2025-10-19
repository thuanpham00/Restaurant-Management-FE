import Http from "src/Helpers/http"
import { DiningTable } from "src/Types/diningTable.type"
import { SuccessResponse } from "src/Types/utils.type"

export const diningTableAPI = {
  createDiningTable: (body: { table_number: number; capacity: number; is_active: boolean }) => {
    return Http.post<SuccessResponse<DiningTable>>("/api/dining-tables", body)
  },

  updateDiningTable: (idDiningTable: string, body: { table_number: number; capacity: number; is_active: boolean }) => {
    return Http.put<SuccessResponse<DiningTable>>(`/api/dining-tables/${idDiningTable}`, body)
  },

  getListReservationTableSessionByIdTable: (idDiningTable: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Http.get<SuccessResponse<any>>(`/api/dining-tables/${idDiningTable}/reservations`)
  },

  getListReservationAndOfflineTableSessionByIdTable: (idDiningTable: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Http.get<SuccessResponse<any>>(`/api/dining-tables/${idDiningTable}/reservations-offline`)
  }
}
