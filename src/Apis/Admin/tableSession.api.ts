import Http from "src/Helpers/http"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import {
  HistoryTableSession,
  HistoryTableSessionDetail,
  PaginatedResponse,
  SuccessResponse,
  TableSession,
  TableSessionDetail,
  TableSessionOrder
} from "src/Types/utils.type"

export const tableSessionAPI = {
  getListTableSession: (params: queryParamConfigTableSessions, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<TableSession>>>("/api/auth/table-sessions", {
      params,
      signal
    })
  },

  getDetailTableSessionByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<TableSessionDetail>>(`/api/auth/table-sessions/${idDiningTable}`, {})
  },

  getDetailTableSessionOrderByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<TableSessionOrder[]>>(`/api/auth/table-sessions/${idDiningTable}/orders`, {})
  },

  getListHistoryTableSessionByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<HistoryTableSession[]>>(
      `/api/auth/table-sessions/${idDiningTable}/session-history`,
      {}
    )
  },

  getListPendingTableSessionByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<HistoryTableSession[]>>(
      `/api/auth/table-sessions/${idDiningTable}/session-pending`,
      {}
    )
  },

  getHistoryTableSessionDetailByIdTableAndIdTableSession: (idDiningTable: string, idTableSession: string) => {
    return Http.get<SuccessResponse<HistoryTableSessionDetail>>(
      `/api/auth/table-sessions/${idDiningTable}/session-history/${idTableSession}`,
      {}
    )
  }
}
