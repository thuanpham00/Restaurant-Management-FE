# HƯỚNG DẪN XÂY DỰNG TRANG QUẢN LÝ CA LÀM VIỆC

## 📋 TỔNG QUAN

Module quản lý ca làm việc với **2 layout**: Table và Calendar, hỗ trợ đầy đủ CRUD cho Shifts và Employee Shifts.

---

## 🏗️ KIẾN TRÚC ĐÃ XÂY DỰNG

### ✅ 1. Type Layer (`shift.type.ts`)
- `Shift` - Ca làm việc (template)
- `EmployeeShift` - Phân công nhân viên
- `queryParamConfigShift` - Filter params cho shifts
- `queryParamConfigEmployeeShift` - Filter params cho employee shifts
- `CalendarEvent` - Event cho React Big Calendar
- `SHIFT_STATUS` - Enum trạng thái
- `SHIFT_STATUS_COLORS` - Màu sắc theo trạng thái

### ✅ 2. API Layer (`shifts.api.ts`)
**Shifts API:**
- `getList()` - GET /api/shifts
- `getDetail()` - GET /api/shifts/:id
- `create()` - POST /api/shifts
- `update()` - PUT /api/shifts/:id
- `delete()` - DELETE /api/shifts/:id

**Employee Shifts API:**
- `getList()` - GET /api/employee-shifts
- `getDetail()` - GET /api/employee-shifts/:id
- `assign()` - POST /api/employee-shifts
- `delete()` - DELETE /api/employee-shifts/:id
- `checkIn()` - PATCH /api/employee-shifts/:id/check-in
- `checkOut()` - PATCH /api/employee-shifts/:id/check-out
- `updateStatus()` - PATCH /api/employee-shifts/:id/status

### ✅ 3. Component Structure
```
ManageShift (parent) - Đã tạo
├── Layout Toggle (Table/Calendar)
├── ShiftTableView (cần tạo)
│   ├── Tabs (Shifts / Employee Shifts)
│   ├── ShiftListTab
│   │   ├── Filter Form
│   │   ├── Table with CRUD
│   │   └── Create/Edit Modal
│   └── EmployeeShiftTab
│       ├── Filter Form
│       ├── Table with actions
│       └── Assign/CheckIn/CheckOut Modals
└── ShiftCalendarView (cần tạo)
    ├── React Big Calendar
    ├── Event Details Modal
    └── Assign Shift Modal
```

---

## 📦 CÀI ĐẶT THƯ VIỆN

Cần cài đặt React Big Calendar:

```bash
yarn add react-big-calendar
yarn add dayjs
yarn add @types/react-big-calendar -D
```

---

## 🎨 TABLE LAYOUT - CHI TIẾT TRIỂN KHAI

### Tab 1: Quản lý Shifts (Templates)

**Features:**
- ✅ Danh sách shifts với pagination
- ✅ Filter: name, shift_date, date_range, time_range
- ✅ CRUD: Create, Edit, Delete
- ✅ Hiển thị: name, shift_date, start_time, end_time

**Table Columns:**
```typescript
[
  { title: "Tên ca", dataIndex: "name" },
  { title: "Ngày", dataIndex: "shift_date", render: date format },
  { title: "Giờ bắt đầu", dataIndex: "start_time" },
  { title: "Giờ kết thúc", dataIndex: "end_time" },
  { title: "Hành động", render: Edit + Delete buttons }
]
```

**Form Fields (Create/Edit):**
- name (required)
- shift_date (optional - DatePicker)
- start_time (required - TimePicker)
- end_time (required - TimePicker)

---

### Tab 2: Quản lý Phân công (Employee Shifts)

**Features:**
- ✅ Danh sách phân công với pagination
- ✅ Filter: employee_id, shift_id, status, date_range
- ✅ Actions: Assign, Check-in, Check-out, Update Status, Delete
- ✅ Hiển thị: employee name, shift name, date, time, status

