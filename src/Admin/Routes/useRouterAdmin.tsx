/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navigate, Outlet, useRoutes } from "react-router-dom"
import { lazy, Suspense, ComponentType, LazyExoticComponent } from "react"
import MainLayoutAdmin from "../Layouts/MainLayoutAdmin"
import { path } from "src/Constants/path"
import LayoutAuthAdmin from "../Layouts/LayoutAuthAdmin"
import { useAppStore } from "src/StateGlobal/zustand"
import ManagePromotion from "../Pages/ManageFinancial/Pages/ManagePromotion"
import ManageInvoice from "../Pages/ManageFinancial/Pages/ManageInvoice"
import InvoiceDetail from "../Pages/ManageFinancial/Pages/InvoiceDetail"
import { FEATURE_VIEW_ABILITY, FeatureKey, PermissionBoundary, resolveRole } from "src/Authorization"
import DishDetail from "../Pages/ManageDished/Pages/DishDetail"

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

type GuardedComponent = LazyExoticComponent<ComponentType<any>> | ComponentType<any>

const withPermission = (feature: FeatureKey, Component: GuardedComponent) => (
  <Suspense>
    <PermissionBoundary ability={FEATURE_VIEW_ABILITY[feature]}>
      <Component />
    </PermissionBoundary>
  </Suspense>
)

const FEATURE_ROUTES: Array<{ path: string; feature: FeatureKey; Component: GuardedComponent }> = [
  { path: path.AdminDashboard, feature: "dashboard", Component: ManageDashboard },
  { path: path.AdminTables, feature: "tables", Component: ManageTable },
  { path: path.AdminTablesDetail, feature: "tables", Component: TableDetail },
  { path: path.AdminTableSessionDetail, feature: "tables", Component: TableSessionHistoryDetail },
  { path: path.AdminReservations, feature: "reservations", Component: ManageReservation },
  { path: path.AdminCategoryDish, feature: "menuCategory", Component: ManageDishCategory },
  { path: path.AdminDish, feature: "dishes", Component: ManageDish },
  { path: path.AdminMenu, feature: "menu", Component: ManageMenu },
  { path: path.AdminMenuDetail, feature: "menu", Component: MenuDetail },
  { path: path.AdminCustomers, feature: "customers", Component: ManageCustomer },
  { path: path.AdminStaff, feature: "staff", Component: ManageEmployee },
  { path: path.AdminStaffDetail, feature: "staff", Component: EmployeeDetail },
  { path: path.AdminShifts, feature: "shifts", Component: ManageShift },
  { path: path.AdminShiftDetail, feature: "shifts", Component: ShiftAssignmentDetail },
  { path: path.AdminPayroll, feature: "payroll", Component: ManagePayroll },
  { path: path.AdminPayrollDetail, feature: "payroll", Component: PayrollDetail },
  { path: path.AdminPromotions, feature: "promotions", Component: ManagePromotion },
  { path: path.AdminInvoices, feature: "invoices", Component: ManageInvoice },
  { path: path.AdminInvoicesDetail, feature: "invoices", Component: InvoiceDetail },
  { path: path.AdminIngredients, feature: "ingredients", Component: ManageIngredient },
  { path: path.AdminSuppliers, feature: "suppliers", Component: ManageSupplier },
  { path: path.AdminWarehouseIn, feature: "warehouseIn", Component: ManageStockImport },
  { path: path.AdminWarehouseOut, feature: "warehouseOut", Component: ManageStockExport },
  { path: path.AdminInventoryLoss, feature: "inventoryLoss", Component: ManageStockLoss },
  { path: path.AdminRoles, feature: "roles", Component: ManageRoles },
  { path: path.AdminPermissionMatrix, feature: "permissionMatrix", Component: ManagePermissionMatrix }
]

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
                ...FEATURE_ROUTES.map(({ path: routePath, feature, Component }) => ({
                  path: routePath,
                  element: withPermission(feature, Component)
                }))
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
