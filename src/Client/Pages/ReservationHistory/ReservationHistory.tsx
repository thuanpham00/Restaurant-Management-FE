import { useEffect, useState } from "react"
import Header from "../../Components/HeaderClient/HeaderClient"
import Footer from "../../Components/FooterClient/FooterClient"
import { reservationAPI } from "src/Apis/Client/ReservationHistory.api"
import { Reservation } from "src/Types/reservation.type"
import { isAxiosError, AxiosResponse } from "axios"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  Users,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

type Paginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const STATUS_LABEL: Record<number, string> = {
  0: "Chờ xác nhận",
  1: "Đã xác nhận",
  2: "Đã hủy",
  3: "Đã hoàn thành"
}

const STATUS_CLASS: Record<number, string> = {
  0: "bg-yellow-600/30 text-yellow-300 border border-yellow-700/50",
  1: "bg-green-600/30 text-green-300 border border-green-700/50",
  2: "bg-red-600/30 text-red-300 border border-red-700/50",
  3: "bg-blue-600/30 text-blue-300 border border-blue-700/50"
}

const STATUS_GLOW: Record<number, string> = {
  0: "bg-yellow-500/20",
  1: "bg-green-500/20",
  2: "bg-red-500/20",
  3: "bg-blue-500/20"
}

const STATUS_ICON: Record<number, React.ElementType> = {
  0: AlertCircle,
  1: CheckCircle,
  2: XCircle,
  3: CheckCircle
}

function normalizeStatus(s: unknown): number {
  const n = Number(s)
  return [0, 1, 2, 3].includes(n) ? n : 0
}

function fmt(d: string) {
  const date = new Date(d)
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, "0")
  const mi = String(date.getMinutes()).padStart(2, "0")
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

// Type guard: kiểm tra xem object có field "data" không
function hasNestedData<T>(obj: unknown): obj is { data: Paginated<T> } {
  return typeof obj === "object" && obj !== null && "data" in obj
}

const ReservationHistory: React.FC = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState<Reservation[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem("access_token")))

  // Theo dõi thay đổi access_token để cập nhật trạng thái đăng nhập
  useEffect(() => {
    const handler = () => setIsAuthenticated(Boolean(localStorage.getItem("access_token")))
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const load = async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res: AxiosResponse<Paginated<Reservation> | { data: Paginated<Reservation> }> = await reservationAPI.listMy(
        { page: p, per_page: 10 }
      )

      const payload = res.data
      const pg: Paginated<Reservation> = hasNestedData<Reservation>(payload) ? payload.data : payload

      setItems(pg.data ?? [])
      setPage(pg.current_page ?? 1)
      setLastPage(pg.last_page ?? 1)
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Vui lòng đăng nhập để xem lịch sử đặt bàn.")
        } else {
          setError(err.response?.data?.message || "Không thể tải lịch sử đặt bàn.")
        }
      } else {
        setError("Có lỗi xảy ra.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      load(1)
    } else {
      setLoading(false)
      setItems([])
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />

      <section className="container mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
            Lịch sử đặt bàn
          </h1>
          <p className="text-gray-400 text-lg">Quản lý và theo dõi các đặt bàn của bạn</p>
        </div>

        {/* Loading State */}
        {loading && isAuthenticated && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Login Alert */}
        {!isAuthenticated && (
          <div className="mb-8 group">
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/50 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-orange-400 font-semibold text-lg mb-2">Yêu cầu đăng nhập</p>
                  <p className="text-orange-300/90 mb-3">Bạn cần đăng nhập để xem lịch sử đặt bàn</p>
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

        {/* Error State */}
        {error && isAuthenticated && (
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-2xl p-6 mb-6 max-w-2xl backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-semibold text-lg mb-1">Có lỗi xảy ra</h3>
                <p className="text-red-300/90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && isAuthenticated && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-800/50 border-2 border-gray-700 mb-6">
              <Calendar className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">Chưa có đặt bàn nào</h3>
            <p className="text-gray-500 mb-6">Hãy đặt bàn ngay để trải nghiệm dịch vụ của chúng tôi</p>
            <button
              onClick={() => navigate("/table")}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Đặt bàn ngay
            </button>
          </div>
        )}

        {/* Reservation Cards */}
        <div className="grid gap-6">
          {items.map((r) => {
            const code = normalizeStatus(r.status)
            const label = STATUS_LABEL[code]
            const cls = STATUS_CLASS[code]
            const glow = STATUS_GLOW[code]
            const StatusIcon = STATUS_ICON[code]

            return (
              <div
                key={r.id}
                className="group relative bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-sm border-2 border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1"
              >
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 rounded-2xl ${glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none`}
                />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Left Side - Info */}
                  <div className="flex-1 space-y-4">
                    {/* Customer Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Khách hàng</p>
                        <p className="text-xl font-semibold text-orange-400">{r.customer.full_name}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-13">
                      {/* Time */}
                      <div className="flex items-center gap-3 text-gray-300">
                        <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Thời gian</p>
                          <p className="font-medium">{fmt(r.reserved_at)}</p>
                        </div>
                      </div>

                      {/* Number of People */}
                      <div className="flex items-center gap-3 text-gray-300">
                        <Users className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Số người</p>
                          <p className="font-medium">{r.number_of_people} người</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {r.notes && (
                      <div className="flex items-start gap-3 pl-13 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                        <MessageSquare className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                          <p className="text-gray-300 text-sm leading-relaxed">{r.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Status Badge */}
                  <div className="flex items-center justify-end md:justify-center">
                    <div
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 ${cls} shadow-lg backdrop-blur-sm`}
                    >
                      <StatusIcon className="w-5 h-5" />
                      <span className="font-semibold text-sm whitespace-nowrap">{label}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {lastPage > 1 && isAuthenticated && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 text-white font-medium transition-all duration-300 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:shadow-none"
              disabled={loading || page <= 1}
              onClick={() => load(page - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Trang trước</span>
            </button>

            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/30 backdrop-blur-sm">
              <span className="text-orange-400 font-bold text-lg">{page}</span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400 font-medium">{lastPage}</span>
            </div>

            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 text-white font-medium transition-all duration-300 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:shadow-none"
              disabled={loading || page >= lastPage}
              onClick={() => load(page + 1)}
            >
              <span>Trang sau</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

export default ReservationHistory