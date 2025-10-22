import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Header from "../../Components/HeaderClient/HeaderClient"
import Footer from "../../Components/FooterClient/FooterClient"
import { useAppStore } from "src/StateGlobal/zustand"
import { clientAPI } from "src/Apis/Client/auth.api"

const AuthCallback: React.FC = () => {
  const { setIsAuthenticated, setAvatar, setNameUser, setRole, setUserId } = useAppStore()
  const navigate = useNavigate()
  const { search } = useLocation()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const qs = new URLSearchParams(search)
    const error = qs.get("error")
    if (error) {
      toast.error(decodeURIComponent(error), { autoClose: 3000 })
      navigate("/login", { replace: true })
      return
    }

    const accessToken = qs.get("access_token")
    const refreshToken = qs.get("refresh_token")
    const provider = qs.get("provider") || "google"
    const isNew = qs.get("is_new_user") === "true"

    if (!accessToken) {
      toast.error("Không nhận được token đăng nhập", { autoClose: 3000 })
      navigate("/login", { replace: true })
      return
    }

    localStorage.setItem("access_token", accessToken)
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken)
    ;(async () => {
      try {
        const res = await clientAPI.me()
        const user = res.data?.data || res.data

        // Cập nhật Zustand store
        setIsAuthenticated(true)
        setAvatar(user?.avatar || "")
        setNameUser(user?.name || user?.full_name || "")
        setRole(user?.role?.name || user?.role || "")
        setUserId(user?.id || user?._id || "")

        // Lưu vào localStorage
        try {
          localStorage.setItem("user", JSON.stringify(user))
          if (user?.id || user?._id) {
            localStorage.setItem("userId", String(user.id ?? user._id))
          }
        } catch {
          // ignore lỗi localStorage
        }

        toast.success(`Đăng nhập ${provider} thành công`, { autoClose: 2000 })
        navigate(isNew ? "/profile/complete" : "/", { replace: true })
      } catch {
        // fallback nếu API lỗi
        setIsAuthenticated(true)
        navigate("/", { replace: true })
      }
    })()
  }, [search, navigate, setIsAuthenticated, setAvatar, setNameUser, setRole, setUserId])

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      <section className="container mx-auto px-4 py-10">
        <div className="text-gray-300">Đang xử lý đăng nhập...</div>
      </section>
      <Footer />
    </div>
  )
}

export default AuthCallback
