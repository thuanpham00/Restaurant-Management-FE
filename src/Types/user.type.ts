export type Role = {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CustomerProfile = {
  address: string | null
  full_name: string
  gender?: "male" | "female" | "other" | null
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
  gender?: "male" | "female" | "other" | null
  phone?: string | null
  address?: string | null
  customer_profile?: CustomerProfile
  employee_profile?: EmployeeProfile
};
