import { Ingredient } from "./ingredient.type"
import { Employee } from "./employee.type"

export type StockLoss = {
  id: string
  ingredient_id: string
  quantity: string
  reason: string | null
  loss_date: string
  employee_id: string | null
  created_at: string
  updated_at: string
  ingredient: Ingredient
  employee?: Employee
}

export type StockLossCreateInput = {
  ingredient_id: string
  quantity: number | string
  reason?: string
  loss_date: string
  employee_id?: string
}

export type StockLossFormInput = {
  ingredient_id?: string
  quantity?: number | string
  reason?: string
  loss_date?: string
  employee_id?: string
}

export type queryParamConfigStockLoss = {
  page?: string
  per_page?: string
  date_from?: string
  date_to?: string
  ingredient_id?: string
}
