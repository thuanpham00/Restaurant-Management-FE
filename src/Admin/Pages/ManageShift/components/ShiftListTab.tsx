/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Form, Input, Modal, Table, DatePicker, TimePicker, Spin, Radio, Badge, Tag, Checkbox } from "antd"
import { isUndefined, omitBy } from "lodash"
import { Clock, Edit, Filter, Plus, RotateCcw, Trash2, Sun, Moon, Settings, Zap, Calendar } from "lucide-react"
import { Fragment, useCallback, useState } from "react"
import { toast } from "react-toastify"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import { shiftsAPI } from "src/Apis/Admin"
import { AppAbility, AppRole, resolveRole, useAuthorization } from "src/Authorization"
import { Shift, ShiftFormInput, queryParamConfigShift } from "src/Types/shift.type"
import { PaginatedResponse } from "src/Types/utils.type"
import useQueryParams from "src/Hook/useQueryParams"
import { useAppStore } from "src/StateGlobal/zustand"

const { RangePicker } = DatePicker

dayjs.extend(isoWeek)

// ========== CONSTANTS ==========
const SHIFT_PRESETS = {
  MORNING: {
    label: "Ca sáng",
    icon: Sun,
    start: "07:00",
    end: "15:00",
    color: "#1890ff"
  },
  EVENING: {
    label: "Ca tối",
    icon: Moon,
    start: "15:00",
    end: "23:00",
    color: "#fa8c16"
  },
  CUSTOM: {
    label: "Tùy chỉnh",
    icon: Settings,
    start: null,
    end: null,
    color: "#52c41a"
  }
} as const

type ShiftPresetType = "MORNING" | "EVENING" | "CUSTOM"

// Helper function to detect shift type
const detectShiftType = (startTime: string | null, endTime: string | null): ShiftPresetType => {
  if (!startTime || !endTime) return "CUSTOM"
  const start = startTime.slice(0, 5)
  const end = endTime.slice(0, 5)
  if (start === "07:00" && end === "15:00") return "MORNING"
  if (start === "15:00" && end === "23:00") return "EVENING"
  return "CUSTOM"
}

