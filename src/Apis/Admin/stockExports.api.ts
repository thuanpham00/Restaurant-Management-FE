import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { StockExport, StockExportFormInput, StockExportCreateInput, queryParamConfigStockExport } from "src/Types/stockExport.type"

export const stockExportsAPI = {
  getList: (params: queryParamConfigStockExport, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<StockExport>>>(
      `/api/stocks/exports`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<StockExport>>(`/api/stocks/exports/${id}`)
  },

  create: (data: StockExportCreateInput) => {
    return Http.post<SuccessResponse<StockExport>>(`/api/stocks/exports`, data)
  },

  update: (id: string, data: StockExportFormInput) => {
    return Http.put<SuccessResponse<StockExport>>(`/api/stocks/exports/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/stocks/exports/${id}`)
  }
}
