import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { clientAPI } from "src/Apis/Client/menu.api"
import { Dish } from "src/Types/dish.type"
import { MenuWithItems, MenuItemInMenu } from "src/Types/menu.type"
import { assets } from "src/Assets/assets"
import { ChevronDown, Tag, DollarSign, Search, Star, Sparkles, Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  dishes: Dish[]
}

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const MenuItem: React.FC<{ item: MenuItemInMenu; isPopular?: boolean }> = ({ item, isPopular }) => {
  const navigate = useNavigate()
  const isInactive = !item.dish_active
  return (
    <div
      className={`group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border-2 border-gray-700/50 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20 ${
        isInactive ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-9" />
        <img
          src={item.dish_image || assets.rectangles.salad}
          alt={item.dish_name || "Dish"}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700`}
        />
        {/* Badge */}
        <div className="absolute top-4 right-4 z-20">
          {isPopular && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/90 backdrop-blur-sm rounded-full border border-orange-400/50 shadow-lg">
              <Star className="w-4 h-4 text-white fill-white" />
              <span className="text-white font-semibold text-xs">Hot</span>
            </div>
          )}
          {isInactive && (
            <span className="bg-red-600/90 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
              Tạm ngừng
            </span>
          )}
        </div>
        {isInactive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="bg-red-600/90 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
              Tạm ngừng
            </span>
          </div>
        )}
        {/* Price Overlay */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="px-4 py-2 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-700/50">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-orange-400">
                {Number(item.price || item.price_base || 0).toLocaleString("vi-VN")}
              </span>
              <span className="text-sm text-gray-400">VND</span>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="relative p-6 flex flex-col flex-1">
        <h3 className="text-white text-xl md:text-2xl font-bold mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors duration-300">
          {item.dish_name || "Unnamed dish"}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-400 line-clamp-3 flex-1">
          {item.notes || "Không có mô tả"}
        </p>
        <button
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/5 hover:from-orange-500 hover:to-orange-600 border-2 border-orange-500/30 hover:border-orange-500 rounded-xl text-orange-400 hover:text-white font-semibold transition-all duration-300 group/btn mt-auto ${
            isInactive ? "cursor-not-allowed opacity-50" : "hover:shadow-lg hover:shadow-orange-500/50"
          }`}
          disabled={isInactive}
          onClick={() => !isInactive && navigate(`/dish/${item.dish_id}`)}
        >
          {isInactive ? "Tạm ngừng" : "Xem chi tiết"}
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const MenuHero: React.FC = () => {
  const navigate = useNavigate()
  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img src={assets.images.background} alt="Gourmet food spread" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900" />
      </div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
          Khám phá thực đơn mới 2025.
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-gray-300  md:text-xl lg:text-2xl">
          Mỗi bữa ăn là một hành trình trải nghiệm.
        </p>
        <button
          className="mt-8 flex items-center justify-center gap-2 px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-1 border-2 border-orange-400/50"
          onClick={() => navigate("/table")}
        >
          <Sparkles className="w-6 h-6" />
          Đặt bàn ngay
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent" />
    </section>
  )
}

const Menu: React.FC = () => {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceSort, setPriceSort] = useState<"asc" | "desc" | null>(null)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([])
  const [menusWithItems, setMenusWithItems] = useState<MenuWithItems[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [popularIds, setPopularIds] = useState<string[]>([])

  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [categoriesRes, menusRes] = await Promise.all([
          clientAPI.getMenuCategories(),
          clientAPI.getMenusWithItems({})
        ])
        if (categoriesRes.data.status === "success") setCategories(categoriesRes.data.data)
        else setError(categoriesRes.data.message)
        if (menusRes.data.status === "success") setMenusWithItems(menusRes.data.data)
        else setError(menusRes.data.message)
      } catch {
        setError("Không thể tải dữ liệu")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    clientAPI.getPopularDishes().then((res) => {
      if (res.data.status === "success") {
        setPopularIds(res.data.data.map((dish) => dish.id))
      }
    })
  }, [])

  useEffect(() => {
    const fetchFilteredDishes = async () => {
      if (!debouncedSearch.trim() && !selectedCategory && !priceSort) {
        setFilteredDishes([])
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const response = await clientAPI.searchFilter({
          q: debouncedSearch.trim() || undefined,
          category_id: selectedCategory || undefined,
          sort_price: priceSort || undefined
        })
        if (response.data.status === "success") setFilteredDishes(response.data.data)
        else setError(response.data.message)
      } catch {
        setError("Không thể tìm kiếm hoặc lọc món ăn")
      } finally {
        setIsLoading(false)
      }
    }
    fetchFilteredDishes()
  }, [debouncedSearch, selectedCategory, priceSort])

  const displayMenus = selectedMenuId ? menusWithItems.filter((menu) => menu.id === selectedMenuId) : menusWithItems

  const dishToMenuItem = (dish: Dish): MenuItemInMenu => ({
    id: dish.id,
    dish_id: dish.id,
    dish_name: dish.name,
    price: dish.price,
    price_base: dish.price,
    notes: dish.desc || "",
    dish_image: dish.image ?? null,
    dish_active: dish.is_active
  })

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <section className="relative bg-gray-900/50 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-start md:gap-6">
              <div className="relative flex-1 max-w-lg">
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedMenuId(null)
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 pl-12 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[150px] group">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 Carb-pointer-events-none z-10" />
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value || null)
                      setSelectedMenuId(null)
                    }}
                    className="w-full appearance-none rounded-lg border-2 border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 pl-10 pr-10 py-3 text-white shadow-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all duration-300 cursor-pointer hover:border-orange-400 hover:shadow-orange-500/20"
                  >
                    <option value="" className="bg-gray-800 text-white py-2">
                      Tất cả danh mục
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-gray-800 text-white py-2">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400 pointer-events-none transition-transform duration-300 group-hover:translate-y-[-4px]" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <div className="relative flex-1 min-w-[150px] group">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                  <select
                    value={priceSort || ""}
                    onChange={(e) => {
                      setPriceSort((e.target.value as "asc" | "desc") || null)
                      setSelectedMenuId(null)
                    }}
                    className="w-full appearance-none rounded-lg border-2 border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 pl-10 pr-10 py-3 text-white shadow-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all duration-300 cursor-pointer hover:border-orange-400 hover:shadow-orange-500/20"
                  >
                    <option value="" className="bg-gray-800 text-white py-2">
                      Lọc theo giá
                    </option>
                    <option value="asc" className="bg-gray-800 text-white py-2">
                      Giá: Thấp đến Cao
                    </option>
                    <option value="desc" className="bg-gray-800 text-white py-2">
                      Giá: Cao đến Thấp
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400 pointer-events-none transition-transform duration-300 group-hover:translate-y-[-4px]" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>
            </div>
            {menusWithItems.length > 0 && !search && !selectedCategory && !priceSort && (
              <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => {
                    setSelectedMenuId(null)
                    setSearch("")
                    setSelectedCategory(null)
                    setPriceSort(null)
                  }}
                  className={`whitespace-nowrap rounded-lg border px-6 py-2 text-sm font-medium transition-all ${
                    !selectedMenuId
                      ? "border-orange-500 bg-orange-500/20 text-orange-500"
                      : "border-gray-700 bg-gray-800 text-white hover:border-orange-500 hover:bg-gray-700 hover:text-orange-500"
                  }`}
                >
                  Tất cả thực đơn
                </button>
                {menusWithItems
                  .filter((menu) => menu.is_active)
                  .map((menu) => (
                    <button
                      key={menu.id}
                      onClick={() => setSelectedMenuId(menu.id)}
                      className={`whitespace-nowrap rounded-lg border px-6 py-2 text-sm font-medium transition-all ${
                        selectedMenuId === menu.id
                          ? "border-orange-500 bg-orange-500/20 text-orange-500"
                          : "border-gray-700 bg-gray-800 text-white hover:border-orange-500 hover:bg-gray-700 hover:text-orange-500 cursor-pointer"
                      }`}
                    >
                      {menu.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </section>

        <MenuHero />

        {error && (
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-2xl p-6 max-w-2xl mx-auto text-center backdrop-blur-sm mb-8">
            <p className="text-red-400 text-lg">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Đang tải thực đơn...</p>
          </div>
        ) : filteredDishes.length > 0 ? (
          <section className="relative px-4 py-16 md:py-24">
            <div className="mx-auto max-w-full">
              <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 text-orange-500">
                  <Sparkles className="h-6 w-6" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Thực đơn của chúng tôi</span>
                </div>
                <h2 className="font-serif text-4xl font-bold text-white md:text-5xl">
                  Khám Phá Các Món Ăn Đặc Trưng Của Chúng Tôi
                </h2>
                <p className="mt-4 text-balance text-lg leading-relaxed text-gray-400">
                  Được chế biến với đam mê, phục vụ với sự xuất sắc
                </p>
              </div>
              {/* Hiển thị dạng grid 4 cột */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {filteredDishes.map((dish) => (
                  <MenuItem key={dish.id} item={dishToMenuItem(dish)} isPopular={popularIds.includes(dish.id)} />
                ))}
              </div>
            </div>
          </section>
        ) : displayMenus.filter((menu) => menu.is_active).length === 0 ? (
          <div className="text-center text-gray-400 py-12">Hiện tại không có thực đơn nào đang hoạt động.</div>
        ) : (
          displayMenus
            .filter((menu) => menu.is_active)
            .map((menu) => (
              <section key={menu.id} className="relative px-4 py-16 md:py-16">
                <div className="mx-auto max-w-7xl">
                  <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 text-orange-500">
                      <Sparkles className="h-6 w-6" />
                      <span className="text-sm font-semibold uppercase tracking-wider">Thực đơn của chúng tôi</span>
                    </div>
                    <h2 className="font-extrabold text-4xl text-white md:text-5xl">{menu.name}</h2>
                    <p className="mt-4 text-balance text-lg leading-relaxed text-gray-400">
                      Được chế biến với đam mê, phục vụ với sự xuất sắc
                    </p>
                  </div>
                  {/* Hiển thị dạng grid 4 cột */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {menu.items.map((item) => (
                      <MenuItem key={item.id} item={item} isPopular={popularIds.includes(item.dish_id)} />
                    ))}
                  </div>
                </div>
              </section>
            ))
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Menu
