import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Form,
  Input,
  Modal,
  Table,
  DatePicker,
  Select,
  Badge,
  Spin,
  InputNumber,
  TimePicker,
  Tag
} from "antd"
import { isUndefined, omitBy } from "lodash"
import { UserPlus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Fragment, useState } from "react"
import { toast } from "react-toastify"
import dayjs from "dayjs"
import { employeeShiftsAPI, shiftsAPI } from "src/Apis/Admin"
import { employeesAPI } from "src/Apis/Admin/employees.api"
import {
  EmployeeShift,
  queryParamConfigEmployeeShift,
  SHIFT_STATUS,
  SHIFT_STATUS_LABELS,
  SHIFT_STATUS_COLORS
} from "src/Types/shift.type"
import { PaginatedResponse } from "src/Types/utils.type"
import useQueryParams from "src/Hook/useQueryParams"

// ========== TYPES FOR MODALS ==========
interface AssignFormInput {
  employee_id: string
  shift_id: string
  shift_date: dayjs.Dayjs
  notes?: string
}

interface CheckInOutFormInput {
  time: dayjs.Dayjs
  notes?: string
}

interface UpdateStatusFormInput {
  status: number
  notes?: string
}

interface CheckOutExtendedFormInput extends CheckInOutFormInput {
  overtime_hours?: number
}

