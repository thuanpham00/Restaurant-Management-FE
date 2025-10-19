export type Dish = {
  id: string
  name: string
  price: number
  desc: string
  category_id: string
  cooking_time: number
  image: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category: {
    id: string
    name: string
    desc: string
    created_at: string
    updated_at: string
  }
}
