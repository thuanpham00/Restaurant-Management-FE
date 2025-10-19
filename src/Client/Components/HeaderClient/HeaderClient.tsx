import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { assets } from "src/Assets/assets"
import { path } from "src/Constants/path"
import { clientAPI } from "src/Apis/Client/auth.api"
import { userAPI } from "src/Apis/Client/settings.api"
import { useAppStore } from "src/StateGlobal/zustand"
import { clearLS, LocalStorageEventTarget } from "src/Helpers/auth"
import { toMediaUrl } from "src/Helpers/media"
import { isAxiosError } from "axios"
import type { User as UserType } from "src/Types/user.type"
import { LucideUtensils } from "lucide-react"

const defaultAvatar = assets.images.default_avatar

const Header = () => {
  const {
    isAuthenticated,
    reset,
    user: storeUser,
    setUser
  } = useAppStore() as {
    isAuthenticated: boolean
    reset: () => void
    user?: UserType
    setUser?: (u: UserType) => void
  }
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUserLocal] = useState<UserType | null>(storeUser || null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId") || storeUser?.id || user?.id
      if (!userId || (user && user.id === userId)) {
        return
      }

      try {
        const cached = localStorage.getItem("user")
        if (cached) {
          try {
            const u = JSON.parse(cached) as UserType
            setUserLocal(u)
            setUser?.(u)
          } catch {
            console.log("Invalid JSON in localStorage")
          }
        }

        const res = await userAPI.getById(userId)
        console.log("API response:", res.data)
        if (res.data.status === "success") {
          setUserLocal(res.data.data)
          setUser?.(res.data.data)
          localStorage.setItem("user", JSON.stringify(res.data.data))
        }
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          console.log("API error:", error.response?.data || error.message)
        }
      }
    }
    fetchUser()
  }, [storeUser?.id, setUser, user?.id])

  useEffect(() => {
    if (storeUser && (!user || user.id !== storeUser.id)) {
      setUserLocal(storeUser)
      setUser?.(storeUser)
    }
  }, [storeUser, setUser])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("click", handleClickOutside)
    window.addEventListener("keydown", handleEsc)
    return () => {
      window.removeEventListener("click", handleClickOutside)
      window.removeEventListener("keydown", handleEsc)
    }
  }, [])

  const logoutMutation = useMutation({
    mutationFn: () => {
      return clientAPI.logout()
    }
  })

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clearLS()
        localStorage.removeItem("user")
        localStorage.removeItem("userId")
        LocalStorageEventTarget.dispatchEvent(new Event("ClearLS"))
        reset()
        setUserLocal(null)
        // Chuyển hướng ngay lập tức, không để người dùng bấm lại
        navigate(path.Login, { replace: true })
        // Hoặc dùng window.location.href nếu muốn reload toàn bộ app:
        // window.location.href = path.Login
      },
      onError: (error) => {
        toast.error("Đăng xuất thất bại", { autoClose: 2000 })
        console.error("Logout error:", error)
      }
    })
  }

  console.log("Rendering with user:", user)

  const isHome = pathname === "/" || pathname === "/home"

  return (
    <header
      className={`relative bg-gradient-to-br from-orange-500/10 via-gray-900/90 to-gray-900 shadow-xl ${
        isHome ? "overflow-hidden h-[340px] sm:h-[440px] md:h-[540px] lg:h-[600px]" : "overflow-visible h-auto"
      } z-[200]`}
    >
      <nav
        className={`relative z-[300] px-4 sm:px-8 lg:px-16 xl:px-24 ${
          isHome ? "py-6 sm:py-7 md:py-9" : "py-4 sm:py-5"
        } flex items-center justify-between`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-full p-3 shadow-lg">
            <LucideUtensils size={26} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight drop-shadow-lg">
            WowWraps<span className="text-orange-400">.</span>
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-white text-base font-medium">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 border-b-2 border-orange-400 pb-1"
                : "text-white/80 hover:text-orange-400 transition-colors"
            }
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 border-b-2 border-orange-400 pb-1"
                : "text-white/80 hover:text-orange-400 transition-colors"
            }
          >
            Thực đơn
          </NavLink>
          <NavLink
            to="/table"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 border-b-2 border-orange-400 pb-1"
                : "text-white/80 hover:text-orange-400 transition-colors"
            }
          >
            Đặt bàn
          </NavLink>
          <NavLink
            to="/Reservation-history"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 border-b-2 border-orange-400 pb-1"
                : "text-white/80 hover:text-orange-400 transition-colors"
            }
          >
            Lịch sử đặt bàn
          </NavLink>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 bg-gray-800/80 border-2 border-orange-400 rounded-full px-3 py-2 shadow-lg hover:scale-105 transition-all"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={user?.name || "Tài khoản"}
              >
                <img
                  src={toMediaUrl(user?.avatar) || defaultAvatar}
                  alt={user?.name || "User"}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.src = defaultAvatar
                  }}
                  className="w-10 h-10 rounded-full object-cover "
                />
                <span className="text-white font-semibold">{user?.name || "Tài khoản"}</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-56 bg-gray-900/95 border border-orange-400 rounded-xl shadow-2xl z-[100] p-4
      before:content-[''] before:absolute before:-top-2 before:right-6
      before:w-0 before:h-0
      before:border-l-8 before:border-r-8 before:border-b-8
      before:border-l-transparent before:border-r-transparent before:border-b-orange-400"
                >
                  <div className="mb-3 pb-3 border-b border-gray-700">
                    <p className="text-xs text-gray-400">Đăng nhập với</p>
                    <p className="text-sm font-medium text-white">{user?.email || "-"}</p>
                  </div>
                  <ul className="space-y-2 text-base">
                    <li>
                      <button
                        role="menuitem"
                        className="text-white w-full text-left px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate("/settings")
                        }}
                      >
                        Thông tin cá nhân
                      </button>
                    </li>
                    <li>
                      <button
                        role="menuitem"
                        className="text-white w-full text-left px-4 py-2 rounded-lg hover:bg-orange-500/20 transition-colors"
                        disabled={logoutMutation.isPending}
                        onClick={handleLogout}
                      >
                        Đăng xuất
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-5 py-2 rounded-xl border-2 font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-orange-500/20 text-orange-400 border-orange-400"
                      : "bg-gray-800/80 text-white/80 border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-400 hover:scale-105"
                  }`
                }
              >
                Đăng nhập
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `px-5 py-2 rounded-xl border-2 font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-orange-500/20 text-orange-400 border-orange-400"
                      : "bg-gray-800/80 text-white/80 border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-400 hover:scale-105"
                  }`
                }
              >
                Đăng ký
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section for Home */}
      {isHome && (
        <div className="relative z-[5] px-4 sm:px-8 lg:px-16 xl:px-24 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="text-center md:text-left">
              <p className="text-orange-400 text-base font-semibold mb-4 animate-pulse">
                Chào mừng bạn mới đến với WowWraps!
              </p>
              <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 drop-shadow-lg">
                Không chỉ là món ăn, mà là trải nghiệm cảm xúc!
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto md:mx-0">
                Nấu ăn là nghệ thuật, là niềm vui và là sự kết nối. Hãy khám phá thực đơn đa dạng và không gian ấm cúng
                của chúng tôi!
              </p>
              <NavLink
                to="/menu"
                className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-orange-500/40 transition-all duration-300"
              >
                Khám phá thực đơn
              </NavLink>
            </div>
            <div className="relative flex justify-center md:justify-end">
              <div className="relative mr-0 sm:mr-10 md:mr-16">
                <img
                  src={assets.images.image89}
                  alt="Main dish"
                  className="w-full max-w-[260px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] h-auto object-cover rounded-3xl shadow-2xl border-2 border-orange-400 mr-2"
                />
                <div className="absolute bottom-4 -left-6 bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3 rounded-xl shadow-lg">
                  <span className="text-white font-bold text-lg">Giá: $11</span>
                </div>
              </div>
              <div className="absolute right-0 top-0 flex flex-col gap-4">
                <img
                  src={assets.images.image90}
                  alt="Food item"
                  className="w-16 h-16 object-cover rounded-xl shadow-lg"
                />
                <img
                  src={assets.images.image77}
                  alt="Food item"
                  className="w-16 h-16 object-cover rounded-xl shadow-lg"
                />
                <img
                  src={assets.images.image91}
                  alt="Food item"
                  className="w-16 h-16 object-cover rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
