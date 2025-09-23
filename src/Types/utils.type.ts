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
