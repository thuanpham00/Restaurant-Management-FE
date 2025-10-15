import Http from "src/Helpers/http"
import { CategoryDishes } from "src/Types/dishCategory.type"
import { queryParamConfigCategoryDish } from "src/Types/queryParams.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const dishCategoryAPI = {
  getList: (params: queryParamConfigCategoryDish, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<CategoryDishes>>>(`/api/dish-categories`, {
      params,
      signal
    })
  },

  create: (data: { name: string; desc?: string }) => {
    return Http.post(`/api/dish-categories`, data)
  },

  update: (id: string, data: { name?: string; desc?: string }) => {
    return Http.put(`/api/dish-categories/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete(`/api/dish-categories/${id}`)
  },

  getListNameCategory: (signal: AbortSignal) => {
    return Http.get<SuccessResponse<{ id: string; name: string }[]>>(
      `/api/dish-categories/get-name-list-dish-category`,
      {
        signal
      }
    )
  }
}
