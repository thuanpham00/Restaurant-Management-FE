import { DishClient } from "./dish.type"

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
    price_base: string
    price: string
    notes: string
    dish_image: string
  }[]
}

export type AddDishToMenu = {
  id: string
  name: string
  price: string
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
  dishes: DishClient[]
}
