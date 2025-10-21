import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Card,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  Spin,
  Result,
  Row,
  Col,
  Descriptions,
  Badge,
  Space,
  TimePicker,
  InputNumber,
  Alert
} from "antd"
import type { ColumnsType } from "antd/es/table"
import type { AxiosResponse } from "axios"
import dayjs from "dayjs"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { employeeShiftsAPI, shiftsAPI } from "src/Apis/Admin"
import { employeesAPI } from "src/Apis/Admin/employees.api"
import {
  EmployeeShift,
  SHIFT_STATUS,
  SHIFT_STATUS_COLORS,
  SHIFT_STATUS_LABELS,
  Shift
} from "src/Types/shift.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"
import { Calendar, Clock, Users, Plus, Trash2, CheckCircle, XCircle, Edit } from "lucide-react"
import { AppAbility, useAuthorization } from "src/Authorization"

interface AssignFormValues {
  employee_ids: string[]
  status?: number
  notes?: string
}

interface CheckFormValues {
  time: dayjs.Dayjs
  notes?: string
  overtime_hours?: number
}

type BulkMode = "check-in" | "check-out"

type CheckMutationPayload = {
  id: string
  values: CheckFormValues
  previousStatus: number
}

interface BulkCheckPayload {
  assignments: EmployeeShift[]
  mode: BulkMode
  values: CheckFormValues
}

interface EmployeeOption {
  id: string
  full_name: string
  employee_code?: string
  position?: string
}

