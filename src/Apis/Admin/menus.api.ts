import Http from "src/Helpers/http"
import { queryParamConfigMenu } from "src/Types/queryParams.type"
import { Menus, PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const menusAPI = {
  getList: (params: queryParamConfigMenu, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Menus>>>(`/api/auth/menus`, { params, signal })
  },

  create: (data: { name: string; description?: string; version?: number; is_active?: boolean }) => {
    return Http.post(`/api/auth/menus`, data)
  },

  update: (id: string, data: { name?: string; description?: string; version?: number; is_active?: boolean }) => {
    return Http.put(`/api/auth/menus/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete(`/api/auth/menus/${id}`)
  }
}
