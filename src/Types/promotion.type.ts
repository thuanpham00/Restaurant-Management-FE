export interface Promotion {
  id: string
  code: string
  description: string | null
  discount_percent: number
  start_date: string | null
  end_date: string | null
  usage_limit: number
  used_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  per_page: number
  last_page: number
  total: number
}

export type PromotionQuery = {
  q?: string
  only_valid?: boolean
  page?: number
  per_page?: number
}
