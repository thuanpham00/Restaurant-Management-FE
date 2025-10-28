import { Dish } from "./dish.type"

export type MenuDetailListItem = {
  menu: {
    id: string
    name: string
  }
  items: {
    id: string
    menu_id: string
    dish_id: string
    dish_name: string
    price_base: number
    price: number
    notes: string
    dish_image: string
  }[]
}

export type AddDishToMenu = {
  id: string
  name: string
  price: number
  image: string
}

export type Menus = {
  id: string
  name: string
  description: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  items_count: number
}

export interface SpecialMenu {
  id: string
  name: string
  description: string
  is_active: boolean
  dishes: Dish[]
}

export type MenuCore = Pick<Menus, "id" | "name" | "description" | "version" | "is_active">

export interface MenuItemInMenu {
  id: string
  menu_id?: string
  dish_id: string
  dish_name: string | null
  price_base: number
  price: number
  desc: string | null
  notes: string | null
  dish_image: string | null
  dish_active: boolean
}

export interface MenuWithItems extends MenuCore {
  items: MenuItemInMenu[]
}

export type MenusWithItemsParams = {
  is_active?: boolean
  limit_items?: number
  only_active_dishes?: boolean
}