/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Col, Collapse, DatePicker, Descriptions, Form, Input, Row, Spin, Table, Tag } from "antd"
import { useEffect, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation } from "react-router-dom"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { adminAPI } from "src/Apis/admin.api"
import { assets } from "src/Assets/assets"
import "./TableDetail.css"
import { TableSessionDetail, TableSessionOrder } from "src/Types/utils.type"
import dayjs from "dayjs"
import InfoTable from "../ManageTable/Components/InfoTable"
import HistoryTableSession from "../ManageTable/Components/HistoryTableSession/HistoryTableSession"

const renderSessionType = (type: number) => {
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

const renderSessionStatus = (status: number) => {
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

const renderOrderItemStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="default">Đã gọi món</Tag>
    case 1:
      return <Tag color="processing">Đang chế biến</Tag>
    case 2:
      return <Tag color="warning">Đã phục vụ</Tag>
    case 3:
      return <Tag color="error">Đã hủy</Tag>
    default:
      return <Tag>Đã gọi món</Tag>
  }
}

const { Panel } = Collapse

export default function TableDetail() {
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

      <Row gutter={16}>
        <Col span={6}>
          <InfoTable
            dataTable={dataTable}
            form={updateTableForm}
            dataTableSessionDetail={dataTableSessionDetail}
            dataTableSessionOrder={dataTableSessionOrder}
          />
          <HistoryTableSession idDiningTable={idDiningTable} />
        </Col>
        <Col span={18}>
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
                                  <img
                                    src={record.dish.image}
                                    alt={record.dish.dish_name}
                                    className="w-12 h-12 rounded-md object-cover"
                                  />
                                ) : (
                                  <img
                                    src={assets.rectangles.Burger}
                                    alt={record.dish.dish_name}
                                    className="w-12 h-12 rounded-md object-cover"
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
                            render: (val: number) => renderOrderItemStatus(val),
                            align: "center"
                          },
                          {
                            title: "Ghi chú",
                            dataIndex: "notes",
                            key: "notes",
                            align: "left"
                          }
                        ]}
                      />
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
