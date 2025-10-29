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
  items?: InvoiceItem[] | null
}

export interface InvoiceItem {
  order_item_id: string
  dish_id: string
  dish_name: string
  dish_desc: string
  dish_image: string | null
  quantity: number
  item_price: string
  total_price: string
  notes: string | null
}