/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Form, Select, Input, Table, InputNumber, Button, Alert, Space, Typography, Divider, Card, Row, Col } from "antd"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { toast } from "react-toastify"
import { tableSessionAPI } from "src/Apis/Admin"
import { TableSessionOrder } from "src/Types/tableSession.type"
import { ColumnsType } from "antd/es/table"
import { ArrowRight, Info } from "lucide-react"

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

  const [selectedItems, setSelectedItems] = useState<OrderItemToSplit[]>([])
  const [targetType, setTargetType] = useState<"new" | "existing">("new")

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
    enabled: visible && targetType === "new",
    retry: 0
  })

  const listEmptyTables = useMemo(() => {
    const data = dataEmptyTables?.data?.data?.data || []
    return data.filter((item: any) => item.dining_table_id !== sourceDiningTableId)
  }, [dataEmptyTables, sourceDiningTableId])

  // Lấy danh sách bàn đang active (để chọn bàn đích)
  const { data: dataTableSessionActive } = useQuery({
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
    enabled: visible && targetType === "existing",
    retry: 0
  })

  const listTableSessionActive = useMemo(() => {
    const data = dataTableSessionActive?.data?.data?.data || []
    // Lọc bỏ bàn nguồn và chỉ lấy bàn đang active
    return data.filter(
      (item: any) =>
        item.session_id !== sourceSessionId &&
        item.session_status === 1 &&
        item.dining_table_id !== sourceDiningTableId
    )
  }, [dataTableSessionActive, sourceSessionId, sourceDiningTableId])

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
              <Select placeholder="Chọn bàn trống" loading={!dataEmptyTables}>
                {listEmptyTables.map((table: any) => (
                  <Select.Option key={table.dining_table_id} value={table.dining_table_id}>
                    Bàn {table.table_number} - {table.capacity} chỗ (Trống)
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
              <Select placeholder="Chọn bàn đang phục vụ" loading={!dataTableSessionActive}>
                {listTableSessionActive.map((table: any) => (
                  <Select.Option key={table.session_id} value={table.session_id}>
                    Bàn {table.table_number} - {table.capacity} chỗ
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
