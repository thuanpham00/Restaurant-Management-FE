import { AppAbility } from "./abilities"

export type FeatureKey =
  | "dashboard"
  | "tables"
  | "reservations"
  | "customers"
  | "profile"
  | "staff"
  | "shifts"
  | "payroll"
  | "menuCategory"
  | "dishes"
  | "menu"
  | "ingredients"
  | "suppliers"
  | "warehouseIn"
  | "warehouseOut"
  | "inventoryLoss"
  | "invoices"
  | "promotions"
  | "roles"
  | "permissionMatrix"

export const FEATURE_VIEW_ABILITY: Record<FeatureKey, AppAbility> = {
  dashboard: AppAbility.DASHBOARD_VIEW,
  tables: AppAbility.TABLES_VIEW,
  reservations: AppAbility.RESERVATIONS_VIEW,
  customers: AppAbility.CUSTOMERS_VIEW,
  profile: AppAbility.PROFILE_VIEW,
  staff: AppAbility.EMPLOYEES_VIEW,
  shifts: AppAbility.SHIFTS_VIEW,
  payroll: AppAbility.PAYROLL_VIEW,
  menuCategory: AppAbility.MENU_CATEGORY_VIEW,
  dishes: AppAbility.DISH_VIEW,
  menu: AppAbility.MENU_VIEW,
  ingredients: AppAbility.INGREDIENTS_VIEW,
  suppliers: AppAbility.SUPPLIERS_VIEW,
  warehouseIn: AppAbility.WAREHOUSE_IMPORT_VIEW,
  warehouseOut: AppAbility.WAREHOUSE_EXPORT_VIEW,
  inventoryLoss: AppAbility.WAREHOUSE_LOSS_VIEW,
  invoices: AppAbility.INVOICES_VIEW,
  promotions: AppAbility.PROMOTIONS_VIEW,
  roles: AppAbility.ROLES_VIEW,
  permissionMatrix: AppAbility.PERMISSION_MATRIX_VIEW
}

export const FEATURE_MANAGE_ABILITY: Partial<Record<FeatureKey, AppAbility>> = {
  tables: AppAbility.TABLES_MANAGE,
  reservations: AppAbility.RESERVATIONS_MANAGE,
  customers: AppAbility.CUSTOMERS_MANAGE,
  staff: AppAbility.EMPLOYEES_MANAGE,
  shifts: AppAbility.SHIFTS_MANAGE,
  payroll: AppAbility.PAYROLL_MANAGE,
  menuCategory: AppAbility.MENU_CATEGORY_MANAGE,
  dishes: AppAbility.DISH_MANAGE,
  menu: AppAbility.MENU_MANAGE,
  ingredients: AppAbility.INGREDIENTS_MANAGE,
  suppliers: AppAbility.SUPPLIERS_MANAGE,
  warehouseIn: AppAbility.WAREHOUSE_IMPORT_MANAGE,
  warehouseOut: AppAbility.WAREHOUSE_EXPORT_MANAGE,
  inventoryLoss: AppAbility.WAREHOUSE_LOSS_MANAGE,
  invoices: AppAbility.INVOICES_MANAGE,
  promotions: AppAbility.PROMOTIONS_MANAGE,
  roles: AppAbility.ROLES_MANAGE,
  permissionMatrix: AppAbility.PERMISSION_MATRIX_MANAGE
}
