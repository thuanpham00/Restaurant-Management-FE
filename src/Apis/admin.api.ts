import Http from "src/Helpers/http"
import { AuthResponse, SuccessResponse } from "src/Types/utils.type"

export const adminAPI = {
  auth: {
    loginAdmin: (body: { email: string; password: string }) => {
      return Http.post<SuccessResponse<AuthResponse>>("/api/auth/login", body)
    },

    logout: () => {
      return Http.post<SuccessResponse<AuthResponse>>("/api/auth/logout")
    }
  }
}