export default function EmployeeShiftTab() {
  const queryConfig: queryParamConfigEmployeeShift = useQueryParams()
  const queryClient = useQueryClient()

  // ========== STATE ==========
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [selectedEmployeeShift, setSelectedEmployeeShift] = useState<EmployeeShift | null>(null)

  const [assignForm] = Form.useForm()
  const [checkInForm] = Form.useForm()
  const [checkOutForm] = Form.useForm()
  const [statusForm] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["employeeShifts", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const params = omitBy(
        {
          page: queryConfig.page || "1",
          per_page: queryConfig.per_page || "15",
          employee_id: queryConfig.employee_id,
          shift_id: queryConfig.shift_id,
          status: queryConfig.status,
          date_from: queryConfig.date_from,
          date_to: queryConfig.date_to
        },
        isUndefined
      )

      return employeeShiftsAPI.getList(params, controller.signal)
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
      return shiftsAPI.getList({ per_page: "99" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  const paginated = data?.data?.data as PaginatedResponse<EmployeeShift>
  const listEmployeeShifts = paginated?.data || []

  const employeeOptions =
    (employeesData?.data?.data as any)?.data?.map((emp: any) => ({
      label: emp.full_name || "N/A",
      value: emp.id
    })) || []

  const shiftOptions =
  (shiftsData?.data?.data as any)?.data
    ?.filter((item: any) => item.employee === null) // chỉ lấy ca chưa có nhân viên
    ?.map((item: any) => {
      const shift = item.shift
      if (!shift) return null // tránh lỗi nếu dữ liệu thiếu shift

      const startTime = shift.start_time ? shift.start_time.slice(0, 5) : "00:00"
      const endTime = shift.end_time ? shift.end_time.slice(0, 5) : "23:59"

      return {
        label: `${shift.name} (${startTime} - ${endTime})`,
        value: shift.id
      }
    })
    ?.filter(Boolean) || []

  // ========== MUTATIONS ==========
  const assignMutation = useMutation({
    mutationFn: (values: AssignFormInput) =>
      employeeShiftsAPI.assign({
        employee_id: values.employee_id,
        shift_id: values.shift_id,
        shift_date: dayjs(values.shift_date).format("YYYY-MM-DD"),
        notes: values.notes
      }),
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
    mutationFn: ({ id, data }: { id: string; data: CheckInOutFormInput }) =>
      employeeShiftsAPI.checkIn(id, {
        check_in_time: dayjs(data.time).format("HH:mm:ss"),
        notes: data.notes
      }),
    onSuccess: () => {
      toast.success("Check-in thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      handleCloseCheckInModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Check-in thất bại", { autoClose: 1500 })
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CheckOutExtendedFormInput }) =>
      employeeShiftsAPI.checkOut(id, {
        check_out_time: dayjs(data.time).format("HH:mm:ss"),
        overtime_hours: data.overtime_hours,
        notes: data.notes
      }),
    onSuccess: () => {
      toast.success("Check-out thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      handleCloseCheckOutModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Check-out thất bại", { autoClose: 1500 })
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusFormInput }) =>
      employeeShiftsAPI.updateStatus(id, {
        status: data.status,
        notes: data.notes
      }),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["employeeShifts"] })
      handleCloseUpdateStatusModal()
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
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS: ASSIGN ==========
  const handleOpenAssignModal = () => {
    assignForm.resetFields()
    setIsAssignModalOpen(true)
  }

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false)
    assignForm.resetFields()
  }

  const handleSubmitAssign = () => {
    assignForm.validateFields().then((values) => {
      assignMutation.mutate(values)
    })
  }

  // ========== HANDLERS: CHECK-IN ==========
  const handleOpenCheckInModal = (record: EmployeeShift) => {
    setSelectedEmployeeShift(record)
    checkInForm.setFieldsValue({
      time: dayjs()
    })
    setIsCheckInModalOpen(true)
  }

  const handleCloseCheckInModal = () => {
    setIsCheckInModalOpen(false)
    setSelectedEmployeeShift(null)
    checkInForm.resetFields()
  }

  const handleSubmitCheckIn = () => {
    if (!selectedEmployeeShift) return
    checkInForm.validateFields().then((values) => {
      checkInMutation.mutate({ id: selectedEmployeeShift.id, data: values })
    })
  }

  // ========== HANDLERS: CHECK-OUT ==========
  const handleOpenCheckOutModal = (record: EmployeeShift) => {
    setSelectedEmployeeShift(record)
    checkOutForm.setFieldsValue({
      time: dayjs()
    })
    setIsCheckOutModalOpen(true)
  }

  const handleCloseCheckOutModal = () => {
    setIsCheckOutModalOpen(false)
    setSelectedEmployeeShift(null)
    checkOutForm.resetFields()
  }

  const handleSubmitCheckOut = () => {
    if (!selectedEmployeeShift) return
    checkOutForm.validateFields().then((values) => {
      checkOutMutation.mutate({ id: selectedEmployeeShift.id, data: values })
    })
  }

  // ========== HANDLERS: UPDATE STATUS ==========
  const handleOpenUpdateStatusModal = (record: EmployeeShift) => {
    setSelectedEmployeeShift(record)
    statusForm.setFieldsValue({
      status: record.status
    })
    setIsUpdateStatusModalOpen(true)
  }

  const handleCloseUpdateStatusModal = () => {
    setIsUpdateStatusModalOpen(false)
    setSelectedEmployeeShift(null)
    statusForm.resetFields()
  }

  const handleSubmitUpdateStatus = () => {
    if (!selectedEmployeeShift) return
    statusForm.validateFields().then((values) => {
      updateStatusMutation.mutate({ id: selectedEmployeeShift.id, data: values })
    })
  }

  // ========== HANDLERS: DELETE ==========
  const handleDelete = (record: EmployeeShift) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Xóa phân công cho "${record.employee?.full_name}" vào ca "${record.shift?.name}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(record.id)
    })
  }

  // ========== FILTER HANDLERS ==========
  const handleFilter = () => {
    const values = filterForm.getFieldsValue()
    const params = new URLSearchParams(window.location.search)
    
    // Update URL params theo đúng API spec
    if (values.employee_id) {
      params.set('employee_id', values.employee_id)
    } else {
      params.delete('employee_id')
    }
    
    if (values.status) {
      params.set('status', values.status)
    } else {
      params.delete('status')
    }
    
    if (values.date_from) {
      params.set('date_from', dayjs(values.date_from).format('YYYY-MM-DD'))
    } else {
      params.delete('date_from')
    }
    
    if (values.date_to) {
      params.set('date_to', dayjs(values.date_to).format('YYYY-MM-DD'))
    } else {
      params.delete('date_to')
    }
    
    // Navigate to update URL
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleResetFilter = () => {
    filterForm.resetFields()
    window.history.pushState({}, '', window.location.pathname)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  // ========== TABLE COLUMNS ==========
  const columns = [
    {
      title: "Nhân viên",
      dataIndex: ["employee", "full_name"],
      key: "employee",
      render: (text: string) => <span className="font-medium">{text || "N/A"}</span>
    },
    {
      title: "Ca làm",
      dataIndex: ["shift", "name"],
      key: "shift",
      render: (text: string, record: EmployeeShift) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {record.shift?.start_time?.slice(0, 5)} - {record.shift?.end_time?.slice(0, 5)}
          </div>
        </div>
      )
    },
    {
      title: "Ngày",
      key: "shift_date",
      render: (_: any, record: EmployeeShift) => {
        // Backend trả shift_date dạng ISO DateTime, cần parse
        const shiftDate = record.shift?.shift_date
        return shiftDate ? dayjs(shiftDate).format("DD/MM/YYYY") : "N/A"
      }
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => (
        <Badge
          status={status === SHIFT_STATUS.PRESENT ? "success" : "processing"}
          text={
            <Tag color={SHIFT_STATUS_COLORS[status as keyof typeof SHIFT_STATUS_COLORS]} className="font-medium">
              {SHIFT_STATUS_LABELS[status as keyof typeof SHIFT_STATUS_LABELS]}
            </Tag>
          }
        />
      )
    },
    {
      title: "Check-in",
      dataIndex: "check_in",
      key: "check_in",
      render: (time: string | null) =>
        time ? (
          <span className="font-mono text-green-600">{dayjs(time).format("HH:mm")}</span>
        ) : (
          <i className="text-gray-400">Chưa</i>
        )
    },
    {
      title: "Check-out",
      dataIndex: "check_out",
      key: "check_out",
      render: (time: string | null) =>
        time ? (
          <span className="font-mono text-red-600">{dayjs(time).format("HH:mm")}</span>
        ) : (
          <i className="text-gray-400">Chưa</i>
        )
    },
    {
      title: "Tăng ca (h)",
      dataIndex: "overtime_hours",
      key: "overtime_hours",
      render: (hours: number | null) => (hours ? <span className="font-bold">{hours}h</span> : "-")
    },
    {
      title: "Hành động",
      key: "action",
      width: 280,
      render: (_: any, record: EmployeeShift) => (
        <div className="flex gap-2 flex-wrap">
          {!record.check_in && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircle size={14} />}
              onClick={() => handleOpenCheckInModal(record)}
              className="bg-green-500"
            >
              Check-in
            </Button>
          )}

          {record.check_in && !record.check_out && (
            <Button
              size="small"
              danger
              icon={<XCircle size={14} />}
              onClick={() => handleOpenCheckOutModal(record)}
            >
              Check-out
            </Button>
          )}

          <Button
            size="small"
            type="default"
            icon={<Edit size={14} />}
            onClick={() => handleOpenUpdateStatusModal(record)}
          >
            Status
          </Button>

          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record)} />
        </div>
      )
    }
  ]

  // ========== RENDER ==========
  return (
    <div>
      {/* Header & Actions */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Phân công Nhân viên</h3>
          <p className="text-gray-500 text-sm">Quản lý lịch phân công và chấm công</p>
        </div>
        <Button type="primary" icon={<UserPlus size={18} />} onClick={handleOpenAssignModal} size="large">
          Phân công mới
        </Button>
      </div>

      {/* Filter Form */}
      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
        <Form form={filterForm} layout="inline" className="flex flex-wrap gap-3">
          <Form.Item name="employee_id" className="mb-0">
            <Select
              placeholder="Chọn nhân viên"
              className="w-56"
              showSearch
              filterOption={(input, option: any) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={employeeOptions}
              allowClear
            />
          </Form.Item>

          <Form.Item name="status" className="mb-0">
            <Select placeholder="Trạng thái" className="w-40" allowClear>
              {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
                <Select.Option key={key} value={parseInt(key)}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="date_from" className="mb-0">
            <DatePicker placeholder="Từ ngày" format="DD/MM/YYYY" className="w-48" />
          </Form.Item>

          <Form.Item name="date_to" className="mb-0">
            <DatePicker placeholder="Đến ngày" format="DD/MM/YYYY" className="w-48" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" onClick={handleFilter}>Áp dụng</Button>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button onClick={handleResetFilter}>Reset</Button>
          </Form.Item>
        </Form>
      </div>

      {/* Table */}
      {isFetching ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={listEmployeeShifts}
            pagination={{
              current: parseInt(queryConfig.page as string) || 1,
              total: paginated?.total,
              pageSize: parseInt(queryConfig.per_page as string) || 15,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} phân công`
            }}
            bordered
            scroll={{ x: 1200 }}
          />
        </Fragment>
      )}

      {/* ========== ASSIGN MODAL ========== */}
      <Modal
        title="Phân công Nhân viên vào Ca"
        open={isAssignModalOpen}
        onCancel={handleCloseAssignModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseAssignModal}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitAssign} loading={assignMutation.isPending}>
              Phân công
            </Button>
          </div>
        }
        width={600}
      >
        <Form form={assignForm} layout="vertical" className="mt-4">
          <Form.Item
            name="employee_id"
            label="Nhân viên"
            rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
          >
            <Select
              placeholder="Chọn nhân viên"
              showSearch
              filterOption={(input, option: any) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={employeeOptions}
            />
          </Form.Item>

          <Form.Item name="shift_id" label="Ca làm việc" rules={[{ required: true, message: "Vui lòng chọn ca!" }]}>
            <Select placeholder="Chọn ca" options={shiftOptions} />
          </Form.Item>

          <Form.Item
            name="shift_date"
            label="Ngày làm việc"
            rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== CHECK-IN MODAL ========== */}
      <Modal
        title="Check-in Nhân viên"
        open={isCheckInModalOpen}
        onCancel={handleCloseCheckInModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseCheckInModal}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitCheckIn} loading={checkInMutation.isPending}>
              Xác nhận Check-in
            </Button>
          </div>
        }
        width={500}
      >
        {selectedEmployeeShift && (
          <div className="bg-blue-50 p-3 rounded mb-4">
            <div>
              <strong>Nhân viên:</strong> {selectedEmployeeShift.employee?.full_name || "N/A"}
            </div>
            <div>
              <strong>Ca:</strong> {selectedEmployeeShift.shift?.name}
            </div>
            <div>
              <strong>Ngày:</strong> {selectedEmployeeShift.shift?.shift_date ? dayjs(selectedEmployeeShift.shift.shift_date).format("DD/MM/YYYY") : "N/A"}
            </div>
          </div>
        )}

        <Form form={checkInForm} layout="vertical">
          <Form.Item
            name="time"
            label="Giờ check-in"
            rules={[{ required: true, message: "Vui lòng chọn giờ!" }]}
          >
            <TimePicker className="w-full" format="HH:mm" placeholder="Chọn giờ" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú (nếu có)..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== CHECK-OUT MODAL ========== */}
      <Modal
        title="Check-out Nhân viên"
        open={isCheckOutModalOpen}
        onCancel={handleCloseCheckOutModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseCheckOutModal}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitCheckOut} loading={checkOutMutation.isPending}>
              Xác nhận Check-out
            </Button>
          </div>
        }
        width={500}
      >
        {selectedEmployeeShift && (
          <div className="bg-red-50 p-3 rounded mb-4">
            <div>
              <strong>Nhân viên:</strong> {selectedEmployeeShift.employee?.full_name || "N/A"}
            </div>
            <div>
              <strong>Ca:</strong> {selectedEmployeeShift.shift?.name}
            </div>
            <div>
              <strong>Check-in:</strong>{" "}
              {selectedEmployeeShift.check_in
                ? dayjs(selectedEmployeeShift.check_in).format("HH:mm")
                : "N/A"}
            </div>
          </div>
        )}

        <Form form={checkOutForm} layout="vertical">
          <Form.Item
            name="time"
            label="Giờ check-out"
            rules={[{ required: true, message: "Vui lòng chọn giờ!" }]}
          >
            <TimePicker className="w-full" format="HH:mm" placeholder="Chọn giờ" />
          </Form.Item>

          <Form.Item name="overtime_hours" label="Số giờ tăng ca" help="Chỉ nhập nếu có làm thêm giờ">
            <InputNumber className="w-full" min={0} max={12} step={0.5} placeholder="VD: 2.5" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú (nếu có)..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== UPDATE STATUS MODAL ========== */}
      <Modal
        title="Cập nhật Trạng thái"
        open={isUpdateStatusModalOpen}
        onCancel={handleCloseUpdateStatusModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseUpdateStatusModal}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmitUpdateStatus}
              loading={updateStatusMutation.isPending}
            >
              Cập nhật
            </Button>
          </div>
        }
        width={500}
      >
        {selectedEmployeeShift && (
          <div className="bg-gray-50 p-3 rounded mb-4">
            <div>
              <strong>Nhân viên:</strong> {selectedEmployeeShift.employee?.full_name || "N/A"}
            </div>
            <div>
              <strong>Ca:</strong> {selectedEmployeeShift.shift?.name} (
              {selectedEmployeeShift.shift?.shift_date ? dayjs(selectedEmployeeShift.shift.shift_date).format("DD/MM/YYYY") : "N/A"})
            </div>
          </div>
        )}

        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="Trạng thái mới"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
          >
            <Select placeholder="Chọn trạng thái">
              {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
                <Select.Option key={key} value={parseInt(key)}>
                  <Tag color={SHIFT_STATUS_COLORS[parseInt(key) as keyof typeof SHIFT_STATUS_COLORS]} className="mr-2">
                    {label}
                  </Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Lý do thay đổi trạng thái..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
