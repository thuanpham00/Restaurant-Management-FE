/**
 * Admin API Module
 * Centralized export for all admin-related API endpoints
 *
 * This module aggregates all admin APIs for easier imports and better organization.
 * Each API module is responsible for a specific domain within the admin portal.
 */

export { authAPI } from "./auth.api"
export { diningTableAPI } from "./diningTable.api"
export { tableSessionAPI } from "./tableSession.api"
export { orderItemsAPI } from "./orderItems.api"
export { dishCategoryAPI } from "./dishCategory.api"
export { dishesAPI } from "./dishes.api"
export { menusAPI } from "./menus.api"
export { customersAPI } from "./customers.api"
export { employeesAPI } from "./employees.api"
export { shiftsAPI, employeeShiftsAPI } from "./shifts.api"
export { payrollAPI } from "./payroll.api"
export { payrollItemsAPI } from "./payrollItems.api"
export { rolesAPI } from "./roles.api"
export { permissionsAPI } from "./permissions.api"
export { suppliersAPI } from "./suppliers.api"
export { ingredientCategoriesAPI } from "./ingredientCategories.api"
export { ingredientsAPI } from "./ingredients.api"
export { stockImportsAPI } from "./stockImports.api"
export { stockExportsAPI } from "./stockExports.api"
export { stockLossesAPI } from "./stockLosses.api"

import { authAPI } from "./auth.api"
import { diningTableAPI } from "./diningTable.api"
import { tableSessionAPI } from "./tableSession.api"
import { orderItemsAPI } from "./orderItems.api"
import { dishCategoryAPI } from "./dishCategory.api"
import { dishesAPI } from "./dishes.api"
import { menusAPI } from "./menus.api"
import { customersAPI } from "./customers.api"
import { employeesAPI } from "./employees.api"
import { shiftsAPI, employeeShiftsAPI } from "./shifts.api"
import { payrollAPI } from "./payroll.api"
import { payrollItemsAPI } from "./payrollItems.api"
import { rolesAPI } from "./roles.api"
import { permissionsAPI } from "./permissions.api"
import { suppliersAPI } from "./suppliers.api"
import { ingredientCategoriesAPI } from "./ingredientCategories.api"
import { ingredientsAPI } from "./ingredients.api"
import { stockImportsAPI } from "./stockImports.api"
import { stockExportsAPI } from "./stockExports.api"
import { stockLossesAPI } from "./stockLosses.api"

export const adminAPI = {
  auth: authAPI,
  diningTable: diningTableAPI,
  tableSession: tableSessionAPI,
  orderItems: orderItemsAPI,
  dishes_category: dishCategoryAPI,
  dishes: dishesAPI,
  menus: menusAPI,
  customers: customersAPI,
  employees: employeesAPI,
  shifts: shiftsAPI,
  employeeShifts: employeeShiftsAPI,
  payroll: payrollAPI,
  payrollItems: payrollItemsAPI,
  roles: rolesAPI,
  permissions: permissionsAPI,
  suppliers: suppliersAPI,
  ingredientCategories: ingredientCategoriesAPI,
  ingredients: ingredientsAPI,
  stockImports: stockImportsAPI,
  stockExports: stockExportsAPI,
  stockLosses: stockLossesAPI
}
