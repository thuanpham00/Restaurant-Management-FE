/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Empty, Form, Input, Modal, Select, Space, Spin, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import { Calendar, dayjsLocalizer } from "react-big-calendar"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { toast } from "react-toastify"
import { employeeShiftsAPI, shiftsAPI } from "src/Apis/Admin"
import { employeesAPI } from "src/Apis/Admin/employees.api"
import { EmployeeShift, SHIFT_STATUS, SHIFT_STATUS_COLORS, SHIFT_STATUS_LABELS, Shift } from "src/Types/shift.type"
import { PaginatedResponse } from "src/Types/utils.type"
import { CalendarDays, Clock, Edit, Plus, Trash2, Users } from "lucide-react"
import "./ManageShift.css"

const localizer = dayjsLocalizer(dayjs)

interface ShiftCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Shift & { assigned_count?: number }
}

interface AssignFormValues {
  employee_ids: string[]
  status?: number
  notes?: string
}

interface UpdateAssignmentFormValues {
  status: number
  notes?: string
}

interface EmployeeOption {
  id: string
  full_name: string
  employee_code?: string
  position?: string
}

const convertToCalendarEvents = (shifts: Shift[]): ShiftCalendarEvent[] => {
  const events: ShiftCalendarEvent[] = []

  shifts.forEach((shift) => {
    if (!shift.shift_date) return

    const shiftDate = dayjs(shift.shift_date)
    if (!shiftDate.isValid()) return

    const startLabel = shift.start_time ? shift.start_time.slice(0, 5) : "00:00"
    const endLabel = shift.end_time ? shift.end_time.slice(0, 5) : "23:59"
    const [startHour, startMinute] = startLabel.split(":").map(Number)
    const [endHour, endMinute] = endLabel.split(":").map(Number)

    const start = shiftDate.hour(startHour).minute(startMinute).second(0).toDate()
    const end = shiftDate.hour(endHour).minute(endMinute).second(0).toDate()
    const assignedCount = Array.isArray((shift as any).employee_assignments)
      ? (shift as any).employee_assignments.length
      : (shift as any).assigned_count || 0

    events.push({
      id: shift.id,
      title: `${shift.name} (${startLabel} - ${endLabel})`,
      start,
      end,
      resource: { ...shift, assigned_count: assignedCount }
    })
  })

  return events
}

const statusSelectOptions = Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => ({
  value: Number(key),
  label: (
    <Tag color={SHIFT_STATUS_COLORS[Number(key) as keyof typeof SHIFT_STATUS_COLORS]}>{label}</Tag>
  )
}))

