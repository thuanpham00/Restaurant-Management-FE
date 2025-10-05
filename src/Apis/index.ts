/**
 * API Module Index
 * Central barrel export for all API modules
 * 
 * This file provides backward compatibility with the old structure
 * while supporting the new modular architecture.
 * 
 * USAGE EXAMPLES:
 * 
 * OLD (Still works):
 * import { adminAPI } from "src/Apis/admin.api"
 * adminAPI.auth.loginAdmin(...)
 * 
 * NEW (Recommended - Better for avoiding conflicts):
 * import { authAPI, dishesAPI } from "src/Apis/Admin"
 * authAPI.loginAdmin(...)
 * 
 * OR (Most specific - Best for large teams):
 * import { authAPI } from "src/Apis/Admin/auth.api"
 * authAPI.loginAdmin(...)
 */

// Export all Admin APIs
export * from "./Admin"
export { adminAPI } from "./Admin"

// Export all Client APIs
export * from "./Client"

// Export all Upload APIs
export * from "./Upload"

/**
 * Re-export for backward compatibility with old import paths
 * This allows existing code to work without changes
 */

// For: import { adminAPI } from "src/Apis/admin.api"
export { adminAPI as default } from "./Admin"

// For: import { MediaAPI } from "src/Apis/upload.api"
export { MediaAPI } from "./Upload"
