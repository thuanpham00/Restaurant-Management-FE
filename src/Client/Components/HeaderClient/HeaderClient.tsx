import { NavLink } from "react-router-dom"; 
import { assets } from "src/Assets/assets";

const Header = () => (
  <header className="relative bg-gray-900 h-[500px] md:h-[573px] overflow-hidden">
    {/* Navigation */}
    <nav className="relative z-10 px-4 sm:px-6 lg:px-[135px] py-7">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="w-14 h-14 md:w-14 md:h-14">
          <img src={assets.icons.vector} alt="Logo" className="w-full h-full" />
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center space-x-8 text-white">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 font-medium transition-colors text-base"
                : "text-white/80 hover:text-white transition-colors text-base"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/menu"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 font-medium transition-colors text-base"
                : "text-white/80 hover:text-white transition-colors text-base"
            }
          >
            Menu
          </NavLink>

          <NavLink
            to="/blog"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 font-medium transition-colors text-base"
                : "text-white/80 hover:text-white transition-colors text-base"
            }
          >
            Blog
          </NavLink>

          <NavLink
            to="/pages"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 font-medium transition-colors text-base"
                : "text-white/80 hover:text-white transition-colors text-base"
            }
          >
            Pages
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive
                ? "text-orange-400 font-medium transition-colors text-base"
                : "text-white/80 hover:text-white transition-colors text-base"
            }
          >
            Contact
          </NavLink>
        </div>

        {/* Right side info */}
        <div className="hidden xl:flex items-center space-x-5 text-white text-sm lg:text-base mr-8">
          <span className="text-white/80">11:24 we`re open</span>
          <div className="text-center">
            <div className="text-white">Table Reservation</div>
            <div className="h-px bg-white w-full mt-1"></div>
          </div>
        </div>

        {/* Mobile menu button */}
        <button className="lg:hidden text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>

    {/* Hero Content */}
    <div className="relative z-10 px-4 sm:px-6 lg:px-[135px] mt-8 md:mt-16">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Content */}
        <div className="text-center lg:text-left">
          <p className="text-white/80 text-base md:text-lg mb-4">Hi, new friend!</p>
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-4 md:mb-6">
            We do not cook, we create your emotions!
          </h1>
          <p className="text-white/80 text-base md:text-lg mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0">
            Theres evidence that cooking, like other creative practices, can boost well-being, self-esteem, and other
            measures of mental health.
          </p>
          <NavLink
            to="/menu"
            className="inline-block text-orange-400 font-medium"
          >
            Our menu
            <div className="h-px bg-orange-400 w-full mt-1"></div>
          </NavLink>
        </div>

        {/* Right Content - Food Images */}
        <div className="relative flex justify-center lg:justify-end -mt-20">
          <div className="relative">
            <img
              src={assets.images.image89}
              alt="Main dish"
              className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[370px] h-[320px] sm:h-[380px] md:h-[436px] object-cover rounded-lg"
            />
            <div className="absolute bottom-4 -left-8 bg-orange-400 px-4 md:px-6 py-2 md:py-3 rounded">
              <span className="text-white font-medium text-lg md:text-xl">Price: $11</span>
            </div>
          </div>

          {/* Side Images */}
          <div className="absolute right-0 top-0 space-y-4 hidden sm:block">
            <img
              src={assets.images.image90}
              alt="Food item"
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded"
            />
            <img
              src={assets.images.image77}
              alt="Food item"
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded"
            />
            <img
              src={assets.images.image91}
              alt="Food item"
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded"
            />
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
