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

/**
 * Table Session API
 * Manages table sessions and their history
 */
export const tableSessionAPI = {
  /**
   * Get paginated list of table sessions
   * @param params - Query parameters for filtering and pagination
   * @param signal - Abort signal for request cancellation
   */
  getListTableSession: (params: queryParamConfigTableSessions, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<TableSession>>>("/api/auth/table-sessions", {
      params,
      signal
    })
  },

  /**
   * Get detailed information of a table session by table ID
   * @param idDiningTable - Table ID
   */
  getDetailTableSessionByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<TableSessionDetail>>(`/api/auth/table-sessions/${idDiningTable}`, {})
  },

  /**
   * Get all orders for a specific table session
   * @param idDiningTable - Table ID
   */
  getDetailTableSessionOrderByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<TableSessionOrder[]>>(`/api/auth/table-sessions/${idDiningTable}/orders`, {})
  },

  /**
   * Get history of all sessions for a specific table
   * @param idDiningTable - Table ID
   */
  getListHistoryTableSessionByIdTable: (idDiningTable: string) => {
    return Http.get<SuccessResponse<HistoryTableSession[]>>(
      `/api/auth/table-sessions/${idDiningTable}/session-history`,
      {}
    )
  },

  /**
   * Get detailed history of a specific table session
   * @param idDiningTable - Table ID
   * @param idTableSession - Session ID
   */
  getHistoryTableSessionDetailByIdTableAndIdTableSession: (idDiningTable: string, idTableSession: string) => {
    return Http.get<SuccessResponse<HistoryTableSessionDetail>>(
      `/api/auth/table-sessions/${idDiningTable}/session-history/${idTableSession}`,
      {}
    )
  }
}
