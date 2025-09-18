// Import asset URLs - Đã cập nhật với đường dẫn public cho Vite

import { Link } from "react-router-dom"
import { assets } from "src/Assets/assets"
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"



// Statistics Section Component
const StatisticsSection = () => (
  <section className="relative h-40 md:h-48">
    {/* Background Image */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${assets.rectangles.rectangle26}')` }}
    />
    {/* Overlay */}
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

    {/* Content */}
    <div className="relative z-10 h-full flex items-center justify-center px-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 lg:gap-16 text-center text-white">
        <div>
          <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">06</div>
          <div className="text-base md:text-lg lg:text-xl">Number Restaurant</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">68</div>
          <div className="text-base md:text-lg lg:text-xl">New Food Menu Dishes</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2">36</div>
          <div className="text-base md:text-lg lg:text-xl">Years of experience</div>
        </div>
      </div>
    </div>
  </section>
)

// Most Popular Food Section Component
const MostPopularFood = () => (
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

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {/* Food Card 1 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <img
          src={assets.rectangles.rectangle12}
          alt="Schezwan Noodles"
          className="w-full h-[250px] md:h-[300px] object-cover"
        />
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
            <h3 className="text-white text-xl md:text-2xl font-medium">Schezwan Noodles</h3>
            <span className="text-white text-xl md:text-2xl font-medium">$49</span>
          </div>
          <p className="text-white/80 text-sm md:text-base mb-4">
            Fresh toasted sourdough bread with olive oil and pomegranate.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <img key={i} src={assets.icons.star8} alt="star" className="w-5 h-5 md:w-6 md:h-6" />
              ))}
            </div>
            <Link to="#" className="text-white hover:text-orange-400 transition-colors text-sm md:text-base">
              Order Now
              <div className="h-px bg-current w-full mt-1"></div>
            </Link>
          </div>
        </div>
      </div>

      {/* Food Card 2 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <img
          src={assets.rectangles.rectangle13}
          alt="Schezwan Noodles"
          className="w-full h-[250px] md:h-[300px] object-cover"
        />
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
            <h3 className="text-white text-xl md:text-2xl font-medium">Schezwan Noodles</h3>
            <span className="text-white text-xl md:text-2xl font-medium">$49</span>
          </div>
          <p className="text-white/80 text-sm md:text-base mb-4">
            Fresh toasted sourdough bread with olive oil and pomegranate.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <img key={i} src={assets.icons.star8} alt="star" className="w-5 h-5 md:w-6 md:h-6" />
              ))}
              <img src={assets.icons.star9} alt="star" className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <Link to="#" className="text-white hover:text-orange-400 transition-colors text-sm md:text-base">
              Order Now
              <div className="h-px bg-current w-full mt-1"></div>
            </Link>
          </div>
        </div>
      </div>

      {/* Food Card 3 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden sm:col-span-2 lg:col-span-1">
        <img
          src={assets.rectangles.rectangle14}
          alt="Schezwan Noodles"
          className="w-full h-[250px] md:h-[300px] object-cover"
        />
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
            <h3 className="text-white text-xl md:text-2xl font-medium">Schezwan Noodles</h3>
            <span className="text-white text-xl md:text-2xl font-medium">$49</span>
          </div>
          <p className="text-white/80 text-sm md:text-base mb-4">
            Fresh toasted sourdough bread with olive oil and pomegranate.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <img key={i} src={assets.icons.star8} alt="star" className="w-5 h-5 md:w-6 md:h-6" />
              ))}
              <img src={assets.icons.star9} alt="star" className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <Link to="#" className="text-white hover:text-orange-400 transition-colors text-sm md:text-base">
              Order Now
              <div className="h-px bg-current w-full mt-1"></div>
            </Link>
          </div>
        </div>
      </div>
    </div>

    {/* Explore All Food Link */}
    <div className="text-center mt-8 md:mt-12">
      <Link to="#" className="inline-flex items-center text-orange-400 font-medium text-sm md:text-base">
        Explore All Food
        <img src={assets.icons.vector5} alt="arrow" className="ml-2 w-3 h-3 md:w-4 md:h-4" />
      </Link>
      <div className="h-px bg-orange-400 w-32 md:w-36 mx-auto mt-1"></div>
    </div>
  </section>
)

// Booking & Location Section Component
const BookingLocationSection = () => (
  <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Reservation Form */}
      <div className="bg-orange-400 p-10 rounded-lg">
        <h2 className="text-gray-900 text-3xl md:text-4xl font-medium mb-8">Reserve! Book Now</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-gray-900 text-2xl font-medium mb-2 block">Set date</div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 text-4xl font-medium">21</span>
              <span className="text-gray-900 text-sm">Sep</span>
              <img src={assets.icons.vector12} alt="dropdown" className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="text-gray-900 text-2xl font-medium mb-2 block">Guests</div>
            <div className="flex items-center space-x-2">
              <img src={assets.icons.vector13} alt="up" className="w-3 h-3" />
              <span className="text-gray-900 text-4xl font-medium">2</span>
              <img src={assets.icons.vector12} alt="down" className="w-3 h-3" />
            </div>
          </div>
        </div>

        <button className="w-full bg-gray-900 text-white py-4 px-8 rounded font-medium hover:bg-gray-800 transition-colors">
          Book now
        </button>
      </div>

      {/* Location Info */}
      <div className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center rounded-lg"
          style={{ backgroundImage: `url('${assets.rectangles.rectangle7}')` }}
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

    {/* Opening Times */}
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
)

