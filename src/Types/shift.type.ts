// ========== SHIFT TYPES ==========
export type Shift = {
  id: string
  name: string
  shift_date: string | null
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

export type ShiftFormInput = {
  name: string
  shift_date?: string
  start_time: string
  end_time: string
}

export type queryParamConfigShift = {
  page?: string
  per_page?: string
  name?: string
  shift_date?: string
  shift_date_from?: string
  shift_date_to?: string
  start_time_from?: string
  start_time_to?: string
  end_time_from?: string
  end_time_to?: string
}

// ========== EMPLOYEE SHIFT TYPES ==========
export type EmployeeShift = {
  id: string
  status: number
  check_in: string | null  // Backend trả về ISO DateTime, không phải check_in_time
  check_out: string | null  // Backend trả về ISO DateTime, không phải check_out_time
  overtime_hours: number | null
  notes: string | null
  employee_id: string
  shift_id: string
  created_at: string
  updated_at: string
  status_label: string
  employee?: {
    id: string
    full_name: string
    phone: string | null
    gender: string | null
    address: string | null
    bank_account: string | null
    contract_type: number
    base_salary: string
    hire_date: string | null
    is_active: boolean
    user_id: string
    created_at: string
    updated_at: string
    contract_label: string
  }
  shift?: {
    id: string
    name: string
    shift_date: string  // Backend trả về ISO DateTime
    start_time: string
    end_time: string
    created_at: string
    updated_at: string
  }
}

export type EmployeeShiftFormInput = {
  employee_id: string
  shift_id: string
  shift_date: string
  notes?: string
}

export type EmployeeShiftCheckIn = {
  check_in_time?: string
  notes?: string
}

export type EmployeeShiftCheckOut = {
  check_out_time?: string
  overtime_hours?: number
  notes?: string
}

export type EmployeeShiftStatusUpdate = {
  status: number
  notes?: string
}

export type queryParamConfigEmployeeShift = {
  page?: string
  per_page?: string
  employee_id?: string
  shift_id?: string
  status?: string
  shift_date?: string
  shift_date_from?: string
  shift_date_to?: string
  date_from?: string
  date_to?: string
}

// ========== CALENDAR EVENT TYPE ==========
export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource: EmployeeShift
}

// ========== STATUS ENUM ==========
export const SHIFT_STATUS = {
  SCHEDULED: 0,
  PRESENT: 1,
  LATE: 2,
  ABSENT: 3,
  EARLY_LEAVE: 4
} as const

export const SHIFT_STATUS_LABELS = {
  [SHIFT_STATUS.SCHEDULED]: "Đã lên lịch",
  [SHIFT_STATUS.PRESENT]: "Có mặt",
  [SHIFT_STATUS.LATE]: "Đi muộn",
  [SHIFT_STATUS.ABSENT]: "Vắng mặt",
  [SHIFT_STATUS.EARLY_LEAVE]: "Về sớm"
} as const

export const SHIFT_STATUS_COLORS = {
  [SHIFT_STATUS.SCHEDULED]: "#8c8c8c",
  [SHIFT_STATUS.PRESENT]: "#52c41a",
  [SHIFT_STATUS.LATE]: "#faad14",
  [SHIFT_STATUS.ABSENT]: "#ff4d4f",
  [SHIFT_STATUS.EARLY_LEAVE]: "#1890ff"
} as const
