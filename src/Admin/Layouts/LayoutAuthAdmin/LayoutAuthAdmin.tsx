import { memo, useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import banner from "src/Assets/figma/rectangles/restaurant.png"
import banner_2 from "src/Assets/figma/rectangles/Dish.png"
import banner_3 from "src/Assets/figma/rectangles/restaurant2.png"

const listBanner = [banner, banner_2, banner_3]

function LayoutAuthAdminInner() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % listBanner.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <div className="h-screen flex items-center justify-center">
        {listBanner.map((item, i) => {
          return (
            <img
              key={i}
              src={item}
              alt="banner_2"
              className={`absolute top-0 left-0 z-0 w-full h-full object-cover transition-opacity duration-1000 brightness-50 ${index === i ? "opacity-100" : "opacity-0"} `}
            />
          )
        })}
        <div className="w-[25%] p-4 rounded-lg shadow-lg flex items-center justify-center bg-white/80 absolute z-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const LayoutAuthAdmin = memo(LayoutAuthAdminInner)
export default LayoutAuthAdmin
