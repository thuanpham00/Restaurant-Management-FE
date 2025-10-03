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

export type queryParamConfigDish = queryParamConfig & {}
