import { Beef } from "lucide-react"
import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Button from "src/Components/Button"
import Input from "src/Components/Input"
import { path } from "src/Constants/path"

export default function AdminLogin() {
  const [account, setAccount] = useState({
    email: "",
    password: ""
  })

  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginDashBoard = (e: any) => {
    e.preventDefault()
    if (account.email === "thuan123@gmail.com" && account.password == "admin123@") {
      navigate(path.AdminDashboard, { replace: true })
    } else {
      toast.error("Thông tin không chính xác", { autoClose: 1500 })
    }
  }

  return (
    <div className="w-full">
      <Helmet>
        <title>Đăng nhập tài khoản - TechZone</title>
        <meta
          name="description"
          content="Đăng nhập tài khoản TechZone để mua sắm nhanh chóng, quản lý đơn hàng và nhận nhiều ưu đãi dành riêng cho bạn."
        />
      </Helmet>

      <div className="p-4 h-full flex items-center flex-col justify-center rounded-tr-lg rounded-br-lg">
        <h1 className="text-xl my-2 font-semibold text-center text-[#000]">Hệ thống quản lý</h1>
        <Link to={path.Home} className="flex items-center justify-center">
          <Beef />
          <span className="text-darkPrimary text-2xl font-bold text-center">Restaurant System</span>
        </Link>
        <h1 className="text-base text-center mt-2 text-[#000]">Đăng nhập</h1>
        <form onSubmit={handleLoginDashBoard} className="mt-2 w-full">
          <Input
            name="email"
            placeholder="Nhập email"
            nameInput="Email"
            value={account.email}
            onChange={(e) => setAccount({ ...account, email: e.target.value })}
          />
          <Input
            name="password"
            placeholder="Nhập mật khẩu"
            nameInput="Mật khẩu"
            type="password"
            classNameError="text-red-500 text-[13px] font-semibold min-h-[2.25rem] block"
            classNameEye="absolute right-2 top-[40%] -translate-y-1/2"
            value={account.password}
            onChange={(e) => setAccount({ ...account, password: e.target.value })}
          />
          <Button
            classNameButton="p-2 bg-blue-500 w-full text-white font-semibold rounded-sm hover:bg-blue-500/80 duration-200"
            nameButton="Đăng nhập"
            type="submit"
          />
        </form>
      </div>
    </div>
  )
}
