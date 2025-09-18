export type queryParamConfig = {
  page?: string
  limit?: string
  created_at_start?: string
  created_at_end?: string
  updated_at_start?: string
  updated_at_end?: string
}

export type queryParamConfigCustomer = queryParamConfig & {
  email?: string
  name?: string
  phone?: string
  verify?: string

  sortBy?: string
}
