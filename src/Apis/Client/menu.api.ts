import Http from "src/Helpers/http"
import { DishClient } from "src/Types/dish.type"
import { Category } from "src/Types/dishCategory.type"
import { SpecialMenu } from "src/Types/menu.type"
import { SuccessResponse } from "src/Types/utils.type"

export const clientAPI = {
  getCategories: () => {
    return Http.get<SuccessResponse<Category[]>>("/api/menu/categories")
  },
  getSpecialMenu: () => {
    return Http.get<SuccessResponse<SpecialMenu | null>>("/api/menu/special")
  },
  searchFilter: (body: {
    search?: string
    category_id?: string
    price_sort?: "asc" | "desc"
    status?: "active" | "inactive"
  }) => {
    return Http.post<SuccessResponse<DishClient[]>>("/api/menu/search-filter", body)
  },
  getPopularDishes: () => {
    return Http.get<SuccessResponse<DishClient[]>>("/api/menu/popular-dishes")
  }
}
