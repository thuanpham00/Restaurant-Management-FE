export interface Invoice {
  invoice_id: string
  table_session_id: string
  table_id: string
  total_amount: string
  discount_amount: string
  tax_amount: string
  final_amount: string
  status: string
  status_label: string
  created_at: string | null
}