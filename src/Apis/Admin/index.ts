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

import { authAPI } from "./auth.api"
import { diningTableAPI } from "./diningTable.api"
import { tableSessionAPI } from "./tableSession.api"
import { orderItemsAPI } from "./orderItems.api"
import { dishCategoryAPI } from "./dishCategory.api"
import { dishesAPI } from "./dishes.api"
import { menusAPI } from "./menus.api"

export const adminAPI = {
  auth: authAPI,
  diningTable: diningTableAPI,
  tableSession: tableSessionAPI,
  orderItems: orderItemsAPI,
  dishes_category: dishCategoryAPI, // Note: keeping legacy naming for backward compatibility
  dishes: dishesAPI,
  menus: menusAPI
}
