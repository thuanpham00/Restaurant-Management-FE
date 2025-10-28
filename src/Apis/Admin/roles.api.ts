import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Role, RoleWithUsers, queryParamConfigRole } from "src/Types/user.type"
import { Permission } from "src/Types/permissions.type"

export const rolesAPI = {
  getList: (params?: queryParamConfigRole, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Role>>>(`/api/roles`, { params, signal })
  },

  getDetail: (id: string, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<Role>>(`/api/roles/${id}`, { signal })
  },

  create: (data: { name: string; description?: string; is_active?: boolean; permissions?: string[] }) => {
    return Http.post<SuccessResponse<Role>>(`/api/roles`, data)
  },

  update: (id: string, data: { name?: string; description?: string; is_active?: boolean }) => {
    return Http.put<SuccessResponse<Role>>(`/api/roles/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<null>>(`/api/roles/${id}`)
  },

  getPermissions: (id: string, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<{ role: Role; permissions: Permission[] }>>(
      `/api/roles/${id}/permissions`,
      { signal }
    )
  },

  assignPermissions: (id: string, permission_ids: string[]) => {
    return Http.post<SuccessResponse<{ role: Role; permissions: Permission[] }>>(
      `/api/roles/${id}/permissions/assign`,
      { permission_ids }
    )
  },

  removePermissions: (id: string, permission_ids: string[]) => {
    return Http.delete<SuccessResponse<{ role: Role; permissions: Permission[] }>>(
      `/api/roles/${id}/permissions/remove`,
      { data: { permission_ids } }
    )
  },

  syncPermissions: (id: string, permission_ids: string[]) => {
    return Http.put<SuccessResponse<{ role: Role; permissions: Permission[] }>>(
      `/api/roles/${id}/permissions/sync`,
      { permission_ids }
    )
  },

  /**
   * Bulk sync permissions for many roles in a single request.
   * Payload shape: { role_permissions: [{ role_id: string, permission_ids: string[] }, ...] }
   */
  syncPermissionsBulk: (data: { role_permissions: { role_id: string; permission_ids: string[] }[] }) => {
    return Http.put<SuccessResponse<{ roles?: any }>>(`/api/roles/permissions/sync`, data)
  },

  getUsers: (id: string, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<RoleWithUsers>>(`/api/roles/${id}/users`, { signal })
  }
}
