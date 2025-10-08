import Http from "src/Helpers/http";
import {
  AuthResponse,
  SuccessResponse,
  RegisterResponse,
  GoogleAuthResponse,
  Statistics,
  Dishes,
  CategoryDishes,
  Promotion,
  Chef,
  DiningTable,
  MessageResponse,
  Dish,
  Category,
  SpecialMenu,
} from "src/Types/utils.type";

export const clientAPI = {
  auth: {
    loginClient: (body: { email: string; password: string }) => {
      return Http.post<SuccessResponse<AuthResponse>>("/api/auth/login", body);
    },
    logout: () => {
      return Http.post<SuccessResponse<AuthResponse>>("/api/auth/logout");
    },
    register: (body: { name: string; email: string; password: string; password_confirmation: string }) => {
      return Http.post<SuccessResponse<RegisterResponse>>("/api/auth/register", body);
    },
    getGoogleAuthUrl: () => {
      return Http.get<SuccessResponse<GoogleAuthResponse>>("/api/auth/google");
    },
    googleCallback: (code: string) => {
      return Http.get<SuccessResponse<AuthResponse>>(`/api/auth/google/callback?code=${code}`);
    },
  },
  home: {
    getStatistics: () => {
      return Http.get<SuccessResponse<Statistics>>("/api/home/statistics");
    },
    getPopularDishes: () => {
      return Http.get<SuccessResponse<Dishes[]>>("/api/home/popular-dishes");
    },
    getMenuCategories: () => {
      return Http.get<SuccessResponse<CategoryDishes[]>>("/api/home/menu-categories");
    },
    getPromotions: () => {
      return Http.get<SuccessResponse<Promotion[]>>("/api/home/promotions");
    },
    getChefs: () => {
      return Http.get<SuccessResponse<Chef[]>>("/api/home/chefs");
    },
    getAvailableTables: (body: { reserved_at: string; number_of_people: number }) => {
      return Http.post<SuccessResponse<DiningTable[]>>("/api/home/available-tables", body);
    },
  },
  menu: {
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
  }
};