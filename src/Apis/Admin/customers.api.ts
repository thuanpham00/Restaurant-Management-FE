import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Customer, CustomerFormInput } from "src/Types/customers.type"
import { queryParamConfigCustomer } from "src/Types/customers.type"

export const customersAPI = {
  getList: (params: queryParamConfigCustomer, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Customer>>>(`/api/customers`, { params, signal })
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<Customer>>(`/api/customers/${id}`)
  },

  update: (id: string, data: CustomerFormInput) => {
    return Http.post<SuccessResponse<Customer>>(`/api/customers/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/customers/${id}`)
  }
}
