import Http from "src/Helpers/http"
import {
  queryParamConfigCategoryDish,
  queryParamConfigDish,
  queryParamConfigTableSessions
} from "src/Types/queryParams.type"
import {
  AuthResponse,
  CategoryDishes,
  DiningTable,
  Dishes,
  HistoryTableSession,
  HistoryTableSessionDetail,
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

    getHistoryTableSessionDetailByIdTableAndIdTableSession: (idDiningTable: string, idTableSession: string) => {
      return Http.get<SuccessResponse<HistoryTableSessionDetail>>(
        `/api/auth/table-sessions/${idDiningTable}/session-history/${idTableSession}`,
        {}
      )
    }
  },

  orderItems: {
    updateStatusListOrderItem: (items: Record<string, number>) => {
      return Http.put<SuccessResponse<HistoryTableSessionDetail>>(`/api/auth/order-items/status/`, {
        items
      })
    }
  },

  dishes_category: {
    getList: (params: queryParamConfigCategoryDish, signal: AbortSignal) => {
      return Http.get<SuccessResponse<PaginatedResponse<CategoryDishes>>>(`/api/auth/dish-categories`, {
        params,
        signal
      })
    },

    create: (data: { name: string; desc?: string }) => {
      return Http.post(`/api/auth/dish-categories`, data)
    },

    update: (id: string, data: { name?: string; desc?: string }) => {
      return Http.put(`/api/auth/dish-categories/${id}`, data)
    },

    delete: (id: string) => {
      return Http.delete(`/api/auth/dish-categories/${id}`)
    }
  },

  dishes: {
    getList: (params: queryParamConfigDish, signal: AbortSignal) => {
      return Http.get<SuccessResponse<PaginatedResponse<Dishes>>>(`/api/auth/dishes`, {
        params,
        signal
      })
    },

    create: (data: { name: string; desc?: string }) => {
      return Http.post(`/api/auth/dishes`, data)
    },

    update: (id: string, data: { name?: string; desc?: string }) => {
      return Http.put(`/api/auth/dishes/${id}`, data)
    },

    delete: (id: string) => {
      return Http.delete(`/api/auth/dishes/${id}`)
    }
  }
}
