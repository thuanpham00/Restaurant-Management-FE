import Http from "src/Helpers/http"
import { queryParamConfigCategoryDish } from "src/Types/queryParams.type"
import { CategoryDishes, PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

/**
 * Dish Category API
 * Manages dish categories and their operations
 */
export const dishCategoryAPI = {
  /**
   * Get paginated list of dish categories
   * @param params - Query parameters for filtering and pagination
   * @param signal - Abort signal for request cancellation
   */
  getList: (params: queryParamConfigCategoryDish, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<CategoryDishes>>>(`/api/auth/dish-categories`, {
      params,
      signal
    })
  },

  /**
   * Create a new dish category
   * @param data - Category name and optional description
   */
  create: (data: { name: string; desc?: string }) => {
    return Http.post(`/api/auth/dish-categories`, data)
  },

  /**
   * Update existing dish category
   * @param id - Category ID
   * @param data - Updated name and/or description
   */
  update: (id: string, data: { name?: string; desc?: string }) => {
    return Http.put(`/api/auth/dish-categories/${id}`, data)
  },

  /**
   * Delete a dish category
   * @param id - Category ID
   */
  delete: (id: string) => {
    return Http.delete(`/api/auth/dish-categories/${id}`)
  },

  /**
   * Get simplified list of category names (for dropdowns)
   * @param signal - Abort signal for request cancellation
   */
  getListNameCategory: (signal: AbortSignal) => {
    return Http.get<SuccessResponse<{ id: string; name: string }[]>>(
      `/api/auth/dish-categories/get-name-list-dish-category`,
      {
        signal
      }
    )
  }
}
