export type Role = {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Employee = {
  id: string
  full_name: string
  phone: null
  gender: null
  address: null
  bank_account: null
  contract_type: number
  base_salary: string
  hire_date: null
  is_active: boolean
  user_id: string
  created_at: string
  updated_at: string
  contract_label: string
}

export type User = {
  id: string
  name: string
  email: string
  email_verified_at: string | null
  status: number
  avatar: string | null
  role_id: string
  created_at: string
  updated_at: string
  role: Role
  employee_profile: Employee
}
