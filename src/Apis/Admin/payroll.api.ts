import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import {
  Payroll,
  PayrollFormInput,
  GeneratePayrollInput,
  UpdateStatusInput,
  MarkAsPaidInput,
  queryParamConfigPayroll
} from "src/Types/payroll.type"

// ========== PAYROLL API ==========
export const payrollAPI = {
  getList: (params: queryParamConfigPayroll, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Payroll>>>(
      `/api/payrolls`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<Payroll>>(`/api/payrolls/${id}`)
  },

  update: (id: string, data: PayrollFormInput) => {
    return Http.put<SuccessResponse<Payroll>>(`/api/payrolls/${id}`, data)
  },

  generate: (data: GeneratePayrollInput) => {
    return Http.post<SuccessResponse<any>>(`/api/payrolls/generate`, data)
  },

  updateStatus: (id: string, data: UpdateStatusInput) => {
    return Http.patch<SuccessResponse<Payroll>>(`/api/payrolls/${id}/status`, data)
  },

  markAsPaid: (id: string, data: MarkAsPaidInput) => {
    return Http.patch<SuccessResponse<Payroll>>(`/api/payrolls/${id}/pay`, data)
  }
}
