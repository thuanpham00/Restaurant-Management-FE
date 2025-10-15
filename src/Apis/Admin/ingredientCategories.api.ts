import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { IngredientCategory, IngredientCategoryFormInput, IngredientCategoryCreateInput, queryParamConfigIngredientCategory } from "src/Types/ingredientCategory.type"

export const ingredientCategoriesAPI = {
  getList: (params: queryParamConfigIngredientCategory, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<IngredientCategory>>>(
      `/api/ingredient-categories`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<IngredientCategory>>(`/api/ingredient-categories/${id}`)
  },

  create: (data: IngredientCategoryCreateInput) => {
    return Http.post<SuccessResponse<IngredientCategory>>(`/api/ingredient-categories`, data)
  },

  update: (id: string, data: IngredientCategoryFormInput) => {
    return Http.put<SuccessResponse<IngredientCategory>>(`/api/ingredient-categories/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/ingredient-categories/${id}`)
  }
}
