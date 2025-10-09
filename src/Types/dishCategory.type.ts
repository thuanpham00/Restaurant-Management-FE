import { DishClient } from "./dish.type"

export type CategoryDishes = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
  id: string
  name: string
  desc: string
  dishes_count: number
  updated_at: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  description: string
  dishes: DishClient[]
}
