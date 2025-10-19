import http from "src/Helpers/http"
import { Paginated } from "src/Types/promotion.type"
import { Reservation, ReservationFilters } from "src/Types/reservation.type"

export const reservationAPI = {
  listMy(params?: ReservationFilters & { page?: number; per_page?: number }) {
    return http.get<Paginated<Reservation>>("/api/reservations/my", { params })
  }
}
