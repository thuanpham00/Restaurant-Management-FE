import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Tag, DollarSign, BookOpen, Sparkles, Clock, Users, Loader2 } from "lucide-react"
import { clientAPI } from "src/Apis/Client/menu.api"
import { Dish } from "src/Types/dish.type"
import { assets } from "src/Assets/assets"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { detailMenuAPI } from "src/Apis/Client/detailMenu.api"

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dish, setDish] = useState<Dish | null>(null)
  const [relatedDishes, setRelatedDishes] = useState<Dish[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDish = async () => {
      try {
        setLoading(true)
        if (!id) return

        const response = await detailMenuAPI.getDishById(id)
        if (response.data.status === "success") {
          setDish(response.data.data)
        } else {
          setError(response.data.message)
        }
      } catch (error) {
        setError("Không thể tải chi tiết món ăn")
        console.error("Lỗi khi lấy chi tiết món ăn:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchRelatedDishes = async () => {
      try {
        const response = await clientAPI.getPopularDishes()
        if (response.data.status === "success") {
          setRelatedDishes(response.data.data.filter((item: Dish) => item.id !== id).slice(0, 3))
        }
      } catch (error) {
        console.error("Lỗi khi lấy món ăn liên quan:", error)
      }
    }

    if (id) {
      fetchDish()
      fetchRelatedDishes()
    }
  }, [id])

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-orange-400 animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Đang tải chi tiết món ăn...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-2xl p-8 mb-8 max-w-2xl mx-auto text-center backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/30 mb-4">
              <Sparkles className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-red-400 mb-2">Oops!</h3>
            <p className="text-red-300/90 text-lg">{error}</p>
          </div>
          <button
            className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition duration-300 mx-auto group"
            onClick={() => navigate("/menu")}
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại Menu</span>
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  if (!dish) return null

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <button
          className="group flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8 transition-all duration-300 hover:gap-3"
          onClick={() => navigate("/menu")}
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Quay lại Menu</span>
        </button>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* Product Image */}
          <div className="lg:col-span-5">
            <div className="relative group">
              {/* Glow effects */}
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

              {/* Image Container */}
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700/50 group-hover:border-orange-500/50 transition-all duration-500 group-hover:shadow-orange-500/20">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent z-10" />
                <img
                  src={dish.image || assets.rectangles.pizza}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Overlay Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/90 backdrop-blur-sm rounded-full border border-orange-400/50 shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">Nổi bật</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Content */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/30 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-2xl border-2 border-gray-700/50 hover:border-orange-500/30 transition-all duration-500">
              {/* Category Badge */}
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 text-sm font-semibold px-4 py-1.5 bg-orange-400/10 rounded-full border border-orange-500/30">
                  {dish.category.name}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{dish.name}</h1>

              {/* Category Description */}
              <div className="flex items-start gap-3 mb-6 p-4 bg-gray-900/40 rounded-xl border border-gray-700/50">
                <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-base leading-relaxed">
                  {dish.category.desc || "Không có mô tả chi tiết cho món ăn này."}
                </p>
              </div>

              {/* Price Section */}
              <div className="border-t-2 border-gray-700/50 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Giá món ăn</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                    {Number(dish.price)?.toLocaleString()}
                  </span>
                  <span className="text-2xl text-gray-400 font-medium">VND</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700/50">
                <div className="flex items-center gap-3 p-3 bg-gray-900/40 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Thời gian</p>
                    <p className="text-sm font-semibold text-gray-300">{dish.cooking_time} phút</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-900/40 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Khẩu phần</p>
                    <p className="text-sm font-semibold text-gray-300">1-2 người</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Tab */}
        <div className="mb-16 bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-700/50 shadow-xl">
          <div className="flex items-center gap-3 border-b-2 border-gray-700 pb-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-orange-400">Mô tả chi tiết</h2>
          </div>
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-gray-300 leading-relaxed text-lg">
              {dish.desc || "Không có mô tả chi tiết cho món ăn này."}
            </p>
          </div>
        </div>

        {/* Related Dishes */}
        {relatedDishes.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Món ăn liên quan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedDishes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/dish/${item.id}`)}
                  className="group bg-gradient-to-br from-gray-800/60 to-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border-2 border-gray-700/50 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20 text-left w-full"
                >
                  {/* Image */}
                  <div className="h-56 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-9" />
                    <img
                      src={item.image || assets.rectangles.pizza}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Overlay Badge */}
                    <div className="absolute top-3 right-3 z-20">
                      <div className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full border border-orange-400/50">
                        <span className="text-white font-semibold text-xs">Hot</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-orange-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {item.desc || "Đợi cập nhật"}
                    </p>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-orange-400">
                          {Number(item.price)?.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">VND</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all duration-300 group-hover:shadow-lg group-hover:shadow-orange-500/50">
                        <span className="text-sm font-semibold">Chi tiết</span>
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default ProductDetail
