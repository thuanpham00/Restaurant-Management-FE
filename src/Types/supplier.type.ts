import { StockImport } from "./stockImport.type"

export type Supplier = {
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
  stock_imports?: StockImport[]  // Optional nested relation from API
}

export type SupplierFormInput = {
  name?: string
  phone?: string
  contact_person_name?: string
  contact_person_phone?: string
  email?: string
  address?: string
  is_active?: boolean
}

export type SupplierCreateInput = {
  name: string
  phone?: string
  contact_person_name?: string
  contact_person_phone?: string
  email?: string
  address?: string
  is_active?: boolean
}

export type queryParamConfigSupplier = {
  page?: string
  per_page?: string
  name?: string
  email?: string
  phone?: string
  is_active?: string
  ingredient_ids?: string[]
}
