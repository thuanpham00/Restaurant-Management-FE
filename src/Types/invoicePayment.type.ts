export type InvoicePaymentPayload = {
  table_session_id: string
  total_amount: number
  discount: number
  tax: number
  final_amount: number
  status: number
  listPromotionApply:
    | {
        promotion_id: string
        discount_value: number
      }[]
    | null
  employee_id: string | null
  method: number
  status_payment: number
}

export type Invoice = {
  id: string
  table_session_id: string
  total_amount: string
  discount: string
  tax: string
  final_amount: string
  status: number
  created_at: string
  updated_at: string
}
