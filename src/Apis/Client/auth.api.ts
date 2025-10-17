import http from "src/Helpers/http"
import Http from "src/Helpers/http"
import { AuthResponse, SuccessResponse, RegisterResponse, GoogleAuthResponse } from "src/Types/utils.type"

export const clientAPI = {
  loginClient: (body: { email: string; password: string }) => {
    return Http.post<SuccessResponse<AuthResponse>>("/api/auth/login", body)
  },
  logout: () => {
    return Http.post<SuccessResponse<AuthResponse>>("/api/auth/logout")
  },
  register: (body: { name: string; email: string; password: string; password_confirmation: string }) => {
    return Http.post<SuccessResponse<RegisterResponse>>("/api/auth/register", body)
  },
  getGoogleAuthUrl: () => {
    return Http.get<SuccessResponse<GoogleAuthResponse>>("/api/auth/google")
  },
  me() {
    return http.get("/api/auth/me")
  },
  forgotPassword: (body: { email: string }) =>
    http.post<SuccessResponse<{ email: string; expires_in: number }>>("/api/auth/forgot-password", body),

  verifyOtp: (body: { email: string; otp: string }) =>
    http.post<SuccessResponse<{ reset_token: string; expires_in: number }>>("/api/auth/verify-otp", body),

  resetPassword: (body: { reset_token: string; password: string; password_confirmation: string }) =>
    http.post<SuccessResponse<object>>("/api/auth/reset-password", body)
}
