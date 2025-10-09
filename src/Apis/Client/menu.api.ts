import Http from "src/Helpers/http";
import {
  SuccessResponse,
  Dish,
  Category,
  SpecialMenu,
} from "src/Types/utils.type";

export const clientAPI = {
    getCategories: () => {
      return Http.get<SuccessResponse<Category[]>>("/api/menu/categories");
    },
    getSpecialMenu: () => {
      return Http.get<SuccessResponse<SpecialMenu | null>>("/api/menu/special");
    },
    searchFilter: (body: {
      search?: string;
      category_id?: string;
      price_sort?: "asc" | "desc";
      status?: "active" | "inactive";
    }) => {
      return Http.post<SuccessResponse<Dish[]>>("/api/menu/search-filter", body);
    },
    getPopularDishes: () => {
      return Http.get<SuccessResponse<Dish[]>>("/api/menu/popular-dishes");
    },
};