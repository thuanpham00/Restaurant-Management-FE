import Http from "src/Helpers/http"
import { Dish } from "src/Types/dish.type"
import { CategoryDishByMenu } from "src/Types/dishCategory.type"
import { Statistics } from "src/Types/statistics.type"
import { Chef, SuccessResponse } from "src/Types/utils.type"

export const clientAPI = {
  getStatistics: () => {
    return Http.get<SuccessResponse<Statistics>>("/api/home/statistics")
  },
  getPopularDishes: () => {
    return Http.get<SuccessResponse<Dish[]>>("/api/auth/dishes/popular")
  },
  getMenuCategories: () => {
    return Http.get<SuccessResponse<CategoryDishByMenu[]>>("/api/auth/menus/active/categories")
  },
  getChefs: () => {
    return Http.get<SuccessResponse<Chef[]>>("/api/employees/find/chefs")
  },
}
