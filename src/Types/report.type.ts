export type RevenueGroupBy = "day" | "week" | "month"

export type RevenueReportParams = {
  start_date: string
  end_date: string
  group_by?: RevenueGroupBy
}

export type RevenueReportRange = {
  start: string
  end: string
}

export type RevenueReportItem = {
  period_start: string
  period_end: string
  label: string
  total_amount: number
  transaction_count: number
}

export type RevenueReportResponse = {
  range: RevenueReportRange
  group_by: RevenueGroupBy
  total_amount: number
  transaction_count: number
  dataset: RevenueReportItem[]
}

export type TopDishesReportParams = {
  start_date: string
  end_date: string
  limit?: number
}

export type TopDishReportItem = {
  dish_id: string
  dish_name: string
  category_name: string
  total_quantity: number
  gross_revenue: number
  estimated_discount_share: number
  estimated_net_revenue: number
  average_unit_price: number
}

export type TopDishesReportResponse = {
  total_gross_revenue: number
  total_discount_considered: number
  dataset: TopDishReportItem[]
}

export type CategoryProfitReportParams = {
  start_date?: string
  end_date?: string
}

export type CategoryProfitReportItem = {
  category_id: string
  category_name: string
  gross_revenue: number
  estimated_profit: number
  profit_ratio_percent: number
}

export type CategoryProfitReportResponse = {
  total_gross_revenue: number
  total_estimated_profit: number
  dataset: CategoryProfitReportItem[]
}

export type PaymentMethodReportParams = {
  start_date?: string
  end_date?: string
}

export type PaymentMethodReportItem = {
  method: number
  method_label: string
  transaction_count: number
  total_amount: number
  percentage: number
}

export type PaymentMethodReportResponse = {
  total_amount: number
  dataset: PaymentMethodReportItem[]
}

export type PromotionsReportParams = {
  start_date?: string
  end_date?: string
}

export type PromotionReportItem = {
  promotion_id: string
  code: string
  description: string
  applied_count: number
  total_discount: number
  percentage: number
}

export type PromotionsReportResponse = {
  total_discount: number
  dataset: PromotionReportItem[]
}
