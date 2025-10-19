import { useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { Card, DatePicker, Empty, Segmented, Select, Spin, Tag } from "antd"
import { useQuery } from "@tanstack/react-query"
import dayjs, { Dayjs } from "dayjs"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import type { ChartOptions } from "chart.js"
import { TrendingUp, Receipt, Flame, Gift } from "lucide-react"

import { reportsAPI } from "src/Apis/Admin"
import { registerCharts } from "src/lib/chart"
import type {
  RevenueGroupBy,
  TopDishReportItem,
  CategoryProfitReportItem,
  PaymentMethodReportItem,
  PromotionReportItem
} from "src/Types/report.type"

registerCharts()

const { RangePicker } = DatePicker

const chartPalette = ["#2563EB", "#16A34A", "#F97316", "#F43F5E", "#14B8A6", "#8B5CF6", "#EF4444", "#0EA5E9"]

const toNumber = (value: number | string | undefined | null) => {
  if (value === undefined || value === null) {
    return 0
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
})

const numberFormatter = new Intl.NumberFormat("vi-VN")

const formatCurrency = (value: number | string | undefined | null) => {
  return currencyFormatter.format(Math.round(toNumber(value)))
}

const formatNumber = (value: number | string | undefined | null) => {
  return numberFormatter.format(Math.round(toNumber(value)))
}

const formatCompactCurrency = (value: number | string | undefined | null) => {
  const numeric = toNumber(value)
  const abs = Math.abs(numeric)

  if (abs >= 1_000_000_000) {
    return `${(numeric / 1_000_000_000).toFixed(1)} tỷ`
  }
  if (abs >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)} tr`
  }
  if (abs >= 1_000) {
    return `${(numeric / 1_000).toFixed(0)} nghìn`
  }
  return formatNumber(numeric)
}

const groupByLabels: Record<RevenueGroupBy, string> = {
  day: "Theo ngày",
  week: "Theo tuần",
  month: "Theo tháng"
}

const topDishLimitOptions = [5, 8, 10, 15]

const defaultRange: [Dayjs, Dayjs] = [dayjs().subtract(29, "day"), dayjs()]

export default function ManageDashboard() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(defaultRange)
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>("day")
  const [topLimit, setTopLimit] = useState<number>(5)

  const startDate = dateRange[0].format("YYYY-MM-DD")
  const endDate = dateRange[1].format("YYYY-MM-DD")

  const revenueParams = useMemo(
    () => ({
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy
    }),
    [startDate, endDate, groupBy]
  )

  const topDishesParams = useMemo(
    () => ({
      start_date: startDate,
      end_date: endDate,
      limit: topLimit
    }),
    [startDate, endDate, topLimit]
  )

  const sharedRangeParams = useMemo(
    () => ({
      start_date: startDate,
      end_date: endDate
    }),
    [startDate, endDate]
  )

  const { data: revenueRes, isFetching: isRevenueFetching } = useQuery({
    queryKey: ["reports", "revenue", revenueParams],
    queryFn: ({ signal }) => reportsAPI.getRevenue(revenueParams, signal),
    staleTime: 5 * 60 * 1000
  })

  const { data: topDishesRes, isFetching: isTopDishesFetching } = useQuery({
    queryKey: ["reports", "top-dishes", topDishesParams],
    queryFn: ({ signal }) => reportsAPI.getTopDishes(topDishesParams, signal),
    staleTime: 5 * 60 * 1000
  })

  const { data: categoryProfitRes, isFetching: isCategoryProfitFetching } = useQuery({
    queryKey: ["reports", "category-profit", sharedRangeParams],
    queryFn: ({ signal }) => reportsAPI.getCategoryProfit(sharedRangeParams, signal),
    staleTime: 5 * 60 * 1000
  })

  const { data: paymentMethodsRes, isFetching: isPaymentMethodsFetching } = useQuery({
    queryKey: ["reports", "payment-methods", sharedRangeParams],
    queryFn: ({ signal }) => reportsAPI.getPaymentMethods(sharedRangeParams, signal),
    staleTime: 5 * 60 * 1000
  })

  const { data: promotionsRes, isFetching: isPromotionsFetching } = useQuery({
    queryKey: ["reports", "promotions", sharedRangeParams],
    queryFn: ({ signal }) => reportsAPI.getPromotions(sharedRangeParams, signal),
    staleTime: 5 * 60 * 1000
  })

  const revenueData = revenueRes?.data.data
  const topDishesData = topDishesRes?.data.data
  const categoryProfitData = categoryProfitRes?.data.data
  const paymentMethodsData = paymentMethodsRes?.data.data
  const promotionsData = promotionsRes?.data.data

  const revenueDataset = revenueData?.dataset ?? []
  const topDishes = topDishesData?.dataset ?? []
  const categoryItems = categoryProfitData?.dataset ?? []
  const paymentItems = paymentMethodsData?.dataset ?? []
  const promotionItems = promotionsData?.dataset ?? []

  const bestSeller = topDishes.length > 0 ? topDishes[0] : null

  const dominantPayment = useMemo(() => {
    return paymentItems.reduce<PaymentMethodReportItem | null>((prev, current) => {
      if (!prev || current.total_amount > prev.total_amount) {
        return current
      }
      return prev
    }, null)
  }, [paymentItems])

  const topPromotion = useMemo(() => {
    return promotionItems.reduce<PromotionReportItem | null>((prev, current) => {
      if (!prev || current.total_discount > prev.total_discount) {
        return current
      }
      return prev
    }, null)
  }, [promotionItems])

  const revenueChartData = useMemo(() => {
    if (!revenueDataset.length) return null
    return {
      labels: revenueDataset.map((item) => item.label),
      datasets: [
        {
          label: "Doanh thu",
          data: revenueDataset.map((item) => item.total_amount),
          borderColor: "#2563EB",
          backgroundColor: "rgba(37, 99, 235, 0.2)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    }
  }, [revenueDataset])

  const revenueChartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          ticks: {
            callback: (value) => formatCompactCurrency(value as number)
          },
          grid: { color: "rgba(148, 163, 184, 0.2)" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${formatCurrency(context.parsed.y)}`
          }
        },
        datalabels: {
          display: false
        }
      }
    }),
    []
  )

  const topDishesChartData = useMemo(() => {
    if (!topDishes.length) return null
    return {
      labels: topDishes.map((item) => item.dish_name),
      datasets: [
        {
          label: "Doanh thu ròng",
          data: topDishes.map((item) => item.estimated_net_revenue),
          backgroundColor: topDishes.map((_, index) => chartPalette[index % chartPalette.length]),
          borderRadius: 6
        }
      ]
    }
  }, [topDishes])

  const topDishesChartOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          ticks: {
            callback: (value) => formatCompactCurrency(value as number)
          },
          grid: { color: "rgba(209, 213, 219, 0.3)" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.parsed.y)
          }
        },
        datalabels: {
          display: false
        }
      }
    }),
    []
  )

  const categoryChartData = useMemo(() => {
    if (!categoryItems.length) return null
    return {
      labels: categoryItems.map((item) => item.category_name),
      datasets: [
        {
          label: "Lợi nhuận ước tính",
          data: categoryItems.map((item) => item.estimated_profit),
          backgroundColor: categoryItems.map((_, index) => chartPalette[index % chartPalette.length])
        }
      ]
    }
  }, [categoryItems])

  const categoryChartOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context) => {
              const item = categoryItems[context.dataIndex]
              const ratio = item?.profit_ratio_percent ?? 0
              return `${context.label}: ${formatCurrency(context.parsed as number)} (${ratio.toFixed(1)}%)`
            }
          }
        },
        datalabels: {
          color: "#1f2937",
          formatter: (_value, context) => {
            const item = categoryItems[context.dataIndex]
            if (!item) return ""
            return `${item.profit_ratio_percent.toFixed(1)}%`
          }
        }
      }
    }),
    [categoryItems]
  )

  const paymentChartData = useMemo(() => {
    if (!paymentItems.length) return null
    return {
      labels: paymentItems.map((item) => item.method_label),
      datasets: [
        {
          label: "Giá trị thanh toán",
          data: paymentItems.map((item) => item.total_amount),
          backgroundColor: paymentItems.map((_, index) => chartPalette[index % chartPalette.length])
        }
      ]
    }
  }, [paymentItems])

  const paymentChartOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context) => {
              const item = paymentItems[context.dataIndex]
              const percent = item?.percentage ?? 0
              return `${context.label}: ${formatCurrency(context.parsed as number)} (${percent.toFixed(1)}%)`
            }
          }
        },
        datalabels: {
          color: "#1f2937",
          formatter: (_value, context) => {
            const item = paymentItems[context.dataIndex]
            if (!item) return ""
            return `${item.percentage.toFixed(1)}%`
          }
        }
      }
    }),
    [paymentItems]
  )

  const promotionsChartData = useMemo(() => {
    if (!promotionItems.length) return null
    return {
      labels: promotionItems.map((item) => item.code),
      datasets: [
        {
          label: "Tổng giá trị giảm",
          data: promotionItems.map((item) => item.total_discount),
          backgroundColor: promotionItems.map((_, index) => chartPalette[index % chartPalette.length]),
          borderRadius: 6
        }
      ]
    }
  }, [promotionItems])

  const promotionsChartOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          ticks: {
            callback: (value) => formatCompactCurrency(value as number)
          },
          grid: { color: "rgba(209, 213, 219, 0.3)" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.parsed.y)
          }
        },
        datalabels: {
          display: false
        }
      }
    }),
    []
  )

  return (
    <div className="space-y-4">
      <Helmet>
        <title>Thống kê hệ thống</title>
      </Helmet>

      <div className="bg-white p-4 rounded-lg shadow flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <RangePicker
            allowClear={false}
            value={dateRange}
            disabledDate={(current) => !!current && current > dayjs().endOf("day")}
            onChange={(values) => {
              if (!values || values.length !== 2) return
              const [start, end] = values as [Dayjs | null, Dayjs | null]
              if (!start || !end) return
              setDateRange([start, end])
            }}
            format="DD/MM/YYYY"
          />

          <Segmented
            value={groupBy}
            onChange={(value) => setGroupBy(value as RevenueGroupBy)}
            options={[
              { label: "Theo ngày", value: "day" },
              { label: "Theo tuần", value: "week" },
              { label: "Theo tháng", value: "month" }
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
        <Card>
          <Spin spinning={isRevenueFetching}>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-lg font-semibold">{formatCurrency(revenueData?.total_amount)}</p>
              </div>
            </div>
          </Spin>
        </Card>

        <Card>
          <Spin spinning={isRevenueFetching}>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                <Receipt size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Số giao dịch</p>
                <p className="text-lg font-semibold">{formatNumber(revenueData?.transaction_count)}</p>
              </div>
            </div>
          </Spin>
        </Card>

        <Card>
          <Spin spinning={isTopDishesFetching}>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-3 text-orange-500">
                <Flame size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Món bán chạy</p>
                {bestSeller ? (
                  <div>
                    <p className="text-lg font-semibold leading-tight">{bestSeller.dish_name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(bestSeller.estimated_net_revenue)} · {formatNumber(bestSeller.total_quantity)} phần</p>
                  </div>
                ) : (
                  <p className="text-lg font-semibold">Không có dữ liệu</p>
                )}
              </div>
            </div>
          </Spin>
        </Card>

        {/* <Card>
          <Spin spinning={isPromotionsFetching}>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-3 text-purple-500">
                <Gift size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Giá trị khuyến mãi</p>
                <p className="text-lg font-semibold">{formatCurrency(promotionsData?.total_discount)}</p>
              </div>
            </div>
          </Spin>
        </Card> */}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Xu hướng doanh thu" extra={<Tag color="geekblue">{groupByLabels[groupBy]}</Tag>} className="xl:col-span-2">
          <Spin spinning={isRevenueFetching}>
            {revenueChartData ? (
              <div style={{ height: 320 }}>
                <Line options={revenueChartOptions} data={revenueChartData} />
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Spin>
        </Card>

        <Card title="Thông tin nhanh">
          <Spin spinning={isRevenueFetching || isPaymentMethodsFetching || isPromotionsFetching}>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start justify-between gap-4">
                <span>Khoảng thời gian</span>
                <span className="font-semibold text-gray-800">
                  {revenueData?.range
                    ? `${dayjs(revenueData.range.start).format("DD/MM/YYYY")} - ${dayjs(revenueData.range.end).format("DD/MM/YYYY")}`
                    : "--/--"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Phương thức phổ biến</span>
                <span className="font-semibold text-gray-800">
                  {dominantPayment
                    ? `${dominantPayment.method_label} · ${dominantPayment.percentage.toFixed(1)}%`
                    : "Chưa có dữ liệu"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Khuyến mãi nổi bật</span>
                <span className="font-semibold text-gray-800 text-right">
                  {topPromotion
                    ? `${topPromotion.code} · ${formatCurrency(topPromotion.total_discount)}`
                    : "Chưa có dữ liệu"}
                </span>
              </div>
            </div>
          </Spin>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Top món bán chạy"
          extra={
            <Select
              size="small"
              value={topLimit}
              style={{ width: 120 }}
              onChange={(value) => setTopLimit(Number(value))}
              options={topDishLimitOptions.map((value) => ({ value, label: `Top ${value}` }))}
            />
          }
        >
          <Spin spinning={isTopDishesFetching}>
            {topDishesChartData ? (
              <div className="space-y-4">
                <div style={{ height: 280 }}>
                  <Bar data={topDishesChartData} options={topDishesChartOptions} />
                </div>
                <div className="space-y-3">
                  {topDishes.map((item: TopDishReportItem, index) => (
                    <div key={item.dish_id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div>
                        <p className="font-semibold text-gray-800">{index + 1}. {item.dish_name}</p>
                        <p className="text-xs text-gray-500">{item.category_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">{formatCurrency(item.estimated_net_revenue)}</p>
                        <p className="text-xs text-gray-500">{formatNumber(item.total_quantity)} phần · {formatCurrency(item.average_unit_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Spin>
        </Card>

        <Card title="Phương thức thanh toán">
          <Spin spinning={isPaymentMethodsFetching}>
            {paymentChartData ? (
              <div className="space-y-4">
                <div style={{ height: 260 }}>
                  <Doughnut data={paymentChartData} options={paymentChartOptions} />
                </div>
                <div className="space-y-2">
                  {paymentItems.map((item: PaymentMethodReportItem) => (
                    <div key={item.method} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="font-medium text-gray-700">{item.method_label}</div>
                      <div className="text-right text-sm text-gray-600">
                        <p>{formatCurrency(item.total_amount)}</p>
                        <p className="text-xs text-gray-500">{formatNumber(item.transaction_count)} giao dịch · {item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Spin>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Biểu đồ lợi nhuận theo danh mục">
          <Spin spinning={isCategoryProfitFetching}>
            {categoryChartData ? (
              <div className="space-y-4">
                <div style={{ height: 260 }}>
                  <Doughnut data={categoryChartData} options={categoryChartOptions} />
                </div>
                <div className="space-y-2">
                  {categoryItems.map((item: CategoryProfitReportItem) => (
                    <div key={item.category_id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.category_name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.gross_revenue)} doanh thu</p>
                      </div>
                      <div className="text-right text-sm text-gray-700">
                        <p>{formatCurrency(item.estimated_profit)}</p>
                        <p className="text-xs text-emerald-600">{item.profit_ratio_percent.toFixed(1)}% lợi nhuận</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Spin>
        </Card>

        <Card title="Hiệu quả khuyến mãi">
          <Spin spinning={isPromotionsFetching}>
            {promotionsChartData ? (
              <div className="space-y-4">
                <div style={{ height: 280 }}>
                  <Bar data={promotionsChartData} options={promotionsChartOptions} />
                </div>
                <div className="space-y-2">
                  {promotionItems.map((item: PromotionReportItem) => (
                    <div key={item.promotion_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.code}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      <div className="text-right text-sm text-gray-700">
                        <p>{formatCurrency(item.total_discount)}</p>
                        <p className="text-xs text-gray-500">{formatNumber(item.applied_count)} lượt · {item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  )
}
