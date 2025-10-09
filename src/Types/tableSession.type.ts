export type TableSession = {
  dining_table_id: string
  table_number: number
  capacity: number
  is_active: number
  session_id: string | null
  session_type: number | null
  session_status: number | null
  started_at: string | null
  ended_at: string | null
}

export type TableSessionDetail = {
  dining_table_id: string
  session_id: string
  session_type: number
  session_status: number
  started_at: string
  reservation_reserved_at: string
  ended_at: null
  reservation_number_of_people: number
  reservation_notes: string
  customer_id: string
  customer_name: string
  customer_gender: string
  customer_phone: string
  customer_address: string
}

export type TableSessionOrder = {
  order_id: string
  table_session_id: string
  order_status: number
  total_amount: string
  items: {
    order_item_id: string
    quantity: number
    item_price: string
    total_price: string
    item_status: number
    notes: string
    prepared_by: string
    served_at: null
    cancelled_reason: null
    dish: {
      dish_id: string
      dish_name: string
      dish_price: string
      dish_desc: string
      cooking_time: number
      image: null
      dish_active: boolean
      category_name: string
      category_desc: string
    }
  }[]
}

export type HistoryTableSession = {
  session_id: string
  table_id: string
  table_number: number
  table_capacity: number
  session_type: number
  session_status: number
  started_at: string
  ended_at: string
  customer_id: string
  employee_id: string
  reservation: {
    reservation_id: string
    customer_id: string
    reserved_at: string
    number_of_people: number
    status: number
    notes: string
    customer_name: string
    customer_phone: string
    customer_gender: string
    customer_address: string
  }
}

export type HistoryTableSessionDetail = {
  session_id: string
  table_id: string
  table_number: number
  table_capacity: number
  session_type: number
  session_status: number
  started_at: string
  ended_at: string
  customer_id: string
  employee_id: string
  reservation: {
    reservation_id: string
    customer_id: string
    reserved_at: string
    number_of_people: number
    status: number
    notes: string
    customer_name: string
    customer_phone: string
    customer_gender: string
    customer_address: string
  }
  orders: {
    order_id: string
    status: number
    total_amount: string
    items: {
      order_item_id: string
      quantity: number
      price: string
      total_price: string
      status: number
      notes: string
      dish: {
        dish_id: string
        name: string
        price: string
        desc: string
        cooking_time: number
        image: string | null
      }
    }[]
  }[]
}
