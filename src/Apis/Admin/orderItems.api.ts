/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import { HistoryTableSessionDetail } from "src/Types/tableSession.type"
import { SuccessResponse } from "src/Types/utils.type"

export const orderItemsAPI = {
  addOrderItem: (body: {
    items: {
      dish_id: string
      name_dish: string
      price: number
      quantity: number
      total_price: number
      status: number
      notes: string
    }[]
    order_id?: string
    table_session_id?: string
    invoice_id?: string
  }) => {
    return Http.post<SuccessResponse<any>>(`/api/order-items/add-order`, body)
  },

  updateListOrderItem: (
    items: Record<string, { status: number; quantity: number; notes: string }>,
    invoice_id?: string
  ) => {
    return Http.put<SuccessResponse<HistoryTableSessionDetail>>(`/api/order-items/update-order`, {
      items,
      invoice_id
    })
  },

  delete: (orderItemId: string, orderId: string) => {
    return Http.delete(`/api/order-items/${orderItemId}?order_id=${orderId}`)
  }
}
