import { memo } from "react"
import { Outlet } from "react-router-dom"

function MainLayoutAuthInner() {
  return (
    <div className="flex items-center bg-white">
      <Outlet />
    </div>
  )
}

const MainLayoutAuth = memo(MainLayoutAuthInner)
export default MainLayoutAuth

// ngăn chặn việc component MainLayout re-render khi không cần thiết
// vì sao nó re-render là do sử dụng route