**Table Columns:**
```typescript
[
  { title: "Nhân viên", dataIndex: ["employee", "full_name"] },
  { title: "Ca làm việc", dataIndex: ["shift", "name"] },
  { title: "Ngày", dataIndex: ["shift", "shift_date"] },
  { title: "Giờ", render: `${start_time} - ${end_time}` },
  { 
    title: "Trạng thái", 
    dataIndex: "status",
    render: Badge với màu theo SHIFT_STATUS_COLORS
  },
  { title: "Check-in", dataIndex: "check_in" },
  { title: "Check-out", dataIndex: "check_out" },
  { title: "Giờ tăng ca", dataIndex: "overtime_hours" },
  { 
    title: "Hành động", 
    render: CheckIn + CheckOut + EditStatus + Delete buttons
  }
]
```

**Modals:**

1. **Assign Shift Modal:**
   - Select Employee (dropdown fetch từ employees API)
   - Select Shift (dropdown fetch từ shifts API có shift_date)
   - Notes (optional)

2. **Check-in Modal:**
   - Check-in Time (TimePicker, default now)
   - Notes (optional)

3. **Check-out Modal:**
   - Check-out Time (TimePicker, default now)
   - Overtime Hours (InputNumber)
   - Notes (optional)

4. **Update Status Modal:**
   - Status (Select: Scheduled, Present, Late, Absent, Early Leave)
   - Notes (optional)

---

## 📅 CALENDAR LAYOUT - CHI TIẾT TRIỂN KHAI

### React Big Calendar Configuration

```typescript
import { Calendar, momentLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(dayjs)

// Convert EmployeeShift to CalendarEvent
const events: CalendarEvent[] = employeeShifts.map(es => ({
  id: es.id,
  title: `${es.employee.full_name} - ${es.shift.name}`,
  start: new Date(`${es.shift.shift_date} ${es.shift.start_time}`),
  end: new Date(`${es.shift.shift_date} ${es.shift.end_time}`),
  resource: es
}))

<Calendar
  localizer={localizer}
  events={events}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 700 }}
  views={['month', 'week', 'day']}
  defaultView="month"
  eventPropGetter={(event) => ({
    style: {
      backgroundColor: SHIFT_STATUS_COLORS[event.resource.status],
      borderColor: SHIFT_STATUS_COLORS[event.resource.status]
    }
  })}
  onSelectEvent={(event) => handleEventClick(event)}
  onSelectSlot={(slotInfo) => handleSlotSelect(slotInfo)}
  selectable
/>
```

### Calendar Features

**1. Event Display:**
- Màu sắc theo status:
  - Scheduled: #8c8c8c (gray)
  - Present: #52c41a (green)
  - Late: #faad14 (orange)
  - Absent: #ff4d4f (red)
  - Early Leave: #1890ff (blue)

**2. Interactions:**
- **Click event**: Mở modal chi tiết với actions (Check-in, Check-out, Update Status, Delete)
- **Click ngày trống**: Mở modal "Assign Shift" cho ngày đó
- **Hover event**: Tooltip hiển thị thông tin nhanh

**3. Event Details Modal:**
```
Employee: [full_name]
Shift: [name]
Date: [shift_date]
Time: [start_time] - [end_time]
Status: [Badge với màu]
Check-in: [time]
Check-out: [time]
Overtime: [hours]
Notes: [text]

Actions:
[Check-in] [Check-out] [Update Status] [Delete]
```

---

## 🎯 WORKFLOW CHUẨN

### Workflow 1: Tạo Shift Template
1. Tab "Quản lý Ca" → Click "Thêm ca mới"
2. Nhập: name, start_time, end_time (không cần shift_date)
3. Save → Shift template sẵn sàng để assign

### Workflow 2: Phân công nhân viên (Table View)
1. Tab "Quản lý Phân công" → Click "Phân công"
2. Chọn Employee
3. Chọn Shift (chỉ hiện shifts có shift_date)
4. Save → Employee được assign vào ca

### Workflow 3: Phân công nhân viên (Calendar View)
1. Click vào ngày muốn phân công
2. Modal hiện ra với date đã chọn
3. Chọn Employee
4. Chọn Shift template (hoặc tạo mới)
5. Save → Event xuất hiện trên calendar

### Workflow 4: Check-in/Check-out
1. Tìm employee shift (table hoặc calendar)
2. Click "Check-in" → Nhập thời gian (default now)
3. Khi kết thúc, click "Check-out" → Nhập overtime hours
4. Status tự động update sang "Present"

---

