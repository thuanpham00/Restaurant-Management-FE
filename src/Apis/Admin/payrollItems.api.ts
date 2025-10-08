import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import {
  PayrollItem,
  PayrollItemFormInput,
  queryParamConfigPayrollItem
} from "src/Types/payroll.type"

// ========== PAYROLL ITEMS API ==========
export const payrollItemsAPI = {
  getList: (params: queryParamConfigPayrollItem, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<PayrollItem>>>(
      `/api/payroll-items`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<PayrollItem>>(`/api/payroll-items/${id}`)
  },

  create: (data: PayrollItemFormInput) => {
    return Http.post<SuccessResponse<PayrollItem>>(`/api/payroll-items`, data)
  },

  update: (id: string, data: Partial<PayrollItemFormInput>) => {
    return Http.put<SuccessResponse<PayrollItem>>(`/api/payroll-items/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<null>>(`/api/payroll-items/${id}`)
  }
}
