export type queryParamConfig = {
  page?: string
  per_page?: string
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

export type queryParamConfigReservation = queryParamConfig & {
  customer_name?: string
  customer_phone?: string
  date_time?: string
  reserved_at?: string
}

export type queryParamConfigPromotion = queryParamConfig & {
  code?: string
  desc?: string
  discount_percent?: string
  is_active?: string
}

export type queryParamConfigInvoice = queryParamConfig & {
  table_session_id?: string
  status?: string
  customer_phone?: string
}
