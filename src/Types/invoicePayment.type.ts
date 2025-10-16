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
