/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Form,
  Image,
  Input,
  Row,
  Select,
  Spin,
  Table,
  Tag
} from "antd"
import { useEffect, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation } from "react-router-dom"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { adminAPI } from "src/Apis/admin.api"
import { assets } from "src/Assets/assets"
import "./TableDetail.css"
import { TableSessionDetail, TableSessionOrder } from "src/Types/utils.type"
import dayjs from "dayjs"
import InfoTable from "../../Components/InfoTable"
import HistoryTableSession from "../../Components/HistoryTableSession/HistoryTableSession"
import { CookingPot } from "lucide-react"
import { toast } from "react-toastify"

export const renderSessionType = (type: number) => {
  switch (type) {
    case 0:
      return <Tag color="blue">Offline</Tag>
    case 1:
      return <Tag color="purple">Ghép bàn</Tag>
    case 2:
      return <Tag color="orange">Đặt trước</Tag>
    case 3:
      return <Tag color="green">Tách bàn</Tag>
    default:
      return <Tag>Khác</Tag>
  }
}

export const renderSessionStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="default">Chờ</Tag>
    case 1:
      return <Tag color="processing">Đang phục vụ</Tag>
    case 2:
      return <Tag color="warning">Thanh toán</Tag>
    case 3:
      return <Tag color="success">Hoàn tất</Tag>
    case 4:
      return <Tag color="error">Hủy</Tag>
    default:
      return <Tag>Không rõ</Tag>
  }
}

const renderOrderStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="default">Chờ</Tag>
    case 1:
      return <Tag color="processing">Đang chế biến</Tag>
    case 2:
      return <Tag color="warning">Đã phục vụ</Tag>
    case 3:
      return <Tag color="success">Đã thanh toán</Tag>
    case 4:
      return <Tag color="error">Đã hủy</Tag>
    default:
      return <Tag>Chờ</Tag>
  }
}

const orderItemStatusOptions = [
  { label: "Đã gọi món", value: 0 },
  { label: "Đang chế biến", value: 1 },
  { label: "Đã phục vụ", value: 2 },
  { label: "Đã Hủy", value: 3 }
]

const { Panel } = Collapse

