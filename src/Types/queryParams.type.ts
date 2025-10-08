export type queryParamConfig = {
  page?: string
  limit?: string
}

export type queryParamConfigTableSessions = queryParamConfig & {
  is_active?: string
  session_status?: string
  capacity?: string
}

export type queryParamConfigCategoryDish = queryParamConfig & {
  name?: string
  desc?: string
}

export type queryParamConfigDish = queryParamConfig & {
  name?: string
  is_active?: string
  category?: string
  cooking_time?: string
  min_price?: string
  max_price?: string
}

export type queryParamConfigMenu = queryParamConfig & {
  name?: string
  desc?: string
  is_active?: string
}
