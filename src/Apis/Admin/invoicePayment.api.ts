/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import { Invoice, InvoicePaymentPayload } from "src/Types/invoicePayment.type"
import { queryParamConfigInvoice } from "src/Types/queryParams.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const invoicePaymentAPI = {
  getList: (params: queryParamConfigInvoice, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Invoice>>>(`/api/invoices`, {
      params,
      signal
    })
  },

  create: (payload: InvoicePaymentPayload) => {
    return Http.post("/api/invoices", payload)
  }
}
