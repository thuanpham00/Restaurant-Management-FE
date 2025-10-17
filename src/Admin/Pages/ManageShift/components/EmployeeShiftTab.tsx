import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Form,
  Input,
  Modal,
  DatePicker,
  Select,
  Badge,
  Spin,
  Card,
  Row,
  Col,
  Tag,
  Empty,
  Checkbox,
  Table
} from "antd"
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  UserCheck,
  CalendarDays,
  Zap,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Eye
} from "lucide-react"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import dayjs from "dayjs"
import { employeeShiftsAPI, shiftsAPI } from "src/Apis/Admin"
import { employeesAPI } from "src/Apis/Admin/employees.api"
import { EmployeeShift, SHIFT_STATUS, SHIFT_STATUS_LABELS, SHIFT_STATUS_COLORS, Shift } from "src/Types/shift.type"
import { path } from "src/Constants/path"
import type { ColumnsType } from "antd/es/table"

// ========== TYPES ==========
interface Employee {
  id: string
  full_name: string
  position?: string
  employee_code?: string
}

interface ShiftWithAssignments extends Shift {
  employee_assignments?: EmployeeShift[]
  assigned_count?: number
}

interface ShiftTableRecord extends ShiftWithAssignments {
  key: string
  assignments: EmployeeShift[]
  assignedCount: number
  statusCounts: Record<number, number>
}

