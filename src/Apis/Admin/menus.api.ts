import Http from "src/Helpers/http"
import { queryParamConfigMenu } from "src/Types/queryParams.type"
import { Menus, PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

/**
 * Menus API
 * Manages menu operations and versioning
 */
export const menusAPI = {
  /**
   * Get paginated list of menus
   * @param params - Query parameters for filtering and pagination
   * @param signal - Abort signal for request cancellation
   */
  getList: (params: queryParamConfigMenu, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Menus>>>(`/api/auth/menus`, { params, signal })
  },

  /**
   * Create a new menu
   * @param data - Menu configuration (name, description, version, active status)
   */
  create: (data: { name: string; description?: string; version?: number; is_active?: boolean }) => {
    return Http.post(`/api/auth/menus`, data)
  },

  /**
   * Update existing menu
   * @param id - Menu ID
   * @param data - Updated menu configuration
   */
  update: (id: string, data: { name?: string; description?: string; version?: number; is_active?: boolean }) => {
    return Http.put(`/api/auth/menus/${id}`, data)
  },

  /**
   * Delete a menu
   * @param id - Menu ID
   */
  delete: (id: string) => {
    return Http.delete(`/api/auth/menus/${id}`)
  }
}
