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
  const [currentSlide, setCurrentSlide] = useState(0) // State cho slide hiện tại
  const slideRef = useRef<HTMLDivElement>(null) // Ref cho container slide
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
      <section className="relative h-40 md:h-48">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${assets.rectangles.sandwich2}')` }}
        />
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          {loading.stats ? (
            <div className="text-white">Đang tải...</div>
          ) : error.stats ? (
            <div className="text-red-400">{error.stats}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 lg:gap-16 text-center text-white">
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">{stats.total_customers}</div>
                <div className="text-base md:text-lg lg:text-xl">Số khách hàng</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">{stats.total_orders}</div>
                <div className="text-base md:text-lg lg:text-xl">Tổng đơn hàng</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">
                  {stats.active_table_sessions}
                </div>
                <div className="text-base md:text-lg lg:text-xl">Bàn trống</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Most Popular Food Section */}
      <section className="bg-gray-900 py-12 md:py-16 px-4 sm:px-6 lg:px-[135px]">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium mb-4 md:mb-6">
            Món ăn phổ biến
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto px-4">
            Khám phá danh sách các món ăn được yêu thích nhất, bao gồm món chính, đồ uống và tráng miệng, để có trải
            nghiệm ẩm thực đích thực!
          </p>
        </div>
        {loading.dishes ? (
          <div className="text-center text-white">Đang tải...</div>
        ) : error.dishes ? (
          <div className="text-red-400">{error.dishes}</div>
        ) : Array.isArray(popularDishes) && popularDishes.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {popularDishes.map((dish) => (
              <div key={dish.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={assets.rectangles.salad} 
                  alt={dish.name}
                  className="w-full h-[250px] md:h-[300px] object-cover"
                />
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                    <h3 className="text-white text-xl md:text-2xl font-medium">{dish.name}</h3>
                    <span className="text-white text-xl md:text-2xl font-medium">
                      {dish.price.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <p className="text-white/80 text-sm md:text-base mb-4">{dish.desc || "Không có mô tả"}</p>
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/dish/${dish.id}`}
                      className="text-white hover:text-orange-400 transition-colors text-sm md:text-base"
                    >
                      Xem chi tiết
                      <div className="h-px bg-current w-full mt-1"></div>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">Không có món ăn phổ biến nào.</div>
        )}
        <div className="text-center mt-8 md:mt-12">
          <Link to="/menu" className="inline-flex items-center text-orange-400 font-medium text-sm md:text-base">
            Khám phá tất cả món ăn
            <img src={assets.icons.vector5} alt="arrow" className="ml-2 w-3 h-3 md:w-4 md:h-4" />
          </Link>
          <div className="h-px bg-orange-400 w-32 md:w-36 mx-auto mt-1"></div>
        </div>
      </section>

      {/* Promotion Banner Section */}
      <section className="relative py-8">
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-[135px]">
          <h2 className="text-white text-3xl md:text-4xl font-bold text-center mb-6">Ưu Đãi Hấp Dẫn</h2>
          {loading.promotions ? (
            <div className="text-center text-white">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent"></div>
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : error.promotions ? (
            <div className="text-center text-red-400">{error.promotions}</div>
          ) : promotions.length > 0 ? (
            <div className="overflow-hidden">
              <div
                ref={slideRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ width: `${promotions.length * 100}%` }}
              >
                {promotions.map((promotion) => (
                  <div key={promotion.id} className="w-full px-4" style={{ flex: `0 0 ${100 / promotions.length}%` }}>
                    <div
                      className="relative border border-gray-700 rounded-lg p-6 text-center text-white shadow-lg min-h-[300px] bg-cover bg-center"
                      style={{
                        backgroundImage:
                          "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')",
                        backgroundBlendMode: "overlay"
                      }}
                    >
                      <div className="absolute inset-0 bg-gray-900/70 rounded-lg" />
                      <div className="relative z-10">
                        <h3 className="text-2xl font-semibold text-orange-400 mb-2">{promotion.code}</h3>
                        <p className="text-lg text-gray-300 mb-4">{promotion.description || "Không có mô tả"}</p>
                        <p className="text-sm text-gray-400">
                          Hiệu lực: {promotion.created_at?.slice(0, 10)} - {promotion.end_date?.slice(0, 10)}
                        </p>
                        <p className="text-lg font-bold text-orange-400 mt-2">
                          Giảm{" "}
                          {promotion.discount_percent > 0 ? `${promotion.discount_percent}%` : "Miễn phí vận chuyển"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Dots điều hướng */}
              <div className="flex justify-center mt-4">
                {promotions.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-2 mx-1 rounded-full ${index === currentSlide ? "bg-orange-400" : "bg-gray-500"}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">Không có chương trình giảm giá nào.</div>
          )}
        </div>
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
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="text-center mb-16">
          <p className="text-white/80 mb-4">Thực đơn của chúng tôi</p>
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">Chọn & Thưởng thức</h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Danh sách các món ăn hàng đầu của nhà hàng, bao gồm món chính, đồ uống và tráng miệng, mang đến trải nghiệm
            ẩm thực đích thực.
          </p>
        </div>
        {loading.categories ? (
          <div className="text-center text-white">Đang tải...</div>
        ) : error.categories ? (
          <div className="text-red-400">{error.categories}</div>
        ) : Array.isArray(categories) && categories.length > 0 ? (
          <>
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <button
                className={`text-center cursor-pointer ${
                  selectedCategory === "All" ? "text-orange-400" : "text-white"
                } text-3xl font-medium hover:text-orange-400 transition-colors`}
                onClick={() => setSelectedCategory("All")}
              >
                <span>Tất cả</span>
                {selectedCategory === "All" && <div className="h-px bg-orange-400 w-full mt-2"></div>}
              </button>
              {categories.map((category: CategoryDishByMenu) => (
                <button
                  key={category.id}
                  className={`block text-center cursor-pointer ${
                    selectedCategory === category.name ? "text-orange-400" : "text-white"
                  } text-3xl font-medium hover:text-orange-400 transition-colors`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span>{category.name}</span>
                  {selectedCategory === category.name && <div className="h-px bg-orange-400 w-full mt-2"></div>}
                </button>
              ))}
            </div>
            <div className="h-px bg-white/20 w-full mb-8"></div>
            <div className="flex justify-center">
              <div className="w-full max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                  {filteredDishes.slice(0, Math.ceil(filteredDishes.length / 2)).map((item: Dish) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-800/40 rounded-xl p-8 w-full max-w-lg"
                    >
                      <div className="flex items-center">
                        <img
                          src={assets.ellipses.ellipse30} // Sử dụng item.image nếu có
                          alt={item.name}
                          className="w-20 h-20 rounded-full object-cover mr-4"
                        />
                        <div className="flex flex-col">
                          <h3 className="text-white text-2xl font-medium max-w-xs">{item.name}</h3>
                          <span className="text-white text-xl font-medium mt-1">
                            {Number(item.price).toLocaleString("vi-VN")} VND
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">Không có danh mục nào.</div>
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <img
              src={assets.rectangles.house}
              alt="Nội thất nhà hàng"
              className="w-full h-[285px] object-cover border border-white"
            />
            <img
              src={assets.rectangles.restaurant2}
              alt="Nội thất nhà hàng"
              className="w-full h-[285px] object-cover border border-white"
            />
          </div>
          <div className="col-span-1">
            <img
              src={assets.rectangles.restaurant}
              alt="Nội thất nhà hàng"
              className="w-full h-[586px] object-cover border border-white"
            />
          </div>
          <div className="space-y-4">
            <img
              src={assets.rectangles.Dish}
              alt="Món ăn"
              className="w-full h-[285px] object-cover border border-white"
            />
            <img
              src={assets.rectangles.chef}
              alt="Đầu bếp"
              className="w-full h-[285px] object-cover border border-white"
            />
          </div>
        </div>
      </section>

      {/* Daily Offers Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="text-center mb-16">
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium">Ưu đãi hàng ngày</h2>
        </div>
      </section>

      {/* Features Banner */}
      <section className="bg-orange-400 py-12">
        <div className="px-6 sm:px-8 lg:px-[135px]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-gray-900">
            {[
              { icon: assets.icons.star3, img: assets.images.image29, title: "Hương vị tuyệt vời" },
              { icon: assets.icons.star5, img: assets.images.image30, title: "Tự phục vụ" },
              { icon: assets.icons.star2, img: assets.images.image28, title: "Món ăn ngon nhất" },
              { icon: assets.icons.star6, img: assets.images.image31, title: "Giao hàng nhanh" },
              { icon: assets.icons.star4, img: assets.images.image29, title: "Hương vị tuyệt vời" }
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="relative w-14 h-14 mb-2">
                  <img src={feature.icon} alt="star" className="w-full h-full" />
                  <img
                    src={feature.img}
                    alt="icon"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8"
                  />
                </div>
                <h3 className="text-3xl font-medium">{feature.title}</h3>
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
          <div className="grid md:grid-cols-3 gap-8">
            {(chefs || []).map((chef: Chef) => (
              <div key={chef.id} className="text-center">
                <img
                  src={assets.rectangles.chef2}
                  alt={chef.name}
                  className="w-full h-[443px] object-contain border border-white/50 rounded-lg mb-6"
                />
                <h3 className="text-white text-3xl font-medium mb-2">{chef.name}</h3>
                <p className="text-white text-lg font-semibold">Đầu bếp</p>
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
