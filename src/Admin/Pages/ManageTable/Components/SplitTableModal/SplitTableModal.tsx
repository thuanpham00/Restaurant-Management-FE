/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Modal,
  Form,
  Select,
  Input,
  Table,
  InputNumber,
  Button,
  Alert,
  Space,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Tag
} from "antd"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { tableSessionAPI } from "src/Apis/Admin"
import { TableSessionOrder } from "src/Types/tableSession.type"
import { ColumnsType } from "antd/es/table"
import { ArrowRight, Info } from "lucide-react"
import type { TableSession } from "src/Types/tableSession.type"
import { TableSessionStatus, TableSessionType } from "src/Types/product.type"
import { AppAbility, useAuthorization } from "src/Authorization"

const { Text } = Typography
const { TextArea } = Input

interface SplitTableModalProps {
  visible: boolean
  onClose: () => void
  sourceSessionId: string
  sourceDiningTableId: string
  dataTableSessionOrder: TableSessionOrder | undefined
  detailInvoice: any
  employeeId: string
  sourceTableNumber: number
}

interface OrderItemToSplit {
  order_item_id: string
  dish_name: string
  current_quantity: number
  quantity_to_transfer: number
  item_price: number
  total_price: number
}

export default function SplitTableModal({
  visible,
  onClose,
  sourceSessionId,
  sourceDiningTableId,
  dataTableSessionOrder,
  detailInvoice,
  employeeId,
  sourceTableNumber
}: SplitTableModalProps) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const { can } = useAuthorization()
  const canViewTables = can(AppAbility.TABLES_VIEW)
  const canManageTables = can(AppAbility.TABLES_MANAGE)

  const [selectedItems, setSelectedItems] = useState<OrderItemToSplit[]>([])
  const [targetType, setTargetType] = useState<"new" | "existing">("new")

  useEffect(() => {
    if (visible && !canViewTables) {
      toast.warn("Bạn không có quyền xem chi tiết bàn.", { autoClose: 1500 })
      onClose()
    }
  }, [visible, canViewTables, onClose])

  // Lấy danh sách bàn trống (cho việc tạo session mới)
  const { data: dataEmptyTables } = useQuery({
    queryKey: ["listEmptyTablesForSplit"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListTableSession(
        {
          page: "1",
          per_page: "100",
          session_status: "empty"
        },
        controller.signal
      )
    },
  enabled: visible && targetType === "new" && canViewTables,
    retry: 0
  })

  const listEmptyTables = useMemo(() => {
    const tables = ((dataEmptyTables?.data.data) ?? []) as TableSession[]
    return tables
      .filter((table) => table.dining_table_id !== sourceDiningTableId && !table.session_id)
      .sort((a, b) => Number(a.table_number) - Number(b.table_number))
  }, [dataEmptyTables, sourceDiningTableId])

  // Lấy danh sách bàn đang active (để chọn bàn đích)
  const { data: dataTableSessionActive, isFetching: isFetchingActiveTables } = useQuery({
    queryKey: ["listTableSessionActiveForSplit"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListTableSession(
        {
          page: "1",
          per_page: "100"
        },
        controller.signal
      )
    },
  enabled: visible && targetType === "existing" && canViewTables,
    retry: 0
  })

  const activeTables = useMemo(() => {
    return ((dataTableSessionActive?.data.data) ?? []) as TableSession[]
  }, [dataTableSessionActive])

  type ActiveSessionGroup = {
    sessionId: string
    label: string
    main: TableSession
    subs: TableSession[]
    totalCapacity: number
    totalTables: number
  }

  const groupedActiveSessions = useMemo<ActiveSessionGroup[]>(() => {
    if (!activeTables.length) {
      return []
    }

    const mainSessionMap = new Map<string, { main: TableSession; subs: TableSession[] }>()

    activeTables.forEach((table) => {
      const sessionId = table.session_id
      if (!sessionId) return
      if (table.merged_into_session_id) return
      if (table.session_status !== TableSessionStatus.Active) return
      if (sessionId === sourceSessionId) return
      if (table.dining_table_id === sourceDiningTableId) return

      mainSessionMap.set(sessionId, {
        main: table,
        subs: []
      })
    })

    if (mainSessionMap.size === 0) {
      return []
    }

    activeTables.forEach((table) => {
      const parentId = table.merged_into_session_id
      if (!parentId) return
      const group = mainSessionMap.get(parentId)
      if (!group) return
      if (table.session_id === sourceSessionId || table.dining_table_id === sourceDiningTableId) return
      group.subs.push(table)
    })

    const groups: ActiveSessionGroup[] = []

    mainSessionMap.forEach(({ main, subs }) => {
      const orderedSubs = [...subs].sort((a, b) => Number(a.table_number) - Number(b.table_number))
      const totalCapacity = orderedSubs.reduce(
        (sum, item) => sum + (Number(item.capacity) || 0),
        Number(main.capacity) || 0
      )

      groups.push({
        sessionId: main.session_id as string,
        label: `Bàn ${main.table_number}${orderedSubs.length ? ` (Gộp ${orderedSubs.length + 1} bàn)` : ""}`,
        main,
        subs: orderedSubs,
        totalCapacity,
        totalTables: orderedSubs.length + 1
      })
    })

    groups.sort((a, b) => Number(a.main.table_number) - Number(b.main.table_number))

    return groups
  }, [activeTables, sourceDiningTableId, sourceSessionId])

  const getSessionStatusMeta = (status: number | null | undefined) => {
    switch (status) {
      case TableSessionStatus.Pending:
        return { color: "orange", label: "Đang chờ" }
      case TableSessionStatus.Active:
        return { color: "blue", label: "Đang phục vụ" }
      case TableSessionStatus.Completed:
        return { color: "gray", label: "Hoàn tất" }
      case TableSessionStatus.Cancelled:
        return { color: "red", label: "Đã hủy" }
      case TableSessionStatus.Merged:
        return { color: "magenta", label: "Đã gộp" }
      default:
        return null
    }
  }

  const getSessionTypeMeta = (type: number | null | undefined) => {
    switch (type) {
      case TableSessionType.Offline:
        return { color: "default", label: "Offline" }
      case TableSessionType.Merge:
        return { color: "gold", label: "Gộp bàn" }
      case TableSessionType.Reservation:
        return { color: "cyan", label: "Đặt trước" }
      case TableSessionType.Split:
        return { color: "purple", label: "Tách bàn" }
      default:
        return null
    }
  }

  useEffect(() => {
    if (targetType === "existing") {
      form.setFieldsValue({ target_dining_table_id: undefined })
    } else {
      form.setFieldsValue({ target_session_id: undefined })
    }
  }, [targetType, form])

  // Tính toán remaining amount
  const remainingAmount = useMemo(() => {
    if (!detailInvoice) return null
    
    const finalAmount = Number(detailInvoice.final_amount || 0)
    const totalPaid = (detailInvoice.payments || [])
      .filter((p: any) => p.status === "Completed" || p.status === 1)
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
    
    return finalAmount - totalPaid
  }, [detailInvoice])

  // Tính tổng giá trị món được chọn
  const totalTransferAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.total_price, 0)
  }, [selectedItems])

  // Kiểm tra điều kiện hợp lệ
  const validationErrors = useMemo(() => {
    const errors: string[] = []

    if (selectedItems.length === 0) {
      errors.push("Vui lòng chọn ít nhất 1 món để tách")
    }

    const totalItemsInOrder = dataTableSessionOrder?.items?.length || 0
    const allItemsSelected = selectedItems.length === totalItemsInOrder &&
      selectedItems.every((selected) => {
        const original = dataTableSessionOrder?.items?.find(
          (item) => item.order_item_id === selected.order_item_id
        )
        return original && selected.quantity_to_transfer === original.quantity
      })

    if (allItemsSelected) {
      errors.push("Phải giữ lại ít nhất 1 món ở bàn nguồn")
    }

    if (remainingAmount !== null && totalTransferAmount >= remainingAmount) {
      errors.push(
        `Giá trị món tách (${totalTransferAmount.toLocaleString()}đ) phải nhỏ hơn số tiền còn lại (${remainingAmount.toLocaleString()}đ)`
      )
    }

    return errors
  }, [selectedItems, dataTableSessionOrder, remainingAmount, totalTransferAmount])

  // Xử lý thay đổi số lượng món
  const handleQuantityChange = (orderItemId: string, quantity: number) => {
    if (!canManageTables) return
    const originalItem = dataTableSessionOrder?.items?.find((item) => item.order_item_id === orderItemId)
    if (!originalItem) return

    const updatedItems = selectedItems.filter((item) => item.order_item_id !== orderItemId)

    if (quantity > 0 && quantity <= originalItem.quantity) {
      const itemPrice = Number(originalItem.item_price)
      updatedItems.push({
        order_item_id: orderItemId,
        dish_name: originalItem.dish.dish_name,
        current_quantity: originalItem.quantity,
        quantity_to_transfer: quantity,
        item_price: itemPrice,
        total_price: itemPrice * quantity
      })
    }

    setSelectedItems(updatedItems)
  }

  // Columns cho bảng chọn món
  const columns: ColumnsType<any> = [
    {
      title: "Món ăn",
      dataIndex: ["dish", "dish_name"],
      key: "dish_name",
      width: "30%"
    },
    {
      title: "SL hiện tại",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: "15%",
      render: (qty: number) => <Text strong>{qty}</Text>
    },
    {
      title: "SL cần tách",
      key: "transfer_quantity",
      align: "center",
      width: "20%",
      render: (_, record) => {
        const selected = selectedItems.find((item) => item.order_item_id === record.order_item_id)
        return (
          <InputNumber
            min={0}
            max={record.quantity}
            value={selected?.quantity_to_transfer || 0}
            onChange={(value) => handleQuantityChange(record.order_item_id, value || 0)}
            style={{ width: "100%" }}
            disabled={!canManageTables}
          />
        )
      }
    },
    {
      title: "Đơn giá",
      dataIndex: "item_price",
      key: "item_price",
      align: "right",
      width: "15%",
      render: (price: string) => (
        <Text type="danger">{Number(price).toLocaleString()}đ</Text>
      )
    },
    {
      title: "Tổng tiền",
      key: "total",
      align: "right",
      width: "20%",
      render: (_, record) => {
        const selected = selectedItems.find((item) => item.order_item_id === record.order_item_id)
        if (!selected || selected.quantity_to_transfer === 0) return <Text>0đ</Text>
        return (
          <Text strong type="danger">
            {selected.total_price.toLocaleString()}đ
          </Text>
        )
      }
    }
  ]

  // Mutation tách bàn
  const splitTableMutation = useMutation({
    mutationFn: (body: {
      source_session_id: string
      order_items: Array<{
        order_item_id: string
        quantity_to_transfer: number
      }>
      target_session_id?: string
      target_dining_table_id?: string
      note?: string
      employee_id: string
    }) => {
      return tableSessionAPI.splitTable(body)
    },
    onSuccess: (response: any) => {
      toast.success("Tách bàn thành công!", {
        autoClose: 1500
      })
      
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["detailTableSession", sourceDiningTableId] })
      queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", sourceSessionId] })
      queryClient.invalidateQueries({ queryKey: ["listTableSession"] })
      queryClient.invalidateQueries({ queryKey: ["detailDetailInvoice", sourceSessionId] })

      // Hiển thị thông tin bàn đích
      const targetSession = response?.data?.data?.target_session
      if (targetSession) {
        toast.info(`Món đã được chuyển sang bàn ${targetSession.table_number || "mới"}`, {
          autoClose: 2000
        })
      }

      handleClose()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Tách bàn thất bại"
      toast.error(errorMessage, {
        autoClose: 2000
      })
    }
  })

  const handleSubmit = async () => {
    if (!canManageTables) {
      toast.warn("Bạn không có quyền tách bàn.", { autoClose: 1500 })
      return
    }
    try {
      const values = await form.validateFields()

      const orderItems = selectedItems.map((item) => ({
        order_item_id: item.order_item_id,
        quantity_to_transfer: item.quantity_to_transfer
      }))

      const body: any = {
        source_session_id: sourceSessionId,
        order_items: orderItems,
        note: values.note || "",
        employee_id: employeeId
      }

      if (targetType === "existing") {
        body.target_session_id = values.target_session_id
      } else {
        body.target_dining_table_id = values.target_dining_table_id
      }

      splitTableMutation.mutate(body)
    } catch (error) {
      console.error("Validation error:", error)
    }
  }

  const handleClose = () => {
    form.resetFields()
    setSelectedItems([])
    setTargetType("new")
    onClose()
  }

  return (
    <Modal
    className="split-table-modal"
      title={
        <Space>
          <span className="text-xl font-bold">Tách bàn #{sourceTableNumber}</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={1000}
      centered
      style={{
        maxHeight: 'calc(100vh - 100px)', 
        overflowY: 'auto',
      }}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={splitTableMutation.isPending}
          disabled={validationErrors.length > 0}
        >
          Xác nhận tách bàn
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        {/* Thông tin invoice */}
        {detailInvoice && (
          <Alert
            message="Thông tin hóa đơn"
            description={
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <Text type="secondary">Tổng tiền:</Text>
                  <br />
                  <Text strong>{Number(detailInvoice.total_amount || 0).toLocaleString()}đ</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Đã thanh toán:</Text>
                  <br />
                  <Text strong type="success">
                    {(Number(detailInvoice.final_amount || 0) - (remainingAmount || 0)).toLocaleString()}đ
                  </Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Còn lại:</Text>
                  <br />
                  <Text strong type="warning">
                    {(remainingAmount || 0).toLocaleString()}đ
                  </Text>
                </Col>
              </Row>
            }
            type="info"
            showIcon
            icon={<Info size={16} />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Hiển thị lỗi validation */}
        {validationErrors.length > 0 && (
          <Alert
            message="Lưu ý"
            description={
              <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Chọn món để tách */}
        <Card
          title="1. Chọn món cần tách"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Table
            columns={columns}
            dataSource={dataTableSessionOrder?.items || []}
            rowKey="order_item_id"
            pagination={false}
            size="small"
            scroll={{ y: 300 }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <Text strong>Tổng tiền chuyển:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong type="danger" style={{ fontSize: 16 }}>
                      {totalTransferAmount.toLocaleString()}đ
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>

        {/* Chọn bàn đích */}
        <Card
          title="2. Chọn bàn đích"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Form.Item label="Loại bàn đích">
            <Select value={targetType} onChange={setTargetType}>
              <Select.Option value="new">Tạo bàn mới</Select.Option>
              <Select.Option value="existing">Chuyển sang bàn có sẵn</Select.Option>
            </Select>
          </Form.Item>

          {targetType === "new" ? (
            <Form.Item
              label="Chọn bàn trống"
              name="target_dining_table_id"
              rules={[{ required: true, message: "Vui lòng chọn bàn đích" }]}
            >
              <Select
                placeholder="Chọn bàn trống"
                loading={visible && targetType === "new" && !dataEmptyTables}
                optionLabelProp="label"
                notFoundContent="Không có bàn trống phù hợp"
              >
                {listEmptyTables.map((table) => (
                  <Select.Option
                    key={table.dining_table_id}
                    value={table.dining_table_id}
                    label={`Bàn ${table.table_number}`}
                  >
                    <div className="flex flex-col">
                      <span>
                        Bàn {table.table_number} · {table.capacity} chỗ
                      </span>
                      <span className="text-xs text-gray-500">Trạng thái: Trống</span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item
              label="Chọn bàn đang phục vụ"
              name="target_session_id"
              rules={[{ required: true, message: "Vui lòng chọn bàn đích" }]}
            >
              <Select
                placeholder="Chọn bàn đang phục vụ"
                optionLabelProp="label"
                loading={isFetchingActiveTables}
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                }
                notFoundContent="Không tìm thấy bàn đang phục vụ phù hợp"
              >
                {groupedActiveSessions.map((session) => (
                  <Select.Option key={session.sessionId} value={session.sessionId} label={session.label}>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-gray-900">Bàn {session.main.table_number}</span>
                        {(() => {
                          const statusMeta = getSessionStatusMeta(session.main.session_status)
                          return statusMeta ? <Tag color={statusMeta.color}>{statusMeta.label}</Tag> : null
                        })()}
                        {(() => {
                          const typeMeta = getSessionTypeMeta(session.main.session_type)
                          return typeMeta ? <Tag color={typeMeta.color}>{typeMeta.label}</Tag> : null
                        })()}
                      </div>
                      <span className="text-xs text-gray-500">
                        Tổng {session.totalTables} bàn · Sức chứa {session.totalCapacity} người
                      </span>
                      {session.subs.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 text-xs">
                          {session.subs.map((sub) => {
                            const subStatusMeta = getSessionStatusMeta(sub.session_status)
                            return (
                              <Tag key={sub.dining_table_id} color={subStatusMeta?.color || "default"}>
                                Bàn {sub.table_number}
                                {subStatusMeta ? ` · ${subStatusMeta.label}` : ""}
                              </Tag>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Card>

        {/* Ghi chú */}
        <Form.Item label="Ghi chú" name="note">
          <TextArea rows={2} placeholder="Ví dụ: Khách yêu cầu tách bàn..." />
        </Form.Item>
      </Form>

      <Divider />

      {/* Preview kết quả */}
      {selectedItems.length > 0 && validationErrors.length === 0 && (
        <Card size="small" className="bg-blue-50">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text strong>Xem trước kết quả:</Text>
            <Row gutter={16} align="middle">
              <Col span={11}>
                <Card size="small">
                  <Text type="secondary">Bàn #{sourceTableNumber}</Text>
                  <br />
                  <Text>
                    Còn lại:{" "}
                    {dataTableSessionOrder?.items?.reduce((sum, item) => {
                      const selected = selectedItems.find((s) => s.order_item_id === item.order_item_id)
                      const remaining = item.quantity - (selected?.quantity_to_transfer || 0)
                      return sum + remaining * Number(item.item_price)
                    }, 0).toLocaleString()}đ
                  </Text>
                </Card>
              </Col>
              <Col span={2} style={{ textAlign: "center" }}>
                <ArrowRight size={24} color="#1890ff" />
              </Col>
              <Col span={11}>
                <Card size="small">
                  <Text type="secondary">Bàn đích</Text>
                  <br />
                  <Text strong type="danger">
                    +{totalTransferAmount.toLocaleString()}đ
                  </Text>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>
      )}
    </Modal>
  )
}
