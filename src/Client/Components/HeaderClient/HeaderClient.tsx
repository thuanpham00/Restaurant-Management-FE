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
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      if (storeUser && !user?.id) {
        setUserLocal(storeUser)
        setUser?.(storeUser)
      }

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

      const userId = localStorage.getItem("userId") || storeUser?.id || user?.id
      console.log("userId:", userId)
      if (!userId) {
        console.log("No userId found")
        setLoading(false)
        return
      }
      try {
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
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [storeUser?.id, setUser])

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
      onSuccess: (response) => {
        toast.success(response.data.message || "Đăng xuất thành công", { autoClose: 1000 })
        clearLS()
        localStorage.removeItem("user")
        localStorage.removeItem("userId")
        LocalStorageEventTarget.dispatchEvent(new Event("ClearLS"))
        reset()
        setUserLocal(null)
        navigate(path.Login)
      },
      onError: (error) => {
        toast.error("Đăng xuất thất bại", { autoClose: 2000 })
        console.error("Logout error:", error)
      }
    })
  }

  console.log("Rendering with user:", user)

  if (loading) {
    return <div>Loading...</div>
  }

  const isHome = pathname === "/" || pathname === "/home"

  return (
    <header
      className={`relative bg-gray-900 ${
        isHome ? "overflow-hidden h-[300px] sm:h-[400px] md:h-[500px] lg:h-[573px]" : "overflow-visible h-auto"
      } z-[200]`}
    >
      <nav
        className={`relative z-[300] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 ${isHome ? "py-4 sm:py-5 md:py-7" : "py-3 sm:py-4"}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-full p-2 mr-2">
              <LucideUtensils size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">
              Restaurant<span className="text-orange-500">.</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 md:gap-6 text-white text-xs sm:text-sm md:text-base">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive
                  ? "text-orange-400 font-medium transition-colors"
                  : "text-white/80 hover:text-white transition-colors"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/menu"
              className={({ isActive }) =>
                isActive
                  ? "text-orange-400 font-medium transition-colors"
                  : "text-white/80 hover:text-white transition-colors"
              }
            >
              Menu
            </NavLink>
            <NavLink
              to="/table"
              className={({ isActive }) =>
                isActive
                  ? "text-orange-400 font-medium transition-colors"
                  : "text-white/80 hover:text-white transition-colors"
              }
            >
              Reservation
            </NavLink>
            <NavLink
              to="/Reservation-history"
              className={({ isActive }) =>
                isActive
                  ? "text-orange-400 font-medium transition-colors"
                  : "text-white/80 hover:text-white transition-colors"
              }
            >
              Reservation History
            </NavLink>
          </div>

          {/* Right side info */}
          <div className="flex items-center gap-3 sm:gap-4 text-white text-xs sm:text-sm md:text-base">
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex flex-col items-center gap-1 focus:outline-none group"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title={user?.name || "Tài khoản"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setMenuOpen((o) => !o)
                    }
                  }}
                >
                  <div className="relative">
                    <img
                      src={toMediaUrl(user?.avatar) || defaultAvatar}
                      alt={user?.name || "User"}
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.src = defaultAvatar
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full object-cover border border-gray-700 transition-all group-hover:border-orange-500"
                    />
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                  </div>
                  <span className="text-gray-300 max-w-[100px] sm:max-w-[120px] truncate hidden sm:block group-hover:text-orange-400 transition-colors">
                    {user?.name || "Tài khoản"}
                  </span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-7 mt-2 w-48 sm:w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-[100] before:content-[''] before:absolute before:-top-2 before:right-4 before:w-0 before:h-0 before:border-l-8 before:border-r-8 before:border-b-8 before:border-l-transparent before:border-r-transparent before:border-b-gray-800"
                  >
                    <div className="px-4 py-2 sm:py-3 border-b border-gray-700">
                      <p className="text-xs sm:text-sm text-gray-400">Đăng nhập với</p>
                      <p className="text-xs sm:text-sm font-medium text-white break-words">{user?.email || "-"}</p>
                    </div>
                    <ul className="py-1 text-xs sm:text-sm text-white">
                      <li>
                        <button
                          role="menuitem"
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-200"
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
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-200"
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
                    `px-3 py-1 sm:px-4 sm:py-2 rounded-md border border-gray-700 font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-orange-500/20 text-orange-400 border-orange-500"
                        : "bg-gray-800 text-white/80 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:scale-105"
                    }`
                  }
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `px-3 py-1 sm:px-4 sm:py-2 rounded-md border border-gray-700 font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-orange-500/20 text-orange-400 border-orange-500"
                        : "bg-gray-800 text-white/80 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:scale-105"
                    }`
                  }
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      {isHome && (
        <div className="relative z-[5] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mt-6 sm:mt-8 md:mt-12 lg:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
            <div className="text-center md:text-left">
              <p className="text-white/80 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">Hi, new friend!</p>
              <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium leading-tight mb-3 sm:mb-4 md:mb-6">
                We do not cook, we create your emotions!
              </h1>
              <p className="text-white/80 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto md:mx-0">
                Theres evidence that cooking, like other creative practices, can boost well-being, self-esteem, and
                other measures of mental health.
              </p>
              <NavLink to="/menu" className="inline-block text-orange-400 font-medium text-sm sm:text-base">
                Our menu
                <div className="h-px bg-orange-400 w-full mt-1"></div>
              </NavLink>
            </div>

            <div className="relative flex justify-center md:justify-end">
              <div className="relative mr-0 sm:mr-12 md:mr-16">
                <img
                  src={assets.images.image89}
                  alt="Main dish"
                  className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[350px] h-auto object-cover rounded-lg"
                />
                <div className="absolute bottom-2 sm:bottom-4 -left-4 sm:-left-6 bg-orange-400 px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded">
                  <span className="text-white font-medium text-sm sm:text-base md:text-lg">Price: $11</span>
                </div>
              </div>

              <div className="absolute right-0 top-0 space-y-3 sm:space-y-4">
                <img
                  src={assets.images.image90}
                  alt="Food item"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded"
                />
                <img
                  src={assets.images.image77}
                  alt="Food item"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded"
                />
                <img
                  src={assets.images.image91}
                  alt="Food item"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded"
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