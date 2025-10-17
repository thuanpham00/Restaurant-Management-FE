/* eslint-disable @typescript-eslint/no-explicit-any */
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

  create: (data: {
    name: string
    desc: string
    price: string
    cooking_time: number
    category_id: string
    is_active: boolean
    image?: File
  }) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as any)
      }
    })
    return Http.post(`/api/dishes`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  },

  update: (
    id: string,
    data: {
      name?: string
      desc?: string
      price?: string
      cooking_time?: number
      category_id?: string
      is_active?: boolean
      image?: File
    }
  ) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as any)
      }
    })
    formData.append("_method", "PUT") // ⚡ thêm dòng này

    return Http.post(`/api/dishes/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  },

  delete: (id: string) => {
    return Http.delete(`/api/dishes/${id}`)
  }
}
