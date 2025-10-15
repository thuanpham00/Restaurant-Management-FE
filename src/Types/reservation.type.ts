export type Reservation = {
  id: string
  customer_id: string
  reserved_at: string
  number_of_people: number
  status: number
  notes: string
  created_at: string
  updated_at: string
  customer: {
    id: string
    full_name: string
    phone: string
    gender: string
    address: string
    membership_level: number
    user_id: string
    created_at: string
    updated_at: string
    membership_label: string
  }
}

export type ReservationCheckAssignTable = {
  reservation_number_of_people: number
  reservation_reserved_at: string
  reservation_status: number
  reservation_notes: string
  reservation_id: string
  customer_name: string
  session_id: string
  dining_table_id: string
  assigned: boolean
}
