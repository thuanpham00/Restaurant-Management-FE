import Http from "src/Helpers/http"
import { SuccessResponse } from "src/Types/utils.type"
import { User } from "src/Types/user.type"
import { Invoice } from "src/Types/invoice.type"

export type UpdateUserPayload = {
  email?: string
  full_name?: string
  phone?: string
  gender?: "Nam" | "Nữ" | "Khác" | null
  address?: string
}

export const userAPI = {
  getById: (id: string) => {
    return Http.get<SuccessResponse<User>>(`/api/users/${id}`)
  },
  update: (payload: UpdateUserPayload) => {
    return Http.put<SuccessResponse<User>>("/api/users/show/my-profile", payload)
  },
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append("avatar", file)
    return Http.post<SuccessResponse<{ avatar: string }>>("/api/users/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  },
  changePassword: (payload: { current_password: string; new_password: string; new_password_confirmation: string }) => {
    return Http.post<SuccessResponse<null>>("/api/users/changePassword", payload)
  },
  getMyInvoices: () => Http.get<SuccessResponse<Invoice[]>>("/api/invoices/my-invoices"),
  getMyInvoicesWithItems: () => Http.get<SuccessResponse<Invoice[]>>("/api/invoices/my-invoices-with-items")
}
