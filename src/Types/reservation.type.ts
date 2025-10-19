export type Reservation = {
  id: string
  customer_id: string
  reserved_at: string
  number_of_people: number
  status: number
  notes?: string | null
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
  dining_table_number: number
  assigned: boolean
}

export type ReservationCreate = {
  number_of_people: number
  reserved_at: string // "YYYY-MM-DD HH:mm:ss"
  notes?: string | null
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ReservationFilters {
  status?: string | null
  date_from?: string | null
  date_to?: string | null
  q?: string | null
}