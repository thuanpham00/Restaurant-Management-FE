/* eslint-disable @typescript-eslint/no-explicit-any */
import Http from "src/Helpers/http"
import {
  Invoice,
  InvoiceDetail,
  InvoicePaymentPayload,
  InvoicePaymentUpdatePayload,
  SplitInvoiceRequest,
  SplitInvoiceResponse,
  InvoiceSummary
} from "src/Types/invoicePayment.type"
import { queryParamConfigInvoice } from "src/Types/queryParams.type"
import { PaginatedResponse, SuccessResponse } from "src/Types/utils.type"

export const invoicePaymentAPI = {
  getList: (params: queryParamConfigInvoice, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Invoice>>>(`/api/invoices`, {
      params,
      signal
    })
  },

  getDetailInvoice: (idInvoice: string) => {
    return Http.get<SuccessResponse<InvoiceDetail>>(`/api/invoices/${idInvoice}`)
  },

  getDetailInvoiceFromIdTableSession: (idTableSession: string) => {
    return Http.get<SuccessResponse<InvoiceDetail[]>>(`/api/invoices/table-session/${idTableSession}`)
  },

  // ✅ NEW: Get invoice summary for table session
  getInvoiceSummary: (tableSessionId: string) => {
    return Http.get<SuccessResponse<InvoiceSummary>>(`/api/table-sessions/${tableSessionId}/invoice-summary`)
  },

  create: (payload: InvoicePaymentPayload) => {
    return Http.post("/api/invoices", payload)
  },

  update: (idInvoice: string, payload: InvoicePaymentPayload | InvoicePaymentUpdatePayload) => {
    return Http.put(`/api/invoices/${idInvoice}`, payload)
  },

  splitInvoice: (body: SplitInvoiceRequest) => {
    return Http.post<SuccessResponse<SplitInvoiceResponse>>("/api/table-sessions/split-invoice", body)
  }
}
