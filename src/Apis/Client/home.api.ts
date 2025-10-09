import Http from "src/Helpers/http"
import { DiningTable } from "src/Types/diningTable.type"
import { Dish } from "src/Types/dish.type"
import { CategoryDishes } from "src/Types/dishCategory.type"
import { Statistics } from "src/Types/statistics.type"
import { Chef, Promotion, SuccessResponse } from "src/Types/utils.type"

export const clientAPI = {
  getStatistics: () => {
    return Http.get<SuccessResponse<Statistics>>("/api/home/statistics")
  },
  getPopularDishes: () => {
    return Http.get<SuccessResponse<Dish[]>>("/api/home/popular-dishes")
  },
  getMenuCategories: () => {
    return Http.get<SuccessResponse<CategoryDishes[]>>("/api/home/menu-categories")
  },
  getPromotions: () => {
    return Http.get<SuccessResponse<Promotion[]>>("/api/home/promotions")
  },
  getChefs: () => {
    return Http.get<SuccessResponse<Chef[]>>("/api/home/chefs")
  },
  getAvailableTables: (body: { reserved_at: string; number_of_people: number }) => {
    return Http.post<SuccessResponse<DiningTable[]>>("/api/home/available-tables", body)
  }
}
