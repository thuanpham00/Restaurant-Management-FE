import { Card, Descriptions, Table, Tag, Spin } from "antd"
import { Helmet } from "react-helmet-async"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"

const getStatusTag = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="gold">Chưa thanh toán</Tag>
    case 1:
      return <Tag color="blue">Thanh toán một phần</Tag>
    case 2:
      return <Tag color="green">Đã thanh toán đủ</Tag>
    case 3:
      return <Tag color="volcano">Đã hủy</Tag>
    default:
      return <Tag color="default">Không xác định</Tag>
  }
}

const getStatusTagPayment = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="gold">Đang chờ xử lý</Tag>
    case 1:
      return <Tag color="blue">Đã hoàn thành</Tag>
    case 2:
      return <Tag color="green">Không thành công</Tag>
    case 3:
      return <Tag color="volcano">Đã hoàn tiền</Tag>
    default:
      return <Tag color="default">Không xác định</Tag>
  }
}

const paymentMethodLabel = (method: number) => {
  switch (method) {
    case 0:
      return "Tiền mặt"
    case 1:
      return "Chuyển khoản"
    case 2:
      return "Thẻ"
    default:
      return "Khác"
  }
}

export default function InvoiceDetail() {
  const { id } = useParams()

  const { data: dataDetailInvoice, isFetching } = useQuery({
    queryKey: ["listDetailInvoice", id],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return invoicePaymentAPI.getDetailInvoice(id as string)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    enabled: Boolean(id),
    placeholderData: keepPreviousData
  })

  const detailInvoice = dataDetailInvoice?.data?.data

  const columns = [
    {
      title: "Mã thanh toán",
      dataIndex: "id",
      key: "id"
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: string) => <div className="text-red-500 font-semibold">{Number(amount).toLocaleString()} ₫</div>
    },
    {
      title: "Phương thức",
      dataIndex: "method",
      key: "method",
      render: (method: number) => paymentMethodLabel(method)
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => getStatusTagPayment(status)
    },
    {
      title: "Nhân viên xử lý",
      dataIndex: ["employee", "full_name"],
      key: "employee",
      render: (name: string) => name || "-"
    },
    {
      title: "Thời gian thanh toán",
      dataIndex: "paid_at",
      key: "paid_at",
      render: (time: string) => (time ? new Date(time).toLocaleString("vi-VN") : "-")
    }
  ]

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Spin size="large" />
      </div>
    )
  }

  if (!detailInvoice) {
    return <div className="text-center text-gray-500 mt-10">Không có dữ liệu</div>
  }

  return (
    <div>
      <Helmet>
        <title>Chi tiết hóa đơn</title>
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        Chi tiết hóa đơn #{detailInvoice.id}
      </h1>

      <Card title="Thông tin hóa đơn" bordered className="shadow-md rounded-2xl mt-2">
        <Descriptions bordered column={2} labelStyle={{ fontWeight: 600 }}>
          <Descriptions.Item label="Mã hóa đơn">{detailInvoice.id}</Descriptions.Item>
          <Descriptions.Item label="Mã phiên bàn">{detailInvoice.table_session_id}</Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            {Number(detailInvoice.total_amount).toLocaleString()} ₫
          </Descriptions.Item>
          <Descriptions.Item label="Giảm giá">{Number(detailInvoice.discount).toLocaleString()} %</Descriptions.Item>
          <Descriptions.Item label="Thuế">{Number(detailInvoice.tax).toLocaleString()} %</Descriptions.Item>
          <Descriptions.Item label="Thành tiền cuối cùng">
            <span className="font-semibold text-green-600 text-lg">
              {Number(detailInvoice.final_amount).toLocaleString()} ₫
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            {getStatusTag(detailInvoice.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {new Date(detailInvoice.created_at).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật gần nhất">
            {new Date(detailInvoice.updated_at).toLocaleString("vi-VN")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Lịch sử thanh toán" bordered className="mt-4 shadow-md rounded-2xl">
        <Table rowKey="id" columns={columns} dataSource={detailInvoice.payments || []} pagination={false} />
      </Card>
    </div>
  )
}
