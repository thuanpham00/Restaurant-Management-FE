export enum AppRole {
  SUPER_ADMIN = "super_administrator",
  ADMINISTRATOR = "administrator",
  MANAGER = "manager",
  STAFF = "staff",
  CASHIER = "cashier",
  KITCHEN_STAFF = "kitchen_staff",
  WAITER = "waiter"
}

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.SUPER_ADMIN]: "Super Administrator",
  [AppRole.ADMINISTRATOR]: "Administrator",
  [AppRole.MANAGER]: "Manager",
  [AppRole.STAFF]: "Staff",
  [AppRole.CASHIER]: "Cashier",
  [AppRole.KITCHEN_STAFF]: "Kitchen Staff",
  [AppRole.WAITER]: "Waiter"
}

const ROLE_ALIAS_ENTRIES: Array<[string, AppRole]> = [
  ["super administrator", AppRole.SUPER_ADMIN],
  ["super_admin", AppRole.SUPER_ADMIN],
  ["super-admin", AppRole.SUPER_ADMIN],
  ["superadmin", AppRole.SUPER_ADMIN],
  ["super admin", AppRole.SUPER_ADMIN],
  ["superadministrator", AppRole.SUPER_ADMIN],
  ["super-administrator", AppRole.SUPER_ADMIN],
  ["administrator", AppRole.ADMINISTRATOR],
  ["admin", AppRole.ADMINISTRATOR],
  ["system admin", AppRole.ADMINISTRATOR],
  ["system administrator", AppRole.ADMINISTRATOR],
  ["general manager", AppRole.MANAGER],
  ["manager", AppRole.MANAGER],
  ["staff", AppRole.STAFF],
  ["employee", AppRole.STAFF],
  ["staff_member", AppRole.STAFF],
  ["cashier", AppRole.CASHIER],
  ["sales staff", AppRole.CASHIER],
  ["sales_staff", AppRole.CASHIER],
  ["kitchen staff", AppRole.KITCHEN_STAFF],
  ["kitchen_staff", AppRole.KITCHEN_STAFF],
  ["inventory staff", AppRole.KITCHEN_STAFF],
  ["inventory_staff", AppRole.KITCHEN_STAFF],
  ["chef", AppRole.KITCHEN_STAFF],
  ["cook", AppRole.KITCHEN_STAFF],
  ["waiter", AppRole.WAITER],
  ["wait staff", AppRole.WAITER],
  ["wait_staff", AppRole.WAITER],
  ["server", AppRole.WAITER]
]

const LEGACY_ROLE_CODES: Array<[string, AppRole]> = [
  ["ADMIN", AppRole.SUPER_ADMIN],
  ["SUPER_ADMIN", AppRole.SUPER_ADMIN],
  ["SUPERADMIN", AppRole.SUPER_ADMIN],
  ["ADMINISTRATOR", AppRole.ADMINISTRATOR],
  ["MANAGER", AppRole.MANAGER],
  ["STAFF", AppRole.STAFF],
  ["SALES_STAFF", AppRole.CASHIER],
  ["INVENTORY_STAFF", AppRole.KITCHEN_STAFF],
  ["CASHIER", AppRole.CASHIER],
  ["KITCHEN_STAFF", AppRole.KITCHEN_STAFF],
  ["WAITER", AppRole.WAITER]
]

const ROLE_ALIAS_LOOKUP = [...ROLE_ALIAS_ENTRIES, ...LEGACY_ROLE_CODES].reduce<Record<string, AppRole>>(
  (acc, [alias, role]) => {
    acc[alias.toLowerCase()] = role
    return acc
  },
  {}
)

export const resolveRole = (rawRole?: string | null): AppRole | null => {
  if (!rawRole) return null
  const normalized = rawRole.trim().toLowerCase()
  return ROLE_ALIAS_LOOKUP[normalized] ?? null
}

export const isAppRole = (value: string): value is AppRole => {
  return Object.values(AppRole).includes(value as AppRole)
}
