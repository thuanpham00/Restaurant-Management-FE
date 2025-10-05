import Http from "src/Helpers/http"
import { AuthResponse, SuccessResponse } from "src/Types/utils.type"

/**
 * Admin Authentication API
 * Handles admin login and logout operations
 */
export const authAPI = {
  /**
   * Login for admin users
   * @param body - Email and password credentials
   */
  loginAdmin: (body: { email: string; password: string }) => {
    return Http.post<SuccessResponse<AuthResponse>>("/api/auth/login", body)
  },

  /**
   * Logout current admin user
   */
  logout: () => {
    return Http.post<SuccessResponse<AuthResponse>>("/api/auth/logout")
  }
}
