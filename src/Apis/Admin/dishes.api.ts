import Http from "src/Helpers/http"
import { queryParamConfigDish } from "src/Types/queryParams.type"
import { Dishes, PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const dishesAPI = {
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
