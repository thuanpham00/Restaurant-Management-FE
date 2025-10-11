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
}
