import { memo } from "react"
import { Outlet } from "react-router-dom"

function MainLayoutInner() {
  return (
    <div>
      <Outlet />
    </div>
  )
}

const MainLayout = memo(MainLayoutInner)
export default MainLayout

// ngăn chặn việc component MainLayout re-render khi không cần thiết
// vì sao nó re-render là do sử dụng route
