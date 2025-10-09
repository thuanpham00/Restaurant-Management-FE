/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Form, Input, InputNumber, Modal, Select, Spin, Tag, TimePicker } from "antd"
import dayjs from "dayjs"
import { CheckCircle, Edit, Trash2, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { Calendar, dayjsLocalizer, SlotInfo } from "react-big-calendar"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { toast } from "react-toastify"
import { employeeShiftsAPI, shiftsAPI } from "src/Apis/Admin"
import { employeesAPI } from "src/Apis/Admin/employees.api"
import { CalendarEvent, EmployeeShift, SHIFT_STATUS_COLORS, SHIFT_STATUS_LABELS } from "src/Types/shift.type"
import { PaginatedResponse } from "src/Types/utils.type"
import "./ManageShift.css"

const localizer = dayjsLocalizer(dayjs)

// ========== HELPER FUNCTIONS ==========
const convertToCalendarEvents = (employeeShifts: EmployeeShift[]): CalendarEvent[] => {
  return employeeShifts.map((es) => {
    const shiftDate = dayjs(es.shift?.shift_date)

    // Parse time từ "HH:mm:ss" string
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":")
      return { hour: parseInt(hours), minute: parseInt(minutes) }
    }

    const startTime = es.shift?.start_time ? parseTime(es.shift.start_time) : { hour: 0, minute: 0 }
    const endTime = es.shift?.end_time ? parseTime(es.shift.end_time) : { hour: 23, minute: 59 }

    const start = shiftDate.hour(startTime.hour).minute(startTime.minute).second(0).toDate()

    const end = shiftDate.hour(endTime.hour).minute(endTime.minute).second(0).toDate()

    return {
      id: es.id,
      title: `${es.employee?.full_name || "N/A"} - ${es.shift?.name || "N/A"}`,
      start,
      end,
      resource: es
    }
  })
}

