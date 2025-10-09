import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "src/Assets/assets";
import { clientAPI } from "src/Apis/Client/home.api";
import Header from "src/Client/Components/HeaderClient";
import Footer from "src/Client/Components/FooterClient";
import { Statistics, Dishes, CategoryDishes, Promotion, Chef, DiningTable } from "src/Types/utils.type";

const Home = () => {
  const [stats, setStats] = useState<Statistics>({ restaurants: 0, new_dishes: 0, years_experience: 0 });
  const [popularDishes, setPopularDishes] = useState<Dishes[]>([]);
  const [categories, setCategories] = useState<CategoryDishes[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [formData, setFormData] = useState<{ reserved_at: string; number_of_people: number }>({ reserved_at: "", number_of_people: 1 });
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<{
    stats: boolean;
    dishes: boolean;
    categories: boolean;
    promotions: boolean;
    chefs: boolean;
    tables: boolean;
    newsletter: boolean;
  }>({
    stats: true,
    dishes: true,
    categories: true,
    promotions: true,
    chefs: true,
    tables: false,
    newsletter: false,
  });
  const [error, setError] = useState<{
    stats: string | null;
    dishes: string | null;
    categories: string | null;
    promotions: string | null;
    chefs: string | null;
    tables: string | null;
    newsletter: string | null;
  }>({
    stats: null,
    dishes: null,
    categories: null,
    promotions: null,
    chefs: null,
    tables: null,
    newsletter: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch statistics
    clientAPI.getStatistics()
      .then((response) => {
        setStats(response.data.data);
        setLoading((prev) => ({ ...prev, stats: false }));
      })
      .catch((err) => {
        setError((prev) => ({ ...prev, stats: "Error fetching statistics" }));
        setLoading((prev) => ({ ...prev, stats: false }));
      });

    // Fetch popular dishes
    clientAPI.getPopularDishes()
      .then((response) => {
        setPopularDishes(response.data.data);
        setLoading((prev) => ({ ...prev, dishes: false }));
      })
      .catch((err) => {
        setError((prev) => ({ ...prev, dishes: "Error fetching popular dishes" }));
        setLoading((prev) => ({ ...prev, dishes: false }));
      });

    // Fetch menu categories
    clientAPI.getMenuCategories()
      .then((response) => {
        setCategories(response.data.data);
        setLoading((prev) => ({ ...prev, categories: false }));
      })
      .catch((err) => {
        setError((prev) => ({ ...prev, categories: "Error fetching menu categories" }));
        setLoading((prev) => ({ ...prev, categories: false }));
      });

    // Fetch promotions
    clientAPI.getPromotions()
      .then((response) => {
        setPromotions(response.data.data);
        setLoading((prev) => ({ ...prev, promotions: false }));
      })
      .catch((err) => {
        setError((prev) => ({ ...prev, promotions: "Error fetching promotions" }));
        setLoading((prev) => ({ ...prev, promotions: false }));
      });

    // Fetch chefs
    clientAPI.getChefs()
      .then((response) => {
        setChefs(response.data.data);
        setLoading((prev) => ({ ...prev, chefs: false }));
      })
      .catch((err) => {
        setError((prev) => ({ ...prev, chefs: "Error fetching chefs" }));
        setLoading((prev) => ({ ...prev, chefs: false }));
      });
  }, []);

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, tables: true }));
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await clientAPI.getAvailableTables(formData);
      setTables(response.data.data);
      setLoading((prev) => ({ ...prev, tables: false }));
    } catch (err) {
      setError((prev) => ({ ...prev, tables: "Error fetching available tables or please login" }));
      setLoading((prev) => ({ ...prev, tables: false }));
    }
  };


  const filteredDishes = Array.isArray(categories)
  ? selectedCategory === "All"
    ? categories.flatMap((cat) => cat.dishes || [])
    : categories.find((cat) => cat.name === selectedCategory)?.dishes || []
  : [];

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
            <div>Loading...</div>
          ) : error.stats ? (
            <div>{error.stats}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 lg:gap-16 text-center text-white">
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">{stats.restaurants}</div>
                <div className="text-base md:text-lg lg:text-xl">Number Restaurant</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">{stats.new_dishes}</div>
                <div className="text-base md:text-lg lg:text-xl">New Food Menu Dishes</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">{stats.years_experience}</div>
                <div className="text-base md:text-lg lg:text-xl">Years of experience</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Most Popular Food Section */}
      <section className="bg-gray-900 py-12 md:py-16 px-4 sm:px-6 lg:px-[135px]">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium mb-4 md:mb-6">
            Most popular food
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto px-4">
            A list of most popular Bangladeshi food including mains, drinks, and deserts you must try while in Bangladesh,
            for an authentic experience. Check now!
          </p>
        </div>
        {loading.dishes ? (
          <div>Loading...</div>
        ) : error.dishes ? (
          <div>{error.dishes}</div>
        ) : Array.isArray(popularDishes) && popularDishes.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {popularDishes.map((dish) => (
              <div key={dish.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={assets.rectangles.salad}
                  alt={dish.name}
                  className="w-full h-[250px] md:h-[300px] object-cover"
                />
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                    <h3 className="text-white text-xl md:text-2xl font-medium">{dish.name}</h3>
                    <span className="text-white text-xl md:text-2xl font-medium">${dish.price}</span>
                  </div>
                  <p className="text-white/80 text-sm md:text-base mb-4">{dish.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <img
                          key={i}
                          src={i < Math.round(dish.reviews_avg_rating || 0) ? assets.icons.star8 : assets.icons.star9}
                          alt="star"
                          className="w-5 h-5 md:w-6 md:h-6"
                        />
                      ))}
                    </div>
                    <Link
                      to={`/dish/${dish.id}`}
                      className="text-white hover:text-orange-400 transition-colors text-sm md:text-base"
                    >
                      Order Now
                      <div className="h-px bg-current w-full mt-1"></div>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No popular dishes available</div>
        )}
        <div className="text-center mt-8 md:mt-12">
          <Link to="/menu" className="inline-flex items-center text-orange-400 font-medium text-sm md:text-base">
            Explore All Food
            <img src={assets.icons.vector5} alt="arrow" className="ml-2 w-3 h-3 md:w-4 md:h-4" />
          </Link>
          <div className="h-px bg-orange-400 w-32 md:w-36 mx-auto mt-1"></div>
        </div>
      </section>

      {/* Booking & Location Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-orange-400 p-10 rounded-lg">
            <h2 className="text-gray-900 text-3xl md:text-4xl font-medium mb-8">Reserve! Book Now</h2>
            <form onSubmit={handleTableSubmit}>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-gray-900 text-2xl font-medium mb-2 block">Set date</label>
                  <input
                    type="datetime-local"
                    value={formData.reserved_at}
                    onChange={(e) => setFormData({ ...formData, reserved_at: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-900 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-900 text-2xl font-medium mb-2 block">Guests</label>
                  <input
                    type="number"
                    value={formData.number_of_people}
                    onChange={(e) => setFormData({ ...formData, number_of_people: parseInt(e.target.value) })}
                    min="1"
                    className="w-full bg-transparent border-b border-gray-900 text-gray-900"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-4 px-8 rounded font-medium hover:bg-gray-800 transition-colors"
                disabled={loading.tables}
              >
                {loading.tables ? "Checking..." : "Book now"}
              </button>
            </form>
            {error.tables && <div className="text-red-500 mt-4">{error.tables}</div>}
            {tables.length > 0 && (
              <div className="mt-4">
                <h3 className="text-gray-900 text-xl">Available Tables:</h3>
                <ul>
                  {tables.map((table) => (
                    <li key={table.id}>Table {table.table_number} (Capacity: {table.capacity})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url('${assets.rectangles.coffee}')` }}
            />
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm rounded-lg" />
            <div className="relative z-10 p-10 text-center text-white border border-white/20 rounded-lg h-full flex flex-col justify-center">
              <h3 className="text-2xl font-medium mb-6">Find us here</h3>
              <div className="space-y-2">
                <p>Avenue Marina 34568 NY (U.S)</p>
                <p>+0123 456 7890</p>
                <p>hellouihut@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 grid lg:grid-cols-2 gap-8">
          <div className="bg-orange-400 p-10 rounded-lg">
            <h3 className="text-gray-900 text-2xl font-medium mb-6 text-center">Opening Times</h3>
            <div className="space-y-4 text-gray-900">
              <div className="flex justify-between">
                <span>Mon</span>
                <span>17:00 to 23:00</span>
              </div>
              <div className="flex justify-between">
                <span>Wed</span>
                <span>19:00 to 24:00</span>
              </div>
              <div className="flex justify-between">
                <span>Thu</span>
                <span>14:00 to 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>Fri</span>
                <span>16:00 to 24:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sat/Sun</span>
                <span>20:00 to 4:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
      <div className="text-center mb-16">
        <p className="text-white/80 mb-4">Our menu</p>
        <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">Choose & Taste What You Like</h2>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          A list of top Bangladeshi food including mains, drinks, and deserts you must try while in Bangladesh, for an
          authentic experience. Check now!
        </p>
      </div>
      {loading.categories ? (
        <div>Loading...</div>
      ) : error.categories ? (
        <div>{error.categories}</div>
      ) : Array.isArray(categories) && categories.length > 0 ? (
        <>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div
              className={`text-center cursor-pointer ${
                selectedCategory === "All" ? "text-orange-400" : "text-white"
              } text-3xl font-medium hover:text-orange-400 transition-colors`}
              onClick={() => setSelectedCategory("All")}
            >
              <span>All</span>
              {selectedCategory === "All" && <div className="h-px bg-orange-400 w-full mt-2"></div>}
            </div>
            {categories.map((category: CategoryDishes) => (
              <div
                key={category.id}
                className={`text-center cursor-pointer ${
                  selectedCategory === category.name ? "text-orange-400" : "text-white"
                } text-3xl font-medium hover:text-orange-400 transition-colors`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <span>{category.name}</span>
                {selectedCategory === category.name && <div className="h-px bg-orange-400 w-full mt-2"></div>}
              </div>
            ))}
          </div>
          <div className="h-px bg-white/20 w-full mb-8"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {filteredDishes.slice(0, Math.ceil(filteredDishes.length / 2)).map((item: Dishes) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={assets.ellipses.ellipse30}
                      alt={item.name}
                      className="w-19 h-19 rounded-full object-cover"
                    />
                    <h3 className="text-white text-3xl font-medium max-w-xs">{item.name}</h3>
                  </div>
                  <span className="text-white text-3xl font-medium">${item.price}</span>
                </div>
              ))}
            </div>
            <div className="space-y-8">
              {filteredDishes.slice(Math.ceil(filteredDishes.length / 2)).map((item: Dishes) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={assets.ellipses.ellipse30}
                      alt={item.name}
                      className="w-19 h-19 rounded-full object-cover"
                    />
                    <h3 className="text-white text-3xl font-medium max-w-xs">{item.name}</h3>
                  </div>
                  <span className="text-white text-3xl font-medium">${item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div>No categories available</div>
      )}
    </section>

      {/* Gallery Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="text-center mb-16">
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">Visit Our Restaurant</h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Quality country-style menu selection, friendly and efficient service, combined with genuine value has kept Our
            Best serving families like yours for over 28.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <img
              src={assets.rectangles.house}
              alt="Restaurant interior"
              className="w-full h-[285px] object-cover border border-white"
            />
            <img
              src={assets.rectangles.restaurant2}
              alt="Restaurant interior"
              className="w-full h-[285px] object-cover border border-white"
            />
          </div>
          <div className="col-span-1">
            <img
              src={assets.rectangles.restaurant}
              alt="Restaurant interior"
              className="w-full h-[600px] object-cover border border-white"
            />
          </div>
          <div className="space-y-4">
            <img
              src={assets.rectangles.Dish}
              alt="Restaurant interior"
              className="w-full h-[285px] object-cover border border-white"
            />
            <img
              src={assets.rectangles.chef}
              alt="Restaurant interior"
              className="w-full h-[285px] object-cover border border-white"
            />
          </div>
        </div>
      </section>

      {/* Daily Offers Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
      <div className="text-center mb-16">
        <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium">Our Daily Offers</h2>
      </div>
      {loading.promotions || loading.dishes ? (
        <div>Loading...</div>
      ) : error.promotions || error.dishes ? (
        <div>{error.promotions || error.dishes}</div>
      ) : Array.isArray(promotions) && promotions.length > 0 && Array.isArray(popularDishes) && popularDishes.length > 0 ? (
    <div className="grid lg:grid-cols-2 gap-8 items-center">
      <div className="relative">
        <img
          src={assets.rectangles.soup}
          alt="Special offer"
          className="w-full h-[434px] object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent rounded-lg" />
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 text-white">
          <h3 className="text-3xl font-semibold mb-4">{promotions[0].description || "Lunch Time"}</h3>
          <div className="flex items-center mb-4">
            <span className="text-8xl font-bold text-orange-400 mr-2">{promotions[0].discount_percent || 30}%</span>
            <span className="text-3xl font-semibold">off</span>
          </div>
          <p className="text-lg mb-6 max-w-xs">We love food, lots of different and food, just like you.</p>
          <button className="bg-orange-400/80 hover:bg-orange-400 px-8 py-3 rounded font-semibold transition-colors">
            Order Now
          </button>
        </div>
        <div className="absolute inset-4 border border-white/20 rounded-lg pointer-events-none" />
      </div>
      <div className="space-y-6">
        {popularDishes.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-start space-x-4">
            <img src={assets.rectangles.shrimp} alt={item.name} className="w-32 h-32 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-2xl font-medium">{item.name}</h3>
                <span className="text-white text-3xl font-medium">${item.price}</span>
              </div>
              <p className="text-white/80 text-lg">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div>No promotions or popular dishes available</div>
  )}
</section>

      {/* Features Banner */}
      <section className="bg-orange-400 py-12">
        <div className="px-6 sm:px-8 lg:px-[135px]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-gray-900">
            {[
              { icon: assets.icons.star3, img: assets.images.image29, title: "Super Taste" },
              { icon: assets.icons.star5, img: assets.images.image30, title: "Self Services" },
              { icon: assets.icons.star2, img: assets.images.image28, title: "Best Food" },
              { icon: assets.icons.star6, img: assets.images.image31, title: "Fast Delivery" },
              { icon: assets.icons.star4, img: assets.images.image29, title: "Super Taste" },
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
        <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">They will cook for you</h2>
        <p className="text-white/80 text-lg max-w-3xl mx-auto">
          Our Diners can enjoy cooking for themselves, or visiting a curated selection of restaurants in the area. They
          will cook for you and make sure you have a home away from home at all times.
        </p>
      </div>
      {loading.chefs ? (
        <div>Loading...</div>
      ) : error.chefs ? (
        <div>{error.chefs}</div>
      ) : (chefs || []).length === 0 ? (
        <div>No chefs available</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {(chefs || []).map((chef: Chef) => (
            <div key={chef.id} className="text-center">
              <img
                src={chef.avatar || assets.rectangles.chef2}
                alt={chef.name}
                className="w-full h-[443px] object-cover border border-white/50 rounded-lg mb-6"
              />
              <h3 className="text-white text-3xl font-medium mb-2">{chef.name}</h3>
              <p className="text-white text-lg font-semibold">Chef</p>
            </div>
          ))}
        </div>
      )}
    </section>

      {/* Blog Section */}
      <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
        <div className="text-center mb-16">
          <p className="text-white/80 mb-4">Our blog</p>
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium">Recent Articles</h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="grid md:grid-cols-2 gap-6">
            <img src={assets.rectangles.sandwich} alt="Blog post" className="w-full h-[348px] object-cover rounded-lg" />
            <div>
              <p className="text-white mb-4">August 6, 2022</p>
              <h3 className="text-white text-3xl font-medium mb-4">The Most Expensive Cup of Coffee in the Usa</h3>
              <p className="text-white/80 text-lg mb-6">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque lauatium, totam rem
                aperiam perspiciatis unde omnis.
              </p>
              <div className="flex justify-between text-white mb-6">
                <span>Comments 165</span>
                <span>View 1265</span>
              </div>
              <Link to="#" className="text-white hover:text-orange-400 transition-colors">
                Read Now
                <div className="h-px bg-current w-16 mt-1"></div>
              </Link>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="order-2 md:order-1">
              <p className="text-white mb-4">August 6, 2022</p>
              <h3 className="text-white text-3xl font-medium mb-4">Chicken Soup With Spring Veggies And Pasta</h3>
              <p className="text-white/80 text-lg mb-6">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque lauatium, totam rem
                aperiam perspiciatis unde omnis.
              </p>
              <div className="flex justify-between text-white mb-6">
                <span>Comments 165</span>
                <span>View 1265</span>
              </div>
              <Link to="#" className="text-white hover:text-orange-400 transition-colors">
                Read Now
                <div className="h-px bg-current w-16 mt-1"></div>
              </Link>
            </div>
            <img
              src={assets.rectangles.pizza}
              alt="Blog post"
              className="w-full h-[348px] object-cover rounded-lg order-1 md:order-2"
            />
          </div>
        </div>
        <div className="text-center mt-12">
          <Link to="#" className="inline-flex items-center text-orange-400 font-medium">
            Explore All Blogs
            <img src={assets.icons.vector5} alt="arrow" className="ml-2 w-4 h-4" />
          </Link>
          <div className="h-px bg-orange-400 w-36 mx-auto mt-1"></div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${assets.rectangles.sandwich2}')` }}
        />
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
        <div className="relative z-10 py-16 px-6 sm:px-8 lg:px-[135px]">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h2 className="text-4xl font-medium mb-4">Newsletter</h2>
              <p className="text-white/80 text-lg max-w-md">
                Subscribe to our newsletter and receive 15% discount from your order.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
