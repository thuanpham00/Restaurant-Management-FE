/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography
} from "antd"
import { Fragment, useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation } from "react-router-dom"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { tableSessionAPI, orderItemsAPI, menusAPI } from "src/Apis/Admin"
import { assets } from "src/Assets/assets"
import "./TableDetail.css"
import { TableSessionDetail, TableSessionOrder } from "src/Types/tableSession.type"
import dayjs from "dayjs"
import InfoTable from "../../Components/InfoTable"
import HistoryTableSession from "../../Components/HistoryTableSession/HistoryTableSession"
import { ChefHat, CookingPot, HandCoins } from "lucide-react"
import { toast } from "react-toastify"
import { ColumnsType } from "antd/es/table"

const { Search } = Input
const { Title } = Typography

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
      return <Tag color="success">Hoàn tất</Tag>
    case 3:
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
      return tableSessionAPI.getDetailTableSessionByIdTable(idDiningTable)
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
      return tableSessionAPI.getDetailTableSessionOrderByIdTable(dataTableSessionDetail?.session_id)
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

  const [orderItemListStatus, setOrderItemListStatus] = useState<Record<string, { status: number; quantity: number }>>(
    {}
  )

  const handleChangeItem = (
    orderItemId: string,
    type: keyof { status: number; quantity: number },
    newValueChange: number
  ) => {
    setOrderItemListStatus((prev) => ({
      ...prev,
      [orderItemId]: {
        ...prev[orderItemId],
        [type]: newValueChange
      }
    }))
  }

  const updateListOrderItemMutation = useMutation({
    mutationFn: (item: Record<string, { status: number; quantity: number }>) => {
      return orderItemsAPI.updateListOrderItem(item)
    },
    onSuccess: () => {
      toast.success("Cập nhật order thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
      queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", dataTableSessionDetail?.session_id] })
    }
  })

  const handleUpdateOrderItemList = () => {
    updateListOrderItemMutation.mutate(orderItemListStatus)
  }

  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: listDishMenuInActiveData, isLoading: isLoadingDishes } = useQuery({
    queryKey: ["ListDishInMenuActive", dataTableSessionDetail?.session_id],
    queryFn: () => menusAPI.getMenuItemFromMenuActive(),
    enabled: isModalOpen
  })

  const listDishMenuInActive = listDishMenuInActiveData?.data?.data?.items

  const columnsListDishMenuInActive: ColumnsType<any> = [
    {
      title: <div className="text-center">Chọn</div>,
      width: 70,
      fixed: "left",
      render: (_: any, record: any) => (
        <div className="text-center">
          <Checkbox
            checked={listOrderAdd.some((item) => item.dish_id === record.dish_id)}
            onChange={(e) => handleChangeCheckOrder(record, e.target.checked)}
          />
        </div>
      )
    },
    {
      title: "Mã order",
      dataIndex: "index",
      key: "index",
      width: 100,
      render: (_, record) => record.id
    },
    {
      title: "Tên món ăn",
      dataIndex: "dish_name",
      key: "dish_name",
      width: 150,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          {record.image ? (
            <Image
              src={record.image}
              alt={record.dish_name}
              className="rounded-md object-cover"
              width={64}
              height={64}
            />
          ) : (
            <Image
              src={assets.rectangles.Burger}
              alt={record.dish_name}
              className="rounded-md object-cover"
              width={64}
              height={64}
            />
          )}
          <div>
            <p className="font-medium">{record.dish_name}</p>
          </div>
        </div>
      )
    },
    {
      title: "Mô tả món ăn",
      dataIndex: "notes",
      key: "notes",
      width: 130
    },
    {
      title: "Giá gốc món ăn",
      dataIndex: "price_base",
      key: "price_base",
      width: 90
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price",
      width: 90
    }
  ]

  const [searchText, setSearchText] = useState("")

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return listDishMenuInActive
    return (listDishMenuInActive || []).filter((item) =>
      item.dish_name?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText, listDishMenuInActive])

  const columnListDishSelected: ColumnsType<any> = [
    {
      title: "Món ăn",
      dataIndex: "name_dish",
      key: "name_dish"
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (_, _record, index) => (
        <InputNumber
          min={1}
          defaultValue={1}
          onChange={(value) => {
            if (value === null) return // nếu null thì bỏ qua
            const newList = [...listOrderAdd]
            newList[index].quantity = value
            newList[index].total_price = value * newList[index].price
            setListOrderAdd(newList)
          }}
        />
      )
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      render: (price) => <div className="text-red-500">{price.toLocaleString()}đ</div>
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (_, record) => (
        <div className="text-red-500 font-semibold">{((record.quantity || 1) * record.price).toLocaleString()}đ</div>
      )
    }
  ]

  const [listOrderAdd, setListOrderAdd] = useState<
    {
      dish_id: string
      name_dish: string
      price: number
      quantity: number
      total_price: number
      status: number
    }[]
  >([])

  const handleChangeCheckOrder = (record: any, checked: any) => {
    if (checked === true) {
      setListOrderAdd((prev) => [
        ...prev,
        {
          // order_id: dataTableSessionOrder.order_id,
          dish_id: record.dish_id,
          price: Number(record.price),
          name_dish: record.dish_name,
          quantity: 1,
          total_price: record.price * 1,
          status: 0
        }
      ])
    } else {
      setListOrderAdd((prev) => prev.filter((item) => item.dish_id !== record.dish_id))
    }
  }

  const addListOrderItemMutation = useMutation({
    mutationFn: (payload: {
      order_id: string
      items: {
        dish_id: string
        name_dish: string
        price: number
        quantity: number
        total_price: number
        status: number
      }[]
    }) => {
      return orderItemsAPI.addOrderItem({
        order_id: payload.order_id,
        items: payload.items
      })
    },
    onSuccess: () => {
      toast.success("Cập nhật order thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
      queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", dataTableSessionDetail?.session_id] })
    }
  })

  const handleAddOrderItemList = () => {
    addListOrderItemMutation.mutate({
      order_id: dataTableSessionOrder?.order_id,
      items: listOrderAdd
    })
    setListOrderAdd([])
    setIsModalOpen(false)
  }

  return (
    <div className="table-detail">
      <Helmet>
        <title>Chi tiết bàn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
          Chi tiết bàn {tableNumber || nameTable}
          {dataTableSessionDetail?.dining_table_id ? (
            <Fragment>
              <span className="text-black">-</span>
              <span className="text-red-500"> {dataTableSessionDetail?.dining_table_id}</span>
            </Fragment>
          ) : (
            ""
          )}
        </h1>
        <div className="flex justify-end gap-2 mb-2">
          <HistoryTableSession idDiningTable={idDiningTable} />
        </div>
      </div>

      <Row gutter={24} style={{ overflow: "hidden" }}>
        <Col span={6}>
          <InfoTable
            dataTable={dataTable}
            form={updateTableForm}
            dataTableSessionDetail={dataTableSessionDetail}
            dataTableSessionOrder={dataTableSessionOrder}
          />
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
              <div>
                <Collapse defaultActiveKey={["sessionInfo", "orderInfo"]} bordered={false} className="mb-4">
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
                        started_at: dataTableSessionDetail?.started_at
                          ? dayjs(dataTableSessionDetail.started_at)
                          : null,
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
                        Thông tin món ăn hiện tại{" "}
                        <span className="text-red-500">#{dataTableSessionOrder?.order_id}</span>
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
                              align: "center",
                              render: (val: number, record: any) => (
                                <InputNumber
                                  min={1}
                                  className="text-right"
                                  value={orderItemListStatus[record.order_item_id]?.quantity ?? val}
                                  onChange={(newValueChange) =>
                                    handleChangeItem(record.order_item_id, "quantity", newValueChange || 0)
                                  }
                                />
                              )
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
                                  value={orderItemListStatus[record.order_item_id]?.status ?? val}
                                  style={{ width: 140 }}
                                  onChange={(newValueChange) =>
                                    handleChangeItem(record.order_item_id, "status", newValueChange)
                                  }
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
                          rowClassName={(_, index) =>
                            index % 2 === 0
                              ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
                              : "bg-white hover:bg-blue-50 transition-colors"
                          }
                        />

                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            className="mt-2 py-4 bg-orange-500"
                            type="primary"
                            icon={<ChefHat />}
                            onClick={() => setIsModalOpen(true)}
                          >
                            Thêm Order
                          </Button>
                          <Button
                            className="mt-2 py-4"
                            type="primary"
                            icon={<CookingPot />}
                            onClick={handleUpdateOrderItemList}
                          >
                            Cập nhật order
                          </Button>
                        </div>
                      </>
                    )}
                  </Panel>
                </Collapse>
                <div className="flex justify-end fixed bottom-1 right-8 z-[1] py-2">
                  <Button
                    className="py-4 bg-green-500 shadow-md"
                    type="primary"
                    icon={<HandCoins />}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Tiến hành thanh toán
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div>Chưa có phiên bàn</div>
          )}
        </Col>

        <Modal
          title="Thêm order"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={false}
          width={1400}
          style={{
            top: 20
          }}
        >
          {isLoadingDishes ? (
            <div className="flex justify-center items-center py-8">
              <Spin />
            </div>
          ) : (
            <Fragment>
              <Row gutter={12}>
                <Col span={14}>
                  <div style={{ marginBottom: 12 }}>
                    <Search
                      placeholder="Tìm kiếm món ăn theo tên..."
                      allowClear
                      enterButton="Tìm"
                      onSearch={setSearchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ maxWidth: 300 }}
                    />
                  </div>

                  <Table
                    dataSource={filteredData}
                    columns={columnsListDishMenuInActive}
                    rowKey="id"
                    pagination={false}
                    bordered
                    loading={isFetching}
                    scroll={{
                      x: 1000,
                      y: 400
                    }}
                    rowClassName={(_, index) =>
                      index % 2 === 0
                        ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
                        : "bg-white hover:bg-blue-50 transition-colors"
                    }
                  />
                </Col>
                <Col span={10}>
                  <Title level={4}>Danh sách món đã chọn</Title>
                  <Table
                    dataSource={listOrderAdd}
                    size="small"
                    bordered
                    rowKey={(record) => record.dish_id}
                    pagination={false}
                    scroll={{
                      y: 420
                    }}
                    columns={columnListDishSelected}
                  />
                </Col>
              </Row>

              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsModalOpen(false)} className="mr-2">
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={addListOrderItemMutation.isPending}
                  onClick={handleAddOrderItemList}
                >
                  Thêm order
                </Button>
              </div>
            </Fragment>
          )}
        </Modal>
      </Row>
    </div>
  )
}
