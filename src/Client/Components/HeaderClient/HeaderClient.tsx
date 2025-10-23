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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        navigate(path.Login, { replace: true })
      },
      onError: (error) => {
        toast.error("Đăng xuất thất bại", { autoClose: 2000 })
        console.error("Logout error:", error)
      }
    })
  }

  const isHome = pathname === "/" || pathname === "/home"

  return (
    <>
      <nav className="sticky top-0 left-0 z-[200] bg-gray-900 shadow-xl px-4 sm:px-8 lg:px-16 xl:px-24 flex items-center justify-between py-4">
        {/* Logo */}
        <NavLink to="/home" className="mx-4 flex items-center justify-center gap-1 py-2 px-2 rounded-lg">
          <div className="w-14 h-12">
            <img src={assets.icons.vector} alt="Logo" className="w-full h-full" />
          </div>
          <span className="text-white text-lg font-bold text-center -tracking-tighter pl-4 font-serif">Restaurant</span>
        </NavLink>

        {/* Hamburger button - chỉ hiện trên mobile */}
        <button
          className="block md:hidden text-white text-3xl"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu"
        >
          {/* Hamburger icon SVG */}
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <rect y="4" width="24" height="2" rx="1" fill="currentColor" />
            <rect y="11" width="24" height="2" rx="1" fill="currentColor" />
            <rect y="18" width="24" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>

        {/* Navigation - chỉ hiện trên md trở lên */}
        <div className="hidden md:flex items-center gap-6 text-white text-base font-medium">
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

        {/* User menu - chỉ hiện trên md trở lên */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 bg-gray-800/80  rounded-3xl px-3 py-3 shadow-lg hover:scale-105 transition-all"
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
                <span className="text-white font-semibold text-[12px]">{user?.name || "Tài khoản"}</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-56 bg-gray-900/95 border border-orange-400 rounded-xl shadow-2xl z-[100] p-2
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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex">
          <div className="bg-gray-900 w-1/2 max-w-xs h-full p-6 flex flex-col">
            <button
              className="mb-8 text-white text-2xl self-end"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Đóng menu"
            >
              &times;
            </button>
            <nav className="flex flex-col gap-6 text-white text-lg font-medium">
              <NavLink to="/home" onClick={() => setMobileMenuOpen(false)}>
                Trang chủ
              </NavLink>
              <NavLink to="/menu" onClick={() => setMobileMenuOpen(false)}>
                Thực đơn
              </NavLink>
              <NavLink to="/table" onClick={() => setMobileMenuOpen(false)}>
                Đặt bàn
              </NavLink>
              <NavLink to="/Reservation-history" onClick={() => setMobileMenuOpen(false)}>
                Lịch sử đặt bàn
              </NavLink>
              <div className="mt-8 border-t border-gray-700 pt-6 flex flex-col gap-4">
                {isAuthenticated ? (
                  <>
                    <button
                      className="text-white text-left"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        navigate("/settings")
                      }}
                    >
                      Thông tin cá nhân
                    </button>
                    <button
                      className="text-white text-left"
                      disabled={logoutMutation.isPending}
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Đăng nhập
                    </NavLink>
                    <NavLink to="/register" onClick={() => setMobileMenuOpen(false)}>
                      Đăng ký
                    </NavLink>
                  </>
                )}
              </div>
            </nav>
          </div>
          {/* Click ngoài để đóng menu */}
          <div
            className="flex-1"
            role="button"
            tabIndex={0}
            aria-label="Đóng menu"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setMobileMenuOpen(false)
              }
            }}
          />
        </div>
      )}

      {/* Hero Section for Home */}
      {isHome && (
        <header className="relative overflow-hidden h-[340px] sm:h-[440px] md:h-[540px] lg:h-[600px] z-[100] bg-gradient-to-br from-orange-500/10 via-gray-900/90 to-gray-900">
          <div className="relative z-[5] px-4 sm:px-8 lg:px-16 xl:px-24 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="text-center md:text-left">
                <p className="text-orange-400 text-base font-semibold mb-4 animate-pulse">
                  Chào mừng bạn mới đến với Restaurant!
                </p>
                <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 drop-shadow-lg">
                  Không chỉ là món ăn, mà là trải nghiệm cảm xúc!
                </h1>
                <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto md:mx-0">
                  Nấu ăn là nghệ thuật, là niềm vui và là sự kết nối. Hãy khám phá thực đơn đa dạng và không gian ấm
                  cúng của chúng tôi!
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
                    <span className="text-white font-bold text-lg">Giá: 300.000VND</span>
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
        </header>
      )}
    </>
  )
}

export default Header
