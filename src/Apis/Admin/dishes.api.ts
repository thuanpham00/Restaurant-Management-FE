import Http from "src/Helpers/http"
import { Dish } from "src/Types/dish.type"
import { queryParamConfigDish } from "src/Types/queryParams.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const dishesAPI = {
  getList: (params: queryParamConfigDish, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Dish>>>(`/api/dishes`, {
      params,
      signal
    })
  },

  create: (data: { name: string; desc?: string }) => {
    return Http.post(`/api/dishes`, data)
  },

  update: (id: string, data: { name?: string; desc?: string }) => {
    return Http.put(`/api/dishes/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete(`/api/dishes/${id}`)
  }
}
