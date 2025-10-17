import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { assets } from "src/Assets/assets"
import { clientAPI } from "src/Apis/Client/home.api"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { Statistics } from "src/Types/statistics.type"
import { Dish } from "src/Types/dish.type"
import { CategoryDishByMenu } from "src/Types/dishCategory.type"
import { Chef } from "src/Types/utils.type"
import { Promotion } from "src/Types/promotion.type"
import {
  Sparkles,
  Users,
  Award,
  Truck,
  ChefHat,
  Calendar,
  UserCheck,
  ShoppingCart,
  Star,
  ChevronRight,
  Flame,
  Loader2,
  UtensilsCrossed,
  DollarSign
} from "lucide-react"

const Home = () => {
  const [stats, setStats] = useState<Statistics>({
    total_customers: 0,
    total_orders: 0,
    total_reservations: 0,
    active_table_sessions: 0
  })
  const [popularDishes, setPopularDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<CategoryDishByMenu[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [chefs, setChefs] = useState<Chef[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const slideRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState<{
    stats: boolean
    dishes: boolean
    categories: boolean
    promotions: boolean
    chefs: boolean
    tables: boolean
    newsletter: boolean
  }>({
    stats: true,
    dishes: true,
    categories: true,
    promotions: true,
    chefs: true,
    tables: false,
    newsletter: false
  })
  const [error, setError] = useState<{
    stats: string | null
    dishes: string | null
    categories: string | null
    promotions: string | null
    chefs: string | null
    tables: string | null
    newsletter: string | null
  }>({
    stats: null,
    dishes: null,
    categories: null,
    promotions: null,
    chefs: null,
    tables: null,
    newsletter: null
  })

  // Tự động chuyển slide
  useEffect(() => {
    if (promotions.length <= 1) return // Không chạy nếu chỉ có 0 hoặc 1 slide
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promotions.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [promotions.length])

  // Reset index nếu số lượng slide thay đổi
  useEffect(() => {
    setCurrentSlide((s) => Math.min(s, Math.max(0, promotions.length - 1)))
  }, [promotions.length])

  // Cập nhật vị trí slide mượt theo tỉ lệ
  useEffect(() => {
    if (!slideRef.current) return
    const n = promotions.length || 1
    const step = 100 / n
    slideRef.current.style.transform = `translateX(-${currentSlide * step}%)`
  }, [currentSlide, promotions.length])

  useEffect(() => {
    // Fetch statistics
    clientAPI
      .getStatistics()
      .then((response) => {
        setStats(response.data.data)
        setLoading((prev) => ({ ...prev, stats: false }))
      })
      .catch((err) => {
        console.log(err)
        setError((prev) => ({ ...prev, stats: "Lỗi khi tải thống kê" }))
        setLoading((prev) => ({ ...prev, stats: false }))
      })

    // Fetch popular dishes
    clientAPI
      .getPopularDishes()
      .then((response) => {
        setPopularDishes(response.data.data)
        setLoading((prev) => ({ ...prev, dishes: false }))
      })
      .catch(() => {
        setError((prev) => ({ ...prev, dishes: "Lỗi khi tải món ăn phổ biến" }))
        setLoading((prev) => ({ ...prev, dishes: false }))
      })

    // Fetch menu categories
    clientAPI
      .getMenuCategories()
      .then((response) => {
        setCategories(response.data.data)
        setLoading((prev) => ({ ...prev, categories: false }))
      })
      .catch(() => {
        setError((prev) => ({ ...prev, categories: "Lỗi khi tải danh mục món ăn" }))
        setLoading((prev) => ({ ...prev, categories: false }))
      })

    // Fetch chefs
    clientAPI
      .getChefs()
      .then((response) => {
        setChefs(response.data.data)
        setLoading((prev) => ({ ...prev, chefs: false }))
      })
      .catch((err) => {
        console.log(err)
        setError((prev) => ({ ...prev, chefs: "Lỗi khi tải danh sách đầu bếp" }))
        setLoading((prev) => ({ ...prev, chefs: false }))
      })

    // Fetch promotions
    clientAPI
      .getPromotions({ only_valid: true, per_page: 5 })
      .then((response) => {
        setPromotions(response.data.data.data)
        setLoading((prev) => ({ ...prev, promotions: false }))
      })
      .catch((err) => {
        console.log(err)
        setError((prev) => ({ ...prev, promotions: "Lỗi khi tải chương trình giảm giá" }))
        setLoading((prev) => ({ ...prev, promotions: false }))
      })
  }, [])

  const filteredDishes = Array.isArray(categories)
    ? selectedCategory === "All"
      ? categories.flatMap((cat) => cat.dishes || [])
      : categories.find((cat) => cat.name === selectedCategory)?.dishes || []
    : []

  return (
    <div className="bg-gray-900 min-h-screen">
      <Header />

      {/* Statistics Section */}
      <section className="relative py-20 md:py-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${assets.rectangles.sandwich2}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 backdrop-blur-sm" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-[135px]">
          {loading.stats ? (
            <div className="text-center text-white">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-orange-400 border-t-transparent"></div>
              <p className="mt-4 text-lg">Đang tải thống kê...</p>
            </div>
          ) : error.stats ? (
            <div className="text-center">
              <div className="text-red-400 text-lg">{error.stats}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12">
              {/* Stat 1: Customers */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gray-800/40 backdrop-blur-sm border-2 border-gray-700/50 rounded-2xl p-8 text-center transition-all duration-500 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="w-10 h-10 text-blue-400" strokeWidth={2} />
                  </div>
                  {/* Number with animation */}
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                    {stats.total_customers.toLocaleString()}
                  </div>
                  <div className="text-lg md:text-xl text-gray-300 font-medium">Số khách hàng</div>
                  {/* Decorative line */}
                  <div className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />
                </div>
              </div>

              {/* Stat 2: Orders */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gray-800/40 backdrop-blur-sm border-2 border-gray-700/50 rounded-2xl p-8 text-center transition-all duration-500 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="w-10 h-10 text-orange-400" strokeWidth={2} />
                  </div>
                  {/* Number */}
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                    {stats.total_orders.toLocaleString()}
                  </div>
                  <div className="text-lg md:text-xl text-gray-300 font-medium">Tổng đơn hàng</div>
                  {/* Decorative line */}
                  <div className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
                </div>
              </div>

              {/* Stat 3: Active Tables */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gray-800/40 backdrop-blur-sm border-2 border-gray-700/50 rounded-2xl p-8 text-center transition-all duration-500 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-10 h-10 text-green-400" strokeWidth={2} />
                  </div>
                  {/* Number */}
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                    {stats.active_table_sessions.toLocaleString()}
                  </div>
                  <div className="text-lg md:text-xl text-gray-300 font-medium">Bàn đang hoạt động</div>
                  {/* Decorative line */}
                  <div className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Promotion Banner Section */}
      <section className="relative py-18 bg-gradient-to-br from-orange-500/10 via-gray-900/80 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-orange-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 px-4 sm:px-6 lg:px-[135px]">
          <h2 className="text-white text-3xl md:text-4xl font-extrabold text-center mb-10 mt-10 tracking-tight drop-shadow-lg">
            Ưu Đãi Hấp Dẫn
          </h2>
          {loading.promotions ? (
            <div className="text-center text-white">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent"></div>
              <p className="mt-4 text-lg">Đang tải...</p>
            </div>
          ) : error.promotions ? (
            <div className="text-center text-red-400">{error.promotions}</div>
          ) : promotions.length > 0 ? (
            <div className="max-w-3xl mx-auto overflow-hidden">
              <div
                ref={slideRef}
                className="flex transition-transform duration-700 ease-in-out"
                style={{ width: `${promotions.length * 100}%` }}
              >
                {promotions.map((promotion) => (
                  <div
                    key={promotion.id}
                    className="w-full flex-shrink-0 px-2"
                    style={{ flex: `0 0 ${100 / promotions.length}%` }}
                  >
                    <div
                      className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-orange-400/30 bg-cover bg-center min-h-[320px] flex flex-col justify-center items-center"
                      style={{
                        backgroundImage:
                          "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')",
                        backgroundBlendMode: "overlay"
                      }}
                    >
                      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" />
                      <div className="relative z-10 p-8 w-full flex flex-col items-center">
                        <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold text-lg shadow-lg mb-4 animate-pulse">
                          {promotion.code}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-2 drop-shadow">
                          {"Ưu đãi đặc biệt"}
                        </h3>
                        <p className="text-lg text-gray-200 mb-3 text-center max-w-xl">
                          {promotion.description || "Không có mô tả"}
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-2">
                          <span className="text-sm text-gray-400">
                            Hiệu lực: {promotion.created_at?.slice(0, 10)} - {promotion.end_date?.slice(0, 10)}
                          </span>
                          <span className="inline-block px-4 py-1 rounded-full bg-orange-500/80 text-white font-semibold text-base shadow">
                            {promotion.discount_percent > 0
                              ? `Giảm ${promotion.discount_percent}%`
                              : "Miễn phí vận chuyển"}
                          </span>
                        </div>
                        <Link
                          to="/menu"
                          className="mt-4 inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-orange-500/40 transition-all duration-300"
                        >
                          Đặt món ngay
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6 gap-2">
                {promotions.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-8 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "bg-orange-400" : "bg-gray-600/40"
                    }`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Chuyển đến ưu đãi ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">Không có chương trình giảm giá nào.</div>
          )}
        </div>
      </section>

      {/* Most Popular Food Section */}
      <section className="bg-gray-900 py-16 md:py-20 px-4 sm:px-6 lg:px-[135px]">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              Món ăn phổ biến
            </h2>
            <div className="w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center">
              <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
            </div>
          </div>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-4">
            Khám phá danh sách các món ăn được yêu thích nhất, bao gồm món chính, đồ uống và tráng miệng, để có trải
            nghiệm ẩm thực đích thực!
          </p>
          <div className="mt-6 h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
        </div>

        {/* Loading State */}
        {loading.dishes ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Đang tải món ăn...</p>
          </div>
        ) : error.dishes ? (
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-2xl p-6 max-w-2xl mx-auto text-center backdrop-blur-sm">
            <p className="text-red-400 text-lg">{error.dishes}</p>
          </div>
        ) : Array.isArray(popularDishes) && popularDishes.length > 0 ? (
          <>
            {/* Dishes Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
              {popularDishes.map((dish, index) => (
                <div
                  key={dish.id}
                  className="group relative bg-gradient-to-br from-gray-800/60 to-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border-2 border-gray-700/50 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Image */}
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
                    <img
                      src={assets.rectangles.salad}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Popular Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/90 backdrop-blur-sm rounded-full border border-orange-400/50 shadow-lg">
                        <Star className="w-4 h-4 text-white fill-white" />
                        <span className="text-white font-semibold text-xs">Hot</span>
                      </div>
                    </div>

                    {/* Price Overlay */}
                    <div className="absolute bottom-4 left-4 z-20">
                      <div className="px-4 py-2 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-700/50">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-orange-400">
                            {dish.price.toLocaleString("vi-VN")}
                          </span>
                          <span className="text-sm text-gray-400">VND</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative p-6">
                    <h3 className="text-white text-xl md:text-2xl font-bold mb-3 line-clamp-1 group-hover:text-orange-400 transition-colors duration-300">
                      {dish.name}
                    </h3>

                    <p className="text-gray-400 text-sm md:text-base mb-4 line-clamp-2 leading-relaxed">
                      {dish.desc || "Món ăn đặc biệt với hương vị tuyệt vời"}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />

                    {/* Action Button */}
                    <Link
                      to={`/dish/${dish.id}`}
                      className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/5 hover:from-orange-500 hover:to-orange-600 border-2 border-orange-500/30 hover:border-orange-500 rounded-xl text-orange-400 hover:text-white font-semibold transition-all duration-300 group/btn"
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Link
                to="/menu"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-1 border-2 border-orange-400/50"
              >
                <Sparkles className="w-5 h-5" />
                <span>Khám phá tất cả món ăn</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
              <div className="mt-4 h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-800/50 border-2 border-gray-700 mb-6">
              <Flame className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">Chưa có món ăn phổ biến</h3>
            <p className="text-gray-500">Hãy quay lại sau để khám phá những món ăn tuyệt vời!</p>
          </div>
        )}
      </section>

      {/* Booking & Location Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="relative">
            <div
              className="absolute inset-0 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url('${assets.rectangles.coffee}')` }}
            />
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm rounded-lg" />
            <div className="relative z-10 p-10 text-center text-white border border-white/20 rounded-lg h-full flex flex-col justify-center">
              <h3 className="text-2xl font-medium mb-6">Tìm chúng tôi tại đây</h3>
              <div className="space-y-2">
                <p>140 LÊ TRỌNG TẤN</p>
                <p>+0123 456 7890</p>
                <p>HUIT@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-400 p-10 rounded-lg">
            <h3 className="text-gray-900 text-2xl font-medium mb-6 text-center">Giờ mở cửa</h3>
            <div className="space-y-4 text-gray-900">
              <div className="flex justify-between">
                <span>Thứ Hai</span>
                <span>8:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Thứ Tư</span>
                <span>8:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Thứ Năm</span>
                <span>8:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Thứ Sáu</span>
                <span>8:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Thứ Bảy/Chủ Nhật</span>
                <span>8:00 - 22:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="bg-gray-900 py-16 md:py-20 px-4 sm:px-6 lg:px-[135px]">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              Chọn & Thưởng thức
            </h2>
            <div className="w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center">
              <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
            </div>
          </div>
          <p className="text-sm text-orange-400 font-semibold uppercase tracking-wider mb-3">Thực đơn của chúng tôi</p>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-4">
            Danh sách các món ăn hàng đầu của nhà hàng, bao gồm món chính, đồ uống và tráng miệng, mang đến trải nghiệm
            ẩm thực đích thực.
          </p>
          <div className="mt-6 h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
        </div>

        {/* Loading State */}
        {loading.categories ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Đang tải danh mục...</p>
          </div>
        ) : error.categories ? (
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-2xl p-6 max-w-2xl mx-auto text-center backdrop-blur-sm">
            <p className="text-red-400 text-lg">{error.categories}</p>
          </div>
        ) : Array.isArray(categories) && categories.length > 0 ? (
          <>
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                className={`group relative px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  selectedCategory === "All"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-800 hover:text-white border-2 border-gray-700/50 hover:border-orange-500/50"
                }`}
                onClick={() => setSelectedCategory("All")}
              >
                <span className="relative z-10">Tất cả</span>
                {selectedCategory === "All" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/20 to-orange-500/20 blur-xl" />
                )}
              </button>

              {categories.map((category: CategoryDishByMenu) => (
                <button
                  key={category.id}
                  className={`group relative px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    selectedCategory === category.name
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50"
                      : "bg-gray-800/60 text-gray-300 hover:bg-gray-800 hover:text-white border-2 border-gray-700/50 hover:border-orange-500/50"
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span className="relative z-10">{category.name}</span>
                  {selectedCategory === category.name && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/20 to-orange-500/20 blur-xl" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-12" />

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredDishes.slice(0, 6).map((item: Dish, index) => (
                <Link
                  key={item.id}
                  to={`/dish/${item.id}`}
                  className="group relative bg-gradient-to-br from-gray-800/60 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-700/50 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                  <div className="relative flex items-center gap-5">
                    {/* Image */}
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-700/50 group-hover:border-orange-500/50 transition-all duration-300">
                        <img
                          src={assets.ellipses.ellipse30}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      {/* Badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-500/90 backdrop-blur-sm border-2 border-orange-400/50 flex items-center justify-center shadow-lg">
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xl font-bold mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors duration-300">
                        {item.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-orange-400">
                            {Number(item.price).toLocaleString("vi-VN")}
                          </span>
                          <span className="text-sm text-gray-500">VND</span>
                        </div>
                      </div>

                      {/* Hover Arrow */}
                      <div className="mt-3 flex items-center gap-2 text-orange-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-sm font-semibold">Xem chi tiết</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            {filteredDishes.length > 6 && (
              <div className="text-center">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-1 border-2 border-orange-400/50"
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  <span>Xem tất cả món ăn</span>
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <div className="mt-4 h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-800/50 border-2 border-gray-700 mb-6">
              <UtensilsCrossed className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">Chưa có danh mục nào</h3>
            <p className="text-gray-500">Hãy quay lại sau để khám phá thực đơn của chúng tôi!</p>
          </div>
        )}
      </section>

      {/* Gallery Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="text-center mb-16">
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">
            Ghé thăm nhà hàng của chúng tôi
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Thực đơn phong cách đồng quê chất lượng, dịch vụ thân thiện và hiệu quả, kết hợp với giá trị thực sự đã
            khiến nhà hàng của chúng tôi phục vụ các gia đình như bạn trong hơn 28 năm.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src={assets.rectangles.house}
                alt="Nội thất nhà hàng"
                className="w-full h-[285px] object-cover transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl border-4 border-gray-800 group-hover:border-orange-400"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent px-4 py-2">
                <span className="text-white text-base font-semibold">Không gian nhà hàng</span>
              </div>
            </div>
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src={assets.rectangles.restaurant2}
                alt="Nội thất nhà hàng"
                className="w-full h-[285px] object-cover transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl border-4 border-gray-800 group-hover:border-orange-400"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent px-4 py-2">
                <span className="text-white text-base font-semibold">Sảnh tiếp khách</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg h-full">
              <img
                src={assets.rectangles.restaurant}
                alt="Nội thất nhà hàng"
                className="w-full h-[586px] object-cover transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl border-4 border-gray-800 group-hover:border-orange-400"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent px-4 py-2">
                <span className="text-white text-base font-semibold">Phòng ăn chính</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src={assets.rectangles.Dish}
                alt="Món ăn"
                className="w-full h-[285px] object-cover transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl border-4 border-gray-800 group-hover:border-orange-400"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent px-4 py-2">
                <span className="text-white text-base font-semibold">Món ăn đặc sắc</span>
              </div>
            </div>
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src={assets.rectangles.chef}
                alt="Đầu bếp"
                className="w-full h-[285px] object-cover transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl border-4 border-gray-800 group-hover:border-orange-400"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent px-4 py-2">
                <span className="text-white text-base font-semibold">Đầu bếp chuyên nghiệp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Offers Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="text-center">
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium">Trải nghiệm mỗi ngày</h2>
        </div>
      </section>

      {/* Features Banner */}
      <section className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-400 py-16">
        <div className="px-6 sm:px-8 lg:px-[135px]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-gray-900">
            {[
              {
                Icon: Sparkles,
                title: "Hương vị tuyệt vời",
                color: "text-yellow-700",
                bgColor: "bg-yellow-100/20"
              },
              {
                Icon: Users,
                title: "Tự phục vụ",
                color: "text-blue-700",
                bgColor: "bg-blue-100/20"
              },
              {
                Icon: Award,
                title: "Món ăn ngon nhất",
                color: "text-green-700",
                bgColor: "bg-green-100/20"
              },
              {
                Icon: Truck,
                title: "Giao hàng nhanh",
                color: "text-purple-700",
                bgColor: "bg-purple-100/20"
              },
              {
                Icon: ChefHat,
                title: "Đầu bếp chuyên nghiệp",
                color: "text-red-700",
                bgColor: "bg-red-100/20"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center group cursor-pointer transition-all duration-300 hover:scale-110"
              >
                <div
                  className={`relative w-20 h-20 mb-4 rounded-full ${feature.bgColor} backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 border-2 border-white/30`}
                >
                  <feature.Icon
                    className={`w-10 h-10 ${feature.color} group-hover:scale-125 transition-transform duration-300`}
                    strokeWidth={2}
                  />
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 group-hover:text-white transition-colors duration-300">
                  {feature.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chefs Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="text-center mb-16">
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">Đầu bếp của chúng tôi</h2>
          <p className="text-white/80 text-lg max-w-3xl mx-auto">
            Thực khách của chúng tôi có thể tự nấu ăn hoặc thưởng thức tại các nhà hàng được chọn lọc trong khu vực. Đầu
            bếp sẽ nấu cho bạn và đảm bảo bạn cảm thấy như ở nhà.
          </p>
        </div>
        {loading.chefs ? (
          <div className="text-center text-white">Đang tải...</div>
        ) : error.chefs ? (
          <div className="text-red-400">{error.chefs}</div>
        ) : (chefs || []).length === 0 ? (
          <div className="text-center text-gray-400">Không có đầu bếp nào.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            {(chefs || []).map((chef: Chef) => (
              <div
                key={chef.id}
                className="group relative bg-gradient-to-br from-gray-800/70 to-gray-900/40 rounded-3xl shadow-2xl border-2 border-orange-400/20 overflow-hidden p-8 flex flex-col items-center transition-all duration-300 hover:-translate-y-2 hover:shadow-orange-500/30"
              >
                {/* Avatar */}
                <div className="relative mb-6">
                  <img
                    src={assets.rectangles.chef2}
                    alt={chef.name}
                    className="w-40 h-40 object-cover rounded-full border-4 border-orange-400 shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Badge */}
                  <span className="absolute bottom-2 right-2 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-lg">
                    Chef
                  </span>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                </div>
                {/* Name */}
                <h3 className="text-white text-2xl md:text-3xl font-bold mb-2 group-hover:text-orange-400 transition-colors duration-300">
                  {chef.name}
                </h3>
                {/* Title */}
                <p className="text-orange-400 text-lg font-semibold mb-2">Đầu bếp</p>
                {/* Description */}
                <p className="text-gray-300 text-base">{"Chuyên gia ẩm thực, sáng tạo và tận tâm."}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

export default Home
