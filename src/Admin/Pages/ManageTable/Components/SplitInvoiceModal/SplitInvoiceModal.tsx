/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, Card, Col, Descriptions, Input, Modal, Progress, Row, Slider, Space, Statistic, Typography } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import { InvoiceDetail } from "src/Types/invoicePayment.type"
import { Calculator, Split } from "lucide-react"
import { toast } from "react-toastify"
import { AppAbility, useAuthorization } from "src/Authorization"

const { Text } = Typography

interface SplitInvoiceModalProps {
  visible: boolean
  onCancel: () => void
  invoice: InvoiceDetail | null
  employeeId: string
  onSuccess?: () => void // ✅ Callback khi split thành công
}

export const SplitInvoiceModal = ({ visible, onCancel, invoice, employeeId, onSuccess }: SplitInvoiceModalProps) => {
  const queryClient = useQueryClient()
  const [percentage, setPercentage] = useState<number>(50)
  const [splitAmount, setSplitAmount] = useState<number>(0) // ✅ Số tiền muốn tách
  const [inputMode, setInputMode] = useState<"percentage" | "amount">("percentage") // ✅ Chế độ input
  const [note, setNote] = useState<string>("")
  const { can } = useAuthorization()
  const canViewInvoices = can(AppAbility.INVOICES_VIEW)
  const canManageInvoices = can(AppAbility.INVOICES_MANAGE)

  useEffect(() => {
    if (visible && !canViewInvoices) {
      toast.warn("Bạn không có quyền xem chi tiết hóa đơn.", { autoClose: 1500 })
      onCancel()
    }
  }, [visible, canViewInvoices, onCancel])

  // Tính toán số tiền đã thanh toán và số tiền còn lại
  const financialInfo = useMemo(() => {
    if (!invoice) return { totalPaid: 0, remaining: 0, finalAmount: 0 }

    const finalAmount = parseFloat(invoice.final_amount) || 0
    const totalPaid =
      invoice.payments
        ?.filter((p) => p.status === 1) // Status 1 = Completed
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
    const remaining = finalAmount - totalPaid

    return { totalPaid, remaining, finalAmount }
  }, [invoice])

  // Tính toán số tiền tách và số tiền còn lại của parent
  const splitCalculation = useMemo(() => {
    if (!invoice || financialInfo.remaining <= 0) {
      return { splitFinal: 0, splitTotal: 0, parentRemaining: 0, parentTotal: 0, calculatedPercentage: 0 }
    }

    const discount = parseFloat(invoice.discount) || 0
    const tax = parseFloat(invoice.tax) || 0
    const totalAmount = parseFloat(invoice.total_amount) || 0

    // ✅ Tính dựa trên chế độ input
    let finalSplitAmount = 0
    let calculatedPercentage = percentage

    if (inputMode === "percentage") {
      // Tính số tiền từ %
      finalSplitAmount = financialInfo.remaining * (percentage / 100)
    } else {
      // Tính % từ số tiền
      finalSplitAmount = Math.min(splitAmount, financialInfo.remaining) // Không vượt quá remaining
      calculatedPercentage = (finalSplitAmount / financialInfo.remaining) * 100
    }

    // Tính ngược total_amount từ final_amount
    const discountMultiplier = 1 - discount / 100
    const taxMultiplier = 1 + tax / 100
    const splitTotal = finalSplitAmount / (discountMultiplier * taxMultiplier)

    // Số tiền còn lại của parent
    const parentRemaining = financialInfo.remaining - finalSplitAmount
    const parentTotal = totalAmount - splitTotal

    return {
      splitFinal: finalSplitAmount,
      splitTotal,
      parentRemaining,
      parentTotal,
      calculatedPercentage
    }
  }, [invoice, percentage, financialInfo, inputMode, splitAmount])

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = []

    if (!invoice) {
      errors.push("Không tìm thấy thông tin hóa đơn")
      return errors
    }

    if (financialInfo.remaining <= 0) {
      errors.push("Hóa đơn đã thanh toán đầy đủ, không thể tách")
    }

    if (invoice.status === 2) {
      // Status 2 = Paid
      errors.push("Hóa đơn đã hoàn tất thanh toán, không thể tách")
    }

    // ✅ Validate dựa trên chế độ input
    if (inputMode === "percentage") {
      if (percentage <= 0 || percentage >= 100) {
        errors.push("Phần trăm tách phải từ 1% đến 99%")
      }
    } else {
      // Mode amount
      if (splitAmount < 1000) {
        errors.push("Số tiền tách tối thiểu là 1,000 VNĐ")
      }
      if (splitAmount >= financialInfo.remaining) {
        errors.push("Số tiền tách phải nhỏ hơn số tiền còn lại")
      }
    }
    return errors
  }, [invoice, percentage, note, financialInfo, inputMode, splitAmount])

  const canSplit = validationErrors.length === 0

  // Mutation: Split Invoice
  const splitInvoiceMutation = useMutation({
    mutationFn: () => {
      if (!invoice) throw new Error("Invoice không tồn tại")

      // ✅ Sử dụng calculatedPercentage từ splitCalculation
      const { calculatedPercentage } = splitCalculation

      return invoicePaymentAPI.splitInvoice({
        invoice_id: invoice.id,
        splits: [
          {
            percentage: calculatedPercentage,
            note: note.trim()
          }
        ],
        employee_id: employeeId
      })
    },
    onSuccess: (response: any) => {
      const data = response.data.data
      console.log("✅ Split invoice thành công:", data)

      // ✅ Invalidate các query liên quan để refresh data
      queryClient.invalidateQueries({ queryKey: ["detailDetailInvoice"] })
      queryClient.invalidateQueries({ queryKey: ["listPendingTableSession"] })
      queryClient.invalidateQueries({ queryKey: ["detailTableSession"] })
      queryClient.invalidateQueries({ queryKey: ["listInvoicesForTableSession"] }) // ✅ Thêm invalidate invoice list
      queryClient.invalidateQueries({ queryKey: ["invoiceDetail"] }) // ✅ Thêm invalidate invoice detail

      Modal.success({
        title: "Tách hóa đơn thành công!",
        content: (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text>
              Đã tạo <strong>{data.summary.split_count}</strong> hóa đơn con từ hóa đơn gốc
            </Text>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Hóa đơn gốc còn lại">
                {Number(data.parent_invoice.final_amount).toLocaleString()} VNĐ (
                {data.summary.parent_remaining_percentage}%)
              </Descriptions.Item>
              <Descriptions.Item label="Hóa đơn con">
                {Number(data.child_invoices[0].final_amount).toLocaleString()} VNĐ (
                {data.summary.total_split_percentage}%)
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )
      })

      // ✅ Gọi onSuccess callback để đóng InvoiceDetailModal
      if (onSuccess) {
        onSuccess()
      }

      // Reset form và đóng modal
      handleClose()
    },
    onError: (error: any) => {
      console.error("❌ Lỗi khi tách hóa đơn:", error)
      Modal.error({
        title: "Tách hóa đơn thất bại",
        content: error?.response?.data?.message || "Đã xảy ra lỗi khi tách hóa đơn. Vui lòng thử lại."
      })
    }
  })

  const handleSplit = () => {
    if (!canManageInvoices) {
      toast.warn("Bạn không có quyền tách hóa đơn.", { autoClose: 1500 })
      return
    }
    if (!canSplit) return
    splitInvoiceMutation.mutate()
  }

  const handleClose = () => {
    setPercentage(50)
    setSplitAmount(0)
    setInputMode("percentage")
    setNote("")
    onCancel()
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN") + " VNĐ"
  }

  if (!invoice || !canViewInvoices) return null

  return (
    <Modal
      title={
        <Space>
          <Split size={20} />
          <span>Tách Hóa Đơn</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleSplit}
      okText="Xác nhận tách"
      cancelText="Hủy"
      width={750}
      centered // ✅ Center modal vertically
      zIndex={1100} // ✅ Higher z-index để hiển thị đè lên InvoiceDetailModal (default: 1000)
      okButtonProps={{
        disabled: !canSplit || !canManageInvoices,
        loading: splitInvoiceMutation.isPending
      }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 250px)", // ✅ Giới hạn chiều cao
          overflowY: "auto", // ✅ Cho phép scroll
          padding: "20px 24px"
        }
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Thông tin hóa đơn hiện tại */}
        <Card title="Thông tin hóa đơn gốc" size="small">
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="Mã hóa đơn">{invoice.id}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {invoice.status === 0 && <Text type="danger">Chưa thanh toán</Text>}
              {invoice.status === 1 && <Text type="warning">Đã thanh toán 1 phần</Text>}
              {invoice.status === 2 && <Text type="success">Đã thanh toán</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">{formatCurrency(parseFloat(invoice.total_amount))}</Descriptions.Item>
            <Descriptions.Item label="Giảm giá">{invoice.discount}%</Descriptions.Item>
            <Descriptions.Item label="Thuế VAT">{invoice.tax}%</Descriptions.Item>
            <Descriptions.Item label="Thành tiền">{formatCurrency(parseFloat(invoice.final_amount))}</Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán" span={2}>
              <Text strong type="success">
                {formatCurrency(financialInfo.totalPaid)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại" span={2}>
              <Text strong type="danger">
                {formatCurrency(financialInfo.remaining)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Input tách hóa đơn với Slider và Progress */}
        <Card
          title={
            <Space>
              <Calculator size={16} />
              <span>Cấu hình tách hóa đơn</span>
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {/* Slider với markers */}
            <div>
              <Text strong>Phần trăm tách hóa đơn:</Text>
              <Slider
                min={1}
                max={99}
                value={percentage}
                onChange={(value) => setPercentage(value)}
                marks={{
                  1: "1%",
                  25: "25%",
                  50: "50%",
                  75: "75%",
                  99: "99%"
                }}
                tooltip={{
                  formatter: (value) => `${value}%`
                }}
                style={{ marginTop: 16, marginBottom: 24 }}
                disabled={!canManageInvoices}
              />
            </div>

            {/* Visual Progress Bars */}
            <div>
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Text type="secondary">Hóa đơn gốc (còn lại)</Text>
                  <Text strong style={{ color: "#fa8c16" }}>
                    {100 - percentage}%
                  </Text>
                </Space>
                <Progress percent={100 - percentage} strokeColor="#fa8c16" trailColor="#d9d9d9" showInfo={false} />

                <Space style={{ width: "100%", justifyContent: "space-between", marginTop: 8 }}>
                  <Text type="secondary">Hóa đơn con (tách ra)</Text>
                  <Text strong style={{ color: "#722ed1" }}>
                    {percentage}%
                  </Text>
                </Space>
                <Progress percent={percentage} strokeColor="#722ed1" showInfo={false} />
              </Space>
            </div>

            {/* Amount Display */}
            <Card size="small" style={{ backgroundColor: "#f0f5ff", marginTop: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Gốc còn lại"
                    value={splitCalculation.parentRemaining}
                    suffix="đ"
                    precision={0}
                    valueStyle={{ color: "#fa8c16" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Con mới"
                    value={splitCalculation.splitFinal}
                    suffix="đ"
                    precision={0}
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Note input */}
            <div style={{ marginTop: 12 }}>
              <Text strong>Ghi chú:</Text>
              <Input.TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Hóa đơn khách A, Chia cho 2 người, ..."
                rows={2}
                style={{ marginTop: 8 }}
                maxLength={200}
                showCount
                disabled={!canManageInvoices}
              />
            </div>
          </Space>
        </Card>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert
            message="Không thể tách hóa đơn"
            description={
              <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
          />
        )}
      </Space>
    </Modal>
  )
}
