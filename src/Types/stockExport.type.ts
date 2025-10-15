import { Ingredient } from "./ingredient.type"

export type StockExportDetail = {
  id: string
  quantity: string
  stock_export_id: string
  ingredient_id: string
  created_at: string
  updated_at: string
  ingredient: Ingredient
}

export type StockExport = {
  id: string
  export_date: string
  purpose: string | null
  status: number
  status_label: string
  created_at: string
  updated_at: string
  details: StockExportDetail[]
}

// Form input for creating details
export type StockExportDetailInput = {
  ingredient_id: string
  quantity: number | string
}

// Form input for updating details (includes optional id and delete flag)
export type StockExportDetailUpdateInput = {
  id?: string
  ingredient_id?: string
  quantity?: number | string
  delete?: boolean
}

export type StockExportCreateInput = {
  export_date: string
  purpose?: string
  status?: number
  details: StockExportDetailInput[]
}

export type StockExportFormInput = {
  export_date?: string
  purpose?: string
  status?: number
  details?: StockExportDetailUpdateInput[]
}

export type queryParamConfigStockExport = {
  page?: string
  per_page?: string
  date_from?: string
  date_to?: string
  status?: string
}
