/* eslint-disable @typescript-eslint/no-explicit-any */
import { Menu } from "lucide-react"
import avatarDefault from "src/Assets/img/avatarDefault.png"
import { Tag } from "antd"
import { useAppStore } from "src/StateGlobal/zustand"

interface Props {
  handleSidebar: (boolean: boolean) => void
  isShowSidebar: boolean
}

export default function HeaderAdmin({ handleSidebar, isShowSidebar }: Props) {
  const { avatar, nameUser, role } = useAppStore()

  const handleSideBarFunc = () => {
    handleSidebar(!isShowSidebar)
  }

  const renderRoleTag = () => {
    switch (role) {
      case "Super Administrator":
        return <Tag color="orange">Super Administrator</Tag>
      case "Administrator":
        return <Tag color="red">Administrator</Tag>
      case "Staff":
        return <Tag color="blue">Staff</Tag>
      case "INVENTORY_STAFF":
        return <Tag color="green">INVENTORY STAFF</Tag>
      default:
        return <Tag>{role}</Tag>
    }
  }

  return (
    <header className="sticky top-0 left-0 z-20 bg-gray-900 flex items-center justify-between p-3 border-b border-gray-200 dark:border-darkBorder">
      <Menu color={"orange"} size={28} onClick={handleSideBarFunc} />
      <div className="flex items-center gap-2 cursor-pointer">
        <img
          src={avatar && avatar !== "null" ? avatar : avatarDefault}
          className="h-10 w-10 rounded-full"
          alt="avatar default"
        />
        <div className="ml-1">
          <span className="text-xs">{renderRoleTag()}</span>
          <span className="mt-[2px] block text-[13px] truncate w-32 text-white">{nameUser}</span>
        </div>
      </div>
    </header>
  )
}
