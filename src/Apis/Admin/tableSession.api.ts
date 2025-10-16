/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import { DiningTable } from "src/Types/diningTable.type"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import {
  HistoryTableSession,
  HistoryTableSessionDetail,
  TableSession,
  TableSessionDetail,
  TableSessionOrder
} from "src/Types/tableSession.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const tableSessionAPI = {
  getListTableSession: (params: queryParamConfigTableSessions, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<TableSession>>>("/api/table-sessions", {
      params,
      signal
    })
  },

  updateStatusTableSession: (idTableSession: string) => {
    return Http.put<SuccessResponse<any>>(`/api/table-sessions/${idTableSession}`)
  },

  createTableSessionTypeReservation: (body: {
    customer_id: string
    employee_id: string
    reservation_id: string
    dining_table_id: string
    pre_order: string
  }) => {
    return Http.post<SuccessResponse<any>>(`/api/table-sessions/reservation`, body)
  },

  createTableSessionTypeOffline: (body: { employee_id: string; dining_table_id: string }) => {
    return Http.post<SuccessResponse<any>>(`/api/table-sessions/offline`, body)
  },

  getDetailTableSessionByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<TableSessionDetail>>(`/api/table-sessions/${idDiningTable}`)
  },

  getDetailTableSessionOrderByIdTable: (idTableSession: string) => {
    return Http.get<SuccessResponse<TableSessionOrder[]>>(`/api/table-sessions/${idTableSession}/orders`)
  },

  getListPendingTableSessionByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<HistoryTableSession[]>>(`/api/table-sessions/${idDiningTable}/session-pending`)
  },

  getHistoryTableSessionDetailByIdTableAndIdTableSession: (idDiningTable: string, idTableSession: string) => {
    return Http.get<SuccessResponse<HistoryTableSessionDetail>>(
      `/api/table-sessions/${idDiningTable}/session-history/${idTableSession}`
    )
  },

  getListTableArrangement: (reserved_at: string, number_of_people: number) => {
    return Http.get<SuccessResponse<DiningTable>>(`/api/table-sessions/available-tables`, {
      params: {
        reserved_at,
        number_of_people
      }
    })
  },

  mergeTableSession: (body: { source_session_ids: string[]; target_session_id: string; employee_id: string }) => {
    return Http.post<SuccessResponse<any>>(`/api/table-sessions/merge`, body)
  }
}