export default function ShiftListTab() {
  const queryConfig: queryParamConfigShift = useQueryParams()
  const queryClient = useQueryClient()
  const { can, role } = useAuthorization()
  const canViewShifts = can(AppAbility.SHIFTS_VIEW)
  const canManageShifts = can(AppAbility.SHIFTS_MANAGE)

  const ensureManagePermission = useCallback(() => {
    if (canManageShifts) return true
    toast.warning("Bạn không có quyền quản lý ca làm việc!", { autoClose: 2000 })
    return false
  }, [canManageShifts])

  const invalidateShiftRelatedQueries = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["shifts"] }),
      queryClient.invalidateQueries({ queryKey: ["shifts-with-assignments"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["employee-shifts-stats"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["shift-detail"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"], exact: false })
    ]).then(() => undefined)
  }, [queryClient])

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [shiftPreset, setShiftPreset] = useState<ShiftPresetType>("MORNING")
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  // Quick Create Modal
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false)
  const [quickCreateForm] = Form.useForm()
  const [quickCreateLoading, setQuickCreateLoading] = useState(false)

  // Date Range Filter State
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => {
    if (queryConfig.shift_date_from && queryConfig.shift_date_to) {
      return [dayjs(queryConfig.shift_date_from), dayjs(queryConfig.shift_date_to)]
    }
    return [dayjs().startOf("isoWeek"), dayjs().endOf("isoWeek")]
  })

  // ========== COMPUTED VALUES ==========
  // Default to current week
  const currentWeekStart = dayjs().startOf("isoWeek").format("YYYY-MM-DD")
  const currentWeekEnd = dayjs().endOf("isoWeek").format("YYYY-MM-DD")

  // ========== QUERY ==========
  const { data, isFetching } = useQuery({
    queryKey: ["shifts", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      // Default to current week if no date filter is provided
      const defaultFrom = queryConfig.shift_date_from || currentWeekStart
      const defaultTo = queryConfig.shift_date_to || currentWeekEnd

      const params = omitBy(
        {
          page: queryConfig.page || "1",
          per_page: queryConfig.per_page || "50",
          name: queryConfig.name,
          shift_date: queryConfig.shift_date,
          shift_date_from: defaultFrom,
          shift_date_to: defaultTo
        },
        isUndefined
      )

      return shiftsAPI.getList(params, controller.signal)
    },
    enabled: canViewShifts,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = (canViewShifts ? data?.data?.data : undefined) as PaginatedResponse<Shift> | undefined
  const listShifts = paginated?.data || []

  // --- filter shifts for limited roles (show only shifts where current employee participates) ---
  const { employeeId } = useAppStore()
  const resolvedRole = resolveRole(String(role ?? ""))
  const limitedViewRoles = [AppRole.STAFF, AppRole.CASHIER, AppRole.KITCHEN_STAFF, AppRole.WAITER]
  const isLimitedView = resolvedRole !== null && limitedViewRoles.includes(resolvedRole)
  const filteredShifts = isLimitedView
    ? listShifts.filter((s) => (s.employee_assignments || []).some((a) => a.employee_id === employeeId))
    : listShifts

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: ShiftFormInput) => shiftsAPI.create(values),
    onSuccess: () => {
      toast.success("Tạo ca làm việc thành công!", { autoClose: 1500 })
      invalidateShiftRelatedQueries()
      handleCloseModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Tạo ca thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShiftFormInput }) => shiftsAPI.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật ca thành công!", { autoClose: 1500 })
      invalidateShiftRelatedQueries()
      handleCloseModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftsAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa ca thành công!", { autoClose: 1500 })
      invalidateShiftRelatedQueries()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS ==========
  const handleCreate = () => {
    if (!ensureManagePermission()) return
    setIsEditMode(false)
    setSelectedShift(null)
    setShiftPreset("MORNING")
    form.resetFields()

    // Auto-generate default name: "Sáng - dd/MM/yyyy"
    const today = dayjs()
    form.setFieldsValue({
      name: `Sáng - ${today.format("DD/MM/YYYY")}`,
      shift_date: today,
      start_time: dayjs().hour(7).minute(0),
      end_time: dayjs().hour(15).minute(0)
    })
    setIsModalOpen(true)
  }

  const handleQuickCreate = () => {
    if (!ensureManagePermission()) return
    quickCreateForm.resetFields()
    quickCreateForm.setFieldsValue({
      date_range: [dayjs(), dayjs()],
      create_morning: true,
      create_evening: true
    })
    setIsQuickCreateModalOpen(true)
  }

  const handleShiftPresetChange = (preset: ShiftPresetType) => {
    setShiftPreset(preset)
    const presetData = SHIFT_PRESETS[preset]

    if (preset !== "CUSTOM" && presetData.start && presetData.end) {
      const [startHour, startMin] = presetData.start.split(":").map(Number)
      const [endHour, endMin] = presetData.end.split(":").map(Number)

      // Auto-update name when changing preset
      const currentDate = form.getFieldValue("shift_date") || dayjs()
      const presetLabel = preset === "MORNING" ? "Sáng" : "Chiều"

      form.setFieldsValue({
        name: `${presetLabel} - ${dayjs(currentDate).format("DD/MM/YYYY")}`,
        start_time: dayjs().hour(startHour).minute(startMin),
        end_time: dayjs().hour(endHour).minute(endMin)
      })
    }
  }

  const handleEdit = (shift: Shift) => {
    if (!ensureManagePermission()) return
    setIsEditMode(true)
    setSelectedShift(shift)

    // Data format "HH:mm:ss" (string) → Dayjs object
    const parseTime = (timeStr: string | null) => {
      if (!timeStr) return null
      const [hours, minutes] = timeStr.split(":")
      return dayjs().hour(parseInt(hours)).minute(parseInt(minutes)).second(0)
    }

    // Detect shift preset type
    const detectedPreset = detectShiftType(shift.start_time, shift.end_time)
    setShiftPreset(detectedPreset)

    form.setFieldsValue({
      name: shift.name,
      shift_date: shift.shift_date ? dayjs(shift.shift_date) : null,
      start_time: parseTime(shift.start_time),
      end_time: parseTime(shift.end_time)
    })
    setIsModalOpen(true)
  }

  const handleDelete = (shift: Shift) => {
    if (!ensureManagePermission()) return
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa ca "${shift.name}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(shift.id)
    })
  }

  const handleSubmit = () => {
    if (!ensureManagePermission()) return
    form.validateFields().then((values) => {
      const submitData: ShiftFormInput = {
        name: values.name,
        shift_date: values.shift_date ? dayjs(values.shift_date).format("YYYY-MM-DD") : undefined,
        start_time: dayjs(values.start_time).format("HH:mm"),
        end_time: dayjs(values.end_time).format("HH:mm")
      }

      if (isEditMode && selectedShift) {
        updateMutation.mutate({ id: selectedShift.id, data: submitData })
      } else {
        createMutation.mutate(submitData)
      }
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setSelectedShift(null)
    setShiftPreset("MORNING")
    form.resetFields()
  }

  // ========== QUICK CREATE HANDLERS ==========
  const handleQuickCreateSubmit = async () => {
    if (!ensureManagePermission()) return
    try {
      const values = await quickCreateForm.validateFields()
      const [startDate, endDate] = values.date_range

      // Calculate days
      const daysDiff = endDate.diff(startDate, "day") + 1
      if (daysDiff > 7) {
        toast.error("Chỉ có thể tạo tối đa 7 ngày!", { autoClose: 2000 })
        return
      }

      setQuickCreateLoading(true)

      // Generate shifts array
      const shiftsToCreate: ShiftFormInput[] = []
      let currentDate = startDate

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
        const dateStr = currentDate.format("DD/MM/YYYY")

        // Morning shift
        if (values.create_morning) {
          shiftsToCreate.push({
            name: `Sáng - ${dateStr}`,
            shift_date: currentDate.format("YYYY-MM-DD"),
            start_time: "07:00",
            end_time: "15:00"
          })
        }

        // Evening shift
        if (values.create_evening) {
          shiftsToCreate.push({
            name: `Chiều - ${dateStr}`,
            shift_date: currentDate.format("YYYY-MM-DD"),
            start_time: "15:00",
            end_time: "23:00"
          })
        }

        currentDate = currentDate.add(1, "day")
      }

      // Check for existing shifts to avoid duplicates
      const existingShiftsMap = new Map(
        listShifts.map((shift) => {
          const key = `${shift.shift_date}_${detectShiftType(shift.start_time, shift.end_time)}`
          return [key, shift]
        })
      )

      // Filter out duplicates
      const newShifts = shiftsToCreate.filter((shift) => {
        const shiftType = shift.start_time === "07:00" ? "MORNING" : "EVENING"
        const key = `${shift.shift_date}_${shiftType}`
        return !existingShiftsMap.has(key)
      })

      if (newShifts.length === 0) {
        toast.warning("Tất cả ca đã tồn tại, không có ca mới được tạo!", { autoClose: 2500 })
        setQuickCreateLoading(false)
        return
      }

      // Create shifts sequentially
      let successCount = 0
      // eslint-disable-next-line prefer-const
      let skippedCount = shiftsToCreate.length - newShifts.length

      for (const shiftData of newShifts) {
        try {
          await shiftsAPI.create(shiftData)
          successCount++
        } catch (error: any) {
          console.error("Failed to create shift:", error)
          // Continue with next shift even if one fails
        }
      }

      // Refresh data
      await invalidateShiftRelatedQueries()

      // Show result
      if (successCount > 0) {
        toast.success(
          `✅ Tạo thành công ${successCount} ca${skippedCount > 0 ? ` (Bỏ qua ${skippedCount} ca trùng)` : ""}`,
          { autoClose: 3000 }
        )
      }

      setQuickCreateLoading(false)
      setIsQuickCreateModalOpen(false)
      quickCreateForm.resetFields()
    } catch (error: any) {
      setQuickCreateLoading(false)
      toast.error(error?.message || "Có lỗi xảy ra khi tạo ca!", { autoClose: 2000 })
    }
  }

  // ========== FILTER HANDLERS ==========
  const handleQuickFilter = (days: number) => {
    const from = dayjs()
    const to = dayjs().add(days, "day")
    const params = new URLSearchParams(window.location.search)

    params.set("shift_date_from", from.format("YYYY-MM-DD"))
    params.set("shift_date_to", to.format("YYYY-MM-DD"))

    setSelectedDateRange([from, to])

    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const daysDiff = dates[1].diff(dates[0], "day") + 1
      if (daysDiff > 7) {
        // Use toastId to prevent duplicate toasts
        toast.warning("Chỉ được chọn tối đa 7 ngày!", { 
          autoClose: 2000,
          toastId: "date-range-limit-warning"
        })
        return
      }

      setSelectedDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])

      const params = new URLSearchParams(window.location.search)
      params.set("shift_date_from", dates[0].format("YYYY-MM-DD"))
      params.set("shift_date_to", dates[1].format("YYYY-MM-DD"))

      window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
      window.dispatchEvent(new PopStateEvent("popstate"))
    } else {
      setSelectedDateRange(null)
    }
  }

  const handleFilter = () => {
    const values = filterForm.getFieldsValue()
    const params = new URLSearchParams(window.location.search)

    if (values.name) {
      params.set("name", values.name)
    } else {
      params.delete("name")
    }

    // Date range is already handled by handleDateRangeChange

    // Navigate to update URL
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const handleResetFilter = () => {
    filterForm.resetFields()
    // Reset to current week
    const from = dayjs().startOf("isoWeek")
    const to = dayjs().endOf("isoWeek")
    setSelectedDateRange([from, to])

    const params = new URLSearchParams()
    params.set("shift_date_from", from.format("YYYY-MM-DD"))
    params.set("shift_date_to", to.format("YYYY-MM-DD"))
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  // ========== TABLE COLUMNS ==========
  const baseColumns = [
    {
      title: "Ngày",
      dataIndex: "shift_date",
      key: "shift_date",
      width: 150,
      render: (date: string | null) => {
        if (!date) return <i className="text-gray-400">Không chỉ định</i>
        const dayOfWeek = dayjs(date).format("dddd")
        return (
          <div>
            <div className="font-semibold">{dayjs(date).format("DD/MM/YYYY")}</div>
            <div className="text-xs text-gray-500">{dayOfWeek}</div>
          </div>
        )
      }
    },
    {
      title: "Tên ca",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Shift) => {
        const shiftType = detectShiftType(record.start_time, record.end_time)
        const preset = SHIFT_PRESETS[shiftType]
        const Icon = preset.icon

        return (
          <div className="flex items-center gap-2">
            <Icon size={18} style={{ color: preset.color }} />
            <span className="font-medium">{text}</span>
            <Tag color={shiftType === "MORNING" ? "blue" : shiftType === "EVENING" ? "orange" : "green"}>
              {preset.label}
            </Tag>
          </div>
        )
      }
    },
    {
      title: "Khung giờ",
      key: "timeRange",
      width: 180,
      render: (_: any, record: Shift) => {
        const start = record.start_time?.slice(0, 5) || "N/A"
        const end = record.end_time?.slice(0, 5) || "N/A"
        const shiftType = detectShiftType(record.start_time, record.end_time)
        const color = SHIFT_PRESETS[shiftType].color

        return (
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color }} />
            <span className="font-mono font-semibold" style={{ color }}>
              {start} - {end}
            </span>
          </div>
        )
      }
    },
    {
      title: "Số nhân viên",
      key: "employeeCount",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Shift) => {
        const count = (record as any).employee_assignments?.length || 0
        return <Badge count={count} showZero style={{ backgroundColor: count > 0 ? "#52c41a" : "#d9d9d9" }} />
      }
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center" as const,
      render: (_: any, record: Shift) => (
        <div className="flex gap-2 justify-center">
          <Button
            type="link"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
            disabled={!canManageShifts}
          ></Button>
          <Button
            type="link"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(record)}
            disabled={!canManageShifts}
          />
        </div>
      )
    }
  ]

  const columns = isLimitedView ? baseColumns.filter((c) => c.key !== "employeeCount") : baseColumns

  if (!canViewShifts) {
    return null
  }

  // ========== RENDER ==========
  return (
    <div>
      {/* Header & Actions */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Lịch làm việc Nhà hàng</h3>
          <p className="text-gray-500 text-sm">
            Quản lý ca sáng (7h-15h) và ca tối (15h-23h) - Chỉ chọn tối đa 7 ngày liên tiếp
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="default"
            icon={<Zap size={18} />}
            onClick={handleQuickCreate}
            size="large"
            className="text-white border-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition-all duration-200 !text-white !bg-gradient-to-r !from-purple-500 !to-pink-500"
            disabled={!canManageShifts}
          >
            Tạo nhanh nhiều ca
          </Button>
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={handleCreate}
            size="large"
            disabled={!canManageShifts}
          >
            Thêm ca mới
          </Button>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="mb-3 flex gap-2">
        <Button type="default" icon={<Calendar size={16} />} onClick={() => handleQuickFilter(7)}>
          7 ngày tới
        </Button>
        <Button type="default" icon={<Calendar size={16} />} onClick={() => handleQuickFilter(30)}>
          30 ngày tới
        </Button>
        <Button type="default" icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
          Tuần này
        </Button>
      </div>

      {/* Filter Form */}
      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
        <Form form={filterForm} layout="inline" className="flex flex-wrap gap-3">
          <Form.Item name="name" className="mb-0">
            <Input placeholder="Tên ca..." className="w-48" />
          </Form.Item>

          <Form.Item className="mb-0">
            <RangePicker
              value={selectedDateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              className="w-72"
              size="large"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" icon={<Filter size={16} />} onClick={handleFilter}>
              Lọc
            </Button>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
              Reset
            </Button>
          </Form.Item>
        </Form>

        {/* Current Filter Info */}
        <div className="mt-3 text-sm text-gray-600">
          📅 Đang hiển thị:{" "}
          <span className="font-semibold">
            {selectedDateRange
              ? `${selectedDateRange[0].format("DD/MM/YYYY")} đến ${selectedDateRange[1].format("DD/MM/YYYY")}`
              : "Tất cả"}
          </span>{" "}
          ({filteredShifts.length} ca)
        </div>
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
            dataSource={filteredShifts}
            pagination={
              isLimitedView
                ? false
                : {
                    current: parseInt(queryConfig.page as string) || 1,
                    total: paginated?.total,
                    pageSize: parseInt(queryConfig.per_page as string) || 15,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} ca`,
                    onChange: (page, pageSize) => {
                      const params = new URLSearchParams(window.location.search)
                      params.set("page", page.toString())
                      params.set("per_page", pageSize.toString())
                      window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
                      window.dispatchEvent(new PopStateEvent("popstate"))
                    }
                  }
            }
            scroll={{
              y: "calc(100vh - 500px)",
              x: true
            }}
            bordered
          />
        </Fragment>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Clock size={20} />
            {isEditMode ? "Chỉnh sửa Ca làm việc" : "Thêm Ca làm việc mới"}
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseModal}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!canManageShifts}
            >
              {isEditMode ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        }
        width={700}
      >
        <Form form={form} layout="vertical" className="mt-4">
          {/* Shift Type Quick Select */}
          <Form.Item label="Loại ca (Chọn nhanh)">
            <Radio.Group
              value={shiftPreset}
              onChange={(e) => handleShiftPresetChange(e.target.value)}
              className="w-full"
            >
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SHIFT_PRESETS).map(([key, preset]) => {
                  const Icon = preset.icon
                  return (
                    <Radio.Button
                      key={key}
                      value={key}
                      className="h-auto text-center"
                      style={{
                        borderColor: shiftPreset === key ? preset.color : undefined,
                        color: shiftPreset === key ? preset.color : undefined
                      }}
                    >
                      <div className="py-2">
                        <Icon size={24} className="mx-auto mb-1" />
                        <div className="font-semibold">{preset.label}</div>
                        {preset.start && (
                          <div className="text-xs text-gray-500">
                            {preset.start} - {preset.end}
                          </div>
                        )}
                      </div>
                    </Radio.Button>
                  )
                })}
              </div>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên ca"
            rules={[
              { required: true, message: "Vui lòng nhập tên ca!" },
              { min: 2, message: "Tên ca phải có ít nhất 2 ký tự" }
            ]}
          >
            <Input placeholder="VD: Ca sáng chủ nhật, Ca tối thứ 7..." size="large" />
          </Form.Item>

          <Form.Item name="shift_date" label="Ngày" rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY (dddd)" placeholder="Chọn ngày" size="large" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="start_time"
              label="Giờ bắt đầu"
              rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu!" }]}
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                placeholder="Chọn giờ"
                minuteStep={15}
                size="large"
                disabled={shiftPreset !== "CUSTOM"}
              />
            </Form.Item>

            <Form.Item
              name="end_time"
              label="Giờ kết thúc"
              rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc!" }]}
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                placeholder="Chọn giờ"
                minuteStep={15}
                size="large"
                disabled={shiftPreset !== "CUSTOM"}
              />
            </Form.Item>
          </div>

          {shiftPreset !== "CUSTOM" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
              💡 <strong>Mẹo:</strong> Chọn `Tùy chỉnh` nếu bạn muốn thay đổi khung giờ cho ca đặc biệt
            </div>
          )}
        </Form>
      </Modal>

      {/* Quick Create Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-purple-500" />
            <span>Tạo nhanh nhiều ca làm việc</span>
          </div>
        }
        open={isQuickCreateModalOpen}
        onCancel={() => {
          setIsQuickCreateModalOpen(false)
          quickCreateForm.resetFields()
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsQuickCreateModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleQuickCreateSubmit}
              loading={quickCreateLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 border-0"
              disabled={!canManageShifts}
            >
              Tạo ca
            </Button>
          </div>
        }
        width={600}
      >
        <Form form={quickCreateForm} layout="vertical" className="mt-4">
          <Form.Item
            name="date_range"
            label="Khoảng thời gian"
            rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian!" }]}
          >
            <RangePicker
              className="w-full"
              format="DD/MM/YYYY"
              size="large"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Form.Item shouldUpdate noStyle>
              {() => {
                const isChecked = quickCreateForm.getFieldValue("create_morning") ?? true
                return (
                  <Form.Item name="create_morning" valuePropName="checked" initialValue={true} noStyle>
                    <button
                      className={`
                        border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer
                        ${
                          isChecked
                            ? "border-blue-500 bg-blue-100 shadow-lg scale-[1.02] ring-2 ring-blue-200"
                            : "border-blue-200 bg-blue-50 hover:border-blue-400 hover:shadow-md hover:scale-[1.01]"
                        }
                      `}
                      onClick={() => quickCreateForm.setFieldValue("create_morning", !isChecked)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation()
                          quickCreateForm.setFieldValue("create_morning", e.target.checked)
                        }}
                      >
                        <div className="flex items-center gap-2 ml-2">
                          <Sun size={22} className="text-blue-600" />
                          <div>
                            <div className="font-semibold text-blue-900">Ca sáng</div>
                            <div className="text-xs text-blue-600 font-medium">7:00 - 15:00</div>
                          </div>
                        </div>
                      </Checkbox>
                    </button>
                  </Form.Item>
                )
              }}
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {() => {
                const isChecked = quickCreateForm.getFieldValue("create_evening") ?? true
                return (
                  <Form.Item name="create_evening" valuePropName="checked" initialValue={true} noStyle>
                    <button
                      className={`
                        border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer
                        ${
                          isChecked
                            ? "border-orange-500 bg-orange-100 shadow-lg scale-[1.02] ring-2 ring-orange-200"
                            : "border-orange-200 bg-orange-50 hover:border-orange-400 hover:shadow-md hover:scale-[1.01]"
                        }
                      `}
                      onClick={() => quickCreateForm.setFieldValue("create_evening", !isChecked)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation()
                          quickCreateForm.setFieldValue("create_evening", e.target.checked)
                        }}
                      >
                        <div className="flex items-center gap-2 ml-2">
                          <Moon size={22} className="text-orange-600" />
                          <div>
                            <div className="font-semibold text-orange-900">Ca tối</div>
                            <div className="text-xs text-orange-600 font-medium">15:00 - 23:00</div>
                          </div>
                        </div>
                      </Checkbox>
                    </button>
                  </Form.Item>
                )
              }}
            </Form.Item>
          </div>

          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.create_morning !== currentValues.create_morning ||
              prevValues.create_evening !== currentValues.create_evening ||
              prevValues.date_range !== currentValues.date_range
            }
          >
            {({ getFieldValue }) => {
              const dateRange = getFieldValue("date_range")
              const createMorning = getFieldValue("create_morning")
              const createEvening = getFieldValue("create_evening")

              if (!dateRange || !dateRange[0] || !dateRange[1]) return null

              const daysDiff = dateRange[1].diff(dateRange[0], "day") + 1
              const shiftsPerDay = (createMorning ? 1 : 0) + (createEvening ? 1 : 0)
              const totalShifts = daysDiff * shiftsPerDay

              if (totalShifts === 0) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-700">
                    ⚠️ Vui lòng chọn ít nhất 1 loại ca (Sáng hoặc Chiều)
                  </div>
                )
              }

              return (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                  📊 <strong>Dự kiến tạo:</strong> {totalShifts} ca ({daysDiff} ngày × {shiftsPerDay} ca/ngày)
                </div>
              )
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
