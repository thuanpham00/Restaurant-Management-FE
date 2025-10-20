import { AppAbility, ALL_ABILITIES } from "./abilities"
import { AppRole } from "./roles"

const unique = (abilities: AppAbility[]): AppAbility[] => Array.from(new Set(abilities))

export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  [AppRole.SUPER_ADMIN]: ALL_ABILITIES,
  [AppRole.ADMINISTRATOR]: unique(ALL_ABILITIES.filter((ability) => ability !== AppAbility.PERMISSION_MATRIX_MANAGE)),
  [AppRole.MANAGER]: unique([
    AppAbility.DASHBOARD_VIEW,
    AppAbility.TABLES_VIEW,
    AppAbility.TABLES_MANAGE,
    AppAbility.RESERVATIONS_VIEW,
    AppAbility.RESERVATIONS_MANAGE,
    AppAbility.CUSTOMERS_VIEW,
    AppAbility.CUSTOMERS_MANAGE,
    AppAbility.EMPLOYEES_VIEW,
    AppAbility.EMPLOYEES_MANAGE,
    AppAbility.SHIFTS_VIEW,
    AppAbility.SHIFTS_MANAGE,
    AppAbility.PAYROLL_VIEW,
    AppAbility.PAYROLL_MANAGE,
    AppAbility.MENU_CATEGORY_VIEW,
    AppAbility.MENU_CATEGORY_MANAGE,
    AppAbility.DISH_VIEW,
    AppAbility.DISH_MANAGE,
    AppAbility.MENU_VIEW,
    AppAbility.MENU_MANAGE,
    AppAbility.ORDER_VIEW,
    AppAbility.ORDER_MANAGE,
    AppAbility.ORDER_ITEM_VIEW,
    AppAbility.ORDER_ITEM_MANAGE,
    AppAbility.INGREDIENTS_VIEW,
    AppAbility.INGREDIENTS_MANAGE,
    AppAbility.SUPPLIERS_VIEW,
    AppAbility.SUPPLIERS_MANAGE,
    AppAbility.WAREHOUSE_IMPORT_VIEW,
    AppAbility.WAREHOUSE_IMPORT_MANAGE,
    AppAbility.WAREHOUSE_EXPORT_VIEW,
    AppAbility.WAREHOUSE_EXPORT_MANAGE,
    AppAbility.WAREHOUSE_LOSS_VIEW,
    AppAbility.WAREHOUSE_LOSS_MANAGE,
    AppAbility.INVOICES_VIEW,
    AppAbility.INVOICES_MANAGE,
    AppAbility.PROMOTIONS_VIEW,
    AppAbility.PROMOTIONS_MANAGE
  ]),
  [AppRole.STAFF]: unique([
    AppAbility.DASHBOARD_VIEW,
    AppAbility.TABLES_VIEW,
    AppAbility.RESERVATIONS_VIEW,
    AppAbility.CUSTOMERS_VIEW,
    AppAbility.EMPLOYEES_VIEW,
    AppAbility.SHIFTS_VIEW,
    AppAbility.MENU_CATEGORY_VIEW,
    AppAbility.DISH_VIEW,
    AppAbility.MENU_VIEW,
    AppAbility.INGREDIENTS_VIEW,
    AppAbility.SUPPLIERS_VIEW,
    AppAbility.WAREHOUSE_IMPORT_VIEW,
    AppAbility.WAREHOUSE_EXPORT_VIEW,
    AppAbility.WAREHOUSE_LOSS_VIEW,
    AppAbility.INVOICES_VIEW,
    AppAbility.PROMOTIONS_VIEW
  ]),
  [AppRole.CASHIER]: unique([
    AppAbility.DASHBOARD_VIEW,
    AppAbility.CUSTOMERS_VIEW,
    AppAbility.CUSTOMERS_MANAGE,
    AppAbility.RESERVATIONS_VIEW,
    AppAbility.INVOICES_VIEW,
    AppAbility.INVOICES_MANAGE,
    AppAbility.PROMOTIONS_VIEW,
    AppAbility.PROMOTIONS_MANAGE
  ]),
  [AppRole.KITCHEN_STAFF]: unique([
    AppAbility.DASHBOARD_VIEW,
    AppAbility.MENU_CATEGORY_VIEW,
    AppAbility.MENU_CATEGORY_MANAGE,
    AppAbility.DISH_VIEW,
    AppAbility.DISH_MANAGE,
    AppAbility.MENU_VIEW,
    AppAbility.MENU_MANAGE,
    AppAbility.INGREDIENTS_VIEW,
    AppAbility.INGREDIENTS_MANAGE,
    AppAbility.SUPPLIERS_VIEW,
    AppAbility.WAREHOUSE_IMPORT_VIEW,
    AppAbility.WAREHOUSE_IMPORT_MANAGE,
    AppAbility.WAREHOUSE_EXPORT_VIEW,
    AppAbility.WAREHOUSE_EXPORT_MANAGE,
    AppAbility.WAREHOUSE_LOSS_VIEW,
    AppAbility.WAREHOUSE_LOSS_MANAGE
  ]),
  [AppRole.WAITER]: unique([
    AppAbility.DASHBOARD_VIEW,
    AppAbility.TABLES_VIEW,
    AppAbility.TABLES_MANAGE,
    AppAbility.RESERVATIONS_VIEW,
    AppAbility.RESERVATIONS_MANAGE,
    AppAbility.CUSTOMERS_VIEW,
    AppAbility.MENU_VIEW,
    AppAbility.DISH_VIEW
  ])
}

export const getDefaultPermissionsForRole = (role: AppRole | null | undefined): AppAbility[] => {
  if (!role) return []
  return ROLE_PERMISSIONS[role] ?? []
}