export default function TableDetail() {
  const queryClient = useQueryClient()

  const { state } = useLocation()
  const dataTable = state?.dataTable
  const nameTable = state?.tableName
  const idDiningTable = dataTable.dining_table_id

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["detailTableSession", idDiningTable],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return adminAPI.tableSession.getDetailTableSessionByIdTable(idDiningTable)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: Boolean(idDiningTable)
  })

  const dataTableSessionDetail = data?.data?.data as TableSessionDetail

  const { data: dataTableSessionOrderRes, isFetching: isFetchingDataTableSessionOrder } = useQuery({
    queryKey: ["detailTableSessionOrder", dataTableSessionDetail?.session_id],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return adminAPI.tableSession.getDetailTableSessionOrderByIdTable(dataTableSessionDetail?.session_id)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: Boolean(dataTableSessionDetail)
  })

  const dataTableSessionOrder = dataTableSessionOrderRes?.data?.data[0] as TableSessionOrder

  const [hasSession, setHasSession] = useState(true)

  useEffect(() => {
    if (isError) {
      const message = (error as any).response?.data.message
      if (message === "No session found for Dining Table: " + idDiningTable) {
        setHasSession(false)
      }
    }
  }, [isError, error, idDiningTable])

  const [updateTableForm] = Form.useForm()
  const tableNumber = Form.useWatch("table_number", updateTableForm)

  const [orderItemListStatus, setOrderItemListStatus] = useState<Record<string, number>>({})

  const handleChangeItemStatus = (orderItemId: string, newStatus: number) => {
    setOrderItemListStatus((prev) => ({
      ...prev,
      [orderItemId]: newStatus // thêm mới hoặc ghi đè
    }))
  }

  const updateListOrderItemMutation = useMutation({
    mutationFn: (item: Record<string, number>) => {
      return adminAPI.orderItems.updateStatusListOrderItem(item)
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái món ăn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
      queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", dataTableSessionDetail?.session_id] })
    }
  })

  const handleUpdateStatusOrderItemList = () => {
    updateListOrderItemMutation.mutate(orderItemListStatus)
  }

  return (
    <div className="table-detail">
      <Helmet>
        <title>Chi tiết bàn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Chi tiết bàn {tableNumber || nameTable}
        <span className="text-black">-</span>
        <span className="text-red-500"> {dataTableSessionDetail?.dining_table_id}</span>
      </h1>

      <Row gutter={16} style={{ overflow: "hidden" }}>
        <Col span={6}>
          <InfoTable
            dataTable={dataTable}
            form={updateTableForm}
            dataTableSessionDetail={dataTableSessionDetail}
            dataTableSessionOrder={dataTableSessionOrder}
          />
          <HistoryTableSession idDiningTable={idDiningTable} />
        </Col>
        <Col
          span={18}
          style={{
            height: 500,
            overflowY: "auto",
            overflowX: "hidden"
          }}
        >
          {hasSession ? (
            isFetching ? (
              <div className="flex justify-center items-center flex-col h-[200px]">
                <Spin tip="Đang tải dữ liệu..." size="large" spinning={isFetching}>
                  <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
                </Spin>
              </div>
            ) : (
              <Collapse defaultActiveKey={["sessionInfo", "orderInfo"]} bordered={false}>
                {/* Panel 1: Thông tin phiên bàn */}
                <Panel
                  key="sessionInfo"
                  header={<h2 className="text-lg font-semibold text-gray-700">Thông tin phiên bàn hiện tại</h2>}
                >
                  <Form
                    layout="vertical"
                    initialValues={{
                      session_id: dataTableSessionDetail?.session_id,
                      session_type: dataTableSessionDetail?.session_type,
                      session_status: dataTableSessionDetail?.session_status,
                      started_at: dataTableSessionDetail?.started_at ? dayjs(dataTableSessionDetail.started_at) : null,
                      ended_at: dataTableSessionDetail?.ended_at ? dayjs(dataTableSessionDetail.ended_at) : null,
                      reservation_number_of_people: dataTableSessionDetail?.reservation_number_of_people,
                      reservation_notes: dataTableSessionDetail?.reservation_notes,
                      reservation_reserved_at: dataTableSessionDetail?.reservation_reserved_at
                        ? dayjs(dataTableSessionDetail.reservation_reserved_at)
                        : null
                    }}
                  >
                    <Descriptions
                      bordered
                      column={2}
                      size="middle"
                      styles={{
                        label: { fontWeight: 500, background: "#fafafa" },
                        content: { background: "#fff" }
                      }}
                    >
                      <Descriptions.Item label="Mã phiên">
                        <Form.Item name="session_id" noStyle>
                          <Input disabled />
                        </Form.Item>
                      </Descriptions.Item>

                      <Descriptions.Item label="Loại phiên">
                        <Form.Item name="session_type" noStyle>
                          <div>{renderSessionType(dataTableSessionDetail?.session_type)}</div>
                        </Form.Item>
                      </Descriptions.Item>

                      <Descriptions.Item label="Trạng thái" span={2}>
                        <Form.Item name="session_status" noStyle>
                          <div>{renderSessionStatus(dataTableSessionDetail?.session_status)}</div>
                        </Form.Item>
                      </Descriptions.Item>

                      <Descriptions.Item label="Bắt đầu">
                        <Form.Item name="started_at" noStyle>
                          <DatePicker showTime style={{ width: "100%" }} disabled />
                        </Form.Item>
                      </Descriptions.Item>

                      <Descriptions.Item label="Kết thúc">
                        <Form.Item name="ended_at" noStyle>
                          <DatePicker showTime style={{ width: "100%" }} disabled />
                        </Form.Item>
                      </Descriptions.Item>

                      <Descriptions.Item label="Thời gian đặt" span={1}>
                        <Form.Item name="reservation_reserved_at" noStyle>
                          <DatePicker showTime style={{ width: "100%" }} disabled />
                        </Form.Item>
                      </Descriptions.Item>

                      <Descriptions.Item label="Số người đặt" span={1}>
                        <Form.Item name="reservation_number_of_people" noStyle>
                          <Input type="number" disabled />
                        </Form.Item>
                      </Descriptions.Item>

                      <Descriptions.Item label="Ghi chú" span={2}>
                        <Form.Item name="reservation_notes" noStyle>
                          <Input.TextArea rows={2} disabled />
                        </Form.Item>
                      </Descriptions.Item>
                    </Descriptions>
                  </Form>

                  <h3 className="text-md font-semibold my-4 text-gray-700">Thông tin khách hàng</h3>
                  <Descriptions
                    bordered
                    column={2}
                    size="middle"
                    styles={{
                      label: { fontWeight: 500, background: "#fafafa" },
                      content: { background: "#fff" }
                    }}
                  >
                    <Descriptions.Item label="Tên khách">{dataTableSessionDetail?.customer_name}</Descriptions.Item>
                    <Descriptions.Item label="Giới tính">{dataTableSessionDetail?.customer_gender}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại" span={2}>
                      {dataTableSessionDetail?.customer_phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      {dataTableSessionDetail?.customer_address}
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>

                {/* Panel 2: Thông tin Order */}
                <Panel
                  key="orderInfo"
                  header={
                    <h2 className="text-lg font-semibold text-gray-700">
                      Thông tin món ăn hiện tại <span className="text-red-500">#{dataTableSessionOrder?.order_id}</span>
                    </h2>
                  }
                >
                  {isFetchingDataTableSessionOrder ? (
                    <div className="flex justify-center items-center flex-col h-[200px]">
                      <Spin tip="Đang tải dữ liệu..." size="large" spinning={isFetching}>
                        <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
                      </Spin>
                    </div>
                  ) : (
                    <>
                      <Descriptions
                        bordered
                        column={2}
                        size="middle"
                        styles={{
                          label: { fontWeight: 500, background: "#fafafa" },
                          content: { background: "#fff" }
                        }}
                      >
                        <Descriptions.Item label="Trạng thái đơn" span={2}>
                          {renderOrderStatus(dataTableSessionOrder?.order_status)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng tiền" span={2}>
                          <span className="text-red-500 font-semibold">
                            {Number(dataTableSessionOrder?.total_amount).toLocaleString("vi-VN")} đ
                          </span>
                        </Descriptions.Item>
                      </Descriptions>

                      <h3 className="text-md font-semibold my-4 text-gray-700">Danh sách món ăn</h3>
                      <Table
                        bordered
                        rowKey="order_item_id"
                        pagination={false}
                        dataSource={dataTableSessionOrder?.items}
                        columns={[
                          {
                            title: "Món ăn",
                            dataIndex: ["dish", "dish_name"],
                            key: "dish_name",
                            render: (_: any, record: any) => (
                              <div className="flex items-center gap-2">
                                {record.dish.image ? (
                                  <Image
                                    src={record.dish.image}
                                    alt={record.dish.dish_name}
                                    className=" rounded-md object-cover"
                                    width={64}
                                    height={64}
                                  />
                                ) : (
                                  <Image
                                    src={assets.rectangles.Burger}
                                    alt={record.dish.dish_name}
                                    className="w-12 h-12 rounded-md object-cover"
                                    width={64}
                                    height={64}
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{record.dish.dish_name}</p>
                                  <p className="text-xs text-gray-500">{record.dish.category_name}</p>
                                </div>
                              </div>
                            )
                          },
                          {
                            title: "Số lượng",
                            dataIndex: "quantity",
                            key: "quantity",
                            align: "center"
                          },
                          {
                            title: "Đơn giá",
                            dataIndex: "item_price",
                            key: "item_price",
                            render: (val: string) => `${Number(val).toLocaleString("vi-VN")} đ`,
                            align: "right"
                          },
                          {
                            title: "Thành tiền",
                            dataIndex: "total_price",
                            key: "total_price",
                            render: (val: string) => `${Number(val).toLocaleString("vi-VN")} đ`,
                            align: "right"
                          },
                          {
                            title: "Trạng thái",
                            dataIndex: "item_status",
                            key: "item_status",
                            render: (val: number, record: any) => (
                              <Select
                                value={orderItemListStatus[record.order_item_id] || val}
                                style={{ width: 140 }}
                                onChange={(newStatus) => handleChangeItemStatus(record.order_item_id, newStatus)}
                                options={orderItemStatusOptions}
                              />
                            ),
                            align: "center"
                          },
                          {
                            title: "Ghi chú",
                            dataIndex: "notes",
                            key: "notes",
                            align: "left"
                          }
                        ]}
                        rowClassName={(record, index) =>
                          index % 2 === 0
                            ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
                            : "bg-white hover:bg-blue-50 transition-colors"
                        }
                      />

                      <div className="flex justify-end">
                        <Button
                          className="mt-2 py-5"
                          type="primary"
                          icon={<CookingPot />}
                          onClick={handleUpdateStatusOrderItemList}
                        >
                          Cập nhật trạng thái món ăn
                        </Button>
                      </div>
                    </>
                  )}
                </Panel>
              </Collapse>
            )
          ) : (
            <div>Chưa có phiên bàn</div>
          )}
        </Col>
      </Row>
    </div>
  )
}
