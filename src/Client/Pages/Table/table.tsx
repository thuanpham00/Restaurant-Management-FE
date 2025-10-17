import { useState } from "react"
import { Calendar, Clock, Users, MessageSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { reservationAPI } from "src/Apis/Client/table.api"
import { toast } from "react-toastify"
import { assets } from "src/Assets/assets"
import { useAppStore } from "src/StateGlobal/zustand"
import { isAxiosError } from "axios"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Kiểm tra đăng nhập trước khi đặt bàn
    if (!isAuthenticated) {
      toast.warning("Bạn cần đăng nhập để đặt bàn", {
        autoClose: 2000,
        position: "top-center"
      })

      // Lưu URL hiện tại để redirect lại sau khi đăng nhập
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)

      // Chuyển đến trang đăng nhập sau 1 giây
      setTimeout(() => {
        navigate("/login")
      }, 1000)
      return
    }

    if (!date || !time || !people || people < 1) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }

    const reserved_at = combineDateTime(date, time)
    setLoading(true)

    try {
      await reservationAPI.create({
        number_of_people: people,
        reserved_at,
        notes: notes.trim() ? notes.trim() : null
      })
      toast.success("Đặt bàn thành công!", { autoClose: 1500 })

      // Chuyển hướng sau 1.5 giây
      setTimeout(() => {
        navigate("/reservation-history")
      }, 1500)
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        const message = err.response?.data?.message
        const data = err.response?.data?.data

        // Xử lý lỗi 401/403 - Chưa đăng nhập hoặc không có quyền
        if (status === 401 || status === 403) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại", {
            autoClose: 2000,
            position: "top-center"
          })

          // Lưu URL để redirect lại
          sessionStorage.setItem("redirectAfterLogin", window.location.pathname)

          setTimeout(() => {
            navigate("/login")
          }, 1000)
          return
        }

        // Xử lý lỗi 422 - Chưa có customer profile
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

        // Xử lý lỗi 429 - Rate limit (đặt bàn quá nhiều lần)
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

        // Các lỗi khác
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Blur */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${assets.images.background})`,
            backgroundBlendMode: "overlay",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Content */}
        <div className="relative z-10 w-full max-w-3xl px-6 py-12">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-4 tracking-wide">Đặt bàn trực tuyến</h1>
            <p className="text-gray-300 text-lg md:text-xl">Đặt bàn của bạn cho bữa trưa hoặc bữa tối.</p>
          </div>

          {/* Thông báo yêu cầu đăng nhập */}
          {!isAuthenticated && (
            <div className="mb-6 bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 text-center">
              <p className="text-orange-400 font-medium">
                ⚠️ Bạn cần đăng nhập để đặt bàn.{" "}
                <button
                  onClick={() => {
                    sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
                    navigate("/login")
                  }}
                  className="underline hover:text-orange-300 transition-colors"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          )}

          {/* Reservation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ô chọn ngày */}
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 text-white pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full bg-black/40 border border-white/30 rounded-lg px-12 py-3 text-white cursor-pointer focus:border-orange-500 outline-none appearance-none hide-picker"
                  required
                />
              </div>

              {/* Ô chọn giờ */}
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 text-white pointer-events-none" />
                <input
                  type="time"
                  min="08:00"
                  max="22:00"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full bg-black/40 border border-white/30 rounded-lg px-12 py-3 text-white cursor-pointer focus:border-orange-500 outline-none appearance-none hide-picker"
                  required
                />
              </div>
            </div>

            {/* Second Row - Number of People */}
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <select
                value={people}
                onChange={(e) => setPeople(Number(e.target.value))}
                className="w-full bg-black/40 backdrop-blur-sm border border-white/30 rounded-lg px-12 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:border-white/50 appearance-none cursor-pointer"
                required
              >
                <option value="" disabled className="bg-gray-900">
                  Số người
                </option>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num} className="bg-gray-900">
                    {num} {num === 1 ? "Người" : num === 7 ? "Người trở lên" : "Người"}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Third Row - Special Request */}
            <div className="relative group">
              <MessageSquare className="absolute left-4 top-6 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú hoặc yêu cầu đặc biệt"
                rows={4}
                className="w-full bg-black/40 backdrop-blur-sm border border-white/30 rounded-lg px-12 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:border-white/50 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading || !isAuthenticated}
                className={`bg-[#f18d2d] text-white font-semibold px-10 py-6 text-lg rounded-lg shadow-[0_4px_0px_rgba(0,0,0,0.2)] hover:bg-[#e17b1f] transition-all duration-300 ${
                  loading || !isAuthenticated ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Đang đặt bàn..." : "Xác nhận đặt bàn"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default TableReservation