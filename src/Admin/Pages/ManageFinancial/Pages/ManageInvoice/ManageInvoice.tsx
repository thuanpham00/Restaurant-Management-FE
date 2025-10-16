import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Empty, Pagination, Space, Spin, Table, Tag, Typography } from "antd"
import { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { isUndefined, omitBy } from "lodash"
import { Helmet } from "react-helmet-async"
import { Link, useSearchParams } from "react-router-dom"
import { Fragment } from "react/jsx-runtime"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import useQueryParams from "src/Hook/useQueryParams"
import { Invoice } from "src/Types/invoicePayment.type"
import { queryParamConfigInvoice } from "src/Types/queryParams.type"
import { GitBranch, Merge } from "lucide-react"

const { Text } = Typography

export default function ManageInvoice() {
  const queryParams: queryParamConfigInvoice = useQueryParams()
  const queryConfig: queryParamConfigInvoice = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "5"
    },
    isUndefined
  )

  const { data, isFetching } = useQuery({
    queryKey: ["listInvoice", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return invoicePaymentAPI.getList(queryConfig, controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data
  const listPromotion = paginated?.data

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const columns: ColumnsType<Invoice> = [
    {
      title: "Mã hóa đơn",
      dataIndex: "id",
      key: "id",
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: "Mã phiên bàn",
      dataIndex: "table_session_id",
      key: "table_session_id"
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value: string) => (
        <span>{Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</span>
      )
    },
    {
      title: "Giảm giá",
      dataIndex: "discount",
      key: "discount",
      render: (value: string) => (
        <span>{Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</span>
      )
    },
    {
      title: "Thuế",
      dataIndex: "tax",
      key: "tax",
      render: (value: string) => (
        <span>{Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</span>
      )
    },
    {
      title: "Thành tiền",
      dataIndex: "final_amount",
      key: "final_amount",
      render: (value: string) => (
        <span className="font-semibold text-red-500 text-center block">
          {Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
        </span>
      )
    },
    {
      title: "Loại & Quan hệ",
      key: "type_relationship",
      width: 200,
      render: (_: unknown, record: Invoice) => {
        if (!record.operation_type) {
          return <Tag color="default">Bình thường</Tag>
        }

        if (record.operation_type === "split_invoice") {
          return (
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Tag color="purple" icon={<GitBranch size={12} />}>
                Đã tách
              </Tag>
              {record.split_percentage && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.split_percentage}% từ{" "}
                  {record.parent_invoice_id && (
                    <Link to={`/admin/manage-invoice/${record.parent_invoice_id}`} className="text-blue-500">
                      #{record.parent_invoice_id}
                    </Link>
                  )}
                </Text>
              )}
            </Space>
          )
        }

        if (record.operation_type === "merge_invoice") {
          return (
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Tag color="cyan" icon={<Merge size={12} />}>
                Đã gộp
              </Tag>
            </Space>
          )
        }

        return <Tag>{record.operation_type}</Tag>
      }
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => {
        let text = ""
        let color: string | undefined = ""

        switch (status) {
          case 0:
            text = "Chưa thanh toán"
            color = "orange"
            break
          case 1:
            text = "Thanh toán trước 1 phần"
            color = "blue"
            break
          case 2:
            text = "Thanh toán đủ"
            color = "green"
            break
          case 3:
            text = "Đã hủy"
            color = "red"
            break
          default:
            text = "Không xác định"
            color = "default"
        }

        return <Tag color={color}>{text}</Tag>
      }
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm")
    },
    {
      title: "Cập nhật",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm")
    },
    {
      title: <div className="text-center">Hành động</div>,
      key: "action",
      fixed: "right", // nếu muốn luôn hiển thị khi scroll ngang
      width: 120,
      render: (_, record: Invoice) => (
        <Link to={`/admin/invoices/${record.id}`} className="text-blue-500 text-center block">
          Xem chi tiết
        </Link>
      )
    }
  ]

  return (
    <div>
      <Helmet>
        <title>Quản lý hóa đơn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách hóa đơn
      </h1>

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
      ) : (listPromotion as Invoice[])?.length === 0 ? (
        <Empty description="Không có khuyến mãi hợp lệ" className="mt-16" />
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={listPromotion as Invoice[]}
            pagination={false}
            bordered={true}
            rowClassName={(_, index) =>
              index % 2 === 0
                ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
                : "bg-white hover:bg-blue-50 transition-colors"
            }
          />

          <div style={{ marginTop: 16, textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
            <Pagination
              current={parseInt(queryConfig.page as string)}
              total={paginated?.total}
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
