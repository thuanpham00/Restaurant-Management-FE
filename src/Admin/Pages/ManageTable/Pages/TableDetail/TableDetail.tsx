/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import {
  TableSessionDetail,
  TableSessionOrder,
  HistoryTableSession as HistoryTableSessionType
} from "src/Types/tableSession.type"
import dayjs from "dayjs"
import InfoTable from "../../Components/InfoTable"
import HistoryTableSession from "../../Components/HistoryTableSession/HistoryTableSession"
import { ChefHat, CookingPot, HandCoins, Plus, Split } from "lucide-react"
import { toast } from "react-toastify"
import { ColumnsType } from "antd/es/table"
import SplitTableModal from "../../Components/SplitTableModal"
import { SplitInvoiceModal } from "../../Components/SplitInvoiceModal"
import { InvoiceListSummary } from "src/Admin/Pages/ManageTable/Components/InvoiceListSummary"
import { InvoiceDetailModal } from "src/Admin/Pages/ManageTable/Components/InvoiceDetailModal"
import CreateInvoiceModal from "../../Components/CreateInvoiceModal"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import { isError422 } from "src/Helpers/utils"
import { useAppStore } from "src/StateGlobal/zustand"
import { useRealtimeQuery } from "src/Hook/useRealtimeQuery"
import type { Invoice } from "src/Types/invoicePayment.type"
import PendingTableSessionSelector from "../../Components/PendingTableSessionSelector"

const { Search } = Input
const { Title } = Typography

export const renderSessionType = (type: number) => {
  switch (type) {
    case 0:
      return (
        <Tag color="blue" className="text-[14px] font-semibold">
          Offline
        </Tag>
      )
    case 1:
      return (
        <Tag color="purple" className="text-[14px] font-semibold">
          Ghép bàn
        </Tag>
      )
    case 2:
      return (
        <Tag color="orange" className="text-[14px] font-semibold">
          Đặt trước
        </Tag>
      )
    case 3:
      return (
        <Tag color="green" className="text-[14px] font-semibold">
          Tách bàn
        </Tag>
      )
    default:
      return <Tag className="text-[14px] font-semibold">Khác</Tag>
  }
}

export const renderSessionStatus = (status: number) => {
  switch (status) {
    case 0:
      return (
        <Tag color="default" className="text-[14px] font-semibold">
          Chờ
        </Tag>
      )
    case 1:
      return (
        <Tag color="processing" className="text-[14px] font-semibold">
          Đang phục vụ
        </Tag>
      )
    case 2:
      return (
        <Tag color="success" className="text-[14px] font-semibold">
          Hoàn tất
        </Tag>
      )
    case 3:
      return (
        <Tag color="error" className="text-[14px] font-semibold">
          Hủy
        </Tag>
      )
    default:
      return <Tag className="text-[14px] font-semibold">Không rõ</Tag>
  }
}

const renderOrderStatus = (status: number) => {
  switch (status) {
    case 0:
      return (
        <Tag color="default" className="text-[14px] font-semibold">
          Chờ
        </Tag>
      )
    case 1:
      return (
        <Tag color="processing" className="text-[14px] font-semibold">
          Đang chế biến
        </Tag>
      )
    case 2:
      return (
        <Tag color="warning" className="text-[14px] font-semibold">
          Đã phục vụ
        </Tag>
      )
    case 3:
      return (
        <Tag color="success" className="text-[14px] font-semibold">
          Đã thanh toán
        </Tag>
      )
    case 4:
      return (
        <Tag color="error" className="text-[14px] font-semibold">
          Đã hủy
        </Tag>
      )
    default:
      return <Tag className="text-[14px] font-semibold">Chờ</Tag>
  }
}

const orderItemStatusOptions = [
  { label: "Đã gọi món", value: 0 },
  { label: "Đang chế biến", value: 1 },
  { label: "Đã chế biến", value: 2 },
  { label: "Đã phục vụ", value: 3 },
  { label: "Đã Hủy", value: 4 }
]

export const statusText: Record<number, string> = {
  0: "Chưa thanh toán",
  1: "Đã thanh toán 1 phần",
  2: "Đã thanh toán",
  3: "Đã hủy"
}

export const statusColor: Record<number, "default" | "success" | "warning" | "error" | "processing"> = {
  0: "error", // Unpaid -> đỏ
  1: "warning", // Partially Paid -> vàng
  2: "success", // Paid -> xanh lá
  3: "default" // Cancelled -> xám
}

