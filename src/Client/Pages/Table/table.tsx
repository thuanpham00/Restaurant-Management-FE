import { useState } from "react"
import { Calendar, Clock, Users, MessageSquare, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { reservationAPI } from "src/Apis/Client/table.api"
import { toast } from "react-toastify"
import { assets } from "src/Assets/assets"
import { useAppStore } from "src/StateGlobal/zustand"
import { isAxiosError } from "axios"
import { useEffect } from "react"
import { userAPI } from "src/Apis/Client/settings.api"

function pad2(n: number) {
  return n.toString().padStart(2, "0")
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function toTimeStr(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function combineDateTime(date: string, time: string) {
  return `${date} ${time}:00`
}

const TableReservation: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppStore()
  const now = new Date()
  const [date, setDate] = useState<string>(toDateStr(now))
  const [time, setTime] = useState<string>(toTimeStr(now))
  const [people, setPeople] = useState<number>(2)
  const [notes, setNotes] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const [phone, setPhone] = useState<string>("")
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const id = localStorage.getItem("userId") || ""
  const [phoneError, setPhoneError] = useState<string>("")

  useEffect(() => {
    const cached = localStorage.getItem("user")
    if (cached) {
      try {
        const u = JSON.parse(cached)
        const phoneValue = u?.customer_profile?.phone || ""
        setUserPhone(phoneValue)
        setPhone(phoneValue)
      } catch {
        // ignore
      }
    }

    async function fetchUserPhone() {
      if (isAuthenticated && id) {
        try {
          const res = await userAPI.getById(id)
          const phoneValue = res.data.data.customer_profile?.phone || ""
          setUserPhone(phoneValue)
          setPhone(phoneValue)
          localStorage.setItem("user", JSON.stringify(res.data.data))
        } catch {
          setUserPhone(null)
        }
      }
    }
    fetchUserPhone()
  }, [isAuthenticated, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setPhoneError("")
    if (!userPhone) {
      const phoneRegex = /^0\d{9,10}$/
      if (!phone || !phoneRegex.test(phone)) {
        setPhoneError("Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng!")
        return
      }
    }
    if (!isAuthenticated) {
      toast.warning("Bạn cần đăng nhập để đặt bàn", {
        autoClose: 2000,
        position: "top-center"
      })

      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      setTimeout(() => {
        navigate("/login")
      }, 1000)
      return
    }

    if (people > 10) {
      toast.error("Số người không được vượt quá 10")
      setPeople(1)
      return
    }

    if (!userPhone && !phone) {
      toast.error("Vui lòng nhập số điện thoại")
      return
    }

    if (!date || !time || !people || people < 1) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }

    const reserved_at = combineDateTime(date, time)
    setLoading(true)

    try {
      // Nếu chưa có số điện thoại → cập nhật trước khi đặt bàn
      if (!userPhone && phone) {
        await userAPI.update({ phone })
      }

      await reservationAPI.create({
        number_of_people: people,
        reserved_at,
        notes: notes.trim() ? notes.trim() : null
      })
      toast.success("Đặt bàn thành công!", { autoClose: 1500 })

      setTimeout(() => {
        navigate("/reservation-history")
      }, 1500)
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        const message = err.response?.data?.message
        const data = err.response?.data?.data

        if (status === 401 || status === 403) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại", {
            autoClose: 2000,
            position: "top-center"
          })

          sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
          setTimeout(() => {
            navigate("/login")
          }, 1000)
          return
        }

        if (status === 422) {
          if (message?.includes("customer") || message?.includes("Customer")) {
            toast.error("Tài khoản chưa có hồ sơ khách hàng. Vui lòng cập nhật thông tin cá nhân trước", {
              autoClose: 3000,
              position: "top-center"
            })

            setTimeout(() => {
              navigate("/settings")
            }, 2000)
            return
          }

          toast.error(message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại", {
            autoClose: 2000
          })
          setLoading(false)
          return
        }

        if (status === 429) {
          const retryAfter = data?.retry_after_seconds
          const nextAllowedAt = data?.next_allowed_at

          let errorMsg = message || "Bạn đã đặt bàn quá số lần cho phép"

          if (retryAfter) {
            const minutes = Math.ceil(retryAfter / 60)
            errorMsg += `. Vui lòng thử lại sau ${minutes} phút`
          } else if (nextAllowedAt) {
            errorMsg += `. Vui lòng thử lại sau ${nextAllowedAt}`
          }

          toast.error(errorMsg, {
            autoClose: 5000,
            position: "top-center"
          })
          setLoading(false)
          return
        }

        toast.error(message || "Không thể đặt bàn. Vui lòng thử lại", {
          autoClose: 2000
        })
      } else {
        toast.error("Có lỗi xảy ra. Vui lòng thử lại sau", { autoClose: 2000 })
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
        {/* Background Image with Enhanced Blur */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${assets.images.background})`,
            filter: "blur(8px)",
            transform: "scale(1.1)"
          }}
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent" />

        {/* Animated Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl px-6 py-12">
          {/* Heading with Icon */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/20 border-2 border-orange-500/30 mb-6">
              <Calendar className="w-10 h-10 text-orange-400" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              Đặt bàn trực tuyến
            </h1>
            <p className="text-gray-400 text-lg md:text-xl">Đặt bàn của bạn cho bữa trưa hoặc bữa tối</p>
            <div className="mt-6 h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
          </div>

          {/* Login Alert */}
          {!isAuthenticated && (
            <div className="mb-8 group">
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/50 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-orange-400 font-semibold text-lg mb-2">Yêu cầu đăng nhập</p>
                    <p className="text-orange-300/90 mb-3">Bạn cần đăng nhập để có thể đặt bàn trực tuyến</p>
                    <button
                      onClick={() => {
                        sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
                        navigate("/login")
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Đăng nhập ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reservation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Container */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-10 border-2 border-gray-700/50 shadow-2xl">
              {/* Date & Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Date Input */}
                <div className="group">
                  <label
                    htmlFor="date"
                    className="block text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Chọn ngày
                  </label>

                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-gray-900/60 backdrop-blur-sm border-2 border-gray-700/50 rounded-xl px-12 py-4 text-white cursor-pointer focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 hover:border-gray-600 appearance-none hide-picker"
                      required
                    />
                  </div>
                </div>

                {/* Time Input */}
                <div className="group">
                  <label
                    htmlFor="time"
                    className="block text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Chọn giờ
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <input
                      id="time"
                      type="time"
                      min="08:00"
                      max="22:00"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-gray-900/60 backdrop-blur-sm border-2 border-gray-700/50 rounded-xl px-12 py-4 text-white cursor-pointer focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 hover:border-gray-600 appearance-none hide-picker"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6" />

              {/* Number of People */}
              <div className="group mb-6">
                <label
                  htmlFor="people"
                  className="block text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Số người
                </label>

                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />

                  {people > 10 && (
                    <div className="absolute -top-12 left-0 flex items-center gap-2 text-sm text-red-400 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Chỉ được nhập tối đa 10 người</span>
                    </div>
                  )}

                  <input
                    id="people"
                    type="number"
                    value={people || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setPeople(val)
                    }}
                    placeholder="Nhập số người (1-10)"
                    min={1}
                    max={10}
                    className={`w-full bg-gray-900/60 backdrop-blur-sm border-2 ${
                      people > 10
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-700/50 focus:border-orange-500 focus:ring-orange-500/20"
                    } rounded-xl px-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 hover:border-gray-600 appearance-none`}
                    required
                  />
                </div>
              </div>

              {/* SỐ ĐIỆN THOẠI - THEO YÊU CẦU */}
              <div className="group mb-6">
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Số điện thoại
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                  {userPhone ? (
                    <input
                      id="phone"
                      type="text"
                      value={userPhone}
                      disabled
                      className="w-full bg-gray-900/60 border-2 border-gray-700/50 rounded-xl pl-12 pr-4 py-4 text-white cursor-not-allowed focus:outline-none"
                    />
                  ) : (
                    <>
                      <input
                        id="phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className={`w-full bg-gray-900/60 border-2 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500
            focus:outline-none transition-all duration-300
            ${phoneError ? "border-red-500" : "border-gray-700/50"}`}
                        required
                      />
                      {phoneError && (
                        <p className="absolute left-0 -bottom-6 w-full text-red-500 text-sm mt-1">{phoneError}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6" />

              {/* Special Request */}
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Ghi chú (Tùy chọn)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm, vị trí ngồi ưa thích..."
                  rows={5}
                  className="w-full bg-gray-900/60 backdrop-blur-sm border-2 border-gray-700/50 rounded-xl px-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 hover:border-gray-600 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading || !isAuthenticated}
                className={`group relative inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-2xl transition-all duration-300 ${
                  loading || !isAuthenticated
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-orange-500/50 hover:-translate-y-1"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>Xác nhận đặt bàn</span>
                  </>
                )}
                {/* Glow effect */}
                {!loading && !isAuthenticated && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                )}
              </button>
            </div>

            {/* Info Text */}
            <p className="text-center text-gray-500 text-sm mt-6">
              Nhà hàng phục vụ từ <span className="text-orange-400 font-semibold">8:00 - 22:00</span> hàng ngày
            </p>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default TableReservation
