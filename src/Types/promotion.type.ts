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
