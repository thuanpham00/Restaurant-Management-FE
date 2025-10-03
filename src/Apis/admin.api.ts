import Http from "src/Helpers/http"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import {
  AuthResponse,
  DiningTable,
  HistoryTableSession,
  PaginatedResponse,
  SuccessResponse,
  TableSession,
  TableSessionDetail,
  TableSessionOrder
} from "src/Types/utils.type"

export const adminAPI = {
  auth: {
    loginAdmin: (body: { email: string; password: string }) => {
      return Http.post<SuccessResponse<AuthResponse>>("/api/auth/login", body)
    },

    logout: () => {
      return Http.post<SuccessResponse<AuthResponse>>("/api/auth/logout")
    }
  },

  diningTable: {
    createDiningTable: (body: { table_number: number; capacity: number; is_active: boolean }) => {
      return Http.post<SuccessResponse<DiningTable>>("/api/auth/dining-tables", body)
    },

    updateDiningTable: (
      idDiningTable: string,
      body: { table_number: number; capacity: number; is_active: boolean }
    ) => {
      return Http.put<SuccessResponse<DiningTable>>(`/api/auth/dining-tables/${idDiningTable}`, body)
    }
  },

  tableSession: {
    getListTableSession: (queryConfig: queryParamConfigTableSessions, signal: AbortSignal) => {
      return Http.get<SuccessResponse<PaginatedResponse<TableSession>>>("/api/auth/table-sessions", {
        params: queryConfig,
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
    }
  }
}
