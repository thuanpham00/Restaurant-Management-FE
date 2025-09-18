import { Navigate, Outlet, useRoutes } from "react-router-dom"
import { lazy, Suspense, useContext } from "react"
import MainLayoutAdmin from "../Layouts/MainLayoutAdmin"
import { path } from "src/Constants/path"
import { AppContext } from "src/Context/authContext"
import LayoutAuthAdmin from "../Layouts/LayoutAuthAdmin"
import { rolesForApi } from "src/Helpers/role_permission"

const ManageTable = lazy(() => import("../Pages/ManageTable"))
const AdminLogin = lazy(() => import("../Pages/AdminLogin"))
const ManageDashboard = lazy(() => import("../Pages/ManageDashboard"))

const isAuthenticated = true
const ProtectedRoute = () => {
  // const { isAuthenticated } = useContext(AppContext)
  return isAuthenticated ? <Outlet /> : <Navigate to={path.AdminLogin} />
} // bắt buộc đăng nhập

const RejectRouter = () => {
  // const { isAuthenticated } = useContext(AppContext)
  if (!isAuthenticated) {
    return <Outlet />
  }
  return <Navigate to={path.AdminDashboard} />
}

const BlockClientForAdmin = () => {
  const { role } = useContext(AppContext)
  if (role === rolesForApi.CUSTOMER) {
    return <Navigate to={path.NotFound} replace />
  }
  return <Outlet />
}

export default function useRouterAdmin() {
  // const { role } = useContext(AppContext)
  const useRouterElement = useRoutes([
    {
      path: "",
      element: <BlockClientForAdmin />,
      children: [
        {
          path: "/admin",
          element: <ProtectedRoute />,
          children: [
            {
              path: "",
              element: <MainLayoutAdmin />,
              children: [
                {
                  path: path.AdminDashboard,
                  element: (
                    <Suspense>
                      <ManageDashboard />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminTables,
                  element: (
                    <Suspense>
                      <ManageTable />
                    </Suspense>
                  )
                }
              ]
            }
          ]
        },
        {
          path: "",
          element: <RejectRouter />,
          children: [
            {
              path: "",
              element: <LayoutAuthAdmin />,
              children: [
                {
                  path: path.AdminLogin,
                  element: (
                    <Suspense>
                      <AdminLogin />
                    </Suspense>
                  )
                }
              ]
            }
          ]
        }
      ]
    }
  ])
  return useRouterElement
}
