export type IngredientCategory = {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
  ingredients_count: number
  ingredients?: Array<{
    id: string
    ingredient_category_id: string
    name: string
    unit: string
    current_stock: string
    min_stock: string
    max_stock: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>
}

export type IngredientCategoryFormInput = {
  name?: string
  is_active?: boolean
}

export type IngredientCategoryCreateInput = {
  name: string
  is_active?: boolean
}

export type queryParamConfigIngredientCategory = {
  page?: string
  per_page?: string
  search?: string
  is_active?: string
}