// Menu Section Component
const MenuSection = () => (
  <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
    <div className="text-center mb-16">
      <p className="text-white/80 mb-4">Our menu</p>
      <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">Choose & Taste What You Like</h2>
      <p className="text-white/80 text-lg max-w-2xl mx-auto">
        A list of top Bangladeshi food including mains, drinks, and deserts you must try while in Bangladesh, for an
        authentic experience. Check now!
      </p>
    </div>

    {/* Menu Categories */}
    <div className="flex flex-wrap justify-center gap-8 mb-8">
      <div className="text-center">
        <span className="text-orange-400 text-3xl font-medium">All</span>
        <div className="h-px bg-orange-400 w-full mt-2"></div>
      </div>
      <span className="text-white text-3xl font-medium cursor-pointer hover:text-orange-400 transition-colors">
        Appetizer
      </span>
      <span className="text-white text-3xl font-medium cursor-pointer hover:text-orange-400 transition-colors">
        Soup
      </span>
      <span className="text-white text-3xl font-medium cursor-pointer hover:text-orange-400 transition-colors">
        Dessert
      </span>
      <span className="text-white text-3xl font-medium cursor-pointer hover:text-orange-400 transition-colors">
        Drinks
      </span>
    </div>

    <div className="h-px bg-white/20 w-full mb-8"></div>

    {/* Menu Items */}
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="space-y-8">
        {[
          { img: assets.ellipses.ellipse30, name: "Chawli Beans and Mint Burger", price: "$11" },
          { img: assets.ellipses.ellipse31, name: "American Chopsuey, Jain Recipe", price: "$16" },
          { img: assets.ellipses.ellipse32, name: "Paneer Nuggets, Quick Paneer Deep-fried", price: "$15" },
          { img: assets.ellipses.ellipse33, name: "Stir Fried Mixed Vegetables in Butter", price: "$23" }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={item.img} alt={item.name} className="w-19 h-19 rounded-full object-cover" />
              <h3 className="text-white text-3xl font-medium max-w-xs">{item.name}</h3>
            </div>
            <span className="text-white text-3xl font-medium">{item.price}</span>
          </div>
        ))}
      </div>

      {/* Right Column */}
      <div className="space-y-8">
        {[
          { img: assets.ellipses.ellipse34, name: "Raw Chicken Fillet Garlic", price: "$25" },
          { img: assets.ellipses.ellipse35, name: "Makai Shorba, Thick Corn Soup", price: "$14" },
          { img: assets.ellipses.ellipse36, name: "Healthy Salmon Power Bowl", price: "$09" },
          { img: assets.ellipses.ellipse37, name: "Paneer N Cheese Roll (Wraps and Rolls)", price: "$10" }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={item.img} alt={item.name} className="w-19 h-19 rounded-full object-cover" />
              <h3 className="text-white text-3xl font-medium max-w-xs">{item.name}</h3>
            </div>
            <span className="text-white text-3xl font-medium">{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// Gallery Section Component
const GallerySection = () => (
  <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
    <div className="text-center mb-16">
      <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">Visit Our Restaurant</h2>
      <p className="text-white/80 text-lg max-w-2xl mx-auto">
        Quality country-style menu selection, friendly and efficient service, combined with genuine value has kept Our
        Best serving families like yours for over 28.
      </p>
    </div>

    {/* Image Gallery Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-4">
        <img
          src={assets.rectangles.rectangle77}
          alt="Restaurant interior"
          className="w-full h-[285px] object-cover border border-white"
        />
        <img
          src={assets.rectangles.rectangle80}
          alt="Restaurant interior"
          className="w-full h-[285px] object-cover border border-white"
        />
      </div>

      <div className="col-span-1">
        <img
          src={assets.rectangles.rectangle78}
          alt="Restaurant interior"
          className="w-full h-[600px] object-cover border border-white"
        />
      </div>

      <div className="space-y-4">
        <img
          src={assets.rectangles.rectangle79}
          alt="Restaurant interior"
          className="w-full h-[285px] object-cover border border-white"
        />
        <img
          src={assets.rectangles.rectangle81}
          alt="Restaurant interior"
          className="w-full h-[285px] object-cover border border-white"
        />
      </div>
    </div>
  </section>
)

// Daily Offers Section Component
const DailyOffersSection = () => (
  <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
    <div className="text-center mb-16">
      <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium">Our Daily Offers</h2>
    </div>

    <div className="grid lg:grid-cols-2 gap-8 items-center">
      {/* Left - Promotional Card */}
      <div className="relative">
        <img
          src={assets.rectangles.rectangle27}
          alt="Special offer"
          className="w-full h-[434px] object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent rounded-lg" />
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 text-white">
          <h3 className="text-3xl font-semibold mb-4">Lunch Time</h3>
          <div className="flex items-center mb-4">
            <span className="text-8xl font-bold text-orange-400 mr-2">30%</span>
            <span className="text-3xl font-semibold">off</span>
          </div>
          <p className="text-lg mb-6 max-w-xs">We love food, lots of different and food, just like you.</p>
          <button className="bg-orange-400/80 hover:bg-orange-400 px-8 py-3 rounded font-semibold transition-colors">
            Order Now
          </button>
        </div>
        <div className="absolute inset-4 border border-white/20 rounded-lg pointer-events-none" />
      </div>

      {/* Right - Food Items */}
      <div className="space-y-6">
        {[
          {
            img: assets.rectangles.rectangle30,
            name: "Spicy Club",
            price: "$42",
            desc: "Pork, chicken and vegetable fried rolls served with lettuce wraps"
          },
          {
            img: assets.rectangles.rectangle29,
            name: "Almond baked Brie",
            price: "$38",
            desc: "Pork, chicken and vegetable fried rolls served with lettuce wraps"
          },
          {
            img: assets.rectangles.rectangle28,
            name: "Tuscan Flatbread",
            price: "$49",
            desc: "Pork, chicken and vegetable fried rolls served with lettuce wraps"
          }
        ].map((item, index) => (
          <div key={index} className="flex items-start space-x-4">
            <img src={item.img} alt={item.name} className="w-32 h-32 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-2xl font-medium">{item.name}</h3>
                <span className="text-white text-3xl font-medium">{item.price}</span>
              </div>
              <p className="text-white/80 text-lg">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// Features Banner Component
const FeaturesBanner = () => (
  <section className="bg-orange-400 py-12">
    <div className="px-6 sm:px-8 lg:px-[135px]">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-gray-900">
        {[
          { icon: assets.icons.star3, img: assets.images.image29, title: "Super Taste" },
          { icon: assets.icons.star5, img: assets.images.image30, title: "Self Services" },
          { icon: assets.icons.star2, img: assets.images.image28, title: "Best Food" },
          { icon: assets.icons.star6, img: assets.images.image31, title: "Fast Delivery" },
          { icon: assets.icons.star4, img: assets.images.image29, title: "Super Taste" }
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
)

// Chefs Section Component
const ChefsSection = () => (
  <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
    <div className="text-center mb-16">
      <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium mb-6">They will cook for you</h2>
      <p className="text-white/80 text-lg max-w-3xl mx-auto">
        Our Diners can enjoy cooking for themselves, or visiting a curated selection of restaurants in the area. They
        will cook for you and make sure you have a home away from home at all times.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8">
      {[
        { img: assets.rectangles.rectangle82, name: "Jubed Ahmed", role: "Chef" },
        { img: assets.rectangles.rectangle83, name: "Delwar hussen", role: "Assistant chef" },
        { img: assets.rectangles.rectangle84, name: "Tajul Islam", role: "Chef" }
      ].map((chef, index) => (
        <div key={index} className="text-center">
          <img
            src={chef.img}
            alt={chef.name}
            className="w-full h-[443px] object-cover border border-white/50 rounded-lg mb-6"
          />
          <h3 className="text-white text-3xl font-medium mb-2">{chef.name}</h3>
          <p className="text-white text-lg font-semibold">{chef.role}</p>
        </div>
      ))}
    </div>
  </section>
)

// Blog Section Component
const BlogSection = () => (
  <section className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
    <div className="text-center mb-16">
      <p className="text-white/80 mb-4">Our blog</p>
      <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium">Recent Articles</h2>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      {/* Blog Post 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <img src={assets.rectangles.rectangle10} alt="Blog post" className="w-full h-[348px] object-cover rounded-lg" />
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

      {/* Blog Post 2 */}
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
          src={assets.rectangles.rectangle11}
          alt="Blog post"
          className="w-full h-[348px] object-cover rounded-lg order-1 md:order-2"
        />
      </div>
    </div>

    {/* Explore All Blogs Link */}
    <div className="text-center mt-12">
      <Link to="#" className="inline-flex items-center text-orange-400 font-medium">
        Explore All Blogs
        <img src={assets.icons.vector5} alt="arrow" className="ml-2 w-4 h-4" />
      </Link>
      <div className="h-px bg-orange-400 w-36 mx-auto mt-1"></div>
    </div>
  </section>
)

// Newsletter Section Component
const NewsletterSection = () => (
  <section className="relative">
    {/* Background Image */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${assets.rectangles.rectangle26}')` }}
    />

    {/* Overlay */}
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

    {/* Content */}
    <div className="relative z-10 py-16 px-6 sm:px-8 lg:px-[135px]">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="text-white">
          <h2 className="text-4xl font-medium mb-4">Newsletter</h2>
          <p className="text-white/80 text-lg max-w-md">
            Subscribe to our newsletter and receive 15% discount from your order.
          </p>
        </div>

        <div className="relative">
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full bg-transparent border-b border-white/40 pb-2 text-white placeholder-white/80 focus:outline-none focus:border-white"
          />
          <button className="absolute right-0 top-0">
            <img src={assets.icons.vector6} alt="send" className="w-12 h-6" />
          </button>
        </div>
      </div>
    </div>
  </section>
)


// Main Restaurant Website Component
const Home = () => {
  return (
    <div className="bg-gray-900 min-h-screen">
      <Header/>
      <StatisticsSection />
      <MostPopularFood />
      <BookingLocationSection />
      <MenuSection />
      <GallerySection />
      <DailyOffersSection />
      <FeaturesBanner />
      <ChefsSection />
      <BlogSection />
      <NewsletterSection />
      <Footer />
    </div>
  )
}

export default Home
