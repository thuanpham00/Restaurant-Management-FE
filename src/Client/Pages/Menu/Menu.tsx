import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { clientAPI } from "src/Apis/Client/menu.api"
import { Dish } from "src/Types/dish.type"
import { MenuWithItems, MenuItemInMenu } from "src/Types/menu.type"
import { assets } from "src/Assets/assets"

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

const MenuItem: React.FC<{ item: MenuItemInMenu }> = ({ item }) => {
  const navigate = useNavigate()
  const isInactive = !item.dish_active

  return (
    <div
      className={`h-full flex flex-col relative bg-zinc-900 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        isInactive ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <div className="relative h-[280px] overflow-hidden flex-shrink-0">
        <img
          src={assets.rectangles.salad}
          alt={item.dish_name || "Dish"}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isInactive ? "" : "hover:scale-110"
          }`}
        />
        {isInactive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600/90 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
              Hết hàng
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-serif text-2xl font-bold text-white line-clamp-2 min-h-[3.5rem]">
            {item.dish_name || "Unnamed dish"}
          </h3>
          <span className="font-serif text-2xl font-bold text-orange-500 block mt-2">
            {`${item.price || item.price_base || 0} VND`}
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-gray-400 line-clamp-3 flex-1">
          {item.notes || "Không có mô tả"}
        </p>
        <button
          className={`w-full flex items-center justify-center gap-2 bg-orange-500 font-semibold text-white py-3 rounded-lg transition-all mt-auto ${
            isInactive ? "cursor-not-allowed opacity-50" : "hover:scale-[1.02] hover:bg-orange-600"
          }`}
          disabled={isInactive}
          onClick={() => !isInactive && navigate(`/dish/${item.dish_id}`)}
        >
          {isInactive ? "Tạm ngừng" : "Order Now"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
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
        <img
          src={assets.images.background} // dùng ảnh từ assets
          alt="Gourmet food spread"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900" />
      </div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
          New Menu 2025
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-gray-300 md:text-xl lg:text-2xl">
          Food Is Not Just Eating Energy, an experience
        </p>
        <button
          className="mt-8 gap-2 bg-orange-500 px-8 py-6 text-base font-semibold text-white rounded-lg transition-all hover:scale-105 hover:bg-orange-600"
          onClick={() => navigate("/table")}
        >
          Order Now
          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
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
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null) // Thêm state này
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([])
  const [menusWithItems, setMenusWithItems] = useState<MenuWithItems[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [menuIndices, setMenuIndices] = useState<Record<string, number>>({})

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

  const itemsPerPage = 3
  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage)

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % totalPages)
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)

  // Lọc menus để hiển thị
  const displayMenus = selectedMenuId 
    ? menusWithItems.filter(menu => menu.id === selectedMenuId)
    : menusWithItems

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <section className="relative bg-gray-900/50 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedMenuId(null) // Reset menu khi search
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 pl-12 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="flex gap-4">
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value || null)
                    setSelectedMenuId(null) // Reset menu khi chọn category
                  }}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  value={priceSort || ""}
                  onChange={(e) => {
                    setPriceSort((e.target.value as "asc" | "desc") || null)
                    setSelectedMenuId(null) // Reset menu khi sort
                  }}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">Sort by Price</option>
                  <option value="asc">Price: Low to High</option>
                  <option value="desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Tabs cho menus */}
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
                  All Menus
                </button>
                {menusWithItems.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => {
                      if (menu.is_active) {
                        setSelectedMenuId(menu.id)
                      }
                    }}
                    disabled={!menu.is_active}
                    className={`whitespace-nowrap rounded-lg border px-6 py-2 text-sm font-medium transition-all ${
                      selectedMenuId === menu.id
                        ? "border-orange-500 bg-orange-500/20 text-orange-500"
                        : menu.is_active
                        ? "border-gray-700 bg-gray-800 text-white hover:border-orange-500 hover:bg-gray-700 hover:text-orange-500 cursor-pointer"
                        : "border-gray-800 bg-gray-900 text-gray-600 opacity-40 cursor-not-allowed"
                    }`}
                    title={!menu.is_active ? "Menu này tạm ngừng hoạt động" : undefined}
                  >
                    {menu.name}
                    {!menu.is_active && <span className="ml-2 text-xs text-gray-500">(Inactive)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <MenuHero />

        {error && (
          <div className="bg-red-600/80 text-white p-4 rounded-lg mb-8 max-w-2xl mx-auto text-center shadow-md font-sans">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center mb-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent"></div>
            <p className="text-gray-300 mt-2">Đang tải...</p>
          </div>
        ) : filteredDishes.length > 0 ? (
          <section className="relative px-4 py-16 md:py-24">
            <div className="mx-auto max-w-full">
              <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 text-orange-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18m-9 5h9" />
                  </svg>
                  <span className="text-sm font-semibold uppercase tracking-wider">Our Menu</span>
                </div>
                <h2 className="font-serif text-4xl font-bold text-white md:text-5xl">Discover Our Signature Dishes</h2>
                <p className="mt-4 text-balance text-lg leading-relaxed text-gray-400">
                  Crafted with passion, served with excellence
                </p>
              </div>
              <div className="relative">
                {totalPages > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute -left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full border border-orange-500 bg-zinc-900 text-orange-500 shadow-lg transition-all hover:scale-110 hover:bg-orange-500 hover:text-white md:flex items-center justify-center"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute -right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full border border-orange-500 bg-zinc-900 text-orange-500 shadow-lg transition-all hover:scale-110 hover:bg-orange-500 hover:text-white md:flex items-center justify-center"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                <div className="overflow-hidden">
                  <div
                    className="flex gap-5 transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(-${currentIndex * 100}%)`
                    }}
                  >
                    {filteredDishes.map((dish) => (
                      <div key={dish.id} className="w-full md:w-1/3 flex-shrink-0">
                        <MenuItem
                          item={{
                            id: dish.id,
                            dish_id: dish.id,
                            dish_name: dish.name,
                            price: dish.price,
                            price_base: dish.price,
                            notes: dish.desc || "",
                            dish_image: dish.image ?? null,
                            dish_active: dish.is_active
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-2 rounded-full transition-all ${i === currentIndex ? "w-8 bg-orange-500" : "w-2 bg-gray-400/30"}`}
                        aria-label={`Go to page ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          displayMenus.map((menu) => {
            const itemsPerPage = 3
            const menuCurrentIndex = menuIndices[menu.id] || 0
            const totalPages = Math.ceil(menu.items.length / itemsPerPage)

            const handleMenuNext = () => {
              setMenuIndices((prev) => ({
                ...prev,
                [menu.id]: (menuCurrentIndex + 1) % totalPages
              }))
            }

            const handleMenuPrev = () => {
              setMenuIndices((prev) => ({
                ...prev,
                [menu.id]: (menuCurrentIndex - 1 + totalPages) % totalPages
              }))
            }

            return (
              <section key={menu.id} className="relative px-4 py-16 md:py-16">
                <div className="mx-auto max-w-7xl">
                  <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 text-orange-500">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18m-9 5h9" />
                      </svg>
                      <span className="text-sm font-semibold uppercase tracking-wider">Our Menu</span>
                    </div>
                    <h2 className="font-serif text-4xl font-bold text-white md:text-5xl">{menu.name}</h2>
                    <p className="mt-4 text-balance text-lg leading-relaxed text-gray-400">
                      Crafted with passion, served with excellence
                    </p>
                  </div>
                  <div className="relative">
                    {totalPages > 1 && (
                      <>
                        <button
                          onClick={handleMenuPrev}
                          className="absolute -left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full border border-orange-500 bg-zinc-900 text-orange-500 shadow-lg transition-all hover:scale-110 hover:bg-orange-500 hover:text-white md:flex items-center justify-center"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleMenuNext}
                          className="absolute -right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full border border-orange-500 bg-zinc-900 text-orange-500 shadow-lg transition-all hover:scale-110 hover:bg-orange-500 hover:text-white md:flex items-center justify-center"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    <div className="overflow-hidden">
                      <div
                        className="flex gap-6 transition-transform duration-700 ease-in-out"
                        style={{
                          transform: `translateX(-${menuCurrentIndex * (100 / itemsPerPage)}%)`
                        }}
                      >
                        {menu.items.map((item) => (
                          <div key={item.id} className="w-[30%] flex-shrink-0">
                            <MenuItem item={item} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-8 flex justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setMenuIndices((prev) => ({
                                ...prev,
                                [menu.id]: i
                              }))
                            }
                            className={`h-2 rounded-full transition-all ${
                              i === menuCurrentIndex ? "w-8 bg-orange-500" : "w-2 bg-gray-400/30"
                            }`}
                            aria-label={`Go to page ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )
          })
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Menu