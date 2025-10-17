import { useEffect, useState } from "react"
import Header from "../../Components/HeaderClient/HeaderClient"
import Footer from "../../Components/FooterClient/FooterClient"
import { reservationAPI } from "src/Apis/Client/ReservationHistory.api"
import { Reservation } from "src/Types/reservation.type"
import { isAxiosError, AxiosResponse } from "axios"
import { useNavigate } from "react-router-dom"

type Paginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const STATUS_LABEL: Record<number, string> = {
  0: "Pending",
  1: "Confirmed",
  2: "Cancelled",
  3: "Completed"
}

const STATUS_CLASS: Record<number, string> = {
  0: "bg-yellow-600/30 text-yellow-300 border border-yellow-700/50",
  1: "bg-green-600/30 text-green-300 border border-green-700/50",
  2: "bg-red-600/30 text-red-300 border border-red-700/50",
  3: "bg-blue-600/30 text-blue-300 border border-blue-700/50"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          navigate("/login")
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
    load(1)
  }, [])

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      <section className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold mb-6">Lịch sử đặt bàn</h1>

        {loading && <div className="text-gray-300">Đang tải...</div>}
        {error && <div className="bg-red-600/80 text-white p-4 rounded-lg mb-6 max-w-2xl">{error}</div>}

        {!loading && !error && items.length === 0 && <div className="text-gray-400">Bạn chưa có đặt bàn nào.</div>}

        <div className="grid gap-4">
          {items.map((r) => {
            const code = normalizeStatus(r.status)
            const label = STATUS_LABEL[code]
            const cls = STATUS_CLASS[code]
            return (
              <div key={r.id} className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-lg font-medium">
                      Tên khách hàng: <span className="text-orange-400">{r.customer.full_name}</span>
                    </div>
                    <div className="text-gray-300">
                      Thời gian: {fmt(r.reserved_at)} • Số người: {r.number_of_people}
                    </div>
                    {r.notes && <div className="text-gray-400 mt-1">Ghi chú: {r.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${cls}`}>{label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {lastPage > 1 && (
          <div className="flex items-center gap-2 mt-6">
            <button
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
              disabled={loading || page <= 1}
              onClick={() => load(page - 1)}
            >
              Trang trước
            </button>
            <span className="text-gray-300">
              {page} / {lastPage}
            </span>
            <button
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
              disabled={loading || page >= lastPage}
              onClick={() => load(page + 1)}
            >
              Trang sau
            </button>
          </div>
        )}
      </section>
      <Footer />
    </div>
  )
}

export default ReservationHistory
