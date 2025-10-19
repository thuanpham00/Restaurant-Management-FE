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

// Define menu item structure
interface MenuItem {
  name: string
  icon: LucideIcon
  path: string
}

interface MenuConfig {
  [key: string]: MenuItem
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setIsAuthenticated, setAvatar, setNameUser, setRole, setEmployeeId, employeeId } = useAppStore()

  // Centralized menu configuration with meaningful keys
  const menuConfig: MenuConfig = {
    dashboard: { name: "Thống kê", icon: LayoutDashboard, path: path.AdminDashboard },
    tables: { name: "Danh sách bàn", icon: UtensilsCrossed, path: path.AdminTables },
    reservations: { name: "Đặt bàn", icon: CalendarPlus, path: path.AdminReservations },
    customers: { name: "Khách hàng", icon: UserCircle, path: path.AdminCustomers },
    staff: { name: "Nhân viên", icon: Users, path: path.AdminStaff },
    shifts: { name: "Ca làm việc", icon: Clock, path: path.AdminShifts },
    payroll: { name: "Bảng tính lương", icon: Calculator, path: path.AdminPayroll },
    categoryDish: { name: "Thể loại món", icon: ClipboardList, path: path.AdminCategoryDish },
    dish: { name: "Danh sách món", icon: Ham, path: path.AdminDish },
    menu: { name: "Menu", icon: BookOpen, path: path.AdminMenu },
    ingredients: { name: "Nguyên liệu", icon: ShoppingBasket, path: path.AdminIngredients },
    suppliers: { name: "Nhà cung cấp", icon: Truck, path: path.AdminSuppliers },
    warehouseIn: { name: "Nhập kho", icon: FileInput, path: path.AdminWarehouseIn },
    warehouseOut: { name: "Xuất kho", icon: FileOutput, path: path.AdminWarehouseOut },
    inventoryLoss: { name: "Hao hụt kiểm kê", icon: Scale, path: path.AdminInventoryLoss },
    invoices: { name: "Quản lý hóa đơn", icon: Receipt, path: path.AdminInvoices },
    promotions: { name: "Quản lý khuyến mãi", icon: Tag, path: path.AdminPromotions },
    roles: { name: "Quản lý vai trò", icon: Shield, path: path.AdminRoles },
    permissionMatrix: { name: "Ma trận phân quyền", icon: Grid, path: path.AdminPermissionMatrix }
  }

  const checkActive = (itemPath: string): boolean => {
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + "/")
  }

  const getSelectedKey = (): string => {
    const activeItem = Object.values(menuConfig).find(
      (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
    )
    return activeItem ? activeItem.path : location.pathname
  }

  // Helper function to create sidebar item
  const createSidebarItem = (menuKey: keyof MenuConfig) => {
    const item = menuConfig[menuKey]
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

  const items: MenuProps["items"] = [
    {
      key: path.AdminDashboard,
      label: (
        <Link to={path.AdminDashboard} className="font-semibold text-[15px]">
          Thống kê hệ thống
        </Link>
      )
    },
    {
      type: "divider"
    },
    {
      key: "sub1",
      label: <div className="font-semibold text-[15px] text-white">Quản lý bàn</div>,
      children: [
        {
          key: path.AdminTables,
          label: createSidebarItem("tables")
        },
        {
          key: path.AdminReservations,
          label: createSidebarItem("reservations")
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: path.AdminCustomers,
      label: (
        <Link to={path.AdminCustomers} className="font-semibold text-[15px]">
          Quản lý Khách hàng
        </Link>
      )
    },
    {
      type: "divider"
    },
    {
      key: "sub2",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Nhân sự</div>,
      children: [
        {
          key: path.AdminStaff,
          label: createSidebarItem("staff")
        },
        {
          key: path.AdminShifts,
          label: createSidebarItem("shifts")
        },
        {
          key: path.AdminPayroll,
          label: createSidebarItem("payroll")
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub3",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Menu</div>,
      children: [
        {
          key: path.AdminCategoryDish,
          label: createSidebarItem("categoryDish")
        },
        {
          key: path.AdminDish,
          label: createSidebarItem("dish")
        },
        {
          key: path.AdminMenu,
          label: createSidebarItem("menu")
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub4",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Nguyên liệu & kho</div>,
      children: [
        {
          key: path.AdminIngredients,
          label: createSidebarItem("ingredients")
        },
        {
          key: path.AdminSuppliers,
          label: createSidebarItem("suppliers")
        },
        {
          key: path.AdminWarehouseIn,
          label: createSidebarItem("warehouseIn")
        },
        {
          key: path.AdminWarehouseOut,
          label: createSidebarItem("warehouseOut")
        },
        {
          key: path.AdminInventoryLoss,
          label: createSidebarItem("inventoryLoss")
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub5",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Tài chính</div>,
      children: [
        {
          key: path.AdminInvoices,
          label: createSidebarItem("invoices")
        },
        {
          key: path.AdminPromotions,
          label: createSidebarItem("promotions")
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub7",
      label: <div className="font-semibold text-[15px] text-white">Cấu hình & Bảo mật</div>,
      children: [
        {
          key: path.AdminRoles,
          label: createSidebarItem("roles")
        },
        {
          key: path.AdminPermissionMatrix,
          label: createSidebarItem("permissionMatrix")
        }
      ]
    }
  ]

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
