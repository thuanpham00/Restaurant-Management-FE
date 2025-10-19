import Http from "src/Helpers/http"
import { SuccessResponse } from "src/Types/utils.type"
import {
  RevenueReportParams,
  RevenueReportResponse,
  TopDishesReportParams,
  TopDishesReportResponse,
  CategoryProfitReportParams,
  CategoryProfitReportResponse,
  PaymentMethodReportParams,
  PaymentMethodReportResponse,
  PromotionsReportParams,
  PromotionsReportResponse
} from "src/Types/report.type"

export const reportsAPI = {
  getRevenue: (params: RevenueReportParams, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<RevenueReportResponse>>("/api/reports/revenue", {
      params,
      signal
    })
  },

  getTopDishes: (params: TopDishesReportParams, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<TopDishesReportResponse>>("/api/reports/top-dishes", {
      params,
      signal
    })
  },

  getCategoryProfit: (params: CategoryProfitReportParams = {}, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<CategoryProfitReportResponse>>("/api/reports/category-profit", {
      params,
      signal
    })
  },

  getPaymentMethods: (params: PaymentMethodReportParams = {}, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<PaymentMethodReportResponse>>("/api/reports/payment-methods", {
      params,
      signal
    })
  },

  getPromotions: (params: PromotionsReportParams = {}, signal?: AbortSignal) => {
    return Http.get<SuccessResponse<PromotionsReportResponse>>("/api/reports/promotions", {
      params,
      signal
    })
  }
}
