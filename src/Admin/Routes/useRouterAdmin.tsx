import { Navigate, Outlet, useRoutes } from "react-router-dom"
import { lazy, Suspense } from "react"
import MainLayoutAdmin from "../Layouts/MainLayoutAdmin"
import { path } from "src/Constants/path"
import LayoutAuthAdmin from "../Layouts/LayoutAuthAdmin"
import { useAppStore } from "src/StateGlobal/zustand"
import ManagePromotion from "../Pages/ManageFinancial/Pages/ManagePromotion"
import ManageInvoice from "../Pages/ManageFinancial/Pages/ManageInvoice"
import InvoiceDetail from "../Pages/ManageFinancial/Pages/InvoiceDetail"
import { FEATURE_VIEW_ABILITY, PermissionBoundary, resolveRole } from "src/Authorization"

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
  if (!role) return <Outlet />
  const normalizedRole = resolveRole(role)
  if (!normalizedRole) {
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
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.dashboard}>
                        <ManageDashboard />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminTables,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.tables}>
                        <ManageTable />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminTablesDetail,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.tables}>
                        <TableDetail />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminTableSessionDetail,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.tables}>
                        <TableSessionHistoryDetail />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminReservations,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.reservations}>
                        <ManageReservation />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminCategoryDish,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.menuCategory}>
                        <ManageDishCategory />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminDish,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.dishes}>
                        <ManageDish />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminMenu,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.menu}>
                        <ManageMenu />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminMenuDetail,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.menu}>
                        <MenuDetail />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminCustomers,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.customers}>
                        <ManageCustomer />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminStaff,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.staff}>
                        <ManageEmployee />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminStaffDetail,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.staff}>
                        <EmployeeDetail />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminShifts,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.shifts}>
                        <ManageShift />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminShiftDetail,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.shifts}>
                        <ShiftAssignmentDetail />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPayroll,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.payroll}>
                        <ManagePayroll />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPayrollDetail,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.payroll}>
                        <PayrollDetail />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPromotions,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.promotions}>
                        <ManagePromotion />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminInvoices,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.invoices}>
                        <ManageInvoice />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminInvoicesDetail,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.invoices}>
                        <InvoiceDetail />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminIngredients,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.ingredients}>
                        <ManageIngredient />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminSuppliers,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.suppliers}>
                        <ManageSupplier />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminWarehouseIn,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.warehouseIn}>
                        <ManageStockImport />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminWarehouseOut,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.warehouseOut}>
                        <ManageStockExport />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminInventoryLoss,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.inventoryLoss}>
                        <ManageStockLoss />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminRoles,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.roles}>
                        <ManageRoles />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminPermissionMatrix,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.permissionMatrix}>
                        <ManagePermissionMatrix />
                      </PermissionBoundary>
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
