import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { LucideUtensils, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { schemaRegister, SchemaRegisterType } from "src/Helpers/rule"
import { isError422 } from "src/Helpers/utils"
import { ErrorResponse } from "src/Types/utils.type"
import { path } from "src/Constants/path"
import { clientAPI } from "src/Apis/Client/auth.api"
import { assets } from "src/Assets/assets"

type FormData = SchemaRegisterType

const Register = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false
  }) // State để quản lý ẩn/hiện mật khẩu

  const {
    formState: { errors },
    setError,
    register,
    handleSubmit
  } = useForm<FormData>({ resolver: yupResolver(schemaRegister) })

  const registerMutation = useMutation({
    mutationFn: (body: FormData) => {
      return clientAPI.register(body)
    }
  })

  const handleSubmitForm = handleSubmit((data) => {
    console.log("Form data:", data)
    registerMutation.mutate(data, {
      onSuccess: (response) => {
        toast.success(response.data.message, { autoClose: 3000 })
        navigate(path.Login)
      },
      onError: (error) => {
        if (isError422<ErrorResponse<FormData>>(error)) {
          const formError = error.response?.data.errors
          if (formError && !Array.isArray(formError)) {
            if (formError.name && formError.name.length > 0) {
              setError("name", { message: formError.name[0] })
            }
            if (formError.email && formError.email.length > 0) {
              setError("email", { message: formError.email[0] })
            }
            if (formError.password && formError.password.length > 0) {
              setError("password", { message: formError.password[0] })
            }
            if (formError.password_confirmation && formError.password_confirmation.length > 0) {
              setError("password_confirmation", { message: formError.password_confirmation[0] })
            }
          } else {
            toast.error(error.response?.data.message || "Đăng ký thất bại", { autoClose: 2000 })
          }
        }
      }
    })
  })

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
      <div className="absolute top-8 left-8 z-10 flex items-center">
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-full p-3 shadow-lg">
          <LucideUtensils size={28} className="text-white" />
        </div>
        <span className="text-white font-extrabold text-2xl ml-3 tracking-tight drop-shadow-lg">
          WowWraps<span className="text-orange-400">.</span>
        </span>
      </div>

      {/* Register Card */}
      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 border-2 border-orange-400/30 rounded-2xl p-10 shadow-2xl w-full backdrop-blur-lg">
          <h1 className="text-3xl font-extrabold text-white text-center mb-8 drop-shadow-lg">Đăng ký</h1>
          <form onSubmit={handleSubmitForm}>
            <div className="mb-6">
              <label htmlFor="fullName" className="block text-gray-300 text-sm font-semibold mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                id="fullName"
                {...register("name")}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 font-medium"
                placeholder="Họ và tên của bạn"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
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
            <div className="mb-6 relative">
              <label htmlFor="password" className="block text-gray-300 text-sm font-semibold mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword.password ? "text" : "password"}
                  id="password"
                  {...register("password")}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 pr-12 font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => ({ ...s, password: !s.password }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400"
                  aria-label="Ẩn/hiện mật khẩu"
                >
                  {showPassword.password ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div className="mb-6 relative">
              <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-semibold mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  id="confirmPassword"
                  {...register("password_confirmation")}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 pr-12 font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400"
                  aria-label="Ẩn/hiện xác nhận mật khẩu"
                >
                  {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-red-500 text-sm mt-1">{errors.password_confirmation.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-300 text-lg"
            >
              {registerMutation.isPending ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white text-base font-medium">
              Đã có tài khoản?{" "}
              <NavLink to="/login" className="text-orange-400 hover:text-orange-500 font-bold">
                Đăng nhập
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
