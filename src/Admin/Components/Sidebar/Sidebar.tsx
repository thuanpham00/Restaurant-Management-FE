import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarPlus,
  Users,
  ClipboardList,
  Clock,
  Calculator,
  BookOpen,
  List,
  ShoppingBasket,
  Truck,
  FileInput,
  FileOutput,
  Scale,
  Receipt,
  DollarSign,
  Tag,
  BarChart3,
  Star,
  UserCog,
  Shield,
  ShieldCheck,
  Info,
  LogOut
} from "lucide-react"
import { path } from "src/Constants/path"
import SidebarItem from "../SidebarItem"
import React from "react"
import { Menu, MenuProps } from "antd"
import "./Sidebar.css"
import { assets } from "src/Assets/assets"

export default function Sidebar() {
  const location = useLocation()

  const sideBarList = [
    { name: "Thống kê", icon: LayoutDashboard, path: path.AdminDashboard },
    { name: "Danh sách bàn", icon: UtensilsCrossed, path: path.AdminTables },
    { name: "Đặt bàn", icon: CalendarPlus, path: path.AdminReservations },
    { name: "Danh sách nhân viên", icon: Users, path: path.AdminStaff },
    { name: "Ca làm việc", icon: Clock, path: path.AdminShifts },
    { name: "Bảng tính lương", icon: Calculator, path: path.AdminPayroll },
    { name: "Danh mục món", icon: ClipboardList, path: path.AdminCategories },
    { name: "Menu", icon: BookOpen, path: path.AdminMenu },
    { name: "Danh mục nguyên liệu", icon: ShoppingBasket, path: path.AdminIngredients },
    { name: "Nhà cung cấp", icon: Truck, path: path.AdminSuppliers },
    { name: "Đơn nhập hàng", icon: List, path: path.AdminPurchaseOrders },
    { name: "Nhập kho", icon: FileInput, path: path.AdminWarehouseIn },
    { name: "Xuất kho", icon: FileOutput, path: path.AdminWarehouseOut },
    { name: "Hao hụt kiểm kê", icon: Scale, path: path.AdminInventoryLoss },
    { name: "Quản lý hóa đơn", icon: Receipt, path: path.AdminInvoices },
    { name: "Quản lý chi phí", icon: DollarSign, path: path.AdminExpenses },
    { name: "Quản lý khuyến mãi", icon: Tag, path: path.AdminPromotions },
    { name: "Báo cáo doanh thu lợi nhuận", icon: BarChart3, path: path.AdminReports },
    { name: "Quản lý đánh giá", icon: Star, path: path.AdminReviews },
    { name: "Quản lý người dùng", icon: UserCog, path: path.AdminUsers },
    { name: "Quản lý vai trò", icon: Shield, path: path.AdminRoles },
    { name: "Quản lý quyền hệ thống", icon: ShieldCheck, path: path.AdminPermissions }
  ]

  const items: MenuProps["items"] = [
    {
      key: "sub0",
      label: (
        <Link to={path.AdminDashboard} className=" font-semibold text-[15px]">
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
          key: "1",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[1].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[1].icon, {
                color: location.pathname.startsWith(sideBarList[1].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[1].name}
              path={sideBarList[1].path}
            />
          )
        },
        {
          key: "2",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[2].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[2].icon, {
                color: location.pathname.startsWith(sideBarList[2].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[2].name}
              path={sideBarList[2].path}
            />
          )
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub2",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Nhân sự</div>,
      children: [
        {
          key: "3",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[3].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[3].icon, {
                color: location.pathname.startsWith(sideBarList[3].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[3].name}
              path={sideBarList[3].path}
            />
          )
        },
        {
          key: "4",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[4].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[4].icon, {
                color: location.pathname.startsWith(sideBarList[4].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[4].name}
              path={sideBarList[4].path}
            />
          )
        },
        {
          key: "5",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[5].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[5].icon, {
                color: location.pathname.startsWith(sideBarList[5].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[5].name}
              path={sideBarList[5].path}
            />
          )
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
          key: "6",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[6].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[6].icon, {
                color: location.pathname.startsWith(sideBarList[6].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[6].name}
              path={sideBarList[6].path}
            />
          )
        },
        {
          key: "7",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[7].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[7].icon, {
                color: location.pathname.startsWith(sideBarList[7].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[7].name}
              path={sideBarList[7].path}
            />
          )
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
          key: "8",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[8].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[8].icon, {
                color: location.pathname.startsWith(sideBarList[8].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[8].name}
              path={sideBarList[8].path}
            />
          )
        },
        {
          key: "9",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[9].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[9].icon, {
                color: location.pathname.startsWith(sideBarList[9].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[9].name}
              path={sideBarList[9].path}
            />
          )
        },
        {
          key: "10",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[10].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[10].icon, {
                color: location.pathname.startsWith(sideBarList[10].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[10].name}
              path={sideBarList[10].path}
            />
          )
        },
        {
          key: "11",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[11].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[11].icon, {
                color: location.pathname.startsWith(sideBarList[11].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[11].name}
              path={sideBarList[11].path}
            />
          )
        },
        {
          key: "12",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[12].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[12].icon, {
                color: location.pathname.startsWith(sideBarList[12].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[12].name}
              path={sideBarList[12].path}
            />
          )
        },
        {
          key: "13",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[13].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[13].icon, {
                color: location.pathname.startsWith(sideBarList[13].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[13].name}
              path={sideBarList[13].path}
            />
          )
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
          key: "14",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[14].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[14].icon, {
                color: location.pathname.startsWith(sideBarList[14].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[14].name}
              path={sideBarList[14].path}
            />
          )
        },
        {
          key: "15",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[15].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[15].icon, {
                color: location.pathname.startsWith(sideBarList[15].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[15].name}
              path={sideBarList[15].path}
            />
          )
        },
        {
          key: "16",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[16].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[16].icon, {
                color: location.pathname.startsWith(sideBarList[16].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[16].name}
              path={sideBarList[16].path}
            />
          )
        },
        {
          key: "17",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[17].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[17].icon, {
                color: location.pathname.startsWith(sideBarList[17].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[17].name}
              path={sideBarList[17].path}
            />
          )
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub6",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Đánh giá & thông báo</div>,
      children: [
        {
          key: "18",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[2].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[2].icon, {
                color: location.pathname.startsWith(sideBarList[2].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[2].name}
              path={sideBarList[2].path}
            />
          )
        },
        {
          key: "19",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[9].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[9].icon, {
                color: location.pathname.startsWith(sideBarList[9].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[9].name}
              path={sideBarList[9].path}
            />
          )
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub7",
      label: <div className="font-semibold text-[15px] text-white">Quản lý Đánh giá</div>,
      children: [
        {
          key: "20",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[18].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[18].icon, {
                color: location.pathname.startsWith(sideBarList[18].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[18].name}
              path={sideBarList[18].path}
            />
          )
        }
      ]
    },
    {
      type: "divider"
    },
    {
      key: "sub8",
      label: <div className="font-semibold text-[15px] text-white">Cấu hình & bảo mật</div>,
      children: [
        {
          key: "21",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[19].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[19].icon, {
                color: location.pathname.startsWith(sideBarList[19].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[19].name}
              path={sideBarList[19].path}
            />
          )
        },
        {
          key: "22",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[20].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[20].icon, {
                color: location.pathname.startsWith(sideBarList[20].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[20].name}
              path={sideBarList[20].path}
            />
          )
        },
        {
          key: "23",
          label: (
            <SidebarItem
              className={`${location.pathname.startsWith(sideBarList[21].path) ? "text-[14px] text-white font-semibold" : "text-[14px] text-white font-normal hover:text-[#495057] duration-200 ease-in"}`}
              classNameWrapper={`flex items-center gap-2 cursor-pointer`}
              icon={React.createElement(sideBarList[21].icon, {
                color: location.pathname.startsWith(sideBarList[21].path) ? "white" : "white"
              })}
              nameSideBar={sideBarList[21].name}
              path={sideBarList[21].path}
            />
          )
        }
      ]
    }
  ]

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
            mode="inline"
            style={{
              maxHeight: "calc(100vh - 190px)",
              overflowY: "auto",
              overflowX: "hidden"
            }}
            defaultOpenKeys={["sub1", "sub2", "sub3"]}
            className="bg-gray-900 menu-scroll"
            items={items}
          />
        </div>

        <div className="absolute bottom-0 left-0 w-full">
          <div className="m-4">
            <Link
              to={path.AdminDashboard}
              className={`text-[14px] flex items-center gap-1 px-3 py-2 w-full hover:text-primaryBlue hover:underline duration-100 ${location.pathname.startsWith(path.AdminDashboard) ? "text-primaryBlue font-semibold" : "text-white"}`}
            >
              Thông tin tài khoản
              <Info size={16} />
            </Link>
            <button className="text-[14px] text-white flex items-center gap-1 px-3 py-2 w-full hover:text-primaryBlue hover:underline duration-100">
              Đăng xuất
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
