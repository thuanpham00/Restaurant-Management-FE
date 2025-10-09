/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import { HistoryTableSessionDetail } from "src/Types/tableSession.type"
import { SuccessResponse } from "src/Types/utils.type"

export const orderItemsAPI = {
  addOrderItem: (body: {
    order_id: string
    items: {
      dish_id: string
      name_dish: string
      price: number
      quantity: number
      total_price: number
      status: number
    }[]
  }) => {
    return Http.post<SuccessResponse<any>>(`/api/auth/order-items/add-order`, body)
  },

  updateListOrderItem: (items: Record<string, { status: number; quantity: number }>) => {
    return Http.put<SuccessResponse<HistoryTableSessionDetail>>(`/api/auth/order-items/update-order`, {
      items
    })
  }
}
