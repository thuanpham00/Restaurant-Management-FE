import { useEffect, useRef, useState } from "react"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { useAppStore } from "src/StateGlobal/zustand"
import { userAPI } from "src/Apis/Client/settings.api"
import { isAxiosError } from "axios"
import { toast } from "react-toastify"
import { User as UserIcon, Lock, FileText } from "lucide-react"
import type { User as UserType } from "src/Types/user.type"
import { toMediaUrl } from "src/Helpers/media"
import { Eye, EyeOff } from "lucide-react"
import { Invoice } from "src/Types/invoice.type"
import { assets } from "src/Assets/assets"

const defaultAvatar = assets.images.default_avatar

export default function Setting() {
  const { user: storeUser, setUser } = useAppStore() as {
    user?: UserType
    setUser?: (u: UserType) => void
  }

  const MEMBERSHIP_LABEL: Record<number, string> = {
    0: "Bronze",
    1: "Silver",
    2: "Gold",
    3: "Titanium"
  }
  const MEMBERSHIP_COLOR: Record<number, string> = {
    0: "bg-gradient-to-r from-yellow-700 to-yellow-500 text-yellow-100",
    1: "bg-gradient-to-r from-gray-400 to-gray-200 text-gray-900",
    2: "bg-gradient-to-r from-yellow-400 to-yellow-200 text-yellow-900",
    3: "bg-gradient-to-r from-blue-700 to-blue-400 text-white"
  }

  const [user, setUserLocal] = useState<UserType | null>(storeUser || null)
  const [form, setForm] = useState({ email: "", phone: "", address: "", full_name: "" })
  const [saving, setSaving] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"account" | "password" | "invoices">("account")
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  const [pwd, setPwd] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  })

  const [showPwd, setShowPwd] = useState({
    current: false,
    next: false,
    confirm: false
  })

  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const init = async () => {
      if (storeUser && !user?.id) {
        setUserLocal(storeUser)
        setUser?.(storeUser)
        setGender(storeUser.customer_profile?.gender ?? null)
        setForm({
          email: storeUser.email ?? "",
          full_name: storeUser.customer_profile?.full_name ?? "",
          phone: storeUser.customer_profile?.phone ?? "",
          address: storeUser.customer_profile?.address ?? ""
        })
      }

      const cached = localStorage.getItem("user")
      if (cached && !user?.id) {
        try {
          const u = JSON.parse(cached) as UserType
          if (u?.id) {
            setUserLocal(u)
            setUser?.(u)
            setGender(u.customer_profile?.gender ?? null)
            setForm({
              email: u.email ?? "",
              full_name: u.customer_profile?.full_name ?? "",
              phone: u.customer_profile?.phone ?? "",
              address: u.customer_profile?.address ?? ""
            })
          }
        } catch {
          // ignore
        }
      }

      const id = storeUser?.id || user?.id || localStorage.getItem("userId") || ""
      if (!id) return
      try {
        const res = await userAPI.getById(id)
        if (res.data.status === "success") {
          setUserLocal(res.data.data)
          setUser?.(res.data.data)
          setGender(res.data.data.customer_profile?.gender ?? null)
          setForm({
            email: res.data.data.email ?? "",
            full_name: res.data.data.customer_profile?.full_name ?? "",
            phone: res.data.data.customer_profile?.phone ?? "",
            address: res.data.data.customer_profile?.address ?? ""
          })
          localStorage.setItem("user", JSON.stringify(res.data.data))
        }
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          setError("Bạn không có quyền xem thông tin người dùng")
        } else {
          setError("Không thể tải thông tin người dùng")
        }
      }
    }
    init()
  }, [storeUser?.id])

  useEffect(() => {
    setForm({
      email: user?.email ?? "",
      full_name: user?.customer_profile?.full_name ?? "",
      phone: user?.customer_profile?.phone ?? "",
      address: user?.customer_profile?.address ?? ""
    })
  }, [user?.id])

  useEffect(() => {
    if (activeTab === "invoices" && invoices.length === 0) {
      fetchInvoices()
    }
  }, [activeTab])

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    setError(null)
    try {
      const res = await userAPI.getMyInvoices()
      if (res.data.status === "success") {
        setInvoices(res.data.data)
      }
    } catch (error: unknown) {
      let msg = "Không thể tải lịch sử hóa đơn"
      if (isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined
        if (error.response?.status === 404) {
          msg = "Không tìm thấy thông tin khách hàng"
        } else if (data?.message) {
          msg = data.message
        }
      }
      setError(msg)
      toast.error(msg)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      toast.error("Không tìm thấy thông tin người dùng")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await userAPI.update({
        email: form.email,
        full_name: form.full_name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        gender: gender || undefined
      })
      if (res.data.status === "success") {
        setUserLocal(res.data.data)
        setForm({
          email: res.data.data.email ?? "",
          full_name: res.data.data.customer_profile?.full_name ?? "",
          phone: res.data.data.customer_profile?.phone ?? "",
          address: res.data.data.customer_profile?.address ?? ""
        })
        setUser?.(res.data.data)
        localStorage.setItem("user", JSON.stringify(res.data.data))
        toast.success("Cập nhật thông tin thành công")
      }
    } catch (error: unknown) {
      let msg = "Cập nhật thất bại"
      if (isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined
        if (error.response?.status === 403) {
          msg = "Bạn không có quyền cập nhật hồ sơ"
        } else if (data?.message) {
          msg = data.message
        }
      }
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (file?: File) => {
    if (!file) return
    setAvatarUploading(true)
    setError(null)
    try {
      const res = await userAPI.uploadAvatar(file)
      if (res.data.status === "success") {
        const avatar = res.data.data.avatar
        const updatedUser = { ...(user as UserType), avatar }
        setUserLocal(updatedUser)
        setUser?.(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))

        toast.success("Cập nhật ảnh đại diện thành công! Đang làm mới...", { autoClose: 1000 })
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error: unknown) {
      let msg = "Tải ảnh thất bại"
      if (isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined
        if (error.response?.status === 403) {
          msg = "Bạn không có quyền cập nhật ảnh đại diện"
        } else if (data?.message) {
          msg = data.message
        }
      }
      setError(msg)
      toast.error(msg)
      setAvatarUploading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwd.current_password || !pwd.new_password || !pwd.new_password_confirmation) {
      toast.error("Vui lòng nhập đủ thông tin")
      return
    }
    setPwdSaving(true)
    setError(null)
    try {
      await userAPI.changePassword(pwd)
      toast.success("Đổi mật khẩu thành công")
      setPwd({
        current_password: "",
        new_password: "",
        new_password_confirmation: ""
      })
    } catch (error: unknown) {
      let msg = "Đổi mật khẩu thất bại"
      if (isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined
        if (error.response?.status === 403) {
          msg = "Bạn không có quyền đổi mật khẩu"
        } else if (data?.message) {
          msg = data.message
        }
      }
      setError(msg)
      toast.error(msg)
    } finally {
      setPwdSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400 border-green-500/40"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/40"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/40"
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-[#111827] to-gray-900 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-start justify-center py-12 px-4 sm:px-6 lg:px-12">
        <div className="w-full max-w-6xl">
          {error && (
            <div className="bg-gradient-to-r from-red-500/80 to-orange-500/60 text-white p-4 rounded-xl mb-8 max-w-2xl mx-auto text-center shadow-lg font-sans border-2 border-red-500/40">
              {error}
            </div>
          )}
          <div className="flex flex-col md:flex-row bg-gradient-to-br from-[#181818] via-[#181818]/80 to-[#222] rounded-3xl overflow-hidden shadow-2xl border border-[#222] backdrop-blur-md">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 bg-gradient-to-br from-[#141414] via-[#181818]/80 to-[#222] border-r border-[#222] p-8 flex flex-col items-center">
              <div className="relative mb-4">
                <img
                  src={toMediaUrl(user?.avatar) || defaultAvatar}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.src = defaultAvatar
                  }}
                  alt={user?.name || "User"}
                  className="h-24 w-24 rounded-full object-cover border-4 border-orange-500/30 shadow-lg"
                />
                <span className="absolute bottom-0 right-0 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                  {user?.name?.split(" ")[0] || "User"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">{user?.name || "User"}</h2>
              <p className="text-gray-400 text-sm mb-6">{user?.email}</p>
              <div className="w-full flex flex-col items-center mb-6">
                <span className="text-gray-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="inline-block text-orange-400">
                    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" />
                  </svg>
                  Cấp độ thành viên
                </span>
                <div
                  className={`px-5 py-2 rounded-xl font-bold shadow-lg text-lg tracking-wide ${MEMBERSHIP_COLOR[user?.customer_profile?.membership_level ?? 0]}`}
                >
                  {MEMBERSHIP_LABEL[user?.customer_profile?.membership_level ?? 0]}
                </div>
              </div>
              <div className="mt-6 w-full space-y-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("account")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === "account"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border border-orange-500/60"
                      : "bg-[#0e0e0e] text-gray-400 border border-[#2a2a2a] hover:bg-orange-600 hover:text-white hover:border-orange-600/60"
                  }`}
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Thông tin tài khoản</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("password")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === "password"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border border-orange-500/60"
                      : "bg-[#0e0e0e] text-gray-400 border border-[#2a2a2a] hover:bg-orange-600 hover:text-white hover:border-orange-600/60"
                  }`}
                >
                  <Lock className="h-5 w-5" />
                  <span>Đổi mật khẩu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("invoices")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === "invoices"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border border-orange-500/60"
                      : "bg-[#0e0e0e] text-gray-400 border border-[#2a2a2a] hover:bg-orange-600 hover:text-white hover:border-orange-600/60"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>Lịch sử hóa đơn</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="w-full md:flex-1 p-8 md:p-10">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {activeTab === "account" && "Thông tin tài khoản"}
                {activeTab === "password" && "Đổi mật khẩu"}
                {activeTab === "invoices" && "Lịch sử hóa đơn"}
              </h1>
              <p className="text-gray-400 mb-6 text-base">
                {activeTab === "account" && "Cập nhật thông tin cá nhân của bạn tại đây."}
                {activeTab === "password" && "Thay đổi mật khẩu để bảo mật tài khoản."}
                {activeTab === "invoices" && "Xem lại các hóa đơn thanh toán của bạn."}
              </p>

              <div className="bg-gradient-to-br from-[#101010] via-[#181818]/80 to-[#222] border border-[#222] rounded-2xl p-6 md:p-8 shadow-xl">
                {activeTab === "account" && (
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-3">
                      <label htmlFor="email" className="text-gray-300 font-semibold">
                        Email
                      </label>
                      <input
                        type="text"
                        id="email"
                        value={form.email}
                        disabled
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white opacity-50 cursor-not-allowed outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="full_name" className="text-gray-300 font-semibold">
                        Tên đầy đủ
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        value={form.full_name}
                        onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/40 outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="phone" className="text-gray-300 font-semibold">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/40 outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="address" className="text-gray-300 font-semibold">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/40 outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="gender" className="text-gray-300 font-semibold">
                        Giới tính
                      </label>
                      <div className="flex gap-6 text-white">
                        {(["male", "female", "other"] as const).map((g) => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={gender === g}
                              onChange={() => setGender(g)}
                              className="accent-orange-500"
                            />
                            <span>{g === "male" ? "Nam" : g === "female" ? "Nữ" : "Khác"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="avatar" className="text-gray-300 font-semibold">
                        Ảnh đại diện
                      </label>
                      <div className="flex items-center gap-6">
                        <img
                          src={toMediaUrl(user?.avatar) || defaultAvatar}
                          onError={(e) => {
                            const t = e.target as HTMLImageElement
                            t.src = defaultAvatar
                          }}
                          alt="Avatar"
                          className="h-24 w-24 rounded-full border-4 border-orange-500/30 shadow-lg"
                        />
                        <div>
                          <input
                            ref={avatarInputRef}
                            id="avatar_file"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={avatarUploading}
                            onChange={(e) => handleAvatar(e.target.files?.[0])}
                          />
                          <button
                            type="button"
                            disabled={avatarUploading}
                            onClick={() => avatarInputRef.current?.click()}
                            className={`px-4 py-2 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:bg-orange-600 hover:border-orange-600/60 transition-all duration-200 ${
                              avatarUploading ? "opacity-60 cursor-not-allowed" : ""
                            }`}
                          >
                            {avatarUploading ? "Đang tải..." : "Chọn ảnh"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`mt-6 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl border border-orange-500/60 hover:bg-orange-600 hover:border-orange-600/60 transition-all duration-200 ${
                        saving ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </form>
                )}

                {activeTab === "password" && (
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-3">
                      <label htmlFor="current_password" className="text-gray-300 font-semibold">
                        Mật khẩu hiện tại
                      </label>
                      <div className="relative">
                        <input
                          id="current_password"
                          type={showPwd.current ? "text" : "password"}
                          value={pwd.current_password}
                          onChange={(e) => setPwd((p) => ({ ...p, current_password: e.target.value }))}
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 pr-12 text-white focus:ring-2 focus:ring-orange-500/40 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-all duration-200"
                          aria-label="Ẩn/hiện mật khẩu hiện tại"
                        >
                          {showPwd.current ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="new_password" className="text-gray-300 font-semibold">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          id="new_password"
                          type={showPwd.next ? "text" : "password"}
                          value={pwd.new_password}
                          onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))}
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 pr-12 text-white focus:ring-2 focus:ring-orange-500/40 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-all duration-200"
                          aria-label="Ẩn/hiện mật khẩu mới"
                        >
                          {showPwd.next ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="new_password_confirmation" className="text-gray-300 font-semibold">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          id="new_password_confirmation"
                          type={showPwd.confirm ? "text" : "password"}
                          value={pwd.new_password_confirmation}
                          onChange={(e) => setPwd((p) => ({ ...p, new_password_confirmation: e.target.value }))}
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 pr-12 text-white focus:ring-2 focus:ring-orange-500/40 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-all duration-200"
                          aria-label="Ẩn/hiện xác nhận mật khẩu"
                        >
                          {showPwd.confirm ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={pwdSaving}
                      className={`mt-6 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl border border-orange-500/60 hover:bg-orange-600 hover:border-orange-600/60 transition-all duration-200 ${
                        pwdSaving ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {pwdSaving ? "Đang đổi..." : "Đổi mật khẩu"}
                    </button>
                  </form>
                )}

                {activeTab === "invoices" && (
                  <div className="space-y-4">
                    {loadingInvoices ? (
                      <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent"></div>
                        <p className="text-gray-400 mt-4">Đang tải hóa đơn...</p>
                      </div>
                    ) : invoices.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Bạn chưa có hóa đơn nào</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {invoices.map((invoice) => (
                          <div
                            key={invoice.invoice_id}
                            className="bg-gradient-to-br from-[#1a1a1a] via-[#181818]/80 to-[#222] border border-[#2a2a2a] rounded-xl p-6 hover:border-orange-500/40 transition-all shadow-lg"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-white font-semibold text-lg">
                                  <p>
                                    {invoice.created_at
                                      ? `Hóa đơn được lập ngày ${new Date(invoice.created_at).toLocaleDateString("vi-VN")}`
                                      : "Hóa đơn chưa được lập"}
                                  </p>
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">Bàn: {invoice.table_id}</p>
                                <p className="text-gray-500 text-xs mt-1">{invoice.created_at}</p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  invoice.status
                                )}`}
                              >
                                {invoice.status_label}
                              </span>
                            </div>
                            <div className="space-y-2 border-t border-[#2a2a2a] pt-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Tổng tiền:</span>
                                <span className="text-white font-medium">{invoice.total_amount} VND</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Giảm giá:</span>
                                <span className="text-orange-500">{invoice.discount_amount} VND</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Thuế:</span>
                                <span className="text-white">{invoice.tax_amount} VND</span>
                              </div>
                              <div className="flex justify-between text-base font-semibold border-t border-[#2a2a2a] pt-2 mt-2">
                                <span className="text-white">Thành tiền:</span>
                                <span className="text-orange-500">{invoice.final_amount} VND</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
