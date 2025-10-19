import Http from "src/Helpers/http"
import { SuccessResponse } from "src/Types/utils.type"
import { Reservation, ReservationCreate } from "src/Types/reservation.type"

export const reservationAPI = {
  create: (payload: ReservationCreate) => {
    return Http.post<SuccessResponse<Reservation>>("/api/auth/reservations", payload)
  }
}