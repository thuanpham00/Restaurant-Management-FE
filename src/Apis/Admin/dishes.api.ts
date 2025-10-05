import Http from "src/Helpers/http"
import { queryParamConfigDish } from "src/Types/queryParams.type"
import { Dishes, PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

/**
 * Dishes API
 * Manages dish operations and CRUD functionality
 */
export const dishesAPI = {
  /**
   * Get paginated list of dishes
   * @param params - Query parameters for filtering and pagination
   * @param signal - Abort signal for request cancellation
   */
  getList: (params: queryParamConfigDish, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Dishes>>>(`/api/auth/dishes`, {
      params,
      signal
    })
  },

  /**
   * Create a new dish
   * @param data - Dish name and optional description
   */
  create: (data: { name: string; desc?: string }) => {
    return Http.post(`/api/auth/dishes`, data)
  },

  /**
   * Update existing dish
   * @param id - Dish ID
   * @param data - Updated name and/or description
   */
  update: (id: string, data: { name?: string; desc?: string }) => {
    return Http.put(`/api/auth/dishes/${id}`, data)
  },

  /**
   * Delete a dish
   * @param id - Dish ID
   */
  delete: (id: string) => {
    return Http.delete(`/api/auth/dishes/${id}`)
  }
}
