export type IngredientDish = {
  id: string
  dish_id: string
  ingredient_id: string
  name: string
  unit: string
  quantity: string
  current_stock: string
  note: string
  created_at: string
  updated_at: string
}

export type AddIngredientDishBody = {
  ingredient_id: string
  quantity: string
  notes?: string
}