const { Panel } = Collapse
type TableSessionOrderMerged = TableSessionOrder & { items: TableSessionOrder["items"]; total_amount: string }

export default function TableDetail() {
  const { employeeId } = useAppStore()
  const queryClient = useQueryClient()

  const { state } = useLocation()
  const dataTable = state?.dataTable

  const nameTable = state?.tableName
  const idDiningTable = dataTable.dining_table_id

  // ✅ Query 1: Detail Table Session - Always fresh, no cache
  const { data, isFetching, isError, error } = useRealtimeQuery(
    ["detailTableSession", idDiningTable],
    () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getDetailTableSessionByIdTable(idDiningTable)
    },
    {
      enabled: Boolean(idDiningTable)
    }
  )

  const dataTableSessionDetail = data?.data?.data as TableSessionDetail

  // ✅ Query 2: Table Session Order - Auto refetch every 15 seconds
  const { data: dataTableSessionOrderRes, isFetching: isFetchingDataTableSessionOrder } = useRealtimeQuery(
    ["detailTableSessionOrder", dataTableSessionDetail?.session_id],
    () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getDetailTableSessionOrderByIdTable(dataTableSessionDetail?.session_id)
    },
    {
      enabled: Boolean(dataTableSessionDetail)
    }
  )

  const dataTableSessionOrderMerged: TableSessionOrderMerged | undefined = (() => {
    const orders = dataTableSessionOrderRes?.data?.data as TableSessionOrder[] | undefined
    if (!orders || orders.length === 0) return undefined

    if (orders.length === 1) return orders[0] // chỉ 1 order, giữ nguyên

    // Nhiều order -> gộp items
    const mergedItems = orders.flatMap((order) => order.items)

    // Cộng tổng total_amount
    const totalAmountSum = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)

    // Lấy thông tin chung từ order đầu tiên (ngoại trừ items và total_amount)
    const { order_id, table_session_id, order_status } = orders[0]

    return {
      order_id,
      table_session_id,
      order_status,
      items: mergedItems,
      total_amount: totalAmountSum.toString()
    }
  })()

  const dataTableSessionOrder = dataTableSessionOrderMerged

  const [hasCurrentSession, setHasCurrentSession] = useState<boolean | null>(null)
  const [listTablePending, setListTablePending] = useState<HistoryTableSessionType[]>([])

  const {
    data: dataListPendingTableSession,
    isFetching: isFetchingListPendingTableSession,
    isError: isErrorPendingTable
  } = useRealtimeQuery(
    ["listPendingTableSession", idDiningTable],
    () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListPendingTableSessionByIdTable(idDiningTable)
    },
    {
      enabled: hasCurrentSession === false
    }
  )

  // ✅ Query 4: List Invoices for Table Session - Auto refetch every 20 seconds
  const { data: dataListInvoices } = useRealtimeQuery(
    ["listInvoicesForTableSession", dataTableSessionDetail?.session_id],
    () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return invoicePaymentAPI.getList(
        {
          page: "1",
          per_page: "50",
          table_session_id: dataTableSessionDetail?.session_id
        },
        controller.signal
      )
    },
    {
      enabled: Boolean(idDiningTable) && Boolean(dataTableSessionDetail?.session_id)
    }
  )

  const invoiceList = dataListInvoices?.data?.data?.data || []
  const detailInvoice = invoiceList[0] || null // For backward compatibility

  // ✅ Calculate overall payment status across all invoices
  const paymentStatus = useMemo(() => {
    if (invoiceList.length === 0) {
      return {
        hasInvoices: false,
        totalInvoices: 0,
        unpaidCount: 0,
        partialPaidCount: 0,
        paidCount: 0,
        allPaid: false,
        hasPendingPayments: false
      }
    }

    let unpaidCount = 0
    let partialPaidCount = 0
    let paidCount = 0

    invoiceList.forEach((invoice) => {
      if (invoice.status === 0) unpaidCount++
      else if (invoice.status === 1) partialPaidCount++
      else if (invoice.status === 2) paidCount++
    })

    const allPaid = paidCount === invoiceList.length && invoiceList.length > 0
    const hasPendingPayments = unpaidCount > 0 || partialPaidCount > 0

    return {
      hasInvoices: true,
      totalInvoices: invoiceList.length,
      unpaidCount,
      partialPaidCount,
      paidCount,
      allPaid,
      hasPendingPayments
    }
  }, [invoiceList])

  // ✅ Effect 1: Xử lý khi Query 1 (detailTableSession) có kết quả
  useEffect(() => {
    if (data && !isError) {
      // ✅ Có data → Có session hiện tại đang phục vụ
      setHasCurrentSession(true)
    } else if (isError) {
      const message = (error as any).response?.data.message
      if (message === "No session found for Dining Table: " + idDiningTable) {
        // ✅ Error "No session found" → Không có session hiện tại
        setHasCurrentSession(false)
      }
    }
  }, [data, isError, error, idDiningTable])

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["detailTableSession"], exact: false })
      queryClient.removeQueries({ queryKey: ["detailTableSessionOrder"], exact: false })
      queryClient.removeQueries({ queryKey: ["detailDetailInvoice"], exact: false })
      queryClient.removeQueries({ queryKey: ["listPendingTableSession"], exact: false })
    }
  }, [queryClient])

  useEffect(() => {
    if (isErrorPendingTable) {
      setListTablePending([])
    } else {
      setListTablePending(dataListPendingTableSession?.data?.data || [])
    }
  }, [dataListPendingTableSession, isErrorPendingTable])

  const [updateTableForm] = Form.useForm()
  const tableNumber = Form.useWatch("table_number", updateTableForm)

  const [updateOrderItemList, setUpdateOrderItemList] = useState<
    Record<string, { status: number; quantity: number; notes: string }>
  >({})

  const handleChangeItem = (
    orderItemId: string,
    type: keyof { status: number; quantity: number; notes: string },
    newValueChange: number | string
  ) => {
    setUpdateOrderItemList((prev) => ({
      ...prev,
      [orderItemId]: {
        ...prev[orderItemId],
        [type]: newValueChange
      }
    }))
  }

  const updateListOrderItemMutation = useMutation({
    mutationFn: (body: {
      items: Record<string, { status: number; quantity: number; notes: string }>
      invoice_id?: string
    }) => {
      return orderItemsAPI.updateListOrderItem(body.items, body.invoice_id)
    },
    onSuccess: () => {
      toast.success("Cập nhật order thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
      queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", dataTableSessionDetail?.session_id] })
    },
    onError: (error) => {
      if (isError422<any>(error)) {
        const errors = error.response?.data.errors
        if (errors && typeof errors === "object") {
          Object.values(errors).forEach((msg) => {
            toast.error(msg as string, {
              autoClose: 1500
            })
          })
          Object.keys(errors).forEach((key) => {
            const item = (dataTableSessionOrder as TableSessionOrderMerged).items.find(
              (item) => item.order_item_id === key
            )

            if (!item) return // nếu không tìm thấy, skip

            setUpdateOrderItemList((prev) => ({
              ...prev,
              [key]: {
                ...prev[key],
                status: item.item_status ?? prev[key]?.status ?? 0, // đảm bảo luôn có number
                quantity: item.quantity ?? prev[key]?.quantity ?? 0 // giữ quantity
              }
            }))
          })
        }
      }
    }
  })

  const handleUpdateOrderItemList = () => {
    if (detailInvoice) {
      updateListOrderItemMutation.mutate(
        {
          items: updateOrderItemList,
          invoice_id: detailInvoice.id
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoiceSummary", dataTableSessionDetail?.session_id] })
            queryClient.invalidateQueries({
              queryKey: ["listInvoicesForTableSession", dataTableSessionDetail?.session_id]
            })
            queryClient.invalidateQueries({ queryKey: ["detailDetailInvoice", dataTableSessionDetail?.session_id] })
          }
        }
      )
    } else {
      updateListOrderItemMutation.mutate({
        items: updateOrderItemList
      })
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSplitTableModal, setShowSplitTableModal] = useState(false)
  const [showSplitInvoiceModal, setShowSplitInvoiceModal] = useState(false)
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Invoice | null>(null)
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false)
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false)

  const { data: listDishMenuInActiveData, isLoading: isLoadingDishes } = useQuery({
    queryKey: ["ListDishInMenuActive", dataTableSessionDetail?.session_id],
    queryFn: () => menusAPI.getMenuItemFromMenuActive(),
    enabled: isModalOpen
  })

  const listDishMenuInActive = listDishMenuInActiveData?.data?.data?.items

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
      width: 120,
      key: "index",
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
      key: "price",
      render: (price) => {
        const formattedPrice = Number(price).toLocaleString("vi-VN")
        return <div className="text-red-500 font-medium">{formattedPrice}đ</div>
      }
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
      invoice_id?: string
    }) => {
      return orderItemsAPI.addOrderItem({
        items: payload.items,
        order_id: payload.order_id,
        table_session_id: payload.table_session_id,
        invoice_id: payload.invoice_id
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
    if (dataTableSessionOrder?.order_id) {
      if (detailInvoice) {
        addListOrderItemMutation.mutate(
          {
            items: listOrderAdd,
            order_id: dataTableSessionOrder?.order_id,
            invoice_id: detailInvoice?.id
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["invoiceSummary", dataTableSessionDetail?.session_id] })
              queryClient.invalidateQueries({
                queryKey: ["listInvoicesForTableSession", dataTableSessionDetail?.session_id]
              })
              queryClient.invalidateQueries({
                queryKey: ["detailDetailInvoice", dataTableSessionDetail?.session_id]
              })
            }
          }
        )
      } else {
        addListOrderItemMutation.mutate({
          items: listOrderAdd,
          order_id: dataTableSessionOrder?.order_id
        })
      }
    } else {
      addListOrderItemMutation.mutate({
        items: listOrderAdd,
        table_session_id: dataTableSessionDetail?.session_id
      })
    }
    setListOrderAdd([])
    setIsModalOpen(false)
  }

  // ✅ Mutation to complete table session when all invoices are paid
  const completeTableSessionMutation = useMutation({
    mutationFn: (sessionId: string) => tableSessionAPI.updateStatusTableSession(sessionId),
    onSuccess: () => {
      toast.success("Phiên bàn đã hoàn tất! Tất cả hóa đơn đã được thanh toán.", {
        autoClose: 2000
      })
      queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
      queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", dataTableSessionDetail?.session_id] })
      queryClient.invalidateQueries({ queryKey: ["listInvoicesForTableSession", dataTableSessionDetail?.session_id] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể hoàn tất phiên bàn", {
        autoClose: 1500
      })
    }
  })

  // ✅ Auto-check and complete session when all invoices are paid
  useEffect(() => {
    if (
      paymentStatus.allPaid &&
      dataTableSessionDetail?.session_status === 1 && // Only if session is "Đang phục vụ"
      !completeTableSessionMutation.isPending
    ) {
      // All invoices paid, complete the session
      completeTableSessionMutation.mutate(dataTableSessionDetail.session_id)
    }
  }, [paymentStatus.allPaid, dataTableSessionDetail?.session_status, dataTableSessionDetail?.session_id])

  const createTableSessionMutation = useMutation({
    mutationFn: ({ employee_id, dining_table_id }: { employee_id: string; dining_table_id: string }) =>
      tableSessionAPI.createTableSessionTypeOffline({
        dining_table_id,
        employee_id
      }),

    onSuccess: () => {
      toast.success("Tạo phiên bàn offline thành công", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listPendingTableSession", idDiningTable] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại ❌", {
        autoClose: 1500
      })
    }
  })

  const handleCreateTableSession = async () => {
    createTableSessionMutation.mutate({
      employee_id: employeeId as string,
      dining_table_id: idDiningTable as string
    })
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
          <InfoTable
            dataTable={dataTable}
            form={updateTableForm}
            dataTableSessionDetail={dataTableSessionDetail}
            dataTableSessionOrder={dataTableSessionOrder as TableSessionOrderMerged}
          />
          {hasCurrentSession && (
            <>
              <Button
                className="py-4 shadow-md"
                type="default"
                icon={<Split />}
                onClick={() => setShowSplitTableModal(true)}
                disabled={
                  !dataTableSessionOrder?.items ||
                  dataTableSessionOrder.items.length < 2 ||
                  paymentStatus.allPaid || // ✅ Disable khi tất cả hóa đơn đã thanh toán
                  invoiceList.length === 0 // ✅ Disable khi chưa có hóa đơn
                }
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  color: "#fff"
                }}
              >
                Tách bàn
              </Button>
              <Button
                className="py-4 shadow-md"
                type="primary"
                icon={<HandCoins />}
                onClick={() => {
                  // ✅ Check if there are items ordered
                  if (!dataTableSessionOrder?.items || dataTableSessionOrder.items.length === 0) {
                    toast.error("Vui lòng order món trước khi tạo hóa đơn", {
                      autoClose: 1500
                    })
                    return
                  }
                  // ✅ NEW LOGIC: Check if invoices exist
                  if (invoiceList.length === 0) {
                    // No invoices → Open CreateInvoiceModal
                    setShowCreateInvoiceModal(true)
                  } else {
                    // Has invoices → Check payment status
                    if (paymentStatus.allPaid) {
                      toast.success("Tất cả hóa đơn đã được thanh toán đầy đủ!", {
                        autoClose: 1500
                      })
                      return
                    }

                    // Find first unpaid or partial paid invoice
                    const unpaidInvoice = invoiceList.find((inv) => inv.status !== 2)
                    if (unpaidInvoice) {
                      setSelectedInvoiceForDetail(unpaidInvoice)
                      setShowInvoiceDetailModal(true)
                    }
                  }
                }}
                disabled={paymentStatus.allPaid && invoiceList.length > 0} // Disable only when all paid
                style={{
                  backgroundColor: paymentStatus.allPaid && invoiceList.length > 0 ? "#95de64" : "#f56a00",
                  borderColor: paymentStatus.allPaid && invoiceList.length > 0 ? "#95de64" : "#f56a00",
                  width: "100%",
                  transition: "background-color 0.2s ease, border-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (!paymentStatus.allPaid || invoiceList.length === 0) {
                    e.currentTarget.style.backgroundColor = "#ff7a45"
                    e.currentTarget.style.borderColor = "#ff7a45"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!paymentStatus.allPaid || invoiceList.length === 0) {
                    e.currentTarget.style.backgroundColor = "#f56a00"
                    e.currentTarget.style.borderColor = "#f56a00"
                  }
                }}
              >
                {invoiceList.length === 0
                  ? "Tạo hóa đơn"
                  : paymentStatus.allPaid
                    ? "✓ Đã thanh toán"
                    : paymentStatus.hasPendingPayments
                      ? `Thanh toán (${paymentStatus.unpaidCount + paymentStatus.partialPaidCount}/${paymentStatus.totalInvoices} HĐ)`
                      : "Thanh toán"}
              </Button>
            </>
          )}
          {hasCurrentSession === false && (
            <Button
              type="primary"
              icon={<Plus />}
              style={{
                backgroundColor: "#f56a00", // đỏ cam
                borderColor: "#f56a00",
                width: "100%",
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
              onClick={handleCreateTableSession}
            >
              Tạo phiên bàn mới (Offline)
            </Button>
          )}

          <HistoryTableSession idDiningTable={idDiningTable} tableNumber={dataTable.table_number} />
        </div>
      </div>

      <Row gutter={24} style={{ overflow: "hidden" }}>
        <Col
          span={24}
          style={{
            height: "calc(100vh - 200px)",
            overflowY: "auto",
            overflowX: "hidden"
          }}
        >
          {hasCurrentSession === true ? (
            isFetching ? (
              <div className="flex justify-center items-center flex-col h-[200px]">
                <Spin tip="Đang tải dữ liệu..." size="large" spinning={isFetching}>
                  <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
                </Spin>
              </div>
            ) : (
              <div>
                <Collapse defaultActiveKey={["sessionInfo", "orderInfo"]} bordered={false} className="mb-4">
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
                            {renderOrderStatus((dataTableSessionOrder as TableSessionOrderMerged)?.order_status)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Tổng tiền" span={2}>
                            <span className="text-red-500 font-semibold">
                              {Number(dataTableSessionOrder?.total_amount || 0).toLocaleString("vi-VN")} đ
                            </span>
                          </Descriptions.Item>
                        </Descriptions>

                        <h3 className="text-md font-semibold my-4 text-gray-700">Danh sách món ăn</h3>
                        <Table
                          scroll={{ x: "max-content" }} // 👈 quan trọng
                          bordered
                          rowKey="order_item_id"
                          pagination={false}
                          rowHoverable={false} // ⬅️ Tắt hover mặc định
                          dataSource={dataTableSessionOrder?.items.sort(
                            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                          )}
                          columns={[
                            {
                              title: "Món ăn",
                              dataIndex: ["dish", "dish_name"],
                              key: "dish_name",
                              fixed: "left",
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
                              render: (val: number, record: any) => {
                                return (
                                  <InputNumber
                                    min={1}
                                    className="text-right"
                                    value={updateOrderItemList[record.order_item_id]?.quantity ?? val}
                                    onChange={(newValueChange) =>
                                      handleChangeItem(record.order_item_id, "quantity", newValueChange || 0)
                                    }
                                    disabled={record.item_status !== 0}
                                  />
                                )
                              }
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
                                  value={updateOrderItemList[record.order_item_id]?.status ?? val}
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
                              align: "center",
                              width: 150,
                              render: (val: string, record: any) => (
                                <Input
                                  className="text-left"
                                  value={updateOrderItemList[record.order_item_id]?.notes ?? val}
                                  onChange={(e) => {
                                    const newValueChange = e.target.value || ""
                                    handleChangeItem(record.order_item_id, "notes", newValueChange)
                                  }}
                                />
                              )
                            },
                            {
                              title: "Thời gian tạo",
                              dataIndex: "created_at",
                              key: "created_at",
                              align: "center",
                              render: (val: string) => <div>{val}</div>
                            }
                          ]}
                          rowClassName={(record, index) => {
                            if (record.item_status === 4) {
                              return "bg-red-200 text-red-700 font-medium"
                            }
                            if (record.item_status === 3) {
                              return "bg-green-200 text-green-700 font-medium"
                            }
                            return index % 2 === 0 ? "bg-[#f2f2f2]" : "bg-white"
                          }}
                        />

                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            className="mt-2 py-4 bg-lime-600 hover:!bg-lime-700"
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

                  <Panel
                    key="invoiceInfo"
                    header={<h2 className="text-lg font-semibold text-gray-700">Hóa đơn ({invoiceList.length})</h2>}
                  >
                    <div style={{ padding: 16 }}>
                      <InvoiceListSummary
                        invoices={invoiceList}
                        tableSessionId={dataTableSessionDetail?.session_id}
                        onViewDetail={(invoice) => {
                          setSelectedInvoiceForDetail(invoice)
                          setShowInvoiceDetailModal(true)
                        }}
                      />
                    </div>
                  </Panel>
                </Collapse>

                {/* Invoice Detail Modal */}
                <InvoiceDetailModal
                  open={showInvoiceDetailModal}
                  onClose={() => {
                    setShowInvoiceDetailModal(false)
                    setSelectedInvoiceForDetail(null)
                  }}
                  invoiceId={selectedInvoiceForDetail?.id || null}
                  tableSessionId={dataTableSessionDetail?.session_id || ""}
                  idDiningTable={idDiningTable}
                  onSplitInvoice={(invoice) => {
                    setSelectedInvoiceForDetail(invoice as any)
                    setShowSplitInvoiceModal(true)
                  }}
                  onPaymentSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
                    queryClient.invalidateQueries({
                      queryKey: ["listInvoicesForTableSession", dataTableSessionDetail?.session_id]
                    })
                  }}
                />
              </div>
            )
          ) : hasCurrentSession === false ? (
            <div>
              <PendingTableSessionSelector
                isFetchingListPendingTableSession={isFetchingListPendingTableSession}
                listPendingTableSession={listTablePending}
                hasSessionPending={false} // Không có session hiện tại
                setHasSessionPending={(value) => {
                  setHasCurrentSession(value === true ? true : null)
                }}
                idDiningTable={idDiningTable}
              />
            </div>
          ) : (
            // hasCurrentSession === null (đang loading)
            <div className="flex justify-center items-center flex-col h-[200px]">
              <Spin tip="Đang kiểm tra phiên bàn..." size="large" spinning>
                <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
              </Spin>
            </div>
          )}
        </Col>

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

        {/* Modal tách bàn */}
        <SplitTableModal
          visible={showSplitTableModal}
          onClose={() => setShowSplitTableModal(false)}
          sourceSessionId={dataTableSessionDetail?.session_id || ""}
          sourceDiningTableId={idDiningTable}
          dataTableSessionOrder={dataTableSessionOrder}
          detailInvoice={detailInvoice as any}
          employeeId={employeeId || ""}
          sourceTableNumber={dataTable?.table_number || 0}
        />

        {/* Modal tách hóa đơn - Will be opened from InvoiceDetailModal */}
        {selectedInvoiceForDetail && (
          <SplitInvoiceModal
            visible={showSplitInvoiceModal}
            onCancel={() => setShowSplitInvoiceModal(false)}
            invoice={selectedInvoiceForDetail as any} // TODO: Fetch full InvoiceDetail
            employeeId={employeeId || ""}
            onSuccess={() => {
              // ✅ Đóng cả InvoiceDetailModal khi tách thành công
              setShowInvoiceDetailModal(false)
              setSelectedInvoiceForDetail(null)
            }}
          />
        )}

        {/* Modal tạo hóa đơn mới */}
        <CreateInvoiceModal
          open={showCreateInvoiceModal}
          onClose={() => setShowCreateInvoiceModal(false)}
          totalAmount={Number(dataTableSessionOrder?.total_amount || 0)}
          tableSessionId={dataTableSessionDetail?.session_id || ""}
          idDiningTable={idDiningTable}
        />
      </Row>
    </div>
  )
}
