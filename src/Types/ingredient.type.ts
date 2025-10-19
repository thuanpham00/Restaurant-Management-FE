import { IngredientCategory } from "./ingredientCategory.type"

export type Ingredient = {
  id: string
  name: string
  unit: string
  current_stock: string
  min_stock: string
  max_stock: string
  is_active: boolean
  ingredient_category_id: string
  created_at: string
  updated_at: string
  category: IngredientCategory
  image?: string | null
  image_url?: string | null
}

export type IngredientFormInput = {
  name?: string
  unit?: string
  current_stock?: string | number
  min_stock?: string | number
  max_stock?: string | number
  is_active?: boolean
  ingredient_category_id?: string
  image?: File | null
}

export type IngredientCreateInput = {
  name: string
  unit: string
  current_stock?: string | number
  min_stock: string | number
  max_stock?: string | number
  is_active?: boolean
  ingredient_category_id: string
  image?: File | null
}

export type queryParamConfigIngredient = {
  page?: string
  per_page?: string
  name?: string
  unit?: string
  is_active?: string
  low_stock?: string
  category_ids?: string | string[]
}
