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
  isDraft: boolean
}

export type InvoicePaymentUpdatePayload = {
  table_session_id: string
  amount: number
  method: number
  status_payment: number
  employee_id: string
}

export type InvoicePromotion = {
  id: string
  invoice_id: string
  promotion_id: string
  discount_value: string
  applied_at: string
  created_at: string
  updated_at: string
  promotion?: {
    id: string
    code?: string | null
    description?: string | null
    discount_percent?: string | null
    start_date?: string | null
    end_date?: string | null
    usage_limit?: number | null
    is_active?: boolean | null
    created_at?: string | null
    updated_at?: string | null
  } | null
}

export type InvoicePaymentHistory = {
  id: string
  amount: string
  method: number
  status: number
  paid_at: string | null
  invoice_id: string
  employee_id: string
  desc_issue: string | null
  created_at: string
  updated_at: string
  employee: {
    id: string
    full_name: string
    phone: string | null
    gender: string | null
    address: string | null
    bank_account: string | null
    contract_type: number
    base_salary: string
    hire_date: string | null
    is_active: boolean
    user_id: string
    created_at: string
    updated_at: string
    contract_label: string
  } | null
}

export type Invoice = {
  id: string
  table_session_id: string
  total_amount: string
  discount: string
  tax: string
  final_amount: string
  status: number
  operation_type: string | null // "split_invoice" | "merge_invoice" | null
  source_invoice_ids: string | null
  split_percentage: string | null
  transferred_item_ids: string | null
  operation_notes: string | null
  operation_at: string | null
  operation_by: string | null
  parent_invoice_id: string | null
  merged_invoice_id: string | null
  created_at: string
  updated_at: string
  invoice_promotions?: InvoicePromotion[]
  payments?: InvoicePaymentHistory[]
}

export type InvoiceDetail = {
  id: string
  table_session_id: string
  total_amount: string
  discount: string
  tax: string
  final_amount: string
  status: number
  operation_type: string | null // "split_invoice" | "merge_invoice" | null
  source_invoice_ids: string | null
  split_percentage: string | null
  transferred_item_ids: string | null
  operation_notes: string | null
  operation_at: string | null
  operation_by: string | null
  parent_invoice_id: string | null
  merged_invoice_id: string | null
  created_at: string
  updated_at: string
  invoice_promotions?: InvoicePromotion[]
  payments: InvoicePaymentHistory[]
}

// Split Invoice Types
export type SplitInvoiceRequest = {
  invoice_id: string
  splits: {
    percentage: number
    note: string
  }[]
  employee_id: string
}

export type SplitInvoiceResponse = {
  parent_invoice: Invoice
  child_invoices: Invoice[]
  summary: {
    original_remaining: number
    split_count: number
    total_split_percentage: number
    parent_remaining_percentage: number
    verification: string
  }
}

// Invoice Summary Types (from backend API)
export type InvoiceSummary = {
  table_session_id: string
  summary: {
    total_invoices: number
    total_amount: number
    total_paid: number
    total_remaining: number
    unpaid_count: number
    partially_paid_count: number
    paid_count: number
    cancelled_count: number
    merged_count: number
  }
  invoices: InvoiceSummaryItem[]
}

export type InvoiceSummaryItem = {
  invoice_id: string
  final_amount: number
  total_paid: number
  remaining_amount: number
  status: number // 0=Unpaid, 1=Partially Paid, 2=Paid, 3=Cancelled, 4=Merged
  status_label: string
  operation_type: string | null
  created_at: string
}
