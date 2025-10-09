import { useEffect } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { LucideUtensils } from "lucide-react"
import { Helmet } from "react-helmet-async"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { clientAPI } from "src/Apis/Client/auth.api"
import { schemaAuth, SchemaAuthType } from "src/Helpers/rule"
import { isError422 } from "src/Helpers/utils"
import { ErrorResponse } from "src/Types/utils.type"
import { useAppStore } from "src/StateGlobal/zustand"

type FormData = Pick<SchemaAuthType, "email" | "password">
const formSchema = schemaAuth.pick(["email", "password"])

const Login = () => {
  const { setIsAuthenticated, setAvatar, setNameUser, setRole, setUserId } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()

  const {
    formState: { errors },
    setError,
    register,
    handleSubmit
  } = useForm<FormData>({ resolver: yupResolver(formSchema) })

  // Mutation để lấy URL Google OAuth
  const googleLoginMutation = useMutation({
    mutationFn: () => clientAPI.getGoogleAuthUrl(),
    onSuccess: (response) => {
      window.location.href = response.data.data.url
    },
    onError: (error) => {
      toast.error(error.message || "Không thể kết nối với Google", { autoClose: 2000 })
    }
  })

  // Mutation để xử lý callback Google
  const googleCallbackMutation = useMutation({
    mutationFn: () => clientAPI.googleCallback(location.search),
    onSuccess: (response) => {
      const { data, message } = response.data
      // Lưu token và thông tin người dùng
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
      setIsAuthenticated(true)
      setAvatar(data.user?.avatar || "")
      setNameUser(data.user?.name || "")
      setRole(data.user?.role?.name || "")
      setUserId(data.user?.id || "")
      toast.success(message || "Đăng nhập bằng Google thành công", { autoClose: 3000 })
      navigate("/")
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      if (error.response?.status === 401) {
        toast.error("Tài khoản chưa được kích hoạt", { autoClose: 3000 })
      } else {
        toast.error(error.response?.data?.message || "Đăng nhập bằng Google thất bại", {
          autoClose: 3000
        })
      }
    }
  })

  // Xử lý callback từ Google
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const code = queryParams.get("code")
    if (code) {
      // Gọi API google/callback khi nhận được code từ Google
      googleCallbackMutation.mutate()
    }
  }, [location.search])

  const loginMutation = useMutation({
    mutationFn: (body: FormData) => clientAPI.loginClient(body),
    onSuccess: (response) => {
      toast.success(response.data.message, { autoClose: 1000 })
      setIsAuthenticated(true)
      setAvatar(response.data.data.user.avatar)
      setNameUser(response.data.data.user.name)
      setRole(response.data.data.user.role.name)
      setUserId(response.data.data.user.id)
      navigate("/")
    },
    onError: (error) => {
      if (isError422<ErrorResponse<FormData>>(error)) {
        const formError = error.response?.data.errors
        if (formError && !Array.isArray(formError)) {
          if (formError.email && formError.email.length > 0) {
            setError("email", { message: formError.email[0] })
          }
          if (formError.password && formError.password.length > 0) {
            setError("password", { message: formError.password[0] })
          }
        } else if (Array.isArray(formError)) {
          toast.error(formError[0] || "Đăng nhập thất bại", { autoClose: 2000 })
        }
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
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative">
      <Helmet>
        <title>Đăng nhập tài khoản - FoodZone</title>
        <meta
          name="description"
          content="Đăng nhập tài khoản FoodZone để đặt món ăn nhanh chóng và tận hưởng trải nghiệm ẩm thực tuyệt vời."
        />
      </Helmet>

      <div className="absolute inset-0 bg-opacity-70 z-0">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')",
            backgroundBlendMode: "overlay"
          }}
        />
      </div>

      <div className="absolute top-6 left-6 z-10 flex items-center">
        <div className="bg-orange-500 rounded-full p-2 mr-2">
          <LucideUtensils size={20} className="text-white" />
        </div>
        <span className="text-white font-bold text-xl">
          food<span className="text-orange-500">.</span>
        </span>
      </div>

      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-[#1a1a1a] rounded-xl p-8 shadow-2xl w-full">
          <h1 className="text-2xl font-bold text-white text-center mb-8">Đăng nhập</h1>
          <form onSubmit={handleSubmitForm}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="w-full px-4 py-3 bg-[#2d2d2d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div className="mb-2">
              <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                {...register("password")}
                className="w-full px-4 py-3 bg-[#2d2d2d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div className="mb-6 text-right">
              <NavLink to="/forgot-password" className="text-orange-500 hover:text-orange-400 text-sm">
                Quên mật khẩu?
              </NavLink>
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition duration-300"
            >
              Đăng nhập
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center mb-6">
              <div className="flex-grow h-px bg-gray-600"></div>
              <span className="px-4 text-sm text-gray-400">hoặc tiếp tục với</span>
              <div className="flex-grow h-px bg-gray-600"></div>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoogleLogin}
                className="bg-white hover:bg-gray-100 text-black w-12 h-12 rounded-full flex items-center justify-center transition duration-300"
              >
                <span className="font-bold">Google</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white text-sm">
              Chưa có tài khoản?{" "}
              <NavLink to="/register" className="text-orange-500 hover:text-orange-400">
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
