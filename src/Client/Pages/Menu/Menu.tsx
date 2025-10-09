import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { assets } from "src/Assets/assets"
import { clientAPI } from "src/Apis/Client/menu.api"
import { DishClient } from "src/Types/dish.type"
import { Category } from "src/Types/dishCategory.type"
import { SpecialMenu } from "src/Types/menu.type"

// MenuItem Component
interface MenuItemProps {
  item: DishClient
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const navigate = useNavigate()
  return (
    <div
      className="min-w-[280px] max-w-[320px] bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2 cursor-pointer"
      onClick={() => navigate(`/dish/${item.id}`)}
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={assets.rectangles.Breakfast_Bowl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {item.reviews_avg_rating && item.reviews_avg_rating >= 4 && (
          <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Bán chạy
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white mb-2 truncate">{item.name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-orange-400">${item.price}</span>
          <button
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              item.is_active
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!item.is_active}
            onClick={(e) => {
              e.stopPropagation()
              if (item.is_active) {
                alert(`Đã thêm ${item.name} vào giỏ hàng`)
              }
            }}
          >
            {item.is_active ? "Order Now" : "Hết hàng"}
          </button>
        </div>
      </div>
    </div>
  )
}

// MenuSection Component
interface MenuSectionProps {
  title: string
  items: DishClient[]
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, items }) => {
  return (
    <section className="py-10">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.length > 0 ? (
          items.map((item) => <MenuItem key={item.id} item={item} />)
        ) : (
          <p className="text-gray-400 text-center col-span-full">Không có món ăn nào.</p>
        )}
      </div>
    </section>
  )
}

// Menu Component
const Menu: React.FC = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [specialMenu, setSpecialMenu] = useState<SpecialMenu | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceSort, setPriceSort] = useState<"asc" | "desc" | null>(null)
  const [status, setStatus] = useState<"active" | "inactive" | null>(null)
  const [filteredDishes, setFilteredDishes] = useState<DishClient[]>([])
  const [activeTab, setActiveTab] = useState<string | "special">("special")
  const [error, setError] = useState<string | null>(null)

  // Lấy danh mục và menu đặc biệt khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await clientAPI.getCategories()
        if (response.data.status === "success") {
          setCategories(response.data.data)
          setActiveTab(response.data.data.length > 0 ? response.data.data[0].id : "special")
        } else {
          setError(response.data.message)
        }
      } catch (error) {
        setError("Không thể tải danh mục món ăn")
        console.error("Error fetching categories:", error)
      }
    }

    const fetchSpecialMenu = async () => {
      try {
        const response = await clientAPI.getSpecialMenu()
        if (response.data.status === "success") {
          setSpecialMenu(response.data.data)
          if (response.data.data) {
            setActiveTab("special") // Ưu tiên hiển thị menu đặc biệt nếu có
          }
        } else {
          setError(response.data.message)
        }
      } catch (error) {
        setError("Không thể tải menu đặc biệt")
        console.error("Error fetching special menu:", error)
      }
    }

    fetchCategories()
    fetchSpecialMenu()
  }, [])

  // Tìm kiếm và lọc món ăn
  useEffect(() => {
    const fetchFilteredDishes = async () => {
      try {
        const response = await clientAPI.searchFilter({
          search: search || undefined,
          category_id: selectedCategory || undefined,
          price_sort: priceSort || undefined,
          status: status || undefined
        })
        if (response.data.status === "success") {
          setFilteredDishes(response.data.data)
        } else {
          setError(response.data.message)
        }
      } catch (error) {
        setError("Không thể tìm kiếm hoặc lọc món ăn")
        console.error("Error fetching filtered dishes:", error)
      }
    }

    fetchFilteredDishes()
  }, [search, selectedCategory, priceSort, status])

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12">
        {/* Tiêu đề trang */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Explore Menu</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience unique dishes prepared with passion and creativity, bringing you wonderful emotions.
          </p>
        </div>

        {/* Hiển thị lỗi nếu có */}
        {error && (
          <div className="bg-red-600/80 text-white p-4 rounded-lg mb-8 max-w-2xl mx-auto text-center shadow-md">
            {error}
          </div>
        )}

        {/* Nút quay lại */}
        <button
          className="mb-8 bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition-colors shadow-md"
          onClick={() => navigate(-1)}
        >
          Back
        </button>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            className="bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={priceSort || ""}
            onChange={(e) => setPriceSort((e.target.value as "asc" | "desc") || null)}
          >
            <option value="">Sắp xếp giá</option>
            <option value="asc">Thấp → Cao</option>
            <option value="desc">Cao → Thấp</option>
          </select>
          <select
            className="bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={status || ""}
            onChange={(e) => setStatus((e.target.value as "active" | "inactive") || null)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Hết hàng</option>
          </select>
        </div>

        {/* Kết quả tìm kiếm/lọc */}
        {search || selectedCategory || priceSort || status ? (
          <MenuSection title="Kết quả tìm kiếm" items={filteredDishes} />
        ) : (
          <>
            {/* Tab danh mục và menu đặc biệt */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              {specialMenu && (
                <button
                  className={`flex items-center gap-2 py-2 px-5 rounded-lg transition-colors border ${
                    activeTab === "special"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
                  }`}
                  onClick={() => setActiveTab("special")}
                >
                  <span className="text-yellow-300">✨</span>
                  {specialMenu.name}
                </button>
              )}
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`py-2 px-5 rounded-lg transition-colors border ${
                    activeTab === category.id
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
                  }`}
                  onClick={() => setActiveTab(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Hiển thị món theo tab */}
            {activeTab === "special" && specialMenu ? (
              <MenuSection title={specialMenu.name} items={specialMenu.dishes} />
            ) : (
              categories
                .filter((category) => category.id === activeTab)
                .map((category) => <MenuSection key={category.id} title={category.name} items={category.dishes} />)
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Menu
