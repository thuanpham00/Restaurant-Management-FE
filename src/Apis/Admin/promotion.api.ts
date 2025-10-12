/* eslint-disable @typescript-eslint/no-explicit-any */
import { PromotionSelect } from "src/Admin/Pages/ManageTable/Components/PromotionForm/PromotionForm"
import Http from "src/Helpers/http"
import { Promotion } from "src/Types/promotion.type"
import { queryParamConfigPromotion } from "src/Types/queryParams.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const promotionAPI = {
  getList: (params: queryParamConfigPromotion, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Promotion>>>(`/api/promotions`, {
      params,
      signal
    })
  },

  getPromotionAll: () => {
    return Http.get<SuccessResponse<PromotionSelect>>(`/api/promotions/all`)
  },

  create: (data: {
    code: string
    description: string
    discount_percent: string
    usage_limit: number
    start_date: string
    end_date: string
    is_active: boolean
  }) => {
    return Http.post(`/api/promotions`, data)
  },

  update: (
    id: string,
    data: {
      code: string
      description: string
      discount_percent: string
      usage_limit: number
      start_date: string
      end_date: string
      is_active: boolean
    }
  ) => {
    return Http.put(`/api/promotions/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete(`/api/promotions/${id}`)
  }
}
