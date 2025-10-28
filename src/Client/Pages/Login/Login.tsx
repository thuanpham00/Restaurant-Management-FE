import { NavLink, useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { clientAPI } from "src/Apis/Client/auth.api"
import { schemaAuth, SchemaAuthType } from "src/Helpers/rule"
import type { ErrorResponse } from "src/Types/utils.type"
import { isAxiosError } from "axios"
import { useAppStore } from "src/StateGlobal/zustand"
import { useState, useEffect } from "react"
import { assets } from "src/Assets/assets"

type FormData = Pick<SchemaAuthType, "email" | "password">
const formSchema = schemaAuth.pick(["email", "password"])

const Login = () => {
  const { setIsAuthenticated, setAvatar, setNameUser, setRole, setUserId } = useAppStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)

  const {
    formState: { errors },
    setError,
    register,
    handleSubmit
  } = useForm<FormData>({ resolver: yupResolver(formSchema) })

  // Kiểm tra URL params khi component mount
  useEffect(() => {
    const error = searchParams.get("error")
    const message = searchParams.get("message")
    const errorCode = searchParams.get("error_code")

    if (error === "true" && message) {
      // Hiển thị thông báo lỗi
      if (errorCode === "EMAIL_ACCOUNT_EXISTS") {
        toast.error(decodeURIComponent(message), {
          autoClose: 5000,
          position: "top-center"
        })
      } else {
        toast.error(decodeURIComponent(message), { autoClose: 3000 })
      }

      // Xóa params khỏi URL sau khi hiển thị
      searchParams.delete("error")
      searchParams.delete("message")
      searchParams.delete("error_code")
      setSearchParams(searchParams, { replace: true })
    }

    // Kiểm tra thành công
    const success = searchParams.get("success")
    if (success === "true") {
      searchParams.delete("success")
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Lấy URL Google OAuth và redirect
  const googleLoginMutation = useMutation({
    mutationFn: () => clientAPI.getGoogleAuthUrl(),
    onSuccess: (response) => {
      window.location.href = response.data.data.url
    },
    onError: (error) => {
      toast.error((error as Error).message || "Không thể kết nối với Google", { autoClose: 2000 })
    }
  })

  // Đăng nhập tài khoản thường
  const loginMutation = useMutation({
    mutationFn: (body: FormData) => clientAPI.loginClient(body),
    onSuccess: (response) => {
      const user = response.data?.data?.user
      if (user?.role?.name !== "Customer") {
        toast.error("Chỉ tài khoản khách hàng mới được phép đăng nhập!", { autoClose: 2500 })
        return
      }
      toast.success(response.data.message, { autoClose: 1000 })
      setIsAuthenticated(true)
      setAvatar(user?.avatar ?? "")
      setNameUser(user?.name ?? "")
      setRole(user?.role?.name ?? "")
      setUserId(user?.id ?? "")
      if (user?.id) {
        localStorage.setItem("userId", user.id)
        localStorage.setItem("user", JSON.stringify(user))
      }
      setTimeout(() => {
        navigate("/")
      }, 300)
    },
    onError: (error: unknown) => {
      console.error("[loginMutation] Lỗi khi đăng nhập:", error)
      if (isAxiosError<ErrorResponse<FormData>>(error)) {
        const status = error.response?.status
        const responseData = error.response?.data

        // Lỗi 422 (validate form)
        if (status === 422 && responseData?.errors) {
          const formError = responseData.errors
          if (!Array.isArray(formError)) {
            if (formError.email?.length) setError("email", { message: formError.email[0] })
            if (formError.password?.length) setError("password", { message: formError.password[0] })
          } else {
            toast.error(formError[0] || "Đăng nhập thất bại", { autoClose: 2000 })
          }
          return
        }

        // Lỗi 401 (Unauthorized)
        if (status === 401) {
          toast.error(responseData?.message || "Email hoặc mật khẩu không hợp lệ", { autoClose: 2000 })
          return
        }

        // Các lỗi khác
        toast.error("Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.", { autoClose: 2000 })
      } else {
        toast.error("Lỗi không xác định. Vui lòng thử lại.", { autoClose: 2000 })
      }
    }
  })

  const handleSubmitForm = handleSubmit((data) => {
    loginMutation.mutate(data)
  })

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate()
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-500/20 via-gray-900/90 to-gray-900 relative">
      {/* Overlay background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage: `url(${assets.images.background})`,
            backgroundBlendMode: "overlay",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-gray-900/80 to-gray-900/90" />
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <div className="mx-4 flex items-center justify-center gap-1 py-2 px-2 rounded-lg">
          <div className="w-14 h-12">
            <img src={assets.icons.vector} alt="Logo" className="w-full h-full" />
          </div>
          <span className="text-white text-lg font-bold text-center -tracking-tighter">Restaurant</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 border-2 border-orange-400/30 rounded-2xl p-10 shadow-2xl w-full backdrop-blur-lg">
          <h1 className="text-3xl font-extrabold text-white text-center mb-8 drop-shadow-lg">Đăng nhập</h1>
          <form onSubmit={handleSubmitForm}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-300 text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 font-medium"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div className="mb-2">
              <label htmlFor="password" className="block text-gray-300 text-sm font-semibold mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register("password")}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 pr-12 font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400"
                  aria-label="Ẩn/hiện mật khẩu"
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div className="mb-6 text-right">
              <NavLink to="/forgot-password" className="text-orange-400 hover:text-orange-500 text-sm font-semibold">
                Quên mật khẩu?
              </NavLink>
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-300 text-lg"
            >
              Đăng nhập
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center mb-6">
              <div className="flex-grow h-px bg-gray-700"></div>
              <span className="px-4 text-sm text-gray-400 font-medium">hoặc tiếp tục với</span>
              <div className="flex-grow h-px bg-gray-700"></div>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoogleLogin}
                className="bg-white hover:bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition duration-300"
              >
                <img src={assets.images.google_logo} alt="Google Login" className="w-6 h-6 object-contain" />
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white text-base font-medium">
              Chưa có tài khoản?{" "}
              <NavLink to="/register" className="text-orange-400 hover:text-orange-500 font-bold">
                Đăng ký miễn phí
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
