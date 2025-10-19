import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios"
import {
  clearLS,
  getAccessTokenFromLS,
  setAccessTokenToLS,
  setAvatarImageToLS,
  setEmployeeIdToLS,
  setNameUserToLS,
  setRoleToLS
} from "src/Helpers/auth"
import { config } from "src/Constants/config"
import { AuthResponse, MessageResponse, SuccessResponse } from "src/Types/utils.type"
import { isAxiosExpiredTokenError, isError401, isError403, isError404 } from "./utils"
import { toast } from "react-toastify"
import { HttpStatusCode } from "src/Constants/httpStatus"
import { EmployeeProfile } from "src/Types/user.type"

class http {
  instance: AxiosInstance
  public accessToken: string
  private refreshTokenRequest: Promise<string> | null

  constructor() {
    this.accessToken = getAccessTokenFromLS()
    this.refreshTokenRequest = null
    this.instance = axios.create({
      baseURL: config.baseURLClient,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json"
      },
      withCredentials: true
    })

    // Request interceptor
    this.instance.interceptors.request.use(
      (cfg) => {
        // Đồng bộ token từ localStorage (hỗ trợ sau OAuth callback)
        const tokenLS = getAccessTokenFromLS()
        if (tokenLS && tokenLS !== this.accessToken) {
          this.accessToken = tokenLS
        }
        if (cfg.headers && this.accessToken) {
          cfg.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return cfg
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        if (response.config.url === "/api/auth/login") {
          const currentPath = window.location.pathname // => ví dụ: "/admin/login"
          const data = response.data as SuccessResponse<AuthResponse>
          const user = data.data.user
          if (currentPath === "/admin/login" && user.employee_profile) {
            this.accessToken = data.data.access_token
            setAccessTokenToLS(this.accessToken)
            setNameUserToLS(user.name)
            setRoleToLS(user.role.name)
            setAvatarImageToLS(user.avatar as string)
            setEmployeeIdToLS((user.employee_profile as EmployeeProfile).id)
          }
        }
        if (response.config.url === "/api/auth/logout") {
          clearLS()
          toast.success(response.data.message, { autoClose: 1500 })
          this.accessToken = ""
        }
        return response
      },
      (error) => {
        // 403 Forbidden
        if (isError403<MessageResponse>(error)) {
          if (
            error.response?.status === HttpStatusCode.Forbidden ||
            error.response?.data.message === "Không có quyền truy cập!"
          ) {
            toast.error(error.response?.data.message || "Không có quyền truy cập!", { autoClose: 1500 })
          }
        }

        // 404 Not Found
        if (isError404<MessageResponse>(error)) {
          // handle 404 nếu cần
        }

        // 401 Unauthorized
        if (isError401(error)) {
          const originalRequest =
            (error.response?.config as InternalAxiosRequestConfig) || ({ headers: {} } as InternalAxiosRequestConfig)
          const { url } = originalRequest
          // Access token hết hạn -> refresh
          if (isAxiosExpiredTokenError<MessageResponse>(error, "Unauthenticated.") && url !== "/api/auth/refresh") {
            this.refreshTokenRequest = this.refreshTokenRequest ?? this.handleRefreshToken()
            return this.refreshTokenRequest.then((accessToken) => {
              return this.instance({
                ...originalRequest,
                headers: { ...(originalRequest.headers || {}), Authorization: `Bearer ${accessToken}` }
              })
            })
          }

          // Refresh token hết hạn/invalid
          if (isAxiosExpiredTokenError<MessageResponse>(error, "Invalid or expired refresh token")) {
            this.accessToken = ""
            clearLS()
            toast.error("Phiên làm việc hết hạn", { autoClose: 1500 })
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private handleRefreshToken() {
    return this.instance
      .post<SuccessResponse<{ access_token: string }>>("/api/auth/refresh")
      .then((res) => {
        const { access_token } = res.data.data
        this.accessToken = access_token
        this.refreshTokenRequest = null
        setAccessTokenToLS(access_token)
        return access_token
      })
      .catch((err) => {
        clearLS()
        this.accessToken = ""
        this.refreshTokenRequest = null
        throw err
      })
  }
}

// Single instance dùng chung
const httpClient = new http()
export const httpRaw = httpClient
const Http = httpClient.instance
export default Http
