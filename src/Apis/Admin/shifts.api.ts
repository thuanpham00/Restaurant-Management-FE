import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import {
  Shift,
  ShiftFormInput,
  queryParamConfigShift,
  EmployeeShift,
  EmployeeShiftFormInput,
  EmployeeShiftCheckIn,
  EmployeeShiftCheckOut,
  EmployeeShiftStatusUpdate,
  queryParamConfigEmployeeShift,
  BulkAssignRequest,
  BulkAssignResponse
} from "src/Types/shift.type"

// ========== SHIFTS API ==========
export const shiftsAPI = {
  getList: (params: queryParamConfigShift, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Shift>>>(
      `/api/shifts`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<Shift>>(`/api/shifts/${id}`)
  },

  create: (data: ShiftFormInput) => {
    return Http.post<SuccessResponse<Shift>>(`/api/shifts`, data)
  },

  update: (id: string, data: ShiftFormInput) => {
    return Http.put<SuccessResponse<Shift>>(`/api/shifts/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/shifts/${id}`)
  }
}

// ========== EMPLOYEE SHIFTS API ==========
export const employeeShiftsAPI = {
  getList: (params: queryParamConfigEmployeeShift, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<EmployeeShift>>>(
      `/api/employee-shifts`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<EmployeeShift>>(`/api/employee-shifts/${id}`)
  },

  assign: (data: EmployeeShiftFormInput) => {
    return Http.post<SuccessResponse<EmployeeShift>>(`/api/employee-shifts`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/employee-shifts/${id}`)
  },

  checkIn: (id: string, data: EmployeeShiftCheckIn) => {
    return Http.patch<SuccessResponse<EmployeeShift>>(`/api/employee-shifts/${id}/check-in`, data)
  },

  checkOut: (id: string, data: EmployeeShiftCheckOut) => {
    return Http.patch<SuccessResponse<EmployeeShift>>(`/api/employee-shifts/${id}/check-out`, data)
  },

  updateStatus: (id: string, data: EmployeeShiftStatusUpdate) => {
    return Http.patch<SuccessResponse<EmployeeShift>>(`/api/employee-shifts/${id}/status`, data)
  },

  // ========== BULK ASSIGN ==========
  bulkAssign: (data: BulkAssignRequest) => {
    return Http.post<SuccessResponse<BulkAssignResponse>>(`/api/employee-shifts/bulk-assign`, data)
  }
}
