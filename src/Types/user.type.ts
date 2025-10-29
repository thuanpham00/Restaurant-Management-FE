import { Permission } from "./permissions.type"

export type Role = {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
  permissions?: Permission[]
}

export type RoleWithUsers = Role & {
  users?: User[]
}

export type queryParamConfigRole = {
  page?: string
  per_page?: string
  name?: string
  is_active?: string
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

export type CustomerProfile = {
  address: string | null
  full_name: string
  gender?: "Nam" | "Nữ" | "Khác" | null
  phone?: string | null
  created_at: string
  user_id: string
  membership_label?: string
  membership_level?: number
};

export type EmployeeProfile = {
  id: string
  full_name: string
  phone?: string | null
  gender?: "male" | "female" | "other" | null
  address?: string | null
};

export type User = {
  id: string
  name: string
  full_name?: string | null
  email: string
  email_verified_at: string | null
  status: number
  status_label?: string
  avatar: string | null
  role_id: string
  role: Role
  created_at: string
  updated_at: string
  gender?: "Nam" | "Nữ" | "Khác" | null
  phone?: string | null
  address?: string | null
  customer_profile?: CustomerProfile
  employee_profile?: EmployeeProfile
};
