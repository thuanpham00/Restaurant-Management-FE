/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Descriptions,
  Table,
  Tag,
  Spin,
  Empty,
  Row,
  Col,
  Card,
  Image,
  Button,
  Modal,
  Input,
  Checkbox,
  Typography,
  InputNumber,
  Divider,
  Form,
  Space,
  Badge
} from "antd"
import { ColumnsType } from "antd/es/table"
import { useLocation } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HistoryTableSessionDetail, TableSessionOrder } from "src/Types/tableSession.type"
import { menusAPI, orderItemsAPI, tableSessionAPI } from "src/Apis/Admin"
import { Helmet } from "react-helmet-async"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { assets } from "src/Assets/assets"
import { renderSessionStatus, renderSessionType, statusColor, statusText } from "../TableDetail/TableDetail"
import { ChefHat, HandCoins, Trash } from "lucide-react"
import { Fragment, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import PromotionForm from "../../Components/PromotionForm"
import PaymentDetailModal from "../../Components/PaymentDetailModal"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"

const { Search } = Input
const { Title } = Typography

export default function TableSessionHistoryDetail() {
  const queryClient = useQueryClient()
  const { state } = useLocation()
  const idDiningTable = state?.idDiningTable
  const idTableSession = state?.idTableSession
  const prepayment = state?.prepayment
  const orderId = state?.orderId

  const [prePaymentValue, setPrePaymentValue] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)

  useEffect(() => {
    setPrePaymentValue(prepayment)
  }, [prepayment])

  const { data, isFetching, isError } = useQuery({
    queryKey: ["detailTableSession", idDiningTable, idTableSession],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getHistoryTableSessionDetailByIdTableAndIdTableSession(idDiningTable, idTableSession)
    },
    retry: 0,
    enabled: Boolean(idDiningTable) && Boolean(idTableSession)
  })

  const dataHistoryTableSessionDetail = data?.data?.data as HistoryTableSessionDetail

  const { data: dataDetailInvoice, isError: isErrorInvoice } = useQuery({
    queryKey: ["detailDetailInvoice", idTableSession],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return invoicePaymentAPI.getDetailInvoiceFromIdTableSession(idTableSession)
    },
    retry: 0,
    enabled: Boolean(idDiningTable) && Boolean(idTableSession)
  })

  const detailInvoice = dataDetailInvoice?.data.data

  const deleteMenuMutation = useMutation({
    mutationFn: (body: { idOrder: string; idOrderItem: string }) =>
      orderItemsAPI.delete(body.idOrderItem, body.idOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable, idTableSession] })
      toast.success("Xóa order thành công!", {
        autoClose: 1500
      })
    }
  })

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
    },
    {
      title: "Thao tác",
      render: (_: any, item: any) => (
        <div className="flex items-center justify-center">
          <Button
            type="primary"
            danger
            disabled={detailInvoice !== undefined}
            onClick={() => {
              deleteMenuMutation.mutate({
                idOrderItem: item.order_item_id,
                idOrder: dataHistoryTableSessionDetail.orders[0].order_id
              })
            }}
          >
            <Trash size={14} />
          </Button>
        </div>
      )
    }
  ]

  const { data: listDishMenuInActiveData, isLoading: isLoadingDishes } = useQuery({
    queryKey: ["ListDishInMenuActive", idTableSession],
    queryFn: () => menusAPI.getMenuItemFromMenuActive(),
    enabled: isModalOpen
  })

  const listDishMenuInActive = listDishMenuInActiveData?.data?.data?.items

  const [searchText, setSearchText] = useState("")

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return listDishMenuInActive
    return (listDishMenuInActive || []).filter((item) =>
      item.dish_name?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText, listDishMenuInActive])

  const [listOrderAdd, setListOrderAdd] = useState<
    {
      dish_id: string
      name_dish: string
      price: number
      quantity: number
      total_price: number
      status: number
      notes: string
    }[]
  >([])

  const handleChangeCheckOrder = (record: any, checked: any) => {
    if (checked === true) {
      setListOrderAdd((prev) => [
        ...prev,
        {
          dish_id: record.dish_id,
          price: Number(record.price),
          name_dish: record.dish_name,
          quantity: 1,
          total_price: record.price * 1,
          status: 0,
          notes: ""
        }
      ])
    } else {
      setListOrderAdd((prev) => prev.filter((item) => item.dish_id !== record.dish_id))
    }
  }

  const columnsListDishMenuInActive: ColumnsType<any> = [
    {
      title: <div className="text-center">Chọn</div>,
      width: 80,
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
      width: 120,
      render: (_, record) => record.id
    },
    {
      title: "Tên món ăn",
      dataIndex: "dish_name",
      key: "dish_name",
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
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price"
    }
  ]

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
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      render: (_, _record, index) => (
        <Input
          onChange={(e) => {
            const value = e.target.value
            if (value === null) return // nếu null thì bỏ qua
            const newList = [...listOrderAdd]
            newList[index].notes = value
            setListOrderAdd(newList)
          }}
        />
      )
    }
  ]

  const addListOrderItemMutation = useMutation({
    mutationFn: (payload: {
      items: {
        dish_id: string
        name_dish: string
        price: number
        quantity: number
        total_price: number
        status: number
        notes: string
      }[]
      order_id?: string
      table_session_id?: string
    }) => {
      return orderItemsAPI.addOrderItem({
        items: payload.items,
        order_id: payload.order_id,
        table_session_id: payload.table_session_id
      })
    },
    onSuccess: () => {
      toast.success("Cập nhật order thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({
        queryKey: ["detailTableSession", idDiningTable, idTableSession]
      })
    }
  })

  const handleAddOrderItemList = () => {
    addListOrderItemMutation.mutate({
      items: listOrderAdd,
      order_id: orderId as string
    })
    setListOrderAdd([])
    setIsModalOpen(false)
  }

  // xử lý thanh toán
  const [formPayment] = Form.useForm()

  const [vat, setVat] = useState<number>(10) // default VAT 1%
  const [prepay, setPrepay] = useState<number>(50) // default trả trước 1%
  const [totalPercentage, setTotalPercentage] = useState<number>(0)
  const [listPromotionApply, setListPromotionApply] = useState<
    { promotion_id: string; discount_value: number }[] | null
  >(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const { data: dataTableSessionOrderRes } = useQuery({
    queryKey: ["detailTableSessionOrder", idTableSession],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getDetailTableSessionOrderByIdTable(idTableSession)
    },
    retry: 0,
    enabled: Boolean(showInvoice)
  })

  const dataTableSessionOrder = dataTableSessionOrderRes?.data?.data[0] as TableSessionOrder

  const finalAmount = useMemo(() => {
    const subtotal = Number(dataTableSessionOrder?.total_amount ?? 0) // Tạm tính
    const discountPercent = Number(totalPercentage ?? 0) // Giảm giá %
    const vatPercent = vat ?? 0 // VAT %

    const discounted = subtotal * (1 - discountPercent / 100)
    const total = discounted * (1 + vatPercent / 100)

    return total
  }, [dataTableSessionOrder?.total_amount, totalPercentage, vat])

  const paymentBefore = useMemo(() => {
    return (finalAmount * (prepay ?? 0)) / 100
  }, [finalAmount, prepay])

  const remainingAmount = useMemo(() => {
    return finalAmount - paymentBefore
  }, [finalAmount, paymentBefore])

  if (isFetching) return <Spin size="large" className="block mx-auto my-10" />
  if (isError || !dataHistoryTableSessionDetail)
    return <Empty description="Không có dữ liệu phiên bàn" className="my-10" />

  return (
    <div>
      <Helmet>
        <title>Lịch sử chi tiết phiên bàn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Thông tin phiên bàn {idTableSession}
      </h1>

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
      {dataHistoryTableSessionDetail.session_type === 2 && dataHistoryTableSessionDetail.reservation && (
        <div className="mt-4">
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
        </div>
      )}

      {dataHistoryTableSessionDetail.orders.map((order, idx) => (
        <Card
          key={idx}
          className="mb-4 rounded-lg shadow-sm"
          styles={{
            body: { padding: "0.5rem" }
          }}
        >
          <div className="flex justify-between items-center bg-blue-50 p-2 border-b border-gray-200">
            <div className="text-lg font-semibold text-blue-700">Order ID: {order.order_id}</div>
            <Tag color="red" className="font-semibold text-lg">
              Tổng: {order.total_amount ?? 0}đ
            </Tag>
          </div>

          <div className="mt-2 overflow-x-auto">
            <Table
              rowKey="order_item_id"
              dataSource={order.items.filter((item) => item.status !== 4)}
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

            {prePaymentValue && (
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  className="py-4 shadow-md"
                  type="primary"
                  icon={<HandCoins />}
                  onClick={() => {
                    if (order.items.length === 0) {
                      toast.error("Vui lòng order món trước khi đặt cọc", {
                        autoClose: 1500
                      })
                    } else {
                      setShowInvoice(true)
                    }
                  }}
                  style={{
                    backgroundColor: "#f56a00", // đỏ cam
                    borderColor: "#f56a00",
                    transition: "background-color 0.2s ease, border-color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff7a45" // hover nhạt hơn
                    e.currentTarget.style.borderColor = "#ff7a45"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f56a00"
                    e.currentTarget.style.borderColor = "#f56a00"
                  }}
                >
                  Đặt cọc
                </Button>
                <Button
                  className="py-4 bg-lime-600 hover:!bg-lime-700"
                  type="primary"
                  icon={<ChefHat />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Thêm Order
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}

      <div className="py-4 px-0 bg-white shadow rounded-lg space-y-6">
        {/* 1. Thông tin tổng quan hóa đơn */}
        <div className="flex justify-between items-center bg-blue-50 p-2 border-b border-gray-200">
          <div className="text-lg font-semibold text-blue-700">Hóa đơn: {detailInvoice?.id}</div>
          {isErrorInvoice ? (
            <Tag className="font-semibold text-lg" color={"orange"}>
              {"Chưa thanh toán"}
            </Tag>
          ) : (
            <Tag
              className="font-semibold text-lg"
              color={
                detailInvoice?.status === 0
                  ? "orange"
                  : detailInvoice?.status === 1
                    ? "green"
                    : detailInvoice?.status === 2
                      ? "blue"
                      : "red"
              }
            >
              {detailInvoice?.status === 0
                ? "Chưa thanh toán"
                : detailInvoice?.status === 1
                  ? "Thanh toán trước 1 phần"
                  : detailInvoice?.status === 2
                    ? "Thanh toán đủ"
                    : "Đã hủy"}
            </Tag>
          )}
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Tổng tiền">
            {Number(detailInvoice?.total_amount ?? 0).toLocaleString("vi-VN")} đ
          </Descriptions.Item>
          <Descriptions.Item label="Giảm giá">
            {Number(detailInvoice?.discount ?? 0).toLocaleString("vi-VN")} %
          </Descriptions.Item>
          <Descriptions.Item label="Thuế VAT">{Number(detailInvoice?.tax ?? 0)} %</Descriptions.Item>
          <Descriptions.Item label="Thành tiền">
            <b>{Number(detailInvoice?.final_amount ?? 0).toLocaleString("vi-VN")} đ</b>
          </Descriptions.Item>
        </Descriptions>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2 p-2 pt-0">Lịch sử thanh toán</h3>
          <Table
            rowKey="id"
            size="small"
            bordered
            pagination={false}
            dataSource={detailInvoice?.payments || []}
            columns={[
              {
                title: "Thời gian",
                dataIndex: "paid_at",
                key: "paid_at",
                render: (text: string) => new Date(text).toLocaleString()
              },
              {
                title: "Số tiền",
                dataIndex: "amount",
                key: "amount",
                render: (text: number) => Number(text).toLocaleString("vi-VN") + " đ"
              },
              {
                title: "Phương thức",
                dataIndex: "method",
                key: "method",
                render: (method: number) => (method === 0 ? "Tiền mặt" : method === 1 ? "Chuyển khoản" : "Khác")
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status: number) => (
                  <Tag color={status === 0 ? "orange" : status === 1 ? "green" : status === 2 ? "red" : "gray"}>
                    {status === 0
                      ? "Chưa thanh toán"
                      : status === 1
                        ? "Hoàn thành"
                        : status === 2
                          ? "Thất bại"
                          : "Đã hoàn tiền"}
                  </Tag>
                )
              },
              {
                title: "Nhân viên",
                dataIndex: ["employee", "full_name"],
                key: "employee"
              }
            ]}
            rowClassName={(_, index) =>
              index % 2 === 0
                ? "bg-[#f9f9f9] hover:bg-blue-50 transition-colors"
                : "bg-white hover:bg-blue-50 transition-colors"
            }
          />
        </div>
      </div>

      <Modal
        title="Thêm order"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={false}
        width={1400}
        style={{
          top: 40
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

            <div className="flex justify-end absolute bottom-4 right-4">
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

      <Modal
        title={`Hóa đơn của phiên bàn ${idTableSession}`}
        open={showInvoice}
        onCancel={() => setShowInvoice(false)}
        footer={null}
        width={1000}
        style={{ top: 50 }}
        styles={{
          body: {
            height: 500,
            overflowY: "auto"
          }
        }}
      >
        <Card
          title={`Bàn ${dataHistoryTableSessionDetail.table_number}`}
          extra={<Badge status={statusColor[0]} text={statusText[0]} />}
          bordered={true}
        >
          <Table
            bordered
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
                        alt={record.dish.name}
                        className="rounded-md object-cover"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <Image
                        src={assets.rectangles.Burger}
                        alt={record.dish.name}
                        className="w-12 h-12 rounded-md object-cover"
                        width={64}
                        height={64}
                      />
                    )}
                    <div>
                      <p className="font-medium">{record.dish.name}</p>
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
                render: (val: number) => <div className="text-center">{val}</div>
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
                title: <div className="text-right">Ghi chú</div>,
                dataIndex: "notes",
                key: "notes",
                render: (val: string) => <div className="text-right">{val}</div>
              }
            ]}
            pagination={false}
          />

          <PromotionForm setTotalPercentage={setTotalPercentage} setListPromotionApply={setListPromotionApply} />

          <Divider />

          <Form
            form={formPayment}
            layout="vertical"
            onValuesChange={(changedValue) => {
              if (changedValue.vat !== undefined) setVat(changedValue.vat)
              if (changedValue.prepay !== undefined) setPrepay(changedValue.prepay)
            }}
            initialValues={{
              vat: 10,
              prepay: 50
            }}
          >
            <Descriptions column={1} bordered size="small" layout="horizontal">
              <Descriptions.Item label="Tạm tính" contentStyle={{ color: "red", fontWeight: 500 }}>
                {Number(dataTableSessionOrder?.total_amount).toLocaleString("vi-VN")} đ
              </Descriptions.Item>
              <Descriptions.Item label="Giảm giá">{totalPercentage} %</Descriptions.Item>
              <Descriptions.Item label="Thuế VAT">
                <Form.Item name="vat" noStyle>
                  <InputNumber min={0} max={100} formatter={(value) => `${value} %`} />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <b>{finalAmount.toLocaleString("vi-VN")} đ</b>
              </Descriptions.Item>

              <Divider />

              <Descriptions.Item label="Trả trước">
                <Form.Item name="prepay" noStyle>
                  <InputNumber min={0} max={100} formatter={(value) => `${value} %`} />
                </Form.Item>
              </Descriptions.Item>

              <Descriptions.Item label="Thanh toán trước">
                <b className="text-red-500">{paymentBefore.toLocaleString("vi-VN")} đ</b>
              </Descriptions.Item>

              <Descriptions.Item label="Còn lại">
                <b className="text-green-500">{remainingAmount.toLocaleString("vi-VN")} đ</b>
              </Descriptions.Item>
            </Descriptions>

            <Space className="mt-4">
              <Button type="primary" onClick={() => setShowPaymentModal(true)}>
                Tiến hành đặt cọc
              </Button>
            </Space>
          </Form>
        </Card>
      </Modal>

      <PaymentDetailModal
        open={showPaymentModal}
        onClosePayment={() => setShowPaymentModal(false)}
        onCloseInvoice={() => setShowInvoice(false)}
        totalAmount={Number(dataTableSessionOrder?.total_amount) || 0}
        totalPercentage={totalPercentage}
        vat={vat}
        finalAmount={finalAmount}
        paymentBefore={paymentBefore} // trả trước
        setPrePaymentValue={setPrePaymentValue} // dùng để check trạng thái đặt cọc 1 lần
        listPromotionApply={listPromotionApply}
        table_session_id={idTableSession}
      />
    </div>
  )
}
