import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Ingredient, IngredientFormInput, IngredientCreateInput, queryParamConfigIngredient } from "src/Types/ingredient.type"

export const ingredientsAPI = {
  getList: (params: queryParamConfigIngredient, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Ingredient>>>(
      `/api/ingredients`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<Ingredient>>(`/api/ingredients/${id}`)
  },

  create: (data: IngredientCreateInput) => {
    return Http.post<SuccessResponse<Ingredient>>(`/api/ingredients`, data)
  },

  update: (id: string, data: IngredientFormInput) => {
    return Http.put<SuccessResponse<Ingredient>>(`/api/ingredients/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/ingredients/${id}`)
  }
}
