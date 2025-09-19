import { Navigate, Outlet, useLocation, useRoutes, useSearchParams } from "react-router-dom"
import MainLayout from "../Layout/MainLayout"
import { path } from "../../Constants/path"
import { lazy, Suspense, useContext } from "react"
import MainLayoutAuth from "../Layout/MainLayoutAuth"
import { AppContext } from "src/Context/authContext"
import { rolesForApi } from "src/Helpers/role_permission"

const Home = lazy(() => import("../Pages/Home"))
const Menu = lazy(() => import("../Pages/Menu"))

const ProjectRouter = () => {
  const { isAuthenticated } = useContext(AppContext)
  const { pathname } = useLocation()
  return isAuthenticated ? <Outlet /> : <Navigate to={`${path.Login}?redirect_url=${encodeURIComponent(pathname)}`} />
}

const RejectRouter = () => {
  const { isAuthenticated } = useContext(AppContext)
  const [searchParams] = useSearchParams()
  if (!isAuthenticated) {
    return <Outlet />
  }
  const navigate = searchParams.get("redirect_url") || path.Home
  return <Navigate to={navigate} />
}

const BlockAdminForClient = () => {
  const { role } = useContext(AppContext)
  if (role === rolesForApi.ADMIN) {
    return <Navigate to={path.AdminNotFound} replace />
  }
  return <Outlet />
}

export default function useRouterClient() {
  // const { role } = useContext(AppContext)
  const routerElement = useRoutes([
    {
      path: "",
      element: <BlockAdminForClient />,
      children: [
        {
          path: "",
          element: <MainLayout />,
          children: [
            {
              index: true,
              element: (
                <Suspense>
                  <Home />
                </Suspense>
              )
            },
            {
              path: "menu", 
              element: <Menu />,
            }
          ]
        },
        {
          path: "",
          element: <ProjectRouter />,
          children: [
            {
              path: "",
              element: <MainLayout />,
              children: []
            }
          ]
        },
        {
          path: "",
          element: <RejectRouter />,
          children: [
            {
              path: "",
              element: <MainLayoutAuth />,
              children: []
            }
          ]
        }
      ]
    }
  ])
  return routerElement
}

/**
 * Suspense là một công cụ quan trọng để cải thiện trải nghiệm khi sử dụng lazy loading trong React,
 * giúp quản lý giao diện chờ trong khi các thành phần lớn hoặc không thường xuyên được sử dụng đang tải.
 */
