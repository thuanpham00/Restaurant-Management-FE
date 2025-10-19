import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Ingredient, IngredientFormInput, IngredientCreateInput, queryParamConfigIngredient } from "src/Types/ingredient.type"

const buildIngredientFormData = (payload: Record<string, unknown>) => {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return

    if (value instanceof File) {
      formData.append(key, value)
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === "") return
        if (item instanceof File) {
          formData.append(`${key}[]`, item)
        } else {
          formData.append(`${key}[]`, typeof item === "boolean" ? (item ? "1" : "0") : String(item))
        }
      })
      return
    }

    formData.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value))
  })

  return formData
}

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
    const formData = buildIngredientFormData({ ...data } as Record<string, unknown>)
    return Http.post<SuccessResponse<Ingredient>>(`/api/ingredients`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  },

  update: (id: string, data: IngredientFormInput) => {
    const formData = buildIngredientFormData({ ...data } as Record<string, unknown>)
    formData.append("_method", "PUT")
    return Http.post<SuccessResponse<Ingredient>>(`/api/ingredients/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/ingredients/${id}`)
  }
}
