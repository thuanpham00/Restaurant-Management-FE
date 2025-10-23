import { Link } from "react-router-dom"
import { assets } from "src/Assets/assets"
import { Facebook, Instagram, Mail, Phone } from "lucide-react"

const Footer = () => (
  <footer className="bg-gradient-to-br from-gray-900 via-[#18181b] to-gray-950 py-14 px-6 sm:px-8 lg:px-[135px] border-t border-orange-500/10 shadow-inner">
    <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-12 justify-items-center md:justify-items-start text-center md:text-left items-start">
      {/* Cột 1 - Logo & giới thiệu */}
      <div className="flex flex-col items-center md:items-start self-start">
        <div className="mx-4 flex items-center justify-center gap-1 py-2 px-2 rounded-lg mb-5 -ml-3">
          <div className="w-14 h-12">
            <img src={assets.icons.vector} alt="Logo" className="w-full h-full" />
          </div>
          <span className="text-white text-lg font-bold text-center -tracking-tighter">Restaurant</span>
        </div>
        <p className="text-white/100 leading-relaxed max-w-[320px] mb-4">
          Thưởng thức hương vị của Nhà hàng chúng tôi — khám phá thực đơn hấp dẫn và đặt món ăn yêu thích của bạn một
          cách dễ dàng.
        </p>
        <div className="flex gap-4 mt-2">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-500/10 hover:bg-orange-500/30 text-orange-400 hover:text-white rounded-full p-2 transition-all"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-500/10 hover:bg-orange-500/30 text-orange-400 hover:text-white rounded-full p-2 transition-all"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Cột 2 - Khám phá nhanh */}
      <div className="self-start">
        <h3 className="text-white text-xl font-semibold mb-6 tracking-wide">Khám phá nhanh</h3>
        <ul className="space-y-3 text-white/80 font-medium">
          {[
            { name: "Trang chủ", to: "/home" },
            { name: "Thực đơn", to: "/menu" },
            { name: "Đặt bàn", to: "/table" }
          ].map((item, idx) => (
            <li key={idx}>
              <Link
                to={item.to}
                className="hover:text-orange-400 hover:underline underline-offset-4 transition-colors duration-200"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Cột 3 - Liên hệ */}
      <div className="self-start">
        <h3 className="text-white text-xl font-semibold mb-6 tracking-wide">Liên hệ</h3>
        <ul className="space-y-3 text-white/80 text-base">
          <li className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400">HUIT@gmail.com</span>
          </li>
          <li className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-400" />
            <span>800-123-45-678</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-orange-400/70 mr-1" />
            <span>140 Lê Trọng Tấn</span>
          </li>
        </ul>
        <div className="h-px bg-white/20 my-6"></div>
        <p className="text-white/60 text-sm">
          ©2025 <span className="font-semibold text-orange-400">Restaurant</span>. Bản quyền thuộc về chúng tôi.
        </p>
      </div>
    </div>
  </footer>
)

export default Footer
