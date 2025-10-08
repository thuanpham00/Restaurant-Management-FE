import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { Empty, Pagination, Spin, Table, Tabs } from "antd"
import { ColumnsType } from "antd/es/table"
import { isUndefined, omitBy } from "lodash"
import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Fragment } from "react/jsx-runtime"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { reservationsAPI } from "src/Apis/Admin/reservation.api"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigReservation } from "src/Types/queryParams.type"
import { Reservation } from "src/Types/utils.type"

export default function ManageReservation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryParams: queryParamConfigReservation = useQueryParams()
  const queryConfig: queryParamConfigReservation = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "5"
    },
    isUndefined
  )

  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "completed" | "cancelled">("confirmed")

  const { data, isFetching } = useQuery({
    queryKey: ["listReservation", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return reservationsAPI.getList(queryConfig, controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data
  const listReservation = paginated?.items

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const columns: ColumnsType<Reservation> = [
    {
      title: "Mã đặt bàn",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-medium">{id}</span>
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.customer.full_name}</div>
          <div className="text-gray-500 text-sm">{record.customer.phone}</div>
        </div>
      )
    },
    {
      title: "Số người",
      dataIndex: "number_of_people",
      key: "number_of_people"
    },
    {
      title: "Ngày đặt",
      dataIndex: "reserved_at",
      key: "reserved_at",
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        switch (status) {
          case 0:
            return <span className="text-gray-600">Chờ</span>
          case 1:
            return <span className="text-blue-600 font-medium">Đã xác nhận</span>
          case 2:
            return <span className="text-red-600 font-medium">Đã hủy</span>
          case 3:
            return <span className="text-green-600 font-medium">Đã hoàn thành</span>
          default:
            return <span>Unknown</span>
        }
      }
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      render: (text) => <span className="text-gray-700">{text || "-"}</span>
    },
    {
      title: "Tạo lúc",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString()
    }
  ]

  const onTabChange = (key: string) => {
    setActiveTab(key as typeof activeTab)

    searchParams.set("page", "1")
    setSearchParams(searchParams)
  }

  const filteredReservations = listReservation?.filter((r) => {
    switch (activeTab) {
      case "pending":
        return r.status === 0
      case "confirmed":
        return r.status === 1
      case "cancelled":
        return r.status === 2
      case "completed":
        return r.status === 3
      default:
        return true
    }
  })

  const countByStatus = {
    pending: listReservation?.filter((r) => r.status === 0).length || 0,
    confirmed: listReservation?.filter((r) => r.status === 1).length || 0,
    cancelled: listReservation?.filter((r) => r.status === 2).length || 0,
    completed: listReservation?.filter((r) => r.status === 3).length || 0
  }

  return (
    <div>
      <Helmet>
        <title>Danh sách Đặt bàn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách đặt bàn
      </h1>

      <Tabs activeKey={activeTab} onChange={onTabChange}>
        <Tabs.TabPane tab={`Xác nhận (${countByStatus.confirmed})`} key="confirmed" />
        <Tabs.TabPane tab={`Chờ (${countByStatus.pending})`} key="pending" />
        <Tabs.TabPane tab={`Hoàn thành (${countByStatus.completed})`} key="completed" />
        <Tabs.TabPane tab={`Đã hủy (${countByStatus.cancelled})`} key="cancelled" />
      </Tabs>

      {isFetching ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column", // để tip xuất hiện bên dưới spinner,
            height: "calc(100vh - 200px)" // chiếm toàn màn hình
          }}
        >
          <Spin tip="Đang tải dữ liệu..." size="large">
            <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
          </Spin>
        </div>
      ) : (filteredReservations as Reservation[]).length === 0 ? (
        <Empty description="Không có đặt bàn hợp lệ" className="mt-16" />
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={filteredReservations as Reservation[]}
            pagination={false}
            bordered
            rowClassName={(_, index) =>
              index % 2 === 0
                ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
                : "bg-white hover:bg-blue-50 transition-colors"
            }
          />

          <div style={{ marginTop: 16, textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
            <Pagination
              current={parseInt(queryConfig.page as string)}
              total={paginated?.meta.total}
              pageSize={parseInt(queryConfig.per_page as string)}
              onChange={handlePaginationChange}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
            />
          </div>
        </Fragment>
      )}
    </div>
  )
}
