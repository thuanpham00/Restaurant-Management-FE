import { Link } from "react-router-dom";
import { assets } from "src/Assets/assets";

const Footer = () => (
    <footer className="bg-gray-900 py-16 px-6 sm:px-8 lg:px-[135px]">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Logo & App Download */}
        <div>
          <img src={assets.icons.group55} alt="Logo" className="w-48 h-12 mb-8" />
          <p className="text-white/80 mb-6">Download the WowWraps app today.</p>
          <div className="flex space-y-4 flex-col">
            <img src={assets.icons.frame} alt="App Store" className="h-[70px]" />
            <img src={assets.icons.frame1} alt="Google Play" className="h-[70px]" />
          </div>
        </div>
  
        {/* Useful Links */}
        <div>
          <h3 className="text-white text-xl font-medium mb-6">Useful Link</h3>
          <ul className="space-y-3 text-white/80">
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Services
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Booking
              </Link>
            </li>
            <li>
              <Link to={""} className="hover:text-white transition-colors">
                Menu
              </Link>
            </li>
          </ul>
        </div>
  
        {/* Contact Info */}
        <div>
          <h3 className="text-white text-xl font-medium mb-6">Contact Info</h3>
          <div className="space-y-3 text-white/80">
            <p>Silk St, Barbican, London EC2Y 8DS, UK</p>
            <p className="text-orange-400">info@example.com</p>
            <p>800-123-45-678</p>
          </div>
        </div>
  
        {/* Follow Us & Legal */}
        <div>
          <div className="mb-8">
            <h3 className="text-white text-xl font-medium mb-6">Follow us</h3>
            <ul className="space-y-3">
              {[
                { name: "Facebook", width: "w-16" },
                { name: "Instagram", width: "w-16" },
                { name: "Linkedin", width: "w-14" },
                { name: "Twitter", width: "w-12" }
              ].map((social, index) => (
                <li key={index}>
                  <Link to="#" className="text-white/80 hover:text-white transition-colors">
                    {social.name}
                  </Link>
                  <div className={`h-px bg-white/40 ${social.width} mt-1`}></div>
                </li>
              ))}
            </ul>
          </div>
  
          <div>
            <h3 className="text-white text-xl font-medium mb-6">Legal</h3>
            <div className="space-y-3 text-white/80">
              <p>Website by huit.com</p>
              <p>©2022. All Rights Reserved</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )

  export default Footer