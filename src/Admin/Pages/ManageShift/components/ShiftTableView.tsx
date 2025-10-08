import { useState } from "react"
import { Tabs } from "antd"
import ShiftListTab from "./ShiftListTab.tsx"
import EmployeeShiftTab from "./EmployeeShiftTab.tsx"

type TabKey = "shifts" | "employee-shifts"

export default function ShiftTableView() {
  const [activeTab, setActiveTab] = useState<TabKey>("shifts")

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as TabKey)}
      size="large"
      items={[
        {
          key: "shifts",
          label: (
            <span className="font-medium">
              📋 Quản lý Ca
            </span>
          ),
          children: <ShiftListTab />
        },
        {
          key: "employee-shifts",
          label: (
            <span className="font-medium">
              👥 Quản lý Phân công
            </span>
          ),
          children: <EmployeeShiftTab />
        }
      ]}
    />
  )
}
