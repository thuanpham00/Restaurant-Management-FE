import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Role } from "src/Types/user.type"

export const rolesAPI = {
  getList: (params?: { per_page?: string }, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Role>>>(
      `/api/roles`,
      { params, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<Role>>(`/api/roles/${id}`)
  }
}
