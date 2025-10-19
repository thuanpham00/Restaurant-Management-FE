import { Dayjs } from "dayjs"

export type Promotion = {
  id: string
  code: string
  description: string
  discount_percent: string
  start_date: Dayjs | null
  end_date: Dayjs | null
  usage_limit: number
  is_active: boolean
  created_at: null
  updated_at: null
  used_count: number
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