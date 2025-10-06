export type Employee = {
  id: string
  full_name: string
  phone: string | null
  gender: "male" | "female" | "other" | null
  address: string | null
  bank_account: string | null
  contract_type: number
  base_salary: string
  hire_date: string | null
  is_active: boolean
  user_id: string
  created_at: string
  updated_at: string
  contract_label: string
  user: {
    id: string
    email: string
    email_verified_at: string | null
    status: number
    avatar: string | null
    role_id: string
    created_at: string
    updated_at: string
    status_label: string
  }
}

export type EmployeeFormInput = {
  full_name: string
  phone?: string
  gender?: "male" | "female" | "other"
  address?: string
  bank_account?: string
  contract_type?: number
  base_salary?: string | number
  hire_date?: string
  is_active?: boolean
  // User account fields (for update)
  email?: string
  password?: string
  password_confirmation?: string
  role_id?: string
}

export type EmployeeCreateInput = {
  full_name: string
  phone?: string
  gender?: "male" | "female" | "other"
  address?: string
  bank_account?: string
  contract_type: number
  base_salary: string | number
  hire_date?: string
  is_active?: boolean
  // User account fields (required for create)
  email: string
  password: string
  password_confirmation: string
  role_id: string
}

export type queryParamConfigEmployee = {
  page?: string
  per_page?: string
  full_name?: string
  is_active?: string
  contract_type?: string
  gender?: string
  hire_date_from?: string
  hire_date_to?: string
}
