/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, DatePicker, Empty, Form, Input, Pagination, Spin, Table, Tabs, Tag } from "antd"
import { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { isUndefined, omit, omitBy } from "lodash"
import { Filter, RotateCcw } from "lucide-react"
import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { Fragment } from "react/jsx-runtime"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { reservationsAPI } from "src/Apis/Admin/reservation.api"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigReservation } from "src/Types/queryParams.type"
import { Reservation, ReservationCheckAssignTable } from "src/Types/reservation.type"
import ArrangementTable from "../../Components/ArrangementTable"

export default function ManageReservation() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryParams: queryParamConfigReservation = useQueryParams()
  const queryConfig: queryParamConfigReservation = omitBy(
    {
      customer_name: queryParams.customer_name,
      customer_phone: queryParams.customer_phone,
      reserved_at: queryParams.reserved_at
    },
    isUndefined
  )

  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "completed" | "cancelled">("pending")

  const { data, isFetching } = useQuery({
    queryKey: ["listReservation", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return reservationsAPI.getList(queryConfig, controller.signal)
    },
    retry: 0
  })

  const listReservation = data?.data.data

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
  }) // sau khi phân loại xong -> phân trang

  const paginatedReservations = filteredReservations?.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePaginationChange = (page: number, size?: number) => {
    setCurrentPage(page)
    if (size) setPageSize(size)
  }

  const columns: ColumnsType<Reservation> = [
    {
      title: "Mã đặt bàn",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <span className="font-medium">{id}</span>
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: Reservation) => (
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
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => {
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
      render: (text: string) => <span className="text-gray-700">{text || "-"}</span>
    },
    {
      title: "Tạo lúc",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleString()
    },
    activeTab === "pending" && {
      title: <div className="text-center">Hành động</div>,
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex justify-center gap-2">
          <Button
            type="primary"
            onClick={() => {
              setArrangement(record)
            }}
          >
            Xác nhận
          </Button>
          <Button danger onClick={() => handleAction(record)}>
            Từ chối
          </Button>
        </div>
      )
    },
    (activeTab === "confirmed" || activeTab === "completed") && {
      title: <div className="text-center">Trạng thái bàn</div>,
      key: "action",
      render: (_: any, record: Reservation) => {
        const findReservation = listCheckAssignedTable?.find((item) => item.reservation_id === record.id)?.assigned
        return (
          <div className="flex justify-center">
            <Tag color={`${findReservation === true ? "blue" : "red"}`} className={`px-2 py-1 rounded-md text-white`}>
              {findReservation === true ? "Đã xếp bàn" : "Chưa xếp bàn"}
            </Tag>
          </div>
        )
      }
    },
    (activeTab === "confirmed" || activeTab === "completed") && {
      title: <div className="text-center">Số bàn</div>,
      dataIndex: "dining_table_number",
      key: "dining_table_number",
      render: (_: string, record: Reservation) => {
        const findTableNumber = listCheckAssignedTable?.find(
          (item) => item.reservation_id === record.id
        )?.dining_table_number
        return <span className="text-gray-700 font-semibold text-center block">{findTableNumber || "-"}</span>
      }
    },
    (activeTab === "confirmed" || activeTab === "completed") && {
      title: <div className="text-center">Phiên bàn</div>,
      dataIndex: "session_id",
      key: "session_id",
      render: (_: string, record: Reservation) => {
        const findTableSession = listCheckAssignedTable?.find((item) => item.reservation_id === record.id)?.session_id
        return <span className="text-gray-700 font-semibold text-center block">{findTableSession || "-"}</span>
      }
    }
  ].filter(Boolean) as ColumnsType<Reservation>

  const onTabChange = (key: string) => {
    setActiveTab(key as typeof activeTab)
    setCurrentPage(1) // reset page khi đổi tab
  }

  const countByStatus = {
    pending: listReservation?.filter((r) => r.status === 0).length || 0,
    confirmed: listReservation?.filter((r) => r.status === 1).length || 0,
    cancelled: listReservation?.filter((r) => r.status === 2).length || 0,
    completed: listReservation?.filter((r) => r.status === 3).length || 0
  }

  const mutationUpdateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) =>
      reservationsAPI.update(id, {
        status
      }),

    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công 🎉", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listReservation", queryConfig] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại ❌", {
        autoClose: 1500
      })
    }
  })

  const handleAction = (record: any) => {
    mutationUpdateStatus.mutate({ id: record.id, status: 2 })
  }

  const [filterForm] = Form.useForm()

  const handleApplyForm = (values: any) => {
    const reservedAt = values.reserved_at ? dayjs(values.reserved_at).format("YYYY-MM-DD HH:mm:ss") : undefined

    const params: queryParamConfigReservation = cleanObject({
      ...queryConfig,
      page: 1,
      customer_name: values.customer_name,
      customer_phone: values.customer_phone,
      reserved_at: reservedAt
    })
    navigate({
      pathname: `${path.AdminReservations}`,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const filteredSearch = omit(queryConfig, ["customer_name", "customer_phone", "reserved_at"])
    navigate({ pathname: `${path.AdminReservations}`, search: createSearchParams(filteredSearch).toString() })
    filterForm.resetFields()
  }

  const { data: dataListCheckAssignedTable } = useQuery({
    queryKey: ["listCheckAssignedTables", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return reservationsAPI.getListCheckAssignedTables(controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const listCheckAssignedTable = dataListCheckAssignedTable?.data.data as ReservationCheckAssignTable[]

  const [arrangement, setArrangement] = useState<Reservation | null>(null)

  return (
    <div>
      <Helmet>
        <title>Danh sách đặt bàn của khách hàng</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách đặt bàn của khách hàng
      </h1>

      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={[
          {
            label: `Chờ (${countByStatus.pending})`,
            key: "pending"
          },
          {
            label: `Xác nhận (${countByStatus.confirmed})`,
            key: "confirmed"
          },
          {
            label: `Đã hủy (${countByStatus.cancelled})`,
            key: "cancelled"
          },
          {
            label: `Hoàn thành (${countByStatus.completed})`,
            key: "completed"
          }
        ]}
      />

      <div className="mt-2 mb-4">
        <Form
          form={filterForm}
          layout="inline"
          onFinish={handleApplyForm}
          className="flex flex-wrap justify-between items-center w-full"
          initialValues={{ capacity: undefined, status: undefined, is_active: undefined }}
        >
          <div className="flex items-center gap-1">
            <div className="text-[15px] font-semibold">Bộ lọc & tìm kiếm: </div>
            <Form.Item name="customer_name">
              <Input placeholder="Tên người đặt..." className="w-42" />
            </Form.Item>

            <Form.Item name="customer_phone">
              <Input placeholder="Số điện thoại..." className="w-42" />
            </Form.Item>

            <Form.Item name="reserved_at">
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="YYYY-MM-DD HH:mm"
                placeholder="Chọn ngày & giờ"
                className="w-56"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<Filter size={16} />}>
                Lọc
              </Button>
            </Form.Item>

            <Form.Item>
              <Button icon={<RotateCcw size={16} />} onClick={resetFilterForm}>
                Reset
              </Button>
            </Form.Item>
          </div>
          <div>
            <ArrangementTable queryConfig={queryConfig} arrangement={arrangement} setArrangement={setArrangement} />
          </div>
        </Form>
      </div>

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
      ) : (filteredReservations as Reservation[])?.length === 0 ? (
        <Empty description="Không có đặt bàn hợp lệ" className="mt-16" />
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={paginatedReservations as Reservation[]}
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
              current={currentPage}
              total={(filteredReservations || []).length}
              pageSize={pageSize}
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
