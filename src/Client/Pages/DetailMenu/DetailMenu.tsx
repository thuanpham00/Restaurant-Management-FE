import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { clientAPI } from "src/Apis/Client/menu.api"
import { Dish } from "src/Types/dish.type"
import { assets } from "src/Assets/assets"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { detailMenuAPI } from "src/Apis/Client/detailMenu.api"
import { ChevronLeftIcon } from "lucide-react"

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dish, setDish] = useState<Dish | null>(null)
  const [relatedDishes, setRelatedDishes] = useState<Dish[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDish = async () => {
      try {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-600/80 text-white p-4 rounded-xl mb-8 max-w-2xl mx-auto text-center shadow-lg backdrop-blur-sm border border-gray-700">
            {error}
          </div>
          <button
            className="flex items-center text-orange-400 hover:text-orange-300 transition duration-300"
            onClick={() => navigate(-1)}
          >
            <ChevronLeftIcon size={20} />
            <span className="ml-1">Quay lại</span>
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  if (!dish) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-400">Đang tải...</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <button
          className="flex items-center text-orange-400 hover:text-orange-300 mb-6 transition duration-300"
          onClick={() => navigate("/menu")}
        >
          <ChevronLeftIcon size={20} />
          <span className="ml-1">Quay lại Menu</span>
        </button>
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Product Image */}
          <div className="lg:col-span-5">
            <div className="relative min-h-full">
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl z-0" />
              <div className="aspect-square rounded-xl overflow-hidden relative z-10 shadow-lg border border-gray-700/50">
                <img src={assets.rectangles.pizza} alt={dish.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Product Content */}
          <div className="lg:col-span-7 flex flex-col justify-between min-h-full">
            <div className="bg-gray-800/50 p-8 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-700">
              <div className="flex items-center mb-2">
                <span className="text-orange-400 text-sm font-medium px-3 py-1 bg-orange-400/10 rounded-full">
                  {dish.category.name}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{dish.name}</h1>
              <p className="text-gray-300 mb-6 text-lg">
                {dish.category.desc || "Không có mô tả chi tiết cho món ăn này."}
              </p>
              {/* Phần giá tiền */}
              <div className="border-t border-gray-600 pt-4">
                <span className="text-gray-400 text-sm font-medium">Price</span>
                <div className="text-3xl font-bold text-orange-400">{dish.price?.toLocaleString()} VND</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mb-16 bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex border-b border-gray-700 mb-6">
            <button className="py-3 px-6 font-medium text-orange-400 border-b-2 border-orange-400">Mô tả</button>
          </div>
          <div className="px-2">
            <p className="text-gray-300 leading-relaxed">{dish.desc || "Không có mô tả chi tiết cho món ăn này."}</p>
          </div>
        </div>

        {/* Related Dishes */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-white">Món ăn liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedDishes.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/dish/${item.id}`)}
                className="bg-gray-800/50 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer group text-left w-full"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10"></div>
                  <img
                    src={assets.rectangles.pizza}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.desc || "Không có mô tả"}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-400 font-bold">{item.price?.toLocaleString()} VND</span>
                    <button
                      className="text-xs bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded-full transition"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/dish/${item.id}`)
                      }}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ProductDetail
