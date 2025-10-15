import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { StockImport, StockImportFormInput, StockImportCreateInput, queryParamConfigStockImport } from "src/Types/stockImport.type"

export const stockImportsAPI = {
  getList: (params: queryParamConfigStockImport, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<StockImport>>>(
      `/api/stocks/imports`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<StockImport>>(`/api/stocks/imports/${id}`)
  },

  create: (data: StockImportCreateInput) => {
    return Http.post<SuccessResponse<StockImport>>(`/api/stocks/imports`, data)
  },

  update: (id: string, data: StockImportFormInput) => {
    return Http.put<SuccessResponse<StockImport>>(`/api/stocks/imports/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/stocks/imports/${id}`)
  }
}
