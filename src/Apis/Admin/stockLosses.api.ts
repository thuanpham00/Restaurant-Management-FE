import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { StockLoss, StockLossFormInput, StockLossCreateInput, queryParamConfigStockLoss } from "src/Types/stockLoss.type"

export const stockLossesAPI = {
  getList: (params: queryParamConfigStockLoss, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<StockLoss>>>(
      `/api/stocks/losses`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<StockLoss>>(`/api/stocks/losses/${id}`)
  },

  create: (data: StockLossCreateInput) => {
    return Http.post<SuccessResponse<StockLoss>>(`/api/stocks/losses`, data)
  },

  update: (id: string, data: StockLossFormInput) => {
    return Http.put<SuccessResponse<StockLoss>>(`/api/stocks/losses/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/stocks/losses/${id}`)
  }
}
