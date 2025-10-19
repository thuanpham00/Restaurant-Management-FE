import Http from "src/Helpers/http"
import { Dish } from "src/Types/dish.type"
import { SuccessResponse } from "src/Types/utils.type"
import { CategoryDishByMenu } from "src/Types/dishCategory.type"
import { MenuWithItems, MenusWithItemsParams } from "src/Types/menu.type"

export type MenuFilterParams = {
  q?: string
  category_id?: string
  is_active?: boolean
  sort_price?: "asc" | "desc"
}

export const clientAPI = {
  searchFilter: (params: MenuFilterParams) => {
    return Http.get<SuccessResponse<Dish[]>>("/api/menus/filter-dishes", { params })
  },
  getPopularDishes: () => {
    return Http.get<SuccessResponse<Dish[]>>("/api/dishes/popular")
  },
  getMenuCategories: () => {
    return Http.get<SuccessResponse<CategoryDishByMenu[]>>("/api/menus/active/categories")
  },
  getMenusWithItems: (params?: MenusWithItemsParams) =>
    Http.get<SuccessResponse<MenuWithItems[]>>("/api/menus/with-items", { params })
}