export default function EmployeeShiftTab() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ========== STATE ==========
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<number | null>(null)
  const [employeeKeyword, setEmployeeKeyword] = useState("")

  const [bulkAssignForm] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== QUERIES ==========
  // Get all employees
  const { data: employeesData, isFetching: isFetchingEmployees } = useQuery({
    queryKey: ["employees-active"],
    queryFn: () => {
      const controller = new AbortController()
      return employeesAPI.getList({ per_page: "999", is_active: "1" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  // Get shifts with filters
  const { data: shiftsData, isFetching: isFetchingShifts } = useQuery({
    queryKey: ["shifts-with-assignments", selectedDateRange],
    queryFn: () => {
      const controller = new AbortController()
      const params: any = { per_page: "999" }

      if (selectedDateRange) {
        params.date_from = selectedDateRange[0].format("YYYY-MM-DD")
        params.date_to = selectedDateRange[1].format("YYYY-MM-DD")
      }

      return shiftsAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000
  })

  // Get employee shifts for statistics
  const { data: employeeShiftsData } = useQuery({
    queryKey: ["employee-shifts-stats", selectedDateRange],
    queryFn: () => {
      const controller = new AbortController()
      const params: any = { per_page: "999" }

      if (selectedDateRange) {
        params.date_from = selectedDateRange[0].format("YYYY-MM-DD")
        params.date_to = selectedDateRange[1].format("YYYY-MM-DD")
      }

      return employeeShiftsAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000
  })

  const employees: Employee[] = (employeesData?.data?.data as any)?.data || []
  const shifts: ShiftWithAssignments[] = (shiftsData?.data?.data as any)?.data || []
  const employeeShifts: EmployeeShift[] = (employeeShiftsData?.data?.data as any)?.data || []

  const filteredEmployees = useMemo(() => {
    const keyword = employeeKeyword.trim().toLowerCase()
    if (!keyword) return employees
    return employees.filter((employee) => {
      const name = employee.full_name?.toLowerCase() || ""
      const code = employee.employee_code?.toLowerCase() || ""
      const position = employee.position?.toLowerCase() || ""
      return name.includes(keyword) || code.includes(keyword) || position.includes(keyword)
    })
  }, [employees, employeeKeyword])

  // ========== COMPUTED DATA ==========
  const statistics = useMemo(() => {
    const totalShifts = shifts.length
    const totalEmployees = employees.length
    const totalAssignments = employeeShifts.length
    const assignedShifts = shifts.filter((s) => employeeShifts.some((es) => es.shift_id === s.id)).length
    const unassignedShifts = totalShifts - assignedShifts
    const avgAssignmentsPerShift = totalShifts > 0 ? Number((totalAssignments / totalShifts).toFixed(1)) : 0

    const statusCounts = {
      scheduled: employeeShifts.filter((es) => es.status === SHIFT_STATUS.SCHEDULED).length,
      present: employeeShifts.filter((es) => es.status === SHIFT_STATUS.PRESENT).length,
      absent: employeeShifts.filter((es) => es.status === SHIFT_STATUS.ABSENT).length,
      late: employeeShifts.filter((es) => es.status === SHIFT_STATUS.LATE).length,
      earlyLeave: employeeShifts.filter((es) => es.status === SHIFT_STATUS.EARLY_LEAVE).length
    }

    return {
      totalShifts,
      totalEmployees,
      totalAssignments,
      assignedShifts,
      unassignedShifts,
      avgAssignmentsPerShift,
      statusCounts
    }
  }, [shifts, employees, employeeShifts])

  // ========== MUTATIONS ==========
  const bulkAssignMutation = useMutation({
    mutationFn: (data: { shift_id: string; employee_ids: string[]; status?: number; notes?: string }) =>
      employeeShiftsAPI.bulkAssign(data),
    onSuccess: (response) => {
      const result = response.data.data
      toast.success(
        `Phân công thành công ${result.total_assigned} nhân viên${result.total_skipped > 0 ? ` (Bỏ qua ${result.total_skipped} đã tồn tại)` : ""}`,
        { autoClose: 3000 }
      )
      queryClient.invalidateQueries({ queryKey: ["shifts-with-assignments"] })
      queryClient.invalidateQueries({ queryKey: ["employee-shifts-stats"] })
      setSelectedShifts([])
      setSelectedEmployees([])
      setIsBulkAssignModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Phân công thất bại", { autoClose: 2000 })
    }
  })

  // ========== HANDLERS ==========
  const handleOpenBulkAssignModal = (initialShiftIds?: string[]) => {
    bulkAssignForm.resetFields()
    setSelectedEmployees([])
    setSelectedShifts(initialShiftIds ?? [])
    setEmployeeKeyword("")
    setIsBulkAssignModalOpen(true)
  }

  const handleSubmitBulkAssign = async () => {
    if (selectedShifts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 ca làm việc!", { autoClose: 2000 })
      return
    }

    if (selectedEmployees.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 nhân viên!", { autoClose: 2000 })
      return
    }

    const values = bulkAssignForm.getFieldsValue()

    // Assign each selected shift with all selected employees
    for (const shiftId of selectedShifts) {
      await bulkAssignMutation.mutateAsync({
        shift_id: shiftId,
        employee_ids: selectedEmployees,
        status: values.status || 0,
        notes: values.notes
      })
    }
  }

  const handleQuickFilter = (days: number) => {
    const from = dayjs()
    const to = dayjs().add(days, "day")
    setSelectedDateRange([from, to])
  }

  const handleResetFilters = () => {
    setSelectedDateRange(null)
    setFilterStatus(null)
    filterForm.resetFields()
  }

  // Get shift assignments grouped by shift
  const getShiftAssignments = (shiftId: string): EmployeeShift[] => {
    return employeeShifts.filter((es) => es.shift_id === shiftId)
  }

  // Filter shifts based on status
  const filteredShifts = useMemo(() => {
    if (!filterStatus) return shifts

    return shifts.filter((shift) => {
      const assignments = getShiftAssignments(shift.id)
      return assignments.some((a) => a.status === filterStatus)
    })
  }, [shifts, filterStatus, employeeShifts])

  const shiftTableData = useMemo<ShiftTableRecord[]>(() => {
    return filteredShifts.map((shift) => {
      const assignments = employeeShifts.filter((es) => es.shift_id === shift.id)
      const statusCounts = assignments.reduce<Record<number, number>>((acc, assignment) => {
        const current = acc[assignment.status] || 0
        acc[assignment.status] = current + 1
        return acc
      }, {})

      return {
        ...shift,
        key: shift.id,
        assignments,
        assignedCount: assignments.length,
        statusCounts
      }
    })
  }, [filteredShifts, employeeShifts])

  const shiftTableColumns: ColumnsType<ShiftTableRecord> = [
    {
      title: "Ca làm việc",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div className="space-y-1">
          <div className="text-base font-semibold text-gray-800">{record.name}</div>
          <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {record.shift_date ? dayjs(record.shift_date).format("DD/MM/YYYY (dddd)") : "Chưa cập nhật"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {record.start_time && record.end_time
                ? `${record.start_time.slice(0, 5)} - ${record.end_time.slice(0, 5)}`
                : "--:--"}
            </span>
          </div>
        </div>
      )
    },
    {
      title: "Phân công",
      dataIndex: "assignedCount",
      key: "assignedCount",
      width: 260,
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <UserCheck size={16} className="text-blue-500" />
            {record.assignedCount > 0 ? `${record.assignedCount} nhân viên` : "Chưa có phân công"}
          </div>
          {record.assignedCount > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {record.assignments.slice(0, 3).map((assignment) => (
                <Tag
                  key={assignment.id}
                  color={SHIFT_STATUS_COLORS[assignment.status as keyof typeof SHIFT_STATUS_COLORS]}
                >
                  {assignment.employee?.full_name || "Không rõ"}
                </Tag>
              ))}
              {record.assignedCount > 3 && <Tag>+{record.assignedCount - 3}</Tag>}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "statusCounts",
      key: "statusCounts",
      width: 260,
      render: (_, record) => {
        const activeStatuses = Object.entries(SHIFT_STATUS_LABELS).filter(([status]) => {
          const statusKey = Number(status)
          return (record.statusCounts[statusKey] || 0) > 0
        })

        if (activeStatuses.length === 0) {
          return <Tag>Chưa phân</Tag>
        }

        return (
          <div className="flex flex-wrap gap-1">
            {activeStatuses.map(([status, label]) => {
              const statusNumber = Number(status) as keyof typeof SHIFT_STATUS_COLORS
              const count = record.statusCounts[statusNumber] || 0
              return (
                <Tag key={status} color={SHIFT_STATUS_COLORS[statusNumber]}>
                  {label} ({count})
                </Tag>
              )
            })}
          </div>
        )
      }
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<Plus size={14} />}
            onClick={(event) => {
              event.stopPropagation()
              handleOpenBulkAssignModal([record.id])
            }}
          >
            Phân công
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<Eye size={14} />}
            onClick={(event) => {
              event.stopPropagation()
              navigate(path.AdminShiftDetail.replace(":id", record.id))
            }}
          >
            Chi tiết
          </Button>
        </div>
      )
    }
  ]

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <CalendarDays size={32} />
              Quản lý Phân công Ca làm việc
            </h2>
            <p className="text-blue-100 mt-2">Hệ thống phân công - Tối ưu cho quản lý nhà hàng</p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<Zap size={20} />}
            onClick={() => handleOpenBulkAssignModal()}
            className="bg-white text-blue-600 border-0 hover:bg-blue-50 font-semibold shadow-lg h-12 px-8"
          >
            Phân công
          </Button>
        </div>
      </div>

      {/* ========== STATISTICS CARDS ==========
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <Statistic
              title={<span className="text-gray-600 font-medium">Tổng ca làm việc</span>}
              value={statistics.totalShifts}
              prefix={<Calendar className="text-blue-500" size={24} />}
              valueStyle={{ color: '#1890ff', fontSize: '2rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <Statistic
              title={<span className="text-gray-600 font-medium">Tổng nhân viên</span>}
              value={statistics.totalEmployees}
              prefix={<Users className="text-green-500" size={24} />}
              valueStyle={{ color: '#52c41a', fontSize: '2rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <Statistic
              title={<span className="text-gray-600 font-medium">Tổng phân công</span>}
              value={statistics.totalAssignments}
              prefix={<UserCheck className="text-purple-500" size={24} />}
              valueStyle={{ color: '#722ed1', fontSize: '2rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500">
            <Statistic
              title={<span className="text-gray-600 font-medium">TB NV/Ca</span>}
              value={statistics.avgAssignmentsPerShift}
              prefix={<TrendingUp className="text-orange-500" size={24} />}
              suffix="người"
              valueStyle={{ color: '#fa8c16', fontSize: '2rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row> */}

      {/* ========== FILTERS ========== */}
      <Card className="shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={20} className="text-blue-600" />
            Bộ lọc & Tìm kiếm
          </h3>
        </div>

        <Form form={filterForm} layout="inline" className="flex flex-wrap gap-3">
          <Form.Item className="mb-0">
            <DatePicker.RangePicker
              value={selectedDateRange}
              onChange={(dates) => setSelectedDateRange(dates as any)}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              className="w-72"
              size="large"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Select
              placeholder="Lọc theo trạng thái"
              className="w-48"
              size="large"
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
            >
              {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
                <Select.Option key={key} value={parseInt(key)}>
                  <Tag color={SHIFT_STATUS_COLORS[parseInt(key) as keyof typeof SHIFT_STATUS_COLORS]}>{label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex gap-2">
            <Button size="large" onClick={() => handleQuickFilter(7)} icon={<Calendar size={16} />}>
              7 ngày tới
            </Button>
            <Button size="large" onClick={() => handleQuickFilter(30)} icon={<Calendar size={16} />}>
              30 ngày tới
            </Button>
            <Button size="large" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </Form>
      </Card>

      {/* ========== STATUS OVERVIEW ========== */}
      <Card className="shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            Thống kê trạng thái
          </h3>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{statistics.statusCounts.scheduled}</div>
              <Tag color="blue" className="mt-2">
                Đã lên lịch
              </Tag>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{statistics.statusCounts.present}</div>
              <Tag color="green" className="mt-2">
                Có mặt
              </Tag>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{statistics.statusCounts.absent}</div>
              <Tag color="red" className="mt-2">
                Vắng mặt
              </Tag>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{statistics.statusCounts.late}</div>
              <Tag color="orange" className="mt-2">
                Đi muộn
              </Tag>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{statistics.statusCounts.earlyLeave}</div>
              <Tag color="purple" className="mt-2">
                Về sớm
              </Tag>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{statistics.unassignedShifts}</div>
              <Tag color="default" className="mt-2">
                Chưa phân
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ========== SHIFTS GRID ========== */}
      <Card className="shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            Danh sách ca làm việc ({filteredShifts.length})
          </h3>
        </div>
        <Table<ShiftTableRecord>
          columns={shiftTableColumns}
          dataSource={shiftTableData}
          rowKey="id"
          loading={isFetchingShifts}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => navigate(path.AdminShiftDetail.replace(":id", record.id)),
            className: "cursor-pointer"
          })}
          locale={{
            emptyText: (
              <Empty
                description="Không có ca làm việc nào trong khoảng thời gian này"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => handleOpenBulkAssignModal()}>
                  Tạo phân công mới
                </Button>
              </Empty>
            )
          }}
        />
      </Card>

      {/* ========== BULK ASSIGN MODAL ========== */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-lg">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold m-0">Phân công</h3>
              <p className="text-sm text-gray-500 m-0">Chọn nhiều ca và nhiều nhân viên cùng lúc</p>
            </div>
          </div>
        }
        open={isBulkAssignModalOpen}
        onCancel={() => setIsBulkAssignModalOpen(false)}
        footer={
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              <strong>{selectedShifts.length}</strong> ca × <strong>{selectedEmployees.length}</strong> NV =
              <span className="text-lg font-bold text-blue-600 ml-2">
                {selectedShifts.length * selectedEmployees.length} phân công
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="large" onClick={() => setIsBulkAssignModalOpen(false)}>
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmitBulkAssign}
                loading={bulkAssignMutation.isPending}
                disabled={selectedShifts.length === 0 || selectedEmployees.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-500 border-0"
                icon={<CheckCircle size={18} />}
              >
                Xác nhận phân công
              </Button>
            </div>
          </div>
        }
        width={1200}
        centered 
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)", 
            overflowY: "auto",
            padding: "20px"
          }
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Form form={bulkAssignForm} layout="vertical">
          <Row gutter={24}>
            {/* LEFT: SELECT SHIFTS */}
            <Col xs={24} md={12}>
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-blue-600" />
                  <h4 className="font-bold text-lg m-0">Chọn ca làm việc</h4>
                  <Badge count={selectedShifts.length} showZero className="ml-auto" />
                </div>

                <div className="mb-3 flex gap-2">
                  <Button
                    size="small"
                    onClick={() => setSelectedShifts(shifts.map((s) => s.id))}
                    icon={<CheckCircle size={14} />}
                  >
                    Chọn tất cả
                  </Button>
                  <Button size="small" onClick={() => setSelectedShifts([])} icon={<XCircle size={14} />}>
                    Bỏ chọn
                  </Button>
                </div>

                <div className="bg-white rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
                  {shifts.length === 0 ? (
                    <Empty description="Không có ca làm việc" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    shifts.map((shift) => {
                      const isSelected = selectedShifts.includes(shift.id)
                      const assignments = getShiftAssignments(shift.id)

                      return (
                        <div
                          key={shift.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedShifts((prev) => prev.filter((id) => id !== shift.id))
                            } else {
                              setSelectedShifts((prev) => [...prev, shift.id])
                            }
                          }}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all border-2
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox checked={isSelected} className="mt-1" />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{shift.name}</div>
                              <div className="text-sm text-gray-600 mt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar size={12} />
                                  {dayjs(shift.shift_date).format("DD/MM/YYYY (dddd)")}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={12} />
                                  {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                                </div>
                              </div>
                              {assignments.length > 0 && (
                                <Tag color="green" className="mt-2">
                                  Đã có {assignments.length} NV
                                </Tag>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </Col>

            {/* RIGHT: SELECT EMPLOYEES */}
            <Col xs={24} md={12}>
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-purple-600" />
                  <h4 className="font-bold text-lg m-0">Chọn nhân viên</h4>
                  <Badge count={selectedEmployees.length} showZero className="ml-auto" />
                </div>

                <div className="mb-3 flex gap-2">
                  <Button
                    size="small"
                    onClick={() => setSelectedEmployees(employees.map((e) => e.id))}
                    icon={<CheckCircle size={14} />}
                  >
                    Chọn tất cả
                  </Button>
                  <Button size="small" onClick={() => setSelectedEmployees([])} icon={<XCircle size={14} />}>
                    Bỏ chọn
                  </Button>
                </div>

                <Input
                  placeholder="🔍 Tìm nhân viên..."
                  size="large"
                  className="mb-3"
                  prefix={<Search size={16} />}
                  value={employeeKeyword}
                  onChange={(event) => setEmployeeKeyword(event.target.value)}
                  allowClear
                />

                <div className="bg-white rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
                  {isFetchingEmployees ? (
                    <div className="text-center py-8">
                      <Spin />
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <Empty description="Không có nhân viên" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    filteredEmployees.map((employee) => {
                      const isSelected = selectedEmployees.includes(employee.id)

                      return (
                        <div
                          key={employee.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedEmployees((prev) => prev.filter((id) => id !== employee.id))
                            } else {
                              setSelectedEmployees((prev) => [...prev, employee.id])
                            }
                          }}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all border-2 flex items-center gap-3
                            ${
                              isSelected
                                ? "border-purple-500 bg-purple-50 shadow-md"
                                : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                            }
                          `}
                        >
                          <Checkbox checked={isSelected} />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{employee.full_name}</div>
                            {employee.position && <div className="text-sm text-gray-500">{employee.position}</div>}
                          </div>
                          {employee.employee_code && <Tag>{employee.employee_code}</Tag>}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* ADDITIONAL OPTIONS */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle size={18} />
              Tùy chọn bổ sung
            </h4>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="status" label="Trạng thái ban đầu" initialValue={0}>
                  <Select size="large">
                    {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
                      <Select.Option key={key} value={parseInt(key)}>
                        <Tag color={SHIFT_STATUS_COLORS[parseInt(key) as keyof typeof SHIFT_STATUS_COLORS]}>
                          {label}
                        </Tag>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="notes" label="Ghi chú chung">
                  <Input size="large" placeholder="Ghi chú chung cho tất cả phân công..." />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