export default function ShiftAssignmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const shiftId = id || ""
  const { can } = useAuthorization()
  const canViewShifts = can(AppAbility.SHIFTS_VIEW)
  const canManageShifts = can(AppAbility.SHIFTS_MANAGE)
  const canViewEmployees = can(AppAbility.EMPLOYEES_VIEW)

  const ensureManagePermission = useCallback(() => {
    if (canManageShifts) return true
    toast.warning("Bạn không có quyền quản lý phân công ca làm việc!", { autoClose: 2000 })
    return false
  }, [canManageShifts])

  const ensureCanViewEmployees = useCallback(() => {
    if (canViewEmployees) return true
    toast.warning("Bạn không có quyền xem danh sách nhân viên", { autoClose: 2000 })
    return false
  }, [canViewEmployees])

  if (!canViewShifts) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền xem phân công ca làm việc."
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        }
      />
    )
  }

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<EmployeeShift | null>(null)

  const [assignForm] = Form.useForm<AssignFormValues>()
  const [checkInForm] = Form.useForm<CheckFormValues>()
  const [checkOutForm] = Form.useForm<CheckFormValues>()
  const [statusForm] = Form.useForm<{ status: number; notes?: string }>()
  const [bulkForm] = Form.useForm<CheckFormValues>()

  const shiftDetailQueryKey = useMemo(() => ["shift-detail", shiftId] as const, [shiftId])
  const assignmentsQueryKey = useMemo(() => ["shift-assignments", shiftId] as const, [shiftId])

  // ===== QUERIES =====
  const { data: shiftDetailData, isFetching: isFetchingShift, isError: isShiftError } = useQuery({
    queryKey: shiftDetailQueryKey,
    enabled: Boolean(shiftId) && canViewShifts,
    queryFn: () => shiftsAPI.getDetail(shiftId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  const { data: assignmentsData, isFetching: isFetchingAssignments, refetch: refetchAssignments } = useQuery({
    queryKey: assignmentsQueryKey,
    enabled: Boolean(shiftId) && canViewShifts,
    queryFn: () => {
      const controller = new AbortController()
      return employeeShiftsAPI.getList({ per_page: "999", shift_id: shiftId }, controller.signal)
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData
  })

  const { data: employeesData, isFetching: isFetchingEmployees } = useQuery({
    queryKey: ["employees-active"],
    enabled: canViewEmployees,
    queryFn: () => {
      const controller = new AbortController()
      return employeesAPI.getList({ per_page: "999", is_active: "1" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState<BulkMode | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  useEffect(() => {
    if (canManageShifts) return
    if (isAssignModalOpen) {
      setIsAssignModalOpen(false)
      assignForm.resetFields()
    }
    if (isCheckInModalOpen) {
      setIsCheckInModalOpen(false)
      setSelectedAssignment(null)
      checkInForm.resetFields()
    }
    if (isCheckOutModalOpen) {
      setIsCheckOutModalOpen(false)
      setSelectedAssignment(null)
      checkOutForm.resetFields()
    }
    if (isStatusModalOpen) {
      setIsStatusModalOpen(false)
      setSelectedAssignment(null)
      statusForm.resetFields()
    }
    if (isBulkModalOpen) {
      setIsBulkModalOpen(false)
      bulkForm.resetFields()
    }
    if (bulkMode !== null) {
      setBulkMode(null)
    }
    if (selectedAssignmentIds.length > 0) {
      setSelectedAssignmentIds([])
    }
  }, [
    canManageShifts,
    isAssignModalOpen,
    isCheckInModalOpen,
    isCheckOutModalOpen,
    isStatusModalOpen,
    isBulkModalOpen,
    bulkMode,
    selectedAssignmentIds.length,
    assignForm,
    bulkForm,
    checkInForm,
    checkOutForm,
    statusForm
  ])

  useEffect(() => {
    if (canViewEmployees) return
    if (isAssignModalOpen) {
      setIsAssignModalOpen(false)
      assignForm.resetFields()
    }
  }, [canViewEmployees, isAssignModalOpen, assignForm])

  const shift = shiftDetailData?.data?.data as Shift | undefined
  const assignmentsPaginated = assignmentsData?.data?.data as PaginatedResponse<EmployeeShift> | undefined
  const assignments = canViewShifts ? assignmentsPaginated?.data || [] : []
  const employees: EmployeeOption[] = canViewEmployees ? ((employeesData?.data?.data as any)?.data || []) : []

  const selectedAssignments = useMemo(() => {
    if (!canManageShifts) return []
    return assignments.filter((assignment) => selectedAssignmentIds.includes(assignment.id))
  }, [assignments, selectedAssignmentIds, canManageShifts])

  useEffect(() => {
    if (!canManageShifts || selectedAssignmentIds.length === 0) return
    setSelectedAssignmentIds((prev) => {
      const validIds = prev.filter((id) => assignments.some((assignment) => assignment.id === id))
      return validIds.length === prev.length ? prev : validIds
    })
  }, [assignments, selectedAssignmentIds.length, canManageShifts])

  const normalizeTimeToMinutes = useCallback((input: dayjs.Dayjs | string | null | undefined): number | null => {
    if (!input) return null
    if (dayjs.isDayjs(input)) {
      return input.hour() * 60 + input.minute()
    }

    const parsed = dayjs(input, ["HH:mm:ss", "HH:mm"], true)
    if (parsed.isValid()) {
      return parsed.hour() * 60 + parsed.minute()
    }

    const fallback = dayjs(input)
    if (fallback.isValid()) {
      return fallback.hour() * 60 + fallback.minute()
    }

    return null
  }, [])

  const computeStatusAfterCheckIn = useCallback(
    (checkTime: dayjs.Dayjs, shiftStart?: string | null): number => {
      const checkMinutes = normalizeTimeToMinutes(checkTime)
      const startMinutes = normalizeTimeToMinutes(shiftStart ?? null)

      if (checkMinutes === null || startMinutes === null) {
        return SHIFT_STATUS.PRESENT
      }

      return checkMinutes > startMinutes ? SHIFT_STATUS.LATE : SHIFT_STATUS.PRESENT
    },
    [normalizeTimeToMinutes]
  )

  const computeStatusAfterCheckOut = useCallback(
    (previousStatus: number, checkTime: dayjs.Dayjs, shiftEnd?: string | null): number => {
      const checkMinutes = normalizeTimeToMinutes(checkTime)
      const endMinutes = normalizeTimeToMinutes(shiftEnd ?? null)

      if (checkMinutes === null || endMinutes === null) {
        return previousStatus
      }

      if (checkMinutes < endMinutes) {
        return SHIFT_STATUS.EARLY_LEAVE
      }

      return previousStatus === SHIFT_STATUS.LATE ? SHIFT_STATUS.LATE : SHIFT_STATUS.PRESENT
    },
    [normalizeTimeToMinutes]
  )

  const updateAssignmentsInCache = useCallback(
    (updated: EmployeeShift | EmployeeShift[]) => {
      const updates = Array.isArray(updated) ? updated : [updated]
      if (updates.length === 0) return

      const updatesMap = new Map<string, EmployeeShift>(updates.map((item) => [item.id, item]))

      queryClient.setQueryData<
        AxiosResponse<SuccessResponse<PaginatedResponse<EmployeeShift>>> | undefined
      >(assignmentsQueryKey, (old) => {
        if (!old) return old

        const responseBody = old.data
        const paginated = responseBody?.data
        const currentList = paginated?.data

        if (!responseBody || !paginated || !currentList) {
          return old
        }

        const nextList = currentList.map((assignment) => updatesMap.get(assignment.id) ?? assignment)

        return {
          ...old,
          data: {
            ...responseBody,
            data: {
              ...paginated,
              data: nextList
            }
          }
        }
      })
    },
    [assignmentsQueryKey, queryClient]
  )

  const removeAssignmentsFromCache = useCallback(
    (ids: string | string[]) => {
      const removalIds = Array.isArray(ids) ? ids : [ids]
      if (removalIds.length === 0) return

      const removalSet = new Set(removalIds)

      queryClient.setQueryData<
        AxiosResponse<SuccessResponse<PaginatedResponse<EmployeeShift>>> | undefined
      >(assignmentsQueryKey, (old) => {
        if (!old) return old

        const responseBody = old.data
        const paginated = responseBody?.data
        const currentList = paginated?.data

        if (!responseBody || !paginated || !currentList) {
          return old
        }

        const nextList = currentList.filter((assignment) => !removalSet.has(assignment.id))
        const removedCount = currentList.length - nextList.length

        if (removedCount === 0) {
          return old
        }

        return {
          ...old,
          data: {
            ...responseBody,
            data: {
              ...paginated,
              data: nextList,
              total: Math.max(paginated.total - removedCount, nextList.length),
              to: Math.max(paginated.to - removedCount, nextList.length)
            }
          }
        }
      })
    },
    [assignmentsQueryKey, queryClient]
  )

  const availableEmployees = useMemo(() => {
    const assignedIds = new Set(assignments.map((assignment) => assignment.employee_id))
    return employees.filter((employee) => !assignedIds.has(employee.id))
  }, [assignments, employees])

  const statusSummary = useMemo(() => {
    return {
      total: assignments.length,
      scheduled: assignments.filter((item) => item.status === SHIFT_STATUS.SCHEDULED).length,
      present: assignments.filter((item) => item.status === SHIFT_STATUS.PRESENT).length,
      late: assignments.filter((item) => item.status === SHIFT_STATUS.LATE).length,
      absent: assignments.filter((item) => item.status === SHIFT_STATUS.ABSENT).length,
      earlyLeave: assignments.filter((item) => item.status === SHIFT_STATUS.EARLY_LEAVE).length
    }
  }, [assignments])

  const canBulkCheckIn = useMemo(
    () => selectedAssignments.length > 0 && selectedAssignments.every((assignment) => !assignment.check_in),
    [selectedAssignments]
  )

  const canBulkCheckOut = useMemo(
    () =>
      selectedAssignments.length > 0 &&
      selectedAssignments.every((assignment) => assignment.check_in && !assignment.check_out),
    [selectedAssignments]
  )

  const markShiftAggregatesStale = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shifts-with-assignments"], exact: false })
    queryClient.invalidateQueries({ queryKey: ["employee-shifts-stats"], exact: false })
  }, [queryClient])

  const persistStatusSilently = useCallback(async (assignmentId: string, status: number) => {
    try {
      await employeeShiftsAPI.updateStatus(assignmentId, { status })
      return true
    } catch (error) {
      console.error("Không thể đồng bộ trạng thái của nhân viên", error)
      return false
    }
  }, [])

  // ===== MUTATIONS =====

  const bulkAssignMutation = useMutation({
    mutationFn: (payload: AssignFormValues) =>
      employeeShiftsAPI.bulkAssign({
        shift_id: shiftId,
        employee_ids: payload.employee_ids,
        status: payload.status,
        notes: payload.notes
      }),
    onSuccess: async (response) => {
      const result = response.data.data
      const skippedMessage = result.total_skipped > 0 ? ` (Bỏ qua ${result.total_skipped})` : ""
      toast.success(`Đã phân công ${result.total_assigned} nhân viên${skippedMessage}`, { autoClose: 2500 })
      await refetchAssignments()
      queryClient.invalidateQueries({ queryKey: shiftDetailQueryKey })
      markShiftAggregatesStale()
      setIsAssignModalOpen(false)
      assignForm.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Phân công thất bại", { autoClose: 2500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentId: string) => employeeShiftsAPI.delete(assignmentId),
    onSuccess: async (_, assignmentId) => {
      toast.success("Đã xóa phân công", { autoClose: 2000 })
      removeAssignmentsFromCache(assignmentId)
      setSelectedAssignmentIds((prev) => prev.filter((id) => id !== assignmentId))
      queryClient.invalidateQueries({ queryKey: shiftDetailQueryKey })
      markShiftAggregatesStale()
      await refetchAssignments()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể xóa phân công", { autoClose: 2000 })
    }
  })

  const checkInMutation = useMutation({
    mutationFn: ({ id, values }: CheckMutationPayload) =>
      employeeShiftsAPI.checkIn(id, {
        check_in: dayjs(values.time).format("HH:mm:ss"),
        notes: values.notes
      }),
    onSuccess: async (response, variables) => {
      const assignment = response.data.data
      const computedStatus = computeStatusAfterCheckIn(variables.values.time, shift?.start_time)
      const updatedAssignment = { ...assignment, status: computedStatus }

      toast.success("Check-in thành công", { autoClose: 2000 })
      updateAssignmentsInCache(updatedAssignment)
      markShiftAggregatesStale()
      setIsCheckInModalOpen(false)
      setSelectedAssignment(null)
      checkInForm.resetFields()
      setSelectedAssignmentIds((prev) => prev.filter((id) => id !== assignment.id))

      if (assignment.status !== computedStatus) {
        const persisted = await persistStatusSilently(assignment.id, computedStatus)
        if (!persisted) {
          toast.error("Không thể đồng bộ trạng thái, dữ liệu sẽ được tải lại", { autoClose: 2500 })
          await refetchAssignments()
        }
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Check-in thất bại", { autoClose: 2000 })
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: ({ id, values }: CheckMutationPayload) =>
      employeeShiftsAPI.checkOut(id, {
        check_out: dayjs(values.time).format("HH:mm:ss"),
        overtime_hours: values.overtime_hours,
        notes: values.notes
      }),
    onSuccess: async (response, variables) => {
      const assignment = response.data.data
      const computedStatus = computeStatusAfterCheckOut(
        variables.previousStatus,
        variables.values.time,
        shift?.end_time
      )
      const updatedAssignment = { ...assignment, status: computedStatus }

      toast.success("Check-out thành công", { autoClose: 2000 })
      updateAssignmentsInCache(updatedAssignment)
      markShiftAggregatesStale()
      setIsCheckOutModalOpen(false)
      setSelectedAssignment(null)
      checkOutForm.resetFields()
      setSelectedAssignmentIds((prev) => prev.filter((id) => id !== assignment.id))

      if (assignment.status !== computedStatus) {
        const persisted = await persistStatusSilently(assignment.id, computedStatus)
        if (!persisted) {
          toast.error("Không thể đồng bộ trạng thái, dữ liệu sẽ được tải lại", { autoClose: 2500 })
          await refetchAssignments()
        }
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Check-out thất bại", { autoClose: 2000 })
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id: assignmentId, data }: { id: string; data: { status: number; notes?: string } }) =>
      employeeShiftsAPI.updateStatus(assignmentId, data),
    onSuccess: (response) => {
      toast.success("Cập nhật trạng thái thành công", { autoClose: 2000 })
      updateAssignmentsInCache(response.data.data)
      markShiftAggregatesStale()
      setIsStatusModalOpen(false)
      setSelectedAssignment(null)
      statusForm.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 2000 })
    }
  })

  const bulkCheckMutation = useMutation({
    mutationFn: async ({ assignments: targets, mode, values }: BulkCheckPayload) => {
      if (targets.length === 0) return [] as PromiseSettledResult<AxiosResponse<SuccessResponse<EmployeeShift>>>[]

      const requests = targets.map((assignment) =>
        mode === "check-in"
          ? employeeShiftsAPI.checkIn(assignment.id, {
              check_in: dayjs(values.time).format("HH:mm:ss"),
              notes: values.notes
            })
          : employeeShiftsAPI.checkOut(assignment.id, {
              check_out: dayjs(values.time).format("HH:mm:ss"),
              overtime_hours: values.overtime_hours,
              notes: values.notes
            })
      )

      return Promise.allSettled(requests)
    },
    onSuccess: async (results, variables) => {
      const successfulAssignments: EmployeeShift[] = []
      const statusUpdates: Array<{ id: string; status: number }> = []

      results.forEach((result, index) => {
        if (result.status !== "fulfilled") {
          return
        }

        const assignment = result.value.data.data
        const sourceAssignment = variables.assignments[index]
        const previousStatus = sourceAssignment?.status ?? assignment.status
        const computedStatus =
          variables.mode === "check-in"
            ? computeStatusAfterCheckIn(variables.values.time, shift?.start_time)
            : computeStatusAfterCheckOut(previousStatus, variables.values.time, shift?.end_time)

        successfulAssignments.push({ ...assignment, status: computedStatus })

        if (assignment.status !== computedStatus) {
          statusUpdates.push({ id: assignment.id, status: computedStatus })
        }
      })

      if (successfulAssignments.length > 0) {
        updateAssignmentsInCache(successfulAssignments)
        markShiftAggregatesStale()
        toast.success(
          `Đã ${variables.mode === "check-in" ? "check-in" : "check-out"} ${successfulAssignments.length} nhân viên`,
          { autoClose: 2200 }
        )
      }

      const failedCount = results.length - successfulAssignments.length
      if (failedCount > 0) {
        toast.warning(`${failedCount} nhân viên chưa cập nhật được, vui lòng thử lại`, { autoClose: 2600 })
      }

      if (statusUpdates.length > 0) {
        const persistResults = await Promise.all(statusUpdates.map((item) => persistStatusSilently(item.id, item.status)))
        if (persistResults.some((success) => !success)) {
          toast.error("Một số trạng thái chưa được đồng bộ, dữ liệu sẽ được tải lại", { autoClose: 2600 })
          await refetchAssignments()
        }
      }

      setIsBulkModalOpen(false)
      setBulkMode(null)
      bulkForm.resetFields()
      if (successfulAssignments.length > 0) {
        setSelectedAssignmentIds((prev) =>
          prev.filter((id) => !successfulAssignments.some((assignment) => assignment.id === id))
        )
      }
    },
    onError: () => {
      toast.error("Không thể cập nhật hàng loạt, vui lòng thử lại", { autoClose: 2600 })
    }
  })

  // ===== HANDLERS =====
  const handleOpenAssignModal = () => {
    if (!ensureManagePermission()) return
    if (!ensureCanViewEmployees()) return
    assignForm.resetFields()
    setIsAssignModalOpen(true)
  }

  const handleSubmitAssign = () => {
    if (!ensureManagePermission()) return
    if (!ensureCanViewEmployees()) return
    assignForm.validateFields().then((values: AssignFormValues) => {
      if (!ensureManagePermission()) return
      if (!ensureCanViewEmployees()) return
      if (!values.employee_ids || values.employee_ids.length === 0) {
        toast.warning("Vui lòng chọn ít nhất 1 nhân viên", { autoClose: 2000 })
        return
      }
      bulkAssignMutation.mutate(values)
    })
  }

  const handleOpenCheckInModal = (record: EmployeeShift) => {
    if (!ensureManagePermission()) return
    setSelectedAssignment(record)
    checkInForm.setFieldsValue({
      time: dayjs(),
      notes: record.notes || undefined
    })
    setIsCheckInModalOpen(true)
  }

  const handleSubmitCheckIn = () => {
    if (!ensureManagePermission()) return
    if (!selectedAssignment) return
    checkInForm.validateFields().then((values: CheckFormValues) => {
      if (!ensureManagePermission()) return
      checkInMutation.mutate({
        id: selectedAssignment.id,
        values,
        previousStatus: selectedAssignment.status
      })
    })
  }

  const handleOpenCheckOutModal = (record: EmployeeShift) => {
    if (!ensureManagePermission()) return
    setSelectedAssignment(record)
    checkOutForm.setFieldsValue({
      time: dayjs(),
      overtime_hours: record.overtime_hours || undefined,
      notes: record.notes || undefined
    })
    setIsCheckOutModalOpen(true)
  }

  const handleSubmitCheckOut = () => {
    if (!ensureManagePermission()) return
    if (!selectedAssignment) return
    checkOutForm.validateFields().then((values: CheckFormValues) => {
      if (!ensureManagePermission()) return
      checkOutMutation.mutate({
        id: selectedAssignment.id,
        values,
        previousStatus: selectedAssignment.status
      })
    })
  }

  const handleOpenStatusModal = (record: EmployeeShift) => {
    if (!ensureManagePermission()) return
    setSelectedAssignment(record)
    statusForm.setFieldsValue({
      status: record.status,
      notes: record.notes || undefined
    })
    setIsStatusModalOpen(true)
  }

  const handleSubmitStatus = () => {
    if (!ensureManagePermission()) return
    if (!selectedAssignment) return
    statusForm.validateFields().then((values: { status: number; notes?: string }) => {
      if (!ensureManagePermission()) return
      updateStatusMutation.mutate({ id: selectedAssignment.id, data: values })
    })
  }

  const handleOpenBulkModal = (mode: BulkMode) => {
    if (!ensureManagePermission()) return
    if (selectedAssignments.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 nhân viên", { autoClose: 2000 })
      return
    }

    if (mode === "check-in" && !canBulkCheckIn) {
      toast.warning("Chỉ có thể check-in hàng loạt cho các nhân viên chưa check-in", { autoClose: 2200 })
      return
    }

    if (mode === "check-out" && !canBulkCheckOut) {
      toast.warning("Chỉ có thể check-out hàng loạt cho nhân viên đã check-in và chưa check-out", { autoClose: 2200 })
      return
    }

    setBulkMode(mode)
    bulkForm.resetFields()
    const defaults: CheckFormValues = {
      time: dayjs(),
      notes: undefined,
      overtime_hours: mode === "check-out" ? undefined : undefined
    }
    bulkForm.setFieldsValue(defaults)
    setIsBulkModalOpen(true)
  }

  const handleSubmitBulk = () => {
    if (!ensureManagePermission()) return
    if (!bulkMode) return
    if (selectedAssignments.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 nhân viên", { autoClose: 2000 })
      setIsBulkModalOpen(false)
      setBulkMode(null)
      return
    }

    if (bulkMode === "check-in" && !canBulkCheckIn) {
      toast.warning("Một số nhân viên đã check-in, không thể thực hiện hàng loạt", { autoClose: 2200 })
      setIsBulkModalOpen(false)
      setBulkMode(null)
      return
    }

    if (bulkMode === "check-out" && !canBulkCheckOut) {
      toast.warning("Chỉ thực hiện check-out hàng loạt cho nhân viên đã check-in và chưa check-out", { autoClose: 2200 })
      setIsBulkModalOpen(false)
      setBulkMode(null)
      return
    }

    bulkForm
      .validateFields()
      .then((values: CheckFormValues) => {
        if (!ensureManagePermission()) return
        bulkCheckMutation.mutate({ assignments: selectedAssignments, mode: bulkMode, values })
      })
      .catch(() => null)
  }

  const handleDeleteAssignment = (record: EmployeeShift) => {
    if (!ensureManagePermission()) return
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Xóa phân công của nhân viên "${record.employee?.full_name || "N/A"}" khỏi ca "${shift?.name || ""}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        if (!ensureManagePermission()) return
        deleteMutation.mutate(record.id)
      }
    })
  }

  const baseColumns: ColumnsType<EmployeeShift> = [
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
      title: "Check-in",
      dataIndex: "check_in",
      key: "check_in",
      render: (value: string | null) =>
        value ? <span className="text-green-600 font-medium">{dayjs(value).format("HH:mm")}</span> : <span className="text-gray-400">Chưa</span>
    },
    {
      title: "Check-out",
      dataIndex: "check_out",
      key: "check_out",
      render: (value: string | null) =>
        value ? <span className="text-red-500 font-medium">{dayjs(value).format("HH:mm")}</span> : <span className="text-gray-400">Chưa</span>
    },
    {
      title: "Tăng ca (h)",
      dataIndex: "overtime_hours",
      key: "overtime_hours",
      render: (value: number | null) => (value ? <span className="font-semibold">{value}h</span> : <span className="text-gray-400">-</span>)
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      render: (value: string | null) => (value ? value : <span className="text-gray-400">-</span>)
    }
  ]

  const columns: ColumnsType<EmployeeShift> = canManageShifts
    ? [
        ...baseColumns,
        {
          title: "Thao tác",
          key: "actions",
          render: (_: unknown, record) => (
            <Space size="small" wrap>
              {!record.check_in && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircle size={14} />}
                  onClick={() => handleOpenCheckInModal(record)}
                  loading={checkInMutation.isPending && selectedAssignment?.id === record.id}
                  disabled={!canManageShifts}
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
                  loading={checkOutMutation.isPending && selectedAssignment?.id === record.id}
                  disabled={!canManageShifts}
                >
                  Check-out
                </Button>
              )}
              <Button
                size="small"
                icon={<Edit size={14} />}
                onClick={() => handleOpenStatusModal(record)}
                loading={updateStatusMutation.isPending && selectedAssignment?.id === record.id}
                disabled={!canManageShifts}
              >
                Trạng thái
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => handleDeleteAssignment(record)}
                loading={deleteMutation.isPending}
                disabled={!canManageShifts}
              />
            </Space>
          )
        }
      ]
    : baseColumns

  const pageTitle = shift ? `Chi tiết phân công - ${shift.name}` : "Chi tiết phân công"

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <NavigateBack />

      {isFetchingShift ? (
        <div className="flex justify-center py-20">
          <Spin size="large" tip="Đang tải thông tin ca làm việc..." />
        </div>
      ) : isShiftError || !shift ? (
        <Result
          status="404"
          title="Không tìm thấy ca làm việc"
          subTitle="Ca làm việc bạn yêu cầu không tồn tại hoặc đã bị xóa."
          extra={
            <Button type="primary" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          }
        />
      ) : (
        <>
          <Card className="shadow-md">
            <Row gutter={16} align="middle">
              <Col xs={24} md={18}>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge count={statusSummary.total} showZero color="#1677ff">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={24} className="text-blue-600" />
                        {shift.name}
                      </h2>
                    </div>
                  </Badge>
                </div>
                <Descriptions column={1} size="small" className="mt-3">
                  <Descriptions.Item label="Ngày">
                    {shift.shift_date ? dayjs(shift.shift_date).format("DD/MM/YYYY (dddd)") : "Chưa cập nhật"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian">
                    <span className="flex items-center gap-2 text-gray-700">
                      <Clock size={14} />
                      {`${shift.start_time?.slice(0, 5)} - ${shift.end_time?.slice(0, 5)}`}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng nhân viên">
                    <span className="font-semibold text-gray-800">{statusSummary.total}</span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={handleOpenAssignModal}
                    disabled={
                      !canManageShifts ||
                      !canViewEmployees ||
                      (!isFetchingEmployees && availableEmployees.length === 0)
                    }
                  >
                    Thêm phân công
                  </Button>
                  <Button
                    icon={<CheckCircle size={16} />}
                    onClick={() => handleOpenBulkModal("check-in")}
                    disabled={!canManageShifts || !canBulkCheckIn || bulkCheckMutation.isPending}
                    loading={bulkCheckMutation.isPending && bulkMode === "check-in"}
                  >
                    Check-in hàng loạt
                  </Button>
                  <Button
                    icon={<XCircle size={16} />}
                    danger
                    onClick={() => handleOpenBulkModal("check-out")}
                    disabled={!canManageShifts || !canBulkCheckOut || bulkCheckMutation.isPending}
                    loading={bulkCheckMutation.isPending && bulkMode === "check-out"}
                  >
                    Check-out hàng loạt
                  </Button>
                  <Button onClick={() => navigate(-1)}>Quay lại danh sách</Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6} md={6} lg={4} xl={4}>
              <Card className="border-l-4 border-blue-500 shadow-sm">
                <div className="text-sm text-gray-500">Đã lên lịch</div>
                <div className="text-2xl font-bold text-blue-600">{statusSummary.scheduled}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={4} xl={4}>
              <Card className="border-l-4 border-green-500 shadow-sm">
                <div className="text-sm text-gray-500">Đúng giờ</div>
                <div className="text-2xl font-bold text-green-600">{statusSummary.present}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={4} xl={4}>
              <Card className="border-l-4 border-orange-500 shadow-sm">
                <div className="text-sm text-gray-500">Đi muộn</div>
                <div className="text-2xl font-bold text-orange-500">{statusSummary.late}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={4} xl={4}>
              <Card className="border-l-4 border-red-500 shadow-sm">
                <div className="text-sm text-gray-500">Vắng mặt</div>
                <div className="text-2xl font-bold text-red-500">{statusSummary.absent}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={4} xl={4}>
              <Card className="border-l-4 border-cyan-500 shadow-sm">
                <div className="text-sm text-gray-500">Về sớm</div>
                <div className="text-2xl font-bold text-cyan-600">{statusSummary.earlyLeave}</div>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Danh sách nhân viên trong ca
              </h3>
              <div className="text-sm text-gray-500">
                {statusSummary.total} nhân viên | {statusSummary.present} đã check-in
              </div>
            </div>

            {selectedAssignments.length > 0 && canManageShifts && (
              <div className="mb-3 text-sm text-blue-600">
                Đã chọn {selectedAssignments.length} nhân viên để thao tác nhanh.
                {!canBulkCheckIn && (
                  <span className="block text-xs text-orange-500">
                    Một số nhân viên đã check-in, không thể check-in hàng loạt.
                  </span>
                )}
                {!canBulkCheckOut && (
                  <span className="block text-xs text-orange-500">
                    Chỉ nhân viên đã check-in và chưa check-out mới có thể check-out hàng loạt.
                  </span>
                )}
              </div>
            )}

            <Table
              rowKey="id"
              columns={columns}
              dataSource={assignments}
              loading={isFetchingAssignments}
              rowSelection={
                canManageShifts
                  ? {
                      selectedRowKeys: selectedAssignmentIds,
                      onChange: (keys) => setSelectedAssignmentIds(keys as string[]),
                      preserveSelectedRowKeys: true
                    }
                  : undefined
              }
              pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
              locale={{
                emptyText: (
                  <div className="py-6">
                    <Alert
                      type="info"
                      message="Chưa có phân công cho ca này"
                      description={'Nhấn "Thêm phân công" để lựa chọn nhân viên phù hợp cho ca làm việc.'}
                      showIcon
                    />
                  </div>
                )
              }}
            />
          </Card>

          {/* ========== ASSIGN MODAL ========== */}
          <Modal
            title="Thêm nhân viên vào ca"
            open={isAssignModalOpen}
            onCancel={() => setIsAssignModalOpen(false)}
            confirmLoading={bulkAssignMutation.isPending}
            onOk={handleSubmitAssign}
            okText="Phân công"
            cancelText="Hủy"
            destroyOnClose
            okButtonProps={{
              disabled:
                !canManageShifts ||
                !canViewEmployees ||
                (!isFetchingEmployees && availableEmployees.length === 0)
            }}
          >
            {!canViewEmployees ? (
              <Alert
                type="warning"
                showIcon
                message="Bạn không có quyền xem danh sách nhân viên"
                description="Vui lòng liên hệ quản trị viên để được cấp quyền trước khi phân công."
              />
            ) : (
              <Form form={assignForm} layout="vertical" preserve={false}>
                <Form.Item
                  name="employee_ids"
                  label="Chọn nhân viên"
                  rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 nhân viên" }]}
                >
                  <Select
                    mode="multiple"
                    placeholder={isFetchingEmployees ? "Đang tải nhân viên..." : "Chọn nhân viên"}
                    options={availableEmployees.map((employee) => ({
                      label: `${employee.full_name}${employee.employee_code ? ` (${employee.employee_code})` : ""}`,
                      value: employee.id
                    }))}
                    disabled={isFetchingEmployees || availableEmployees.length === 0}
                    optionFilterProp="label"
                    loading={isFetchingEmployees}
                    showSearch
                  />
                </Form.Item>

                {availableEmployees.length === 0 && !isFetchingEmployees && (
                  <Alert
                    type="info"
                    showIcon
                    message="Tất cả nhân viên đã được phân vào ca này"
                    description="Hãy xóa phân công hiện tại hoặc kích hoạt thêm nhân viên để phân công mới."
                    className="mb-3"
                  />
                )}

                <Form.Item name="status" label="Trạng thái ban đầu" initialValue={SHIFT_STATUS.SCHEDULED}>
                  <Select>
                    {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
                      <Select.Option key={key} value={parseInt(key)}>
                        <Tag color={SHIFT_STATUS_COLORS[parseInt(key) as keyof typeof SHIFT_STATUS_COLORS]}>
                          {label}
                        </Tag>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="notes" label="Ghi chú">
                  <Input.TextArea rows={3} placeholder="Ghi chú (nếu có)..." />
                </Form.Item>
              </Form>
            )}
          </Modal>

          {/* ========== CHECK-IN MODAL ========== */}
          <Modal
            title="Check-in nhân viên"
            open={isCheckInModalOpen}
            onCancel={() => {
              setIsCheckInModalOpen(false)
              setSelectedAssignment(null)
            }}
            onOk={handleSubmitCheckIn}
            confirmLoading={checkInMutation.isPending}
            okText="Xác nhận"
            cancelText="Hủy"
            okButtonProps={{ disabled: !canManageShifts }}
          >
            {selectedAssignment && (
              <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4 text-sm">
                <div><strong>Nhân viên:</strong> {selectedAssignment.employee?.full_name || "N/A"}</div>
                <div><strong>Ca:</strong> {shift.name}</div>
                <div>
                  <strong>Ngày:</strong> {shift.shift_date ? dayjs(shift.shift_date).format("DD/MM/YYYY") : "-"}
                </div>
              </div>
            )}
            <Form form={checkInForm} layout="vertical">
              <Form.Item
                name="time"
                label="Giờ check-in"
                rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
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
            title="Check-out nhân viên"
            open={isCheckOutModalOpen}
            onCancel={() => {
              setIsCheckOutModalOpen(false)
              setSelectedAssignment(null)
            }}
            onOk={handleSubmitCheckOut}
            confirmLoading={checkOutMutation.isPending}
            okText="Xác nhận"
            cancelText="Hủy"
            okButtonProps={{ disabled: !canManageShifts }}
          >
            {selectedAssignment && (
              <div className="bg-orange-50 border border-orange-100 rounded p-3 mb-4 text-sm">
                <div><strong>Nhân viên:</strong> {selectedAssignment.employee?.full_name || "N/A"}</div>
                <div><strong>Check-in:</strong> {selectedAssignment.check_in ? dayjs(selectedAssignment.check_in).format("HH:mm") : "-"}</div>
              </div>
            )}
            <Form form={checkOutForm} layout="vertical">
              <Form.Item
                name="time"
                label="Giờ check-out"
                rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
              >
                <TimePicker className="w-full" format="HH:mm" placeholder="Chọn giờ" />
              </Form.Item>
              <Form.Item name="overtime_hours" label="Số giờ tăng ca">
                <InputNumber className="w-full" min={0} max={12} step={0.5} placeholder="VD: 1.5" />
              </Form.Item>
              <Form.Item name="notes" label="Ghi chú">
                <Input.TextArea rows={2} placeholder="Ghi chú (nếu có)..." />
              </Form.Item>
            </Form>
          </Modal>

          {/* ========== STATUS MODAL ========== */}
          <Modal
            title="Cập nhật trạng thái"
            open={isStatusModalOpen}
            onCancel={() => {
              setIsStatusModalOpen(false)
              setSelectedAssignment(null)
            }}
            onOk={handleSubmitStatus}
            confirmLoading={updateStatusMutation.isPending}
            okText="Cập nhật"
            cancelText="Hủy"
            okButtonProps={{ disabled: !canManageShifts }}
          >
            {selectedAssignment && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-sm">
                <div><strong>Nhân viên:</strong> {selectedAssignment.employee?.full_name || "N/A"}</div>
                <div><strong>Ca:</strong> {shift.name}</div>
              </div>
            )}
            <Form form={statusForm} layout="vertical">
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select>
                  {Object.entries(SHIFT_STATUS_LABELS).map(([key, label]) => (
                    <Select.Option key={key} value={parseInt(key)}>
                      <Tag color={SHIFT_STATUS_COLORS[parseInt(key) as keyof typeof SHIFT_STATUS_COLORS]}>
                        {label}
                      </Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="notes" label="Ghi chú">
                <Input.TextArea rows={3} placeholder="Ghi chú (nếu có)..." />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={bulkMode === "check-in" ? "Check-in hàng loạt" : "Check-out hàng loạt"}
            open={isBulkModalOpen}
            onCancel={() => {
              setIsBulkModalOpen(false)
              setBulkMode(null)
              bulkForm.resetFields()
            }}
            onOk={handleSubmitBulk}
            okText={bulkMode === "check-in" ? "Check-in" : "Check-out"}
            cancelText="Hủy"
            confirmLoading={bulkCheckMutation.isPending}
            destroyOnClose
            okButtonProps={{ disabled: !canManageShifts }}
          >
            <Alert
              type="info"
              showIcon
              className="mb-3"
              message={`${selectedAssignments.length} nhân viên sẽ được ${bulkMode === "check-in" ? "check-in" : "check-out"}`}
              description="Các thông tin dưới đây sẽ áp dụng cho tất cả nhân viên đã chọn."
            />
            <Form form={bulkForm} layout="vertical">
              <Form.Item
                name="time"
                label="Thời gian"
                rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
              >
                <TimePicker className="w-full" format="HH:mm" placeholder="Chọn giờ" />
              </Form.Item>
              {bulkMode === "check-out" && (
                <Form.Item name="overtime_hours" label="Số giờ tăng ca">
                  <InputNumber className="w-full" min={0} max={12} step={0.5} placeholder="VD: 1.5" />
                </Form.Item>
              )}
              <Form.Item name="notes" label="Ghi chú chung">
                <Input.TextArea rows={3} placeholder="Ghi chú áp dụng cho tất cả nhân viên..." />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  )
}
