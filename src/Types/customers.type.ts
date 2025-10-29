export type Customer = {
  id: string
  full_name: string
  phone: string | null
  gender: "Nam" | "Nữ" | "Khác" | null
  address: string | null
  membership_level: number
  user_id: string
  created_at: string
  updated_at: string
  membership_label: string
  user: {
    id: string
    email: string
    email_verified_at: string | null
    status: number
    name: string
    avatar: string | null
    role_id: string
    created_at: string
    updated_at: string
    status_label: string
  }
}

export type CustomerFormInput = {
  full_name: string
  phone?: string
  gender?: "Nam" | "Nữ" | "Khác"
  address?: string
  membership_level?: number
}

export type queryParamConfigCustomer = {
  page?: string
  per_page?: string
  full_name?: string
  phone?: string
  gender?: string
  membership_level?: string
  user_id?: string
}