export default function ShiftCalendarView() {
  const queryClient = useQueryClient()

  // ========== STATE ==========
  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isCreatingNewShift, setIsCreatingNewShift] = useState(false) // Chế độ tạo ca mới

  const [assignForm] = Form.useForm()
  const [checkInForm] = Form.useForm()
  const [checkOutForm] = Form.useForm()
  const [statusForm] = Form.useForm()

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["employeeShifts", selectedMonth.format("YYYY-MM")],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const startOfMonth = selectedMonth.startOf("month").format("YYYY-MM-DD")
      const endOfMonth = selectedMonth.endOf("month").format("YYYY-MM-DD")

      return employeeShiftsAPI.getList(
        {
          per_page: "99",
          date_from: startOfMonth,
          date_to: endOfMonth
        },
        controller.signal
      )
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  // Get employees for select
  const { data: employeesData } = useQuery({
    queryKey: ["employees-select"],
    queryFn: () => {
      const controller = new AbortController()
      return employeesAPI.getList({ per_page: "99", is_active: "1" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  // Get shifts for select
  const { data: shiftsData } = useQuery({
    queryKey: ["shifts-select"],
    queryFn: () => {
      const controller = new AbortController()
      return shiftsAPI.getList({ per_page: "15" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  const paginated = data?.data?.data as PaginatedResponse<EmployeeShift>
  const employeeShifts = paginated?.data || []
  const events = useMemo(() => convertToCalendarEvents(employeeShifts), [employeeShifts])

  const employeeOptions =
    (employeesData?.data?.data as any)?.data?.map((emp: any) => ({
      label: emp.full_name || "N/A",
      value: emp.id
    })) || []

  const shiftOptions =
    (shiftsData?.data?.data as any)?.data
      ?.filter((shift: any) => {
        return !shift.employee_assignments || shift.employee_assignments.length === 0
      })
      ?.map((shift: any) => {
        const startTime = shift.start_time ? shift.start_time.slice(0, 5) : "00:00"
        const endTime = shift.end_time ? shift.end_time.slice(0, 5) : "23:59"
        const shiftDate = shift.shift_date ? dayjs(shift.shift_date).format("DD/MM/YYYY") : ""
        return {
          label: `${shift.name} (${startTime} - ${endTime}) - ${shiftDate}`,
          value: shift.id
        }
      }) || []

  // ========== MUTATIONS ==========
  const createShiftMutation = useMutation({
    mutationFn: (data: any) => shiftsAPI.create(data),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Tạo ca thất bại", { autoClose: 1500 })
    }
  })

  const assignMutation = useMutation({
    mutationFn: (values: any) => employeeShiftsAPI.assign(values),
    onSuccess: () => {
      toast.success("Phân công thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      handleCloseAssignModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Phân công thất bại", { autoClose: 1500 })
    }
  })

  const checkInMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeShiftsAPI.checkIn(id, data),
    onSuccess: () => {
      toast.success("Check-in thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      setIsCheckInModalOpen(false)
      setIsDetailModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Check-in thất bại", { autoClose: 1500 })
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeShiftsAPI.checkOut(id, data),
    onSuccess: () => {
      toast.success("Check-out thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      setIsCheckOutModalOpen(false)
      setIsDetailModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Check-out thất bại", { autoClose: 1500 })
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeShiftsAPI.updateStatus(id, data),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      setIsUpdateStatusModalOpen(false)
      setIsDetailModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeShiftsAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa phân công thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      setIsDetailModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS: CALENDAR ==========
  const handleNavigate = (date: Date) => {
    setSelectedMonth(dayjs(date))
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDetailModalOpen(true)
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedDate(slotInfo.start)
    setIsCreatingNewShift(false)
    assignForm.setFieldsValue({
      shift_date: dayjs(slotInfo.start),
      mode: "existing"
    })
    setIsAssignModalOpen(true)
  }

  // ========== HANDLERS: ASSIGN ==========
  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false)
    setSelectedDate(null)
    setIsCreatingNewShift(false)
    assignForm.resetFields()
  }

  const handleModeChange = (mode: string) => {
    setIsCreatingNewShift(mode === "new")
    if (mode === "new") {
      assignForm.setFieldsValue({ shift_id: undefined })
    }
  }

  const handleSubmitAssign = () => {
    assignForm.validateFields().then(async (values) => {
      try {
        let shiftId = values.shift_id

        // Nếu chế độ tạo ca mới
        if (values.mode === "new") {
          // Bước 1: Tạo ca mới
          const shiftData = {
            name: values.shift_name,
            shift_date: dayjs(values.shift_date).format("YYYY-MM-DD"),
            start_time: dayjs(values.start_time).format("HH:mm:ss"),
            end_time: dayjs(values.end_time).format("HH:mm:ss")
          }

          const shiftResult = await createShiftMutation.mutateAsync(shiftData)
          shiftId = shiftResult.data.data.id

          toast.success("Tạo ca mới thành công!", { autoClose: 1000 })
        }

        assignMutation.mutate({
          employee_id: values.employee_id,
          shift_id: shiftId,
          notes: values.notes
        })
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Có lỗi xảy ra", { autoClose: 1500 })
      }
    })
  }

  // ========== HANDLERS: CHECK-IN ==========
  const handleOpenCheckInModal = () => {
    if (!selectedEvent) return
    checkInForm.setFieldsValue({ time: dayjs() })
    setIsCheckInModalOpen(true)
  }

  const handleSubmitCheckIn = () => {
    if (!selectedEvent) return
    checkInForm.validateFields().then((values) => {
      checkInMutation.mutate({
        id: selectedEvent.id,
        data: {
          check_in: dayjs(values.time).format("YYYY-MM-DD HH:mm:ss"),
          notes: values.notes
        }
      })
    })
  }

  // ========== HANDLERS: CHECK-OUT ==========
  const handleOpenCheckOutModal = () => {
    if (!selectedEvent) return
    checkOutForm.setFieldsValue({ time: dayjs() })
    setIsCheckOutModalOpen(true)
  }

  const handleSubmitCheckOut = () => {
    if (!selectedEvent) return
    checkOutForm.validateFields().then((values) => {
      checkOutMutation.mutate({
        id: selectedEvent.id,
        data: {
          check_out: dayjs(values.time).format("YYYY-MM-DD HH:mm:ss"),
          overtime_hours: values.overtime_hours,
          notes: values.notes
        }
      })
    })
  }

  // ========== HANDLERS: UPDATE STATUS ==========
  const handleOpenUpdateStatusModal = () => {
    if (!selectedEvent) return
    statusForm.setFieldsValue({ status: selectedEvent.resource.status })
    setIsUpdateStatusModalOpen(true)
  }

  const handleSubmitUpdateStatus = () => {
    if (!selectedEvent) return
    statusForm.validateFields().then((values) => {
      updateStatusMutation.mutate({
        id: selectedEvent.id,
        data: values
      })
    })
  }

  // ========== HANDLERS: DELETE ==========
  const handleDelete = () => {
    if (!selectedEvent) return
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Xóa phân công này?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(selectedEvent.id)
    })
  }

  // ========== EVENT STYLING ==========
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status
    const backgroundColor = SHIFT_STATUS_COLORS[status as keyof typeof SHIFT_STATUS_COLORS] || "#8c8c8c"

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontWeight: 500,
        fontSize: "0.875rem"
      }
    }
  }

  // ========== RENDER ==========
  return (
    <div className="shift-calendar-container">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Lịch phân công Ca làm việc</h3>
        <p className="text-gray-500 text-sm">Xem và quản lý phân công theo lịch</p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex gap-4 flex-wrap bg-gray-50 p-3 rounded-lg">
        <span className="font-semibold text-gray-700">Trạng thái:</span>
        {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                backgroundColor: SHIFT_STATUS_COLORS[parseInt(key) as keyof typeof SHIFT_STATUS_COLORS]
              }}
            />
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {isFetching ? (
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
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
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
              event: "Sự kiện",
              noEventsInRange: "Không có ca nào trong khoảng thời gian này.",
              showMore: (total: number) => `+ ${total} ca khác`
            }}
          />
        </div>
      )}

      {/* ========== DETAIL MODAL ========== */}
      {selectedEvent && (
        <Modal
          title="Chi tiết Phân công"
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          footer={null}
          width={600}
        >
          <div className="space-y-4">
            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div>
                <strong>Nhân viên:</strong> {selectedEvent.resource.employee?.full_name || "N/A"}
              </div>
              <div>
                <strong>Ca:</strong> {selectedEvent.resource.shift?.name || "N/A"}
              </div>
              <div>
                <strong>Ngày:</strong> {dayjs(selectedEvent.resource.shift?.shift_date).format("DD/MM/YYYY")}
              </div>
              <div>
                <strong>Giờ:</strong> {selectedEvent.resource.shift?.start_time?.slice(0, 5)} -{" "}
                {selectedEvent.resource.shift?.end_time?.slice(0, 5)}
              </div>
              <div>
                <strong>Trạng thái:</strong>{" "}
                <Tag color={SHIFT_STATUS_COLORS[selectedEvent.resource.status as keyof typeof SHIFT_STATUS_COLORS]}>
                  {SHIFT_STATUS_LABELS[selectedEvent.resource.status as keyof typeof SHIFT_STATUS_LABELS]}
                </Tag>
              </div>
            </div>

            {/* Check-in/out Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 text-sm">Check-in</div>
                <div className="font-mono font-semibold text-green-600">
                  {selectedEvent.resource.check_in
                    ? dayjs(selectedEvent.resource.check_in).format("HH:mm")
                    : "Chưa check-in"}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">Check-out</div>
                <div className="font-mono font-semibold text-red-600">
                  {selectedEvent.resource.check_out
                    ? dayjs(selectedEvent.resource.check_out).format("HH:mm")
                    : "Chưa check-out"}
                </div>
              </div>
            </div>

            {selectedEvent.resource.overtime_hours && (
              <div>
                <strong>Tăng ca:</strong> {selectedEvent.resource.overtime_hours} giờ
              </div>
            )}

            {selectedEvent.resource.notes && (
              <div>
                <strong>Ghi chú:</strong> {selectedEvent.resource.notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              {!selectedEvent.resource.check_in && (
                <Button
                  type="primary"
                  icon={<CheckCircle size={16} />}
                  onClick={handleOpenCheckInModal}
                  className="bg-green-500"
                >
                  Check-in
                </Button>
              )}

              {selectedEvent.resource.check_in && !selectedEvent.resource.check_out && (
                <Button danger icon={<XCircle size={16} />} onClick={handleOpenCheckOutModal}>
                  Check-out
                </Button>
              )}

              <Button icon={<Edit size={16} />} onClick={handleOpenUpdateStatusModal}>
                Đổi trạng thái
              </Button>

              <Button danger icon={<Trash2 size={16} />} onClick={handleDelete}>
                Xóa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========== ASSIGN MODAL ========== */}
      <Modal
        title={`Phân công Ca - ${selectedDate ? dayjs(selectedDate).format("DD/MM/YYYY") : ""}`}
        open={isAssignModalOpen}
        onCancel={handleCloseAssignModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseAssignModal}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmitAssign}
              loading={assignMutation.isPending || createShiftMutation.isPending}
            >
              {isCreatingNewShift ? "Tạo ca & Phân công" : "Phân công"}
            </Button>
          </div>
        }
        width={700}
      >
        <Form form={assignForm} layout="vertical" className="mt-4">
          {/* Mode Selection */}
          <Form.Item
            name="mode"
            label="Chế độ"
            initialValue="existing"
            rules={[{ required: true, message: "Vui lòng chọn chế độ!" }]}
          >
            <Select onChange={handleModeChange}>
              <Select.Option value="existing">Chọn ca có sẵn</Select.Option>
              <Select.Option value="new">Tạo ca mới</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="employee_id"
            label="Nhân viên"
            rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
          >
            <Select placeholder="Chọn nhân viên" showSearch options={employeeOptions} />
          </Form.Item>

          {/* Existing Shift Mode */}
          {!isCreatingNewShift && (
            <Form.Item
              name="shift_id"
              label="Ca làm việc"
              rules={[{ required: !isCreatingNewShift, message: "Vui lòng chọn ca!" }]}
            >
              <Select placeholder="Chọn ca có sẵn" options={shiftOptions} />
            </Form.Item>
          )}

          {/* New Shift Mode */}
          {isCreatingNewShift && (
            <>
              <Form.Item
                name="shift_name"
                label="Tên ca mới"
                rules={[
                  { required: isCreatingNewShift, message: "Vui lòng nhập tên ca!" },
                  { max: 100, message: "Tên ca không quá 100 ký tự" }
                ]}
              >
                <Input placeholder="VD: Ca sáng, Ca chiều..." />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="start_time"
                  label="Giờ bắt đầu"
                  rules={[{ required: isCreatingNewShift, message: "Vui lòng chọn giờ!" }]}
                >
                  <TimePicker className="w-full" format="HH:mm" placeholder="Chọn giờ bắt đầu" />
                </Form.Item>

                <Form.Item
                  name="end_time"
                  label="Giờ kết thúc"
                  rules={[{ required: isCreatingNewShift, message: "Vui lòng chọn giờ!" }]}
                >
                  <TimePicker className="w-full" format="HH:mm" placeholder="Chọn giờ kết thúc" />
                </Form.Item>
              </div>
            </>
          )}

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú thêm..." />
          </Form.Item>

          {isCreatingNewShift && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Lưu ý:</strong> Ca mới sẽ được tạo cho ngày đã chọn và tự động phân công cho nhân viên.
              </p>
            </div>
          )}
        </Form>
      </Modal>

      {/* ========== CHECK-IN MODAL ========== */}
      <Modal
        title="Check-in"
        open={isCheckInModalOpen}
        onCancel={() => setIsCheckInModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsCheckInModalOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitCheckIn} loading={checkInMutation.isPending}>
              Xác nhận
            </Button>
          </div>
        }
      >
        <Form form={checkInForm} layout="vertical" className="mt-4">
          <Form.Item name="time" label="Giờ check-in" rules={[{ required: true, message: "Vui lòng chọn giờ!" }]}>
            <TimePicker className="w-full" format="HH:mm" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== CHECK-OUT MODAL ========== */}
      <Modal
        title="Check-out"
        open={isCheckOutModalOpen}
        onCancel={() => setIsCheckOutModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsCheckOutModalOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitCheckOut} loading={checkOutMutation.isPending}>
              Xác nhận
            </Button>
          </div>
        }
      >
        <Form form={checkOutForm} layout="vertical" className="mt-4">
          <Form.Item name="time" label="Giờ check-out" rules={[{ required: true, message: "Vui lòng chọn giờ!" }]}>
            <TimePicker className="w-full" format="HH:mm" />
          </Form.Item>
          <Form.Item name="overtime_hours" label="Tăng ca (giờ)">
            <InputNumber className="w-full" min={0} max={12} step={0.5} />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== UPDATE STATUS MODAL ========== */}
      <Modal
        title="Cập nhật Trạng thái"
        open={isUpdateStatusModalOpen}
        onCancel={() => setIsUpdateStatusModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsUpdateStatusModalOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitUpdateStatus} loading={updateStatusMutation.isPending}>
              Cập nhật
            </Button>
          </div>
        }
      >
        <Form form={statusForm} layout="vertical" className="mt-4">
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
          >
            <Select>
              {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
                <Select.Option key={key} value={parseInt(key)}>
                  <Tag color={SHIFT_STATUS_COLORS[parseInt(key) as keyof typeof SHIFT_STATUS_COLORS]}>{label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