export default function ShiftCalendarView() {
  const queryClient = useQueryClient()

  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<EmployeeShift | null>(null)

  const [assignForm] = Form.useForm<AssignFormValues>()
  const [updateForm] = Form.useForm<UpdateAssignmentFormValues>()

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false)
    assignForm.resetFields()
  }

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false)
    updateForm.resetFields()
    setSelectedAssignment(null)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedShiftId(null)
    handleCloseAssignModal()
    handleCloseUpdateModal()
  }

  const { data: shiftsResponse, isFetching: isFetchingShifts } = useQuery({
    queryKey: ["calendar-shifts", selectedMonth.format("YYYY-MM")],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const startOfMonth = selectedMonth.startOf("month").format("YYYY-MM-DD")
      const endOfMonth = selectedMonth.endOf("month").format("YYYY-MM-DD")

      const params: any = {
        per_page: "999",
        date_from: startOfMonth,
        date_to: endOfMonth
      }

      return shiftsAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const { data: shiftDetailResponse, isFetching: isFetchingShiftDetail } = useQuery({
    queryKey: ["shift-detail", selectedShiftId],
    enabled: isDetailModalOpen && Boolean(selectedShiftId),
    queryFn: () => shiftsAPI.getDetail(selectedShiftId as string)
  })

  const { data: assignmentsResponse, isFetching: isFetchingAssignments } = useQuery({
    queryKey: ["shift-assignments", selectedShiftId],
    enabled: isDetailModalOpen && Boolean(selectedShiftId),
    queryFn: () => {
      const controller = new AbortController()
      return employeeShiftsAPI.getList({ per_page: "999", shift_id: selectedShiftId as string }, controller.signal)
    }
  })

  const { data: employeesResponse, isFetching: isFetchingEmployees } = useQuery({
    queryKey: ["employees-active"],
    enabled: isDetailModalOpen,
    queryFn: () => {
      const controller = new AbortController()
      return employeesAPI.getList({ per_page: "999", is_active: "1" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  const shiftPaginated = shiftsResponse?.data?.data as PaginatedResponse<Shift> | undefined
  const shifts = shiftPaginated?.data || []
  const events = useMemo(() => convertToCalendarEvents(shifts), [shifts])

  const shiftDetail = shiftDetailResponse?.data?.data as Shift | undefined
  const assignmentsPaginated = assignmentsResponse?.data?.data as PaginatedResponse<EmployeeShift> | undefined
  const assignments = assignmentsPaginated?.data || []
  const employees: EmployeeOption[] = (employeesResponse?.data?.data as any)?.data || []

  const availableEmployees = useMemo(() => {
    const assignedIds = new Set(assignments.map((assignment) => assignment.employee_id))
    return employees.filter((employee) => !assignedIds.has(employee.id))
  }, [assignments, employees])

  const statusCountByCode = useMemo(() => {
    return assignments.reduce<Record<number, number>>((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1
      return acc
    }, {})
  }, [assignments])

  const employeeOptions = useMemo(
    () =>
      availableEmployees.map((employee) => ({
        label: `${employee.full_name}${employee.employee_code ? ` (${employee.employee_code})` : ""}`,
        value: employee.id
      })),
    [availableEmployees]
  )

  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["shift-assignments"], exact: false })
    queryClient.invalidateQueries({ queryKey: ["shift-detail"], exact: false })
    queryClient.invalidateQueries({ queryKey: ["calendar-shifts"], exact: false })
    queryClient.invalidateQueries({ queryKey: ["shifts-with-assignments"], exact: false })
    queryClient.invalidateQueries({ queryKey: ["employee-shifts-stats"], exact: false })
  }

  const bulkAssignMutation = useMutation({
    mutationFn: async (values: AssignFormValues) => {
      if (!selectedShiftId) throw new Error("Không tìm thấy ca làm việc")
      return employeeShiftsAPI.bulkAssign({
        shift_id: selectedShiftId,
        employee_ids: values.employee_ids,
        status: values.status ?? SHIFT_STATUS.SCHEDULED,
        notes: values.notes
      })
    },
    onSuccess: (response) => {
      const result = response.data.data
      const skippedMessage = result.total_skipped > 0 ? ` (Bỏ qua ${result.total_skipped})` : ""
      toast.success(`✅ Đã phân công ${result.total_assigned} nhân viên${skippedMessage}`, { autoClose: 2500 })
      invalidateRelatedQueries()
      handleCloseAssignModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Phân công thất bại", { autoClose: 2000 })
    }
  })

  const updateAssignmentMutation = useMutation({
    mutationFn: async (values: UpdateAssignmentFormValues) => {
      if (!selectedAssignment) throw new Error("Không tìm thấy phân công")
      return employeeShiftsAPI.updateStatus(selectedAssignment.id, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật phân công thành công", { autoClose: 2000 })
      invalidateRelatedQueries()
      handleCloseUpdateModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 2000 })
    }
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => employeeShiftsAPI.delete(assignmentId),
    onSuccess: () => {
      toast.success("Đã xóa phân công", { autoClose: 2000 })
      invalidateRelatedQueries()
      if (isUpdateModalOpen) {
        handleCloseUpdateModal()
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể xóa phân công", { autoClose: 2000 })
    }
  })

  const handleNavigate = (date: Date) => {
    setSelectedMonth(dayjs(date))
  }

  const handleSelectEvent = (event: ShiftCalendarEvent) => {
    setSelectedShiftId(event.id)
    setIsDetailModalOpen(true)
  }

  const handleOpenAssignModal = () => {
    assignForm.resetFields()
    assignForm.setFieldsValue({ status: SHIFT_STATUS.SCHEDULED })
    setIsAssignModalOpen(true)
  }

  const handleSubmitAssign = () => {
    assignForm.validateFields().then((values) => {
      if (!selectedShiftId) {
        toast.error("Không tìm thấy ca làm việc", { autoClose: 2000 })
        return
      }
      if (!values.employee_ids || values.employee_ids.length === 0) {
        toast.warning("Vui lòng chọn ít nhất 1 nhân viên", { autoClose: 2000 })
        return
      }
      bulkAssignMutation.mutate(values)
    })
  }

  const handleOpenUpdateModal = (record: EmployeeShift) => {
    setSelectedAssignment(record)
    updateForm.setFieldsValue({
      status: record.status,
      notes: record.notes || undefined
    })
    setIsUpdateModalOpen(true)
  }

  const handleSubmitUpdate = () => {
    updateForm.validateFields().then((values) => {
      if (!selectedAssignment) {
        toast.error("Không tìm thấy phân công", { autoClose: 2000 })
        return
      }
      updateAssignmentMutation.mutate(values)
    })
  }

  const handleDeleteAssignment = (record: EmployeeShift) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Xóa phân công của nhân viên "${record.employee?.full_name || "N/A"}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteAssignmentMutation.mutate(record.id)
    })
  }

  const eventStyleGetter = (event: ShiftCalendarEvent) => {
    const assignedCount = event.resource.assigned_count || 0
    const backgroundColor = assignedCount > 0 ? "#1677ff" : "#8c8c8c"

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.95,
        color: "#ffffff",
        border: "none",
        display: "block",
        fontWeight: 500,
        fontSize: "0.875rem"
      }
    }
  }

  const columns: ColumnsType<EmployeeShift> = [
    {
      title: "Nhân viên",
      key: "employee",
      render: (_: unknown, record) => (
        <div>
          <div className="font-semibold text-gray-800">{record.employee?.full_name || "N/A"}</div>
          <div className="text-xs text-gray-500">ID: {record.employee?.id || record.employee_id}</div>
        </div>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => (
        <Tag color={SHIFT_STATUS_COLORS[status as keyof typeof SHIFT_STATUS_COLORS]}>
          {SHIFT_STATUS_LABELS[status as keyof typeof SHIFT_STATUS_LABELS]}
        </Tag>
      )
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      render: (value: string | null) => (value ? value : <span className="text-gray-400">-</span>)
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handleOpenUpdateModal(record)}
            loading={updateAssignmentMutation.isPending && selectedAssignment?.id === record.id}
          >
            Cập nhật
          </Button>
          <Button
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDeleteAssignment(record)}
            loading={deleteAssignmentMutation.isPending}
          />
        </Space>
      )
    }
  ]

  return (
    <div className="shift-calendar-container">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Lịch ca làm việc</h3>
        <p className="text-gray-500 text-sm">Theo dõi ca làm việc và phân công ngay trên lịch</p>
      </div>

      <div className="mb-4 flex gap-4 flex-wrap bg-gray-50 p-3 rounded-lg">
        <span className="font-semibold text-gray-700">Trạng thái nhân viên:</span>
        {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: SHIFT_STATUS_COLORS[Number(key) as keyof typeof SHIFT_STATUS_COLORS] }}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {isFetchingShifts ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ height: 700 }}>
          {/* @ts-ignore - React Big Calendar type issue */}
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            views={["month", "week", "day", "agenda"]}
            defaultView="month"
            selectable={false}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={{
              next: "Tiếp",
              previous: "Trước",
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày",
              agenda: "Lịch trình",
              date: "Ngày",
              time: "Thời gian",
              event: "Ca làm việc",
              noEventsInRange: "Không có ca nào trong khoảng thời gian này.",
              showMore: (total: number) => `+ ${total} ca khác`
            }}
          />
        </div>
      )}

      <Modal
        title="Chi tiết ca làm việc"
        open={isDetailModalOpen}
        onCancel={handleCloseDetailModal}
        footer={null}
        width={900}
        centered
        style={{
          maxHeight : "calc(100vh - 50px)",
          overflowY: "auto",
        }}
      >
        {isFetchingShiftDetail ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : !shiftDetail ? (
          <Empty description="Không tìm thấy thông tin ca làm việc" />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-800 text-xl font-semibold">
                <CalendarDays size={20} className="text-blue-600" />
                {shiftDetail.name}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {shiftDetail.shift_date ? dayjs(shiftDetail.shift_date).format("DD/MM/YYYY (dddd)") : "Chưa cập nhật"}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {shiftDetail.start_time && shiftDetail.end_time
                    ? `${shiftDetail.start_time.slice(0, 5)} - ${shiftDetail.end_time.slice(0, 5)}`
                    : "--:--"}
                </span>
                <span className="flex items-center gap-2">
                  <Users size={16} />
                  {assignments.length} nhân viên
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => {
                const statusCode = Number(key)
                const count = statusCountByCode[statusCode] || 0
                return (
                  <Tag
                    key={key}
                    color={SHIFT_STATUS_COLORS[statusCode as keyof typeof SHIFT_STATUS_COLORS]}
                  >
                    {label}: {count}
                  </Tag>
                )
              })}
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-800">Danh sách phân công</h4>
              <Button type="primary" icon={<Plus size={16} />} onClick={handleOpenAssignModal}>
                Phân công nhân viên
              </Button>
            </div>

            <Table<EmployeeShift>
              columns={columns}
              dataSource={assignments}
              rowKey="id"
              loading={isFetchingAssignments}
              pagination={false}
              locale={{
                emptyText: "Chưa có phân công nào cho ca này"
              }}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Phân công nhân viên"
        open={isAssignModalOpen}
        onCancel={handleCloseAssignModal}
        onOk={handleSubmitAssign}
        confirmLoading={bulkAssignMutation.isPending}
        okText="Xác nhận"
        cancelText="Hủy"
        width={520}
      >
        {isFetchingEmployees ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <Form form={assignForm} layout="vertical">
            <Form.Item
              name="employee_ids"
              label="Nhân viên"
              rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn nhân viên"
                showSearch
                optionFilterProp="label"
                options={employeeOptions}
                disabled={availableEmployees.length === 0}
              />
            </Form.Item>

            <Form.Item name="status" label="Trạng thái" initialValue={SHIFT_STATUS.SCHEDULED}>
              <Select options={statusSelectOptions} />
            </Form.Item>

            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={3} placeholder="Ghi chú thêm (không bắt buộc)" />
            </Form.Item>

            {availableEmployees.length === 0 && (
              <Tag color="orange">Tất cả nhân viên đã được phân vào ca này</Tag>
            )}
          </Form>
        )}
      </Modal>

      <Modal
        title="Cập nhật phân công"
        open={isUpdateModalOpen}
        onCancel={handleCloseUpdateModal}
        onOk={handleSubmitUpdate}
        confirmLoading={updateAssignmentMutation.isPending}
        okText="Lưu"
        cancelText="Hủy"
        width={480}
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select options={statusSelectOptions} />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
