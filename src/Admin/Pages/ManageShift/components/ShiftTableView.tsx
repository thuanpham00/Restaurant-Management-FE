import { useEffect, useState } from "react"
import { Tabs } from "antd"
import { Calendar, Users } from "lucide-react"
import { AppAbility, useAuthorization } from "src/Authorization"
import ShiftListTab from "./ShiftListTab.tsx"
import EmployeeShiftTab from "./EmployeeShiftTab.tsx"

type TabKey = "shifts" | "employee-shifts"

const TAB_STORAGE_KEY = "admin-shift-table-active-tab"

const getInitialTab = (): TabKey => {
  if (typeof window === "undefined") {
    return "shifts"
  }
  const stored = window.localStorage.getItem(TAB_STORAGE_KEY)
  return stored === "employee-shifts" ? "employee-shifts" : "shifts"
}

export default function ShiftTableView() {
  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab)
  const { can } = useAuthorization()
  const canViewShifts = can(AppAbility.SHIFTS_VIEW)

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(TAB_STORAGE_KEY, activeTab)
  }, [activeTab])

  if (!canViewShifts) {
    return null
  }

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as TabKey)}
      size="large"
      items={[
        {
          key: "shifts",
          label: (
            <span className="flex items-center gap-2 font-medium">
              <Calendar size={18} />
              Lịch làm việc
            </span>
          ),
          children: <ShiftListTab />
        },
        {
          key: "employee-shifts",
          label: (
            <span className="flex items-center gap-2 font-medium">
              <Users size={18} />
              Phân công Nhân viên
            </span>
          ),
          children: <EmployeeShiftTab />
        }
      ]}
    />
  )
}
