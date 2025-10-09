/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "./user.type"

export type SuccessResponse<Data> = {
  status: string
  message: string
  data: Data
}

export type ErrorResponse<Data> = {
  status: string
  message: string
  errors?: Data
}

export type MessageResponse = {
  message: string
}

export type AuthResponse = {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export type PaginationLink = {
  url: string | null
  label: string
  page: number | null
  active: boolean
}

export type PaginatedResponse<T> = {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: PaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

export type Promotion = {
  id: string
  code: string
  description: string
  discount_percent: number
  start_date: string
  end_date: string
  usage_limit: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RegisterResponse = {
  email: string
  expires_at: string
}

export type GoogleAuthResponse = {
  url: string
  provider: "google"
}

export type Chef = {
  id: string
  name: string
  avatar: string | null
}
