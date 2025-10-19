import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Employee, EmployeeFormInput, EmployeeCreateInput, queryParamConfigEmployee } from "src/Types/employee.type"

const buildEmployeeFormData = (payload: Record<string, unknown>) => {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return

    if (value instanceof File) {
      formData.append(key, value)
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          if (item instanceof File) {
            formData.append(`${key}[]`, item)
          } else {
            formData.append(`${key}[]`, typeof item === "boolean" ? (item ? "1" : "0") : String(item))
          }
        }
      })
      return
    }

    formData.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value))
  })

  return formData
}

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
    const formData = buildEmployeeFormData({ ...data } as Record<string, unknown>)
    return Http.post<SuccessResponse<Employee>>(`/api/employees`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  },

  update: (id: string, data: EmployeeFormInput) => {
    const payload = { ...data }
    const formData = buildEmployeeFormData(payload as Record<string, unknown>)
    return Http.post<SuccessResponse<Employee>>(`/api/employees/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/employees/${id}`)
  },

  toggleActive: (id: string, is_active: boolean) => {
    return Http.patch<SuccessResponse<Employee>>(`/api/employees/${id}/activate`, { is_active })
  }
}
