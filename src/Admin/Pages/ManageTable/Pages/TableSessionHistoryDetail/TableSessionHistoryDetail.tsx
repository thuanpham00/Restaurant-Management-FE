/* eslint-disable @typescript-eslint/no-explicit-any */
import { Descriptions, Table, Tag, Spin, Empty, Row, Col, Card, Image } from "antd"
import { ColumnsType } from "antd/es/table"
import { useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { HistoryTableSessionDetail } from "src/Types/utils.type"
import { adminAPI } from "src/Apis/admin.api"
import { Helmet } from "react-helmet-async"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { assets } from "src/Assets/assets"
import { renderSessionStatus, renderSessionType } from "../TableDetail/TableDetail"

export default function TableSessionHistoryDetail() {
  const { state } = useLocation()
  const idDiningTable = state?.idDiningTable
  const idTableSession = state?.idTableSession

  const { data, isFetching, isError } = useQuery({
    queryKey: ["detailTableSession", idDiningTable, idTableSession],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return adminAPI.tableSession.getHistoryTableSessionDetailByIdTableAndIdTableSession(idDiningTable, idTableSession)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    enabled: Boolean(idDiningTable) && Boolean(idTableSession)
  })

  const dataHistoryTableSessionDetail = data?.data?.data as HistoryTableSessionDetail

  if (isFetching) return <Spin size="large" className="block mx-auto my-10" />
  if (isError || !dataHistoryTableSessionDetail)
    return <Empty description="Không có dữ liệu phiên bàn" className="my-10" />

  const orderColumns: ColumnsType<any> = [
    {
      title: "Ảnh",
      dataIndex: ["dish", "image"],
      key: "image",
      render: (_: any, item: any) => (
        <div>
          {item.dish.image ? (
            <Image
              src={item.dish.image}
              alt={item.dish.dish_name}
              className="rounded-md object-cover"
              width={64}
              height={64}
            />
          ) : (
            <Image
              src={assets.rectangles.Burger}
              alt={item.dish.dish_name}
              className="rounded-md object-cover"
              width={64}
              height={64}
            />
          )}
        </div>
      )
    },
    {
      title: "Tên món",
      dataIndex: ["dish", "name"],
      key: "name",
      render: (_: any, item: any) => item.dish.name
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity"
    },
    {
      title: "Đơn giá",
      dataIndex: ["dish", "price"],
      key: "price",
      render: (_: any, item: any) => item.price
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price"
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes"
    }
  ]

  return (
    <div>
      <Helmet>
        <title>Lịch sử chi tiết phiên bàn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Lịch sử chi tiết phiên bàn {idTableSession}
      </h1>

      <Row gutter={12}>
        <Col span={12} className="space-y-4">
          <Descriptions
            title="Thông tin phiên bàn"
            bordered
            column={2}
            size="middle"
            labelStyle={{ fontWeight: 500, background: "#fafafa" }}
            contentStyle={{ background: "#fff" }}
          >
            <Descriptions.Item label="Mã phiên">{dataHistoryTableSessionDetail.session_id}</Descriptions.Item>
            <Descriptions.Item label="Bàn số">{dataHistoryTableSessionDetail.table_number}</Descriptions.Item>
            <Descriptions.Item label="Sức chứa">{dataHistoryTableSessionDetail.table_capacity}</Descriptions.Item>
            <Descriptions.Item label="Loại phiên">
              {renderSessionType(dataHistoryTableSessionDetail.session_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {renderSessionStatus(dataHistoryTableSessionDetail.session_status)}
            </Descriptions.Item>
            <Descriptions.Item label="Bắt đầu">{dataHistoryTableSessionDetail.started_at}</Descriptions.Item>
            <Descriptions.Item label="Kết thúc">{dataHistoryTableSessionDetail.ended_at}</Descriptions.Item>
            <Descriptions.Item label="Nhân viên">{dataHistoryTableSessionDetail.employee_id}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{dataHistoryTableSessionDetail.customer_id}</Descriptions.Item>
          </Descriptions>

          {/* Thông tin reservation */}
          {dataHistoryTableSessionDetail.reservation && (
            <Descriptions
              title="Thông tin đặt trước"
              bordered
              column={2}
              size="middle"
              labelStyle={{ fontWeight: 500, background: "#fafafa" }}
              contentStyle={{ background: "#fff" }}
            >
              <Descriptions.Item label="Mã đặt">
                {dataHistoryTableSessionDetail.reservation.reservation_id}
              </Descriptions.Item>
              <Descriptions.Item label="Khách">
                {dataHistoryTableSessionDetail.reservation.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {dataHistoryTableSessionDetail.reservation.customer_phone}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {dataHistoryTableSessionDetail.reservation.customer_gender}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {dataHistoryTableSessionDetail.reservation.customer_address}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {dataHistoryTableSessionDetail.reservation.reserved_at}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng người">
                {dataHistoryTableSessionDetail.reservation.number_of_people}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">{dataHistoryTableSessionDetail.reservation.notes}</Descriptions.Item>
            </Descriptions>
          )}
        </Col>

        <Col span={12}>
          {dataHistoryTableSessionDetail.orders.map((order, idx) => (
            <Card key={idx} className="mb-4 rounded-lg shadow-sm" bodyStyle={{ padding: "0.5rem" }}>
              <div className="flex justify-between items-center bg-blue-50 p-2 border-b border-gray-200">
                <div className="text-lg font-semibold text-blue-700">Order ID: {order.order_id}</div>
                <Tag color="red" className="font-semibold text-lg">
                  Tổng: {order.total_amount}đ
                </Tag>
              </div>

              {/* Table */}
              <div className="mt-2 overflow-x-auto">
                <Table
                  rowKey="order_item_id"
                  dataSource={order.items}
                  columns={orderColumns}
                  pagination={false}
                  bordered
                  size="small"
                  rowClassName={(_, index) =>
                    index % 2 === 0
                      ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
                      : "bg-white hover:bg-blue-50 transition-colors"
                  }
                />
              </div>
            </Card>
          ))}
        </Col>
      </Row>
    </div>
  )
}
// header={`Order ID: ${order.order_id} - Tổng: ${order.total_amount}`}