## 🚀 CÁC BƯỚC TRIỂN KHAI TIẾP THEO

### Bước 1: Hoàn thiện ShiftTableView

File: `ManageShift/components/ShiftTableView.tsx`

```typescript
export default function ShiftTableView() {
  const [activeTab, setActiveTab] = useState<"shifts" | "employee-shifts">("shifts")
  
  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as any)}
      items={[
        {
          key: "shifts",
          label: "Quản lý Ca",
          children: <ShiftListTab />
        },
        {
          key: "employee-shifts",
          label: "Quản lý Phân công",
          children: <EmployeeShiftTab />
        }
      ]}
    />
  )
}
```

### Bước 2: Tạo ShiftListTab

File: `ManageShift/components/ShiftListTab.tsx`

- Query shifts với React Query
- Filter form (name, date range, time range)
- Table với columns đã define
- Create/Edit Modal
- Delete confirmation

### Bước 3: Tạo EmployeeShiftTab

File: `ManageShift/components/EmployeeShiftTab.tsx`

- Query employee-shifts với React Query
- Filter form (employee, shift, status, date range)
- Table với columns đã define
- Assign Modal
- Check-in/Check-out Modals
- Update Status Modal
- Delete confirmation

### Bước 4: Tạo ShiftCalendarView

File: `ManageShift/components/ShiftCalendarView.tsx`

- Import React Big Calendar
- Convert employee-shifts to events
- Handle event click
- Handle slot select
- Event Details Modal
- Assign Shift Modal

### Bước 5: Styling

File: `ManageShift/ManageShift.css`

```css
/* Calendar custom styles */
.rbc-calendar {
  font-family: inherit;
}

.rbc-event {
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12px;
}

.rbc-event:hover {
  opacity: 0.8;
  cursor: pointer;
}

.rbc-today {
  background-color: #f0f2f5 !important;
}

.rbc-selected {
  background-color: #e6f7ff !important;
}
```

---

## 📊 STATE MANAGEMENT

Dùng React Query để manage server state:

```typescript
// Shifts
const { data: shiftsData, isFetching } = useQuery({
  queryKey: ["shifts", queryConfig],
  queryFn: () => shiftsAPI.getList(queryConfig, controller.signal)
})

// Employee Shifts
const { data: employeeShiftsData } = useQuery({
  queryKey: ["employee-shifts", queryConfig],
  queryFn: () => employeeShiftsAPI.getList(queryConfig, controller.signal)
})

// Employees list (for dropdown)
const { data: employeesData } = useQuery({
  queryKey: ["employees-list"],
  queryFn: () => employeesAPI.getList({ per_page: "1000" }, controller.signal)
})
```

---

## 🎨 UX ENHANCEMENTS

1. **Loading States**: Skeleton hoặc Spin khi fetch data
2. **Empty States**: Thông báo khi không có data
3. **Error Handling**: Toast notification cho mọi errors
4. **Confirmation Dialogs**: Trước khi delete
5. **Success Feedback**: Toast sau mọi actions thành công
6. **Optimistic Updates**: Invalidate queries sau mutations

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] Type definitions
- [x] API layer
- [x] Export trong Admin/index.ts
- [x] Main component với layout toggle
- [x] Route integration
- [ ] ShiftTableView component
- [ ] ShiftListTab component
- [ ] EmployeeShiftTab component
- [ ] ShiftCalendarView component
- [ ] Install React Big Calendar
- [ ] Styling & responsive
- [ ] Testing

---

## 🎯 PRIORITY

1. **High**: ShiftListTab (CRUD shifts) - Cơ bản nhất
2. **High**: EmployeeShiftTab (Assign & manage) - Core feature
3. **Medium**: ShiftCalendarView (Calendar view) - Nice to have
4. **Low**: Advanced filters, drag-drop - Enhancement

---

## 📝 NOTES

- Shift có thể không có `shift_date` (template)
- Employee Shift **PHẢI** có `shift_date` (phân công cụ thể)
- Status workflow: Scheduled → Present/Late/Absent
- Check-in/Check-out tự động update status
- Overtime hours tính khi check-out
- Calendar chỉ hiển thị employee shifts (có date cụ thể)

---

Vui lòng follow hướng dẫn này để hoàn thiện module! 🚀
