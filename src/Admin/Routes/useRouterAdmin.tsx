import { Navigate, Outlet, useRoutes } from "react-router-dom"
import { lazy, Suspense } from "react"
import MainLayoutAdmin from "../Layouts/MainLayoutAdmin"
import { path } from "src/Constants/path"
import LayoutAuthAdmin from "../Layouts/LayoutAuthAdmin"
import { rolesForApi } from "src/Helpers/role_permission"
import { useAppStore } from "src/StateGlobal/zustand"
import ManageDish from "../Pages/ManageDished/Pages/ManageDish"
import ManageMenu from "../Pages/ManageDished/Pages/ManageMenu"

const AdminLogin = lazy(() => import("../Pages/AdminLogin"))
const ManageDashboard = lazy(() => import("../Pages/ManageDashboard"))
const ManageTable = lazy(() => import("../Pages/ManageTable/Pages/ManageTable"))
const TableDetail = lazy(() => import("../Pages/ManageTable/Pages/TableDetail"))
const TableSessionHistoryDetail = lazy(() => import("../Pages/ManageTable/Pages/TableSessionHistoryDetail"))
const ManageDishCategory = lazy(() => import("../Pages/ManageDished/Pages/ManageDishCategory"))

const ManageReservation = lazy(() => import("../Pages/ManageReservation"))

const ProtectedRoute = () => {
  const { isAuthenticated } = useAppStore()
  return isAuthenticated ? <Outlet /> : <Navigate to={path.AdminLogin} />
} // bắt buộc đăng nhập

const RejectRouter = () => {
  const { isAuthenticated } = useAppStore()
  if (!isAuthenticated) {
    return <Outlet />
  }
  return <Navigate to={path.AdminDashboard} />
}

const BlockClientForAdmin = () => {
  const { role } = useAppStore()
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
                },
                {
                  path: path.AdminTablesDetail,
                  element: (
                    <Suspense>
                      <TableDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminTableSessionDetail,
                  element: (
                    <Suspense>
                      <TableSessionHistoryDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminReservations,
                  element: (
                    <Suspense>
                      <ManageReservation />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminCategoryDish,
                  element: (
                    <Suspense>
                      <ManageDishCategory />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminDish,
                  element: (
                    <Suspense>
                      <ManageDish />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminMenu,
                  element: (
                    <Suspense>
                      <ManageMenu />
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
