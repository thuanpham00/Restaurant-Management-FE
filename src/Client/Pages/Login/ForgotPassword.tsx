import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { clientAPI } from "src/Apis/Client/auth.api"
import { isAxiosError } from "axios"
import * as yup from "yup"
import type { ErrorResponse } from "src/Types/utils.type"
import { useAppStore } from "src/StateGlobal/zustand"
import { assets } from "src/Assets/assets"

// Step 1: Email form
const emailSchema = yup.object({
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email")
})
type EmailFormData = yup.InferType<typeof emailSchema>

// Step 2: OTP form
const otpSchema = yup.object({
  otp: yup
    .string()
    .required("Vui lòng nhập mã OTP")
    .length(6, "Mã OTP phải có 6 số")
    .matches(/^\d+$/, "Mã OTP chỉ chứa số")
})
type OtpFormData = yup.InferType<typeof otpSchema>

// Step 3: Reset password form
const resetPasswordSchema = yup.object({
  password: yup.string().required("Vui lòng nhập mật khẩu mới").min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  password_confirmation: yup
    .string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp")
})
type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { setIsAuthenticated, setAvatar, setNameUser, setRole, setUserId } = useAppStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  }) // State để quản lý ẩn/hiện mật khẩu

  // Step 1: Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors }
  } = useForm<EmailFormData>({
    resolver: yupResolver(emailSchema)
  })

  // Step 2: OTP form
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors }
  } = useForm<OtpFormData>({
    resolver: yupResolver(otpSchema)
  })

  // Step 3: Reset password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors }
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema)
  })

  // Mutation: Gửi email OTP
  const sendOtpMutation = useMutation({
    mutationFn: (data: EmailFormData) => clientAPI.forgotPassword(data),
    onSuccess: () => {
      toast.success("Mã OTP đã được gửi đến email của bạn", { autoClose: 2000 })
      setStep(2)
      setCountdown(300) // 5 phút = 300 giây

      // Countdown timer
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    onError: (error: unknown) => {
      if (isAxiosError<ErrorResponse<EmailFormData>>(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message

        if (status === 404) {
          toast.error("Email không tồn tại trong hệ thống", { autoClose: 2000 })
        } else if (status === 422) {
          toast.error(message || "Email không hợp lệ", { autoClose: 2000 })
        } else {
          toast.error("Không thể gửi mã OTP. Vui lòng thử lại sau", { autoClose: 2000 })
        }
      } else {
        toast.error("Lỗi không xác định. Vui lòng thử lại", { autoClose: 2000 })
      }
    }
  })

  // Mutation: Xác thực OTP
  const verifyOtpMutation = useMutation({
    mutationFn: (data: OtpFormData & { email: string }) => clientAPI.verifyOtp(data),
    onSuccess: (response) => {
      toast.success("Xác thực thành công", { autoClose: 1000 })
      setResetToken(response.data.data.reset_token)
      setStep(3)
    },
    onError: (error: unknown) => {
      if (isAxiosError<ErrorResponse<OtpFormData>>(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message

        if (status === 400) {
          toast.error(message || "Mã OTP không hợp lệ hoặc đã hết hạn", { autoClose: 2000 })
        } else {
          toast.error("Xác thực thất bại. Vui lòng thử lại", { autoClose: 2000 })
        }
      } else {
        toast.error("Lỗi không xác định. Vui lòng thử lại", { autoClose: 2000 })
      }
    }
  })

  // Mutation: Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordFormData & { reset_token: string }) => clientAPI.resetPassword(data),
    onSuccess: async () => {
      toast.success("Đặt lại mật khẩu thành công! Đang đăng nhập...", { autoClose: 1000 })

      // Tự động đăng nhập
      try {
        const loginResponse = await clientAPI.loginClient({
          email,
          password: (document.getElementById("password") as HTMLInputElement).value
        })
        const user = loginResponse.data?.data?.user
        setIsAuthenticated(true)
        setAvatar(loginResponse.data.data.user.avatar)
        setNameUser(loginResponse.data.data.user.name)
        setRole(loginResponse.data.data.user.role.name)
        setUserId(loginResponse.data.data.user.id)
        if (user?.id) {
          localStorage.setItem("userId", user.id)
          localStorage.setItem("user", JSON.stringify(user))
        }
        setTimeout(() => {
          navigate("/")
        }, 1000)
      } catch {
        toast.info("Vui lòng đăng nhập lại với mật khẩu mới", { autoClose: 2000 })
        navigate("/login")
      }
    },
    onError: (error: unknown) => {
      if (isAxiosError<ErrorResponse<ResetPasswordFormData>>(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message

        if (status === 400) {
          toast.error("Token không hợp lệ hoặc đã hết hạn. Vui lòng thử lại", { autoClose: 2000 })
          setStep(1)
        } else if (status === 422) {
          toast.error(message || "Mật khẩu không hợp lệ", { autoClose: 2000 })
        } else {
          toast.error("Đặt lại mật khẩu thất bại. Vui lòng thử lại", { autoClose: 2000 })
        }
      } else {
        toast.error("Lỗi không xác định. Vui lòng thử lại", { autoClose: 2000 })
      }
    }
  })

  const onSubmitEmail = (data: EmailFormData) => {
    setEmail(data.email)
    sendOtpMutation.mutate(data)
  }

  const onSubmitOtp = (data: OtpFormData) => {
    verifyOtpMutation.mutate({ ...data, email })
  }

  const onSubmitPassword = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate({ ...data, reset_token: resetToken })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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

      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 border-2 border-orange-400/30 rounded-2xl p-10 shadow-2xl w-full backdrop-blur-lg">
          <NavLink to="/login" className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            <span>Quay lại đăng nhập</span>
          </NavLink>

          <h1 className="text-3xl font-extrabold text-white text-center mb-2 drop-shadow-lg">
            {step === 1 && "Quên mật khẩu"}
            {step === 2 && "Nhập mã OTP"}
            {step === 3 && "Đặt mật khẩu mới"}
          </h1>

          <p className="text-gray-400 text-center mb-8 text-base font-medium">
            {step === 1 && "Nhập email của bạn để nhận mã xác thực"}
            {step === 2 && "Mã OTP đã được gửi đến email của bạn"}
            {step === 3 && "Nhập mật khẩu mới để hoàn tất"}
          </p>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSubmitEmail(onSubmitEmail)}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-300 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  {...registerEmail("email")}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 font-medium"
                  placeholder="your@email.com"
                />
                {emailErrors.email && <p className="text-red-500 text-sm mt-1">{emailErrors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={sendOtpMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {sendOtpMutation.isPending ? "Đang gửi..." : "Gửi mã xác thực"}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleSubmitOtp(onSubmitOtp)}>
              <div className="mb-6">
                <label htmlFor="otp" className="block text-gray-300 text-sm font-semibold mb-2">
                  Mã OTP (6 số)
                </label>
                <input
                  type="text"
                  id="otp"
                  maxLength={6}
                  {...registerOtp("otp")}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-orange-500 font-medium"
                  placeholder="000000"
                />
                {otpErrors.otp && <p className="text-red-500 text-sm mt-1">{otpErrors.otp.message}</p>}

                {countdown > 0 && (
                  <p className="text-gray-400 text-sm mt-2 text-center">
                    Mã sẽ hết hạn sau: <span className="text-orange-500 font-semibold">{formatTime(countdown)}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyOtpMutation.isPending || countdown === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {verifyOtpMutation.isPending ? "Đang xác thực..." : "Xác nhận"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full mt-3 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Gửi lại mã
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-300 text-sm font-semibold mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    id="password"
                    {...registerPassword("password")}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 pr-12 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => ({ ...s, new: !s.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400"
                    aria-label="Ẩn/hiện mật khẩu mới"
                  >
                    {showPassword.new ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.password.message}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="password_confirmation" className="block text-gray-300 text-sm font-semibold mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    id="password_confirmation"
                    {...registerPassword("password_confirmation")}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 pr-12 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400"
                    aria-label="Ẩn/hiện xác nhận mật khẩu"
                  >
                    {showPassword.confirm ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.password_confirmation && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.password_confirmation.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {resetPasswordMutation.isPending ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
