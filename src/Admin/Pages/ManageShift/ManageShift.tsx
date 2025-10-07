import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { Segmented } from "antd"
import { Table as TableIcon, Calendar as CalendarIcon } from "lucide-react"
import NavigateBack from "src/Admin/Components/NavigateBack"
import ShiftTableView from "./components/ShiftTableView"
import ShiftCalendarView from "./components/ShiftCalendarView"

type ViewMode = "table" | "calendar"

export default function ManageShift() {
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  return (
    <div className="p-6">
      <Helmet>
        <title>Quản lý Ca làm việc</title>
      </Helmet>

      <div className="flex justify-between items-center mb-4">
        <NavigateBack />

        <Segmented
          value={viewMode}
          onChange={(value) => setViewMode(value as ViewMode)}
          options={[
            {
              label: (
                <div className="flex items-center gap-2 px-2">
                  <TableIcon size={16} />
                  <span>Dạng bảng</span>
                </div>
              ),
              value: "table"
            },
            {
              label: (
                <div className="flex items-center gap-2 px-2">
                  <CalendarIcon size={16} />
                  <span>Lịch</span>
                </div>
              ),
              value: "calendar"
            }
          ]}
          size="large"
        />

      </div>
        <div className="bg-white p-4 rounded-lg shadow">
          {viewMode === "table" ? <ShiftTableView /> : <ShiftCalendarView />}
        </div>
    </div>
  )
}
