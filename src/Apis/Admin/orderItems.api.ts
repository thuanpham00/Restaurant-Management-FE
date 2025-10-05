import Http from "src/Helpers/http"
import { HistoryTableSessionDetail, SuccessResponse } from "src/Types/utils.type"

/**
 * Order Items API
 * Manages order item operations and status updates
 */
export const orderItemsAPI = {
  /**
   * Update status for multiple order items
   * @param items - Record of item IDs to status codes
   */
  updateStatusListOrderItem: (items: Record<string, number>) => {
    return Http.put<SuccessResponse<HistoryTableSessionDetail>>(`/api/auth/order-items/status/`, {
      items
    })
  }
}
