import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarPlus,
  Users,
  ClipboardList,
  Clock,
  Calculator,
  BookOpen,
  ShoppingBasket,
  Truck,
  FileInput,
  FileOutput,
  Scale,
  Receipt,
  Tag,
  Shield,
  Info,
  LogOut,
  Ham,
  UserCircle,
  Grid,
  LucideIcon
} from "lucide-react"
import { path } from "src/Constants/path"
import SidebarItem from "../SidebarItem"
import React, { useMemo } from "react"
import { Menu, MenuProps } from "antd"
import "./Sidebar.css"
import { assets } from "src/Assets/assets"
import { useMutation } from "@tanstack/react-query"
import { authAPI } from "src/Apis/Admin"
import { useAppStore } from "src/StateGlobal/zustand"
import { FEATURE_VIEW_ABILITY, useAuthorization } from "src/Authorization"

// Define menu item structure
interface MenuItem {
  name: string
  icon: LucideIcon
  path: string
  feature: keyof typeof FEATURE_VIEW_ABILITY
}

type MenuItems = NonNullable<MenuProps["items"]>

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setIsAuthenticated, setAvatar, setNameUser, setRole, setEmployeeId, setPermissions, employeeId } = useAppStore()
  const { can } = useAuthorization()

  // Centralized menu configuration with meaningful keys
  const menuConfig: Record<string, MenuItem> = {
    dashboard: { name: "Thống kê", icon: LayoutDashboard, path: path.AdminDashboard, feature: "dashboard" },
    tables: { name: "Danh sách bàn", icon: UtensilsCrossed, path: path.AdminTables, feature: "tables" },
    reservations: { name: "Đặt bàn", icon: CalendarPlus, path: path.AdminReservations, feature: "reservations" },
    customers: { name: "Khách hàng", icon: UserCircle, path: path.AdminCustomers, feature: "customers" },
    staff: { name: "Nhân viên", icon: Users, path: path.AdminStaff, feature: "staff" },
    shifts: { name: "Ca làm việc", icon: Clock, path: path.AdminShifts, feature: "shifts" },
    payroll: { name: "Bảng tính lương", icon: Calculator, path: path.AdminPayroll, feature: "payroll" },
    categoryDish: { name: "Thể loại món", icon: ClipboardList, path: path.AdminCategoryDish, feature: "menuCategory" },
    dish: { name: "Danh sách món", icon: Ham, path: path.AdminDish, feature: "dishes" },
    menu: { name: "Menu", icon: BookOpen, path: path.AdminMenu, feature: "menu" },
    ingredients: { name: "Nguyên liệu", icon: ShoppingBasket, path: path.AdminIngredients, feature: "ingredients" },
    suppliers: { name: "Nhà cung cấp", icon: Truck, path: path.AdminSuppliers, feature: "suppliers" },
    warehouseIn: { name: "Nhập kho", icon: FileInput, path: path.AdminWarehouseIn, feature: "warehouseIn" },
    warehouseOut: { name: "Xuất kho", icon: FileOutput, path: path.AdminWarehouseOut, feature: "warehouseOut" },
    inventoryLoss: { name: "Hao hụt kiểm kê", icon: Scale, path: path.AdminInventoryLoss, feature: "inventoryLoss" },
    invoices: { name: "Quản lý hóa đơn", icon: Receipt, path: path.AdminInvoices, feature: "invoices" },
    promotions: { name: "Quản lý khuyến mãi", icon: Tag, path: path.AdminPromotions, feature: "promotions" },
    roles: { name: "Quản lý vai trò", icon: Shield, path: path.AdminRoles, feature: "roles" },
    permissionMatrix: { name: "Ma trận phân quyền", icon: Grid, path: path.AdminPermissionMatrix, feature: "permissionMatrix" }
  }

  type MenuKey = keyof typeof menuConfig

  const canAccessFeature = (feature: keyof typeof FEATURE_VIEW_ABILITY) => can(FEATURE_VIEW_ABILITY[feature])

  const checkActive = (itemPath: string): boolean => {
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + "/")
  }

  const getSelectedKey = (): string => {
    const accessibleItems = Object.values(menuConfig).filter((item) => canAccessFeature(item.feature))
    const activeItem = accessibleItems.find(
      (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
    )
    return activeItem ? activeItem.path : location.pathname
  }

  const buildSidebarLink = (menuKey: MenuKey) => {
    const item = menuConfig[menuKey]
    if (!canAccessFeature(item.feature)) {
      return null
    }
    return (
      <SidebarItem
        className={`${checkActive(item.path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
        classNameWrapper="flex items-center gap-2 cursor-pointer"
        icon={React.createElement(item.icon, { color: "white" })}
        nameSideBar={item.name}
        path={item.path}
      />
    )
  }

  const buildMenuChildren = (keys: MenuKey[]): MenuItems =>
    keys
      .map((key) => {
        const label = buildSidebarLink(key)
        if (!label) return null
        const item = menuConfig[key]
        return {
          key: item.path,
          label
        }
      })
      .filter(Boolean) as MenuItems

  const items: MenuItems = []

  const pushDivider = () => {
    if (items.length > 0 && items[items.length - 1]?.type !== "divider") {
      items.push({ type: "divider" })
    }
  }

  if (canAccessFeature("dashboard")) {
    items.push({
      key: path.AdminDashboard,
      label: (
        <Link to={path.AdminDashboard} className="font-semibold text-[15px]">
          Thống kê hệ thống
        </Link>
      )
    })
    pushDivider()
  }

  const tableChildren = buildMenuChildren(["tables", "reservations"])
  if (tableChildren.length > 0) {
    items.push({
      key: "sub1",
      label: <div className="font-semibold text-[15px] text-white">Quản lý bàn</div>,
      children: tableChildren
    })
    pushDivider()
  }

  if (canAccessFeature("customers")) {
    items.push({
      key: path.AdminCustomers,
      label: (
        <Link to={path.AdminCustomers} className="font-semibold text-[15px]">
          Quản lý Khách hàng
        </Link>
      )
    })
    pushDivider()
  }

  const hrChildren = buildMenuChildren(["staff", "shifts", "payroll"])
  if (hrChildren.length > 0) {
    items.push({
      key: "sub2",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Nhân sự</div>,
      children: hrChildren
    })
    pushDivider()
  }

  const menuChildren = buildMenuChildren(["categoryDish", "dish", "menu"])
  if (menuChildren.length > 0) {
    items.push({
      key: "sub3",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Menu</div>,
      children: menuChildren
    })
    pushDivider()
  }

  const inventoryChildren = buildMenuChildren([
    "ingredients",
    "suppliers",
    "warehouseIn",
    "warehouseOut",
    "inventoryLoss"
  ])
  if (inventoryChildren.length > 0) {
    items.push({
      key: "sub4",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Nguyên liệu & kho</div>,
      children: inventoryChildren
    })
    pushDivider()
  }

  const financeChildren = buildMenuChildren(["invoices", "promotions"])
  if (financeChildren.length > 0) {
    items.push({
      key: "sub5",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Tài chính</div>,
      children: financeChildren
    })
    pushDivider()
  }

  const securityChildren = buildMenuChildren(["roles", "permissionMatrix"])
  if (securityChildren.length > 0) {
    items.push({
      key: "sub7",
      label: <div className="font-semibold text-[15px] text-white">Cấu hình & Bảo mật</div>,
      children: securityChildren
    })
  }

  if (items.length > 0 && items[items.length - 1]?.type === "divider") {
    items.pop()
  }

  const accountPath = useMemo(() => {
    if (employeeId) {
      return path.AdminStaffDetail.replace(":id", employeeId)
    }
    return path.AdminProfile
  }, [employeeId])

  const logoutMutation = useMutation({
    mutationFn: () => {
      return authAPI.logout()
    }
  })

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: (response) => {
        console.log(response)
        setIsAuthenticated(false)
        setNameUser(null)
        setRole(null)
        setAvatar(null)
        setEmployeeId(null)
        setPermissions([])

        navigate(path.AdminLogin)
      }
    })
  }

  return (
    <div className="sticky top-0 left-0 py-4 bg-gray-900 h-screen border-r border-[#dedede] shadow-xl">
      <div>
        <div className="mx-4 flex items-center justify-center gap-1 py-2 px-2 rounded-lg">
          <div className="w-14 h-12">
            <img src={assets.icons.vector} alt="Logo" className="w-full h-full" />
          </div>
          <span className="text-white text-lg font-bold text-center -tracking-tighter">Restaurant Management</span>
        </div>
        <div className="mt-4 menu-sidebar">
          <Menu
            selectedKeys={[getSelectedKey()]}
            mode="inline"
            style={{
              maxHeight: "calc(100vh - 190px)",
              overflowY: "auto",
              overflowX: "hidden"
            }}
            className="bg-gray-900 menu-scroll"
            items={items}
          />
        </div>

        <div className="absolute bottom-0 left-0 w-full">
          <div className="m-4">
            <Link
              to={accountPath}
              className={`text-[14px] flex items-center gap-1 px-3 py-2 w-full hover:text-primaryBlue hover:underline duration-100 ${checkActive(accountPath) ? "text-primaryBlue font-semibold" : "text-white"}`}
            >
              Thông tin tài khoản
              <Info size={16} />
            </Link>
            <button
              onClick={handleLogout}
              className="text-[14px] text-white flex items-center gap-1 px-3 py-2 w-full hover:text-primaryBlue hover:underline duration-100"
            >
              Đăng xuất
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
