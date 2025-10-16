import { Ingredient } from "./ingredient.type"

export type StockImportSupplier = {
  id: string
  name: string
  phone: string
  contact_person_name: string
  contact_person_phone: string
  email: string
  address: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StockImportDetail = {
  id: string
  ordered_quantity: string
  received_quantity: string
  unit_price: string
  total_price: string
  stock_import_id: string
  ingredient_id: string
  created_at: string
  updated_at: string
  ingredient: Ingredient
}

export type StockImport = {
  id: string
  import_date: string
  total_amount: string
  supplier_id: string
  created_at: string
  updated_at: string
  supplier?: StockImportSupplier 
  details: StockImportDetail[]
}

// Form input for creating details
export type StockImportDetailInput = {
  ingredient_id: string
  ordered_quantity: number | string
  received_quantity: number | string
  unit_price: number | string
}

export type StockImportDetailUpdateInput = {
  id?: string
  ingredient_id?: string
  ordered_quantity?: number | string
  received_quantity?: number | string
  unit_price?: number | string
  delete?: boolean
}

export type StockImportCreateInput = {
  import_date: string
  supplier_id?: string
  details: StockImportDetailInput[]
}

export type StockImportFormInput = {
  import_date?: string
  supplier_id?: string
  details?: StockImportDetailUpdateInput[]
}

export type queryParamConfigStockImport = {
  page?: string
  per_page?: string
  date_from?: string
  date_to?: string
  supplier_id?: string
}
