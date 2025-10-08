/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import { queryParamConfigMenu } from "src/Types/queryParams.type"
import { AddDishToMenu, MenuDetailListItem, Menus, PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const menusAPI = {
  getList: (params: queryParamConfigMenu, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Menus>>>(`/api/auth/menus`, { params, signal })
  },

  create: (data: { name: string; description?: string; version?: number; is_active?: boolean }) => {
    return Http.post(`/api/auth/menus`, data)
  },

  update: (id: string, data: { name?: string; description?: string; version?: number; is_active?: boolean }) => {
    return Http.put(`/api/auth/menus/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete(`/api/auth/menus/${id}`)
  },

  getMenuItemByIdMenu: (id: string) => {
    return Http.get<SuccessResponse<MenuDetailListItem>>(`/api/auth/menus/${id}/items`)
  },

  getMenuItemFromMenuActive: () => {
    return Http.get<SuccessResponse<MenuDetailListItem>>(`/api/auth/menus/active/items`)
  },

  createMenuItemByIdMenu: (id: string, body: { dish_id: string; price: number; notes: string }) => {
    return Http.post<SuccessResponse<any>>(`/api/auth/menus/${id}/items`, body)
  },

  updateMenuItemByIdMenu: (
    idMenu: string,
    idMenuItem: string,
    body: { dish_id: string; price: number; notes: string }
  ) => {
    return Http.put<SuccessResponse<any>>(`/api/auth/menus/${idMenu}/items/${idMenuItem}`, body)
  },

  deleteMenuItemByIdMenu: (idMenu: string, idMenuItem: string) => {
    return Http.delete<SuccessResponse<any>>(`/api/auth/menus/${idMenu}/items/${idMenuItem}`)
  },

  getDishNotOnTheMenu: (id: string) => {
    return Http.get<SuccessResponse<AddDishToMenu[]>>(`/api/auth/menus/${id}/available-dishes`)
  }
}
