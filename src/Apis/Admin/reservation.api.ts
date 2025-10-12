/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import { queryParamConfigReservation } from "src/Types/queryParams.type"
import { Reservation } from "src/Types/reservation.type"
import { SuccessResponse } from "src/Types/utils.type"

export const reservationsAPI = {
  getList: (params: queryParamConfigReservation, signal: AbortSignal) => {
    return Http.get<SuccessResponse<Reservation[]>>(`/api/reservations`, { params, signal })
  },

  update: (
    idReservation: string,
    { status, reserved_at, number_of_people }: { status?: number; reserved_at?: string; number_of_people?: number }
  ) => {
    return Http.put<SuccessResponse<Reservation>>(`/api/reservations/${idReservation}`, {
      status,
      reserved_at,
      number_of_people
    })
  },

  getListCheckAssignedTables: (signal: AbortSignal) => {
    return Http.get<SuccessResponse<any>>(`/api/reservations/check-assigned-tables`, { signal })
  }
}
