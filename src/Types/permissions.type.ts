export type Permission = {
  id: string
  code: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PermissionWithRoles = Permission & {
  roles?: Array<{
    id: string
    name: string
    description: string
    is_active: boolean
  }>
}

export type queryParamConfigPermission = {
  page?: string
  per_page?: string
  search?: string
}
