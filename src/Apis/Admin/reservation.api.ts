/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import { queryParamConfigReservation } from "src/Types/queryParams.type"
import { Reservation } from "src/Types/reservation.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const reservationsAPI = {
  getList: (params: queryParamConfigReservation, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Reservation>>>(`/api/auth/reservations`, { params, signal })
  }
}
