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
  payrollItems: payrollItemsAPI
}
