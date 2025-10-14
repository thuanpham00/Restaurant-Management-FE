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
  paymentBefore?: number
}

export type InvoicePaymentUpdatePayload = {
  amount: number
  method: number
  status_payment: number
  employee_id: string
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

export type InvoiceDetail = {
  id: string
  table_session_id: string
  total_amount: string
  discount: string
  tax: string
  final_amount: string
  status: number
  created_at: string
  updated_at: string
  payments: {
    id: string
    amount: string
    method: number
    status: number
    paid_at: string
    invoice_id: string
    employee_id: string
    desc_issue: null
    created_at: string
    updated_at: string
    employee: {
      id: string
      full_name: string
      phone: null
      gender: null
      address: null
      bank_account: null
      contract_type: number
      base_salary: string
      hire_date: null
      is_active: boolean
      user_id: string
      created_at: string
      updated_at: string
      contract_label: string
    }
  }[]
}
