import Http from "src/Helpers/http"
import { Permission, PermissionWithRoles, queryParamConfigPermission } from "src/Types/permissions.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const permissionsAPI = {
  getList: (params?: queryParamConfigPermission, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Permission>>>("/api/permissions", {
      params,
      signal
    })
  },

  getDetail: (id: string, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<Permission>>(`/api/permissions/${id}`, { signal })
  },

  getRoles: (id: string, signal?: AbortSignal) => {
    return Http.get<
      SuccessResponse<{
        permission: PermissionWithRoles
        roles: Array<{
          id: string
          name: string
          description: string
          is_active: boolean
        }>
      }>
    >(`/api/permissions/${id}/roles`, { signal })
  }
}
