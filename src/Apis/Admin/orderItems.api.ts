import Http from "src/Helpers/http"
import { HistoryTableSessionDetail, SuccessResponse } from "src/Types/utils.type"

export const orderItemsAPI = {
  updateStatusListOrderItem: (items: Record<string, number>) => {
    return Http.put<SuccessResponse<HistoryTableSessionDetail>>(`/api/auth/order-items/status/`, {
      items
    })
  }
}
