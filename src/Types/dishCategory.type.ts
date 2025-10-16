import { Dish } from './dish.type'

export type CategoryDishes = {
  id: string
  name: string
  desc: string
  dishes_count: number
  updated_at: string
  created_at: string
}

export type CategoryDishByMenu = {
  id: string
  name: string
  desc: string
  dishes_count: number
  updated_at: string
  created_at: string
  dishes: Dish[]
}