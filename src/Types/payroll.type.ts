// ========== PAYROLL TYPES ==========

export interface Employee {
  id: string
  full_name: string
  phone: string | null
  gender: number | null
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

export interface PayrollItem {
  id: string
  payroll_id: string
  item_type: number // 0=earning, 1=deduction
  code: string
  description: string
  amount: string
  signed_amount: string // amount with +/- sign
  created_at: string
  updated_at: string
}

export interface Payroll {
  id: string
  month: number
  year: number
  base_salary: string
  bonus: string
  deductions: string
  final_salary: string
  status: number // 0=Draft, 1=Paid
  payment_method: number // 0=Cash, 1=Bank Transfer, 3=E-Wallet
  payment_ref: string | null
  paid_at: string | null
  notes: string | null
  paid_by: string | null
  employee_id: string
  created_at: string
  updated_at: string
  status_label: string
  payment_method_label: string
  employee: Employee
  paid_by_employee: Employee | null
  items?: PayrollItem[]
}

// ========== FORM INPUT TYPES ==========

export interface PayrollFormInput {
  base_salary?: number
  bonus?: number
  deductions?: number
  notes?: string
}

export interface PayrollItemFormInput {
  payroll_id: string
  item_type: number // 0=earning, 1=deduction
  code: string
  description: string
  amount: number
}

export interface GeneratePayrollInput {
  month: number
  year: number
}

export interface UpdateStatusInput {
  status: number
  notes?: string
}

export interface MarkAsPaidInput {
  payment_method: number
  payment_ref?: string
  notes?: string
}

// ========== QUERY PARAMS ==========

export type queryParamConfigPayroll = {
  page?: string
  per_page?: string
  employee_id?: string
  status?: string
  month?: string
  year?: string
}

export type queryParamConfigPayrollItem = {
  page?: string
  per_page?: string
  payroll_id?: string
  item_type?: string
  code?: string
}

// ========== CONSTANTS ==========

export const PAYROLL_STATUS = {
  DRAFT: 0,
  PAID: 1
} as const

export const PAYROLL_STATUS_LABELS: Record<number, string> = {
  0: "Nháp",
  1: "Đã thanh toán"
}

export const PAYROLL_STATUS_COLORS: Record<number, string> = {
  0: "orange",
  1: "green"
}

export const PAYMENT_METHOD = {
  CASH: 0,
  BANK_TRANSFER: 1,
  E_WALLET: 3
} as const

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  0: "Tiền mặt",
  1: "Chuyển khoản",
  3: "Ví điện tử"
}

export const ITEM_TYPE = {
  EARNING: 0,
  DEDUCTION: 1
} as const

export const ITEM_TYPE_LABELS: Record<number, string> = {
  0: "Thu nhập",
  1: "Khấu trừ"
}

export const ITEM_TYPE_COLORS: Record<number, string> = {
  0: "green",
  1: "red"
}

// Common payroll item codes
export const COMMON_ITEM_CODES = {
  OVERTIME: "OVERTIME",
  PERFORMANCE: "PERFORMANCE",
  BONUS: "BONUS",
  ALLOWANCE: "ALLOWANCE",
  TAX: "TAX",
  INSURANCE: "INSURANCE",
  UNIFORM: "UNIFORM",
  LATE_PENALTY: "LATE_PENALTY"
}

export const COMMON_ITEM_DESCRIPTIONS: Record<string, string> = {
  OVERTIME: "Làm thêm giờ",
  PERFORMANCE: "Thưởng hiệu suất",
  BONUS: "Thưởng",
  ALLOWANCE: "Phụ cấp",
  TAX: "Thuế thu nhập",
  INSURANCE: "Bảo hiểm",
  UNIFORM: "Đồng phục",
  LATE_PENALTY: "Phạt đi trễ"
}
