import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { Tabs } from "antd"
import { Calculator } from "lucide-react"
import NavigateBack from "src/Admin/Components/NavigateBack"
import PayrollListTab from "./components/PayrollListTab"

export default function ManagePayroll() {
  const [activeTab, setActiveTab] = useState("list")

  const items = [
    {
      key: "list",
      label: (
        <div className="flex items-center gap-2">
          <Calculator size={18} />
          <span>Danh sách Bảng lương</span>
        </div>
      ),
      children: <PayrollListTab />
    }
  ]

  return (
    <div>
      <Helmet>
        <title>Quản lý Bảng tính lương</title>
      </Helmet>

      <div className="mb-4">
        <NavigateBack />
      </div>

      <div className="bg-white rounded-lg shadow">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} size="large" className="px-4" />
      </div>
    </div>
  )
}
