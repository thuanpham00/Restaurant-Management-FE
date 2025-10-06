import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Employee, EmployeeFormInput, EmployeeCreateInput, queryParamConfigEmployee } from "src/Types/employee.type"

export const employeesAPI = {
  getList: (params: queryParamConfigEmployee, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Employee>>>(
      `/api/employees`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<Employee>>(`/api/employees/${id}`)
  },

  create: (data: EmployeeCreateInput) => {
    return Http.post<SuccessResponse<Employee>>(`/api/employees`, data)
  },

  update: (id: string, data: EmployeeFormInput) => {
    return Http.put<SuccessResponse<Employee>>(`/api/employees/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/employees/${id}`)
  },

  toggleActive: (id: string, is_active: boolean) => {
    return Http.patch<SuccessResponse<Employee>>(`/api/employees/${id}/activate`, { is_active })
  }
}
