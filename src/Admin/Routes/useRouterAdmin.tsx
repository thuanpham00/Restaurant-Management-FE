import { Navigate, Outlet, useRoutes } from "react-router-dom"
import { lazy, Suspense } from "react"
import MainLayoutAdmin from "../Layouts/MainLayoutAdmin"
import { path } from "src/Constants/path"
import LayoutAuthAdmin from "../Layouts/LayoutAuthAdmin"
import { rolesForApi } from "src/Helpers/role_permission"
import { useAppStore } from "src/StateGlobal/zustand"
import ManagePromotion from "../Pages/ManageFinancial/Pages/ManagePromotion"
import ManageInvoice from "../Pages/ManageFinancial/Pages/ManageInvoice"
import InvoiceDetail from "../Pages/ManageFinancial/Pages/InvoiceDetail"

const AdminLogin = lazy(() => import("../Pages/AdminLogin"))
const ManageDashboard = lazy(() => import("../Pages/ManageDashboard"))
const ManageTable = lazy(() => import("../Pages/ManageTable/Pages/ManageTable"))
const TableDetail = lazy(() => import("../Pages/ManageTable/Pages/TableDetail"))
const TableSessionHistoryDetail = lazy(() => import("../Pages/ManageTable/Pages/TableSessionHistoryDetail"))
const ManageDishCategory = lazy(() => import("../Pages/ManageDished/Pages/ManageDishCategory"))
const ManageDish = lazy(() => import("../Pages/ManageDished/Pages/ManageDish"))
const ManageMenu = lazy(() => import("../Pages/ManageDished/Pages/ManageMenu"))
const MenuDetail = lazy(() => import("../Pages/ManageDished/Pages/MenuDetail"))

const ManageCustomer = lazy(() => import("../Pages/ManageCustomer"))
const ManageEmployee = lazy(() => import("../Pages/ManageEmployee"))
const EmployeeDetail = lazy(() => import("../Pages/ManageEmployee/Pages/EmployeeDetail"))
const ManageShift = lazy(() => import("../Pages/ManageShift"))
const ShiftAssignmentDetail = lazy(() => import("../Pages/ManageShift/components/ShiftAssignmentDetail"))
const ManagePayroll = lazy(() => import("../Pages/ManagePayroll"))
const PayrollDetail = lazy(() => import("../Pages/ManagePayroll/PayrollDetail"))
const ManageReservation = lazy(() => import("../Pages/ManageTable/Pages/ManageReservation"))
const ManageIngredient = lazy(() => import("../Pages/ManageIngredient"))
const ManageSupplier = lazy(() => import("../Pages/ManageSupplier"))
const ManageStockImport = lazy(() => import("../Pages/ManageStockImport"))
const ManageStockExport = lazy(() => import("../Pages/ManageStockExport"))
const ManageStockLoss = lazy(() => import("../Pages/ManageStockLoss"))
const ManageRoles = lazy(() => import("../Pages/ManageRoles"))
const ManagePermissionMatrix = lazy(() => import("../Pages/ManagePermissionMatrix"))

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
                },
                {
                  path: path.AdminMenuDetail,
                  element: (
                    <Suspense>
                      <MenuDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminCustomers,
                  element: (
                    <Suspense>
                      <ManageCustomer />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminStaff,
                  element: (
                    <Suspense>
                      <ManageEmployee />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminStaffDetail,
                  element: (
                    <Suspense>
                      <EmployeeDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminShifts,
                  element: (
                    <Suspense>
                      <ManageShift />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminShiftDetail,
                  element: (
                    <Suspense>
                      <ShiftAssignmentDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPayroll,
                  element: (
                    <Suspense>
                      <ManagePayroll />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPayrollDetail,
                  element: (
                    <Suspense>
                      <PayrollDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPromotions,
                  element: (
                    <Suspense>
                      <ManagePromotion />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminInvoices,
                  element: (
                    <Suspense>
                      <ManageInvoice />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminInvoicesDetail,
                  element: (
                    <Suspense>
                      <InvoiceDetail />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminIngredients,
                  element: (
                    <Suspense>
                      <ManageIngredient />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminSuppliers,
                  element: (
                    <Suspense>
                      <ManageSupplier />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminWarehouseIn,
                  element: (
                    <Suspense>
                      <ManageStockImport />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminWarehouseOut,
                  element: (
                    <Suspense>
                      <ManageStockExport />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminInventoryLoss,
                  element: (
                    <Suspense>
                      <ManageStockLoss />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminRoles,
                  element: (
                    <Suspense>
                      <ManageRoles />
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPermissionMatrix,
                  element: (
                    <Suspense>
                      <ManagePermissionMatrix />
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
