import { Modal, Space, Button, Descriptions, Tag, Row, Col, Card, Radio, Divider, Checkbox } from "antd"
import { FileText, CreditCard, Split } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import { useAppStore } from "src/StateGlobal/zustand"
import { toast } from "react-toastify"
import type {
  InvoiceDetail,
  InvoicePaymentUpdatePayload,
  InvoicePromotion
} from "../../../../../Types/invoicePayment.type"
import type { TableSessionDetail, TableSessionOrder } from "src/Types/tableSession.type"
import {
  exportInvoicePdf,
  formatCurrency,
  formatDateTime,
  formatPromotionDateRange,
  getPaymentMethodLabel,
  getPaymentStatusMeta,
  resolvePromotionDiscountLabel,
  toNumber
} from "../../utils/invoicePdf"
import { AppAbility, useAuthorization } from 'src/Authorization'

interface InvoiceDetailModalProps {
  open: boolean
  onClose: () => void
  invoiceId: string | null
  tableSessionId: string
  idDiningTable: string
  onSplitInvoice?: (invoice: InvoiceDetail) => void // ✅ Callback để mở SplitInvoiceModal
  onPaymentSuccess?: () => void // ✅ Callback khi thanh toán thành công
  tableSessionDetail?: TableSessionDetail | null
  tableInfo?: {
    tableName?: string | null
    tableNumber?: number | null
  }
  orderItems?: TableSessionOrder["items"]
  orderSubtotal?: number
}

export const InvoiceDetailModal = ({
  open,
  onClose,
  invoiceId,
  tableSessionId,
  idDiningTable,
  onSplitInvoice, // ✅ Callback mở SplitInvoiceModal
  onPaymentSuccess, // ✅ Callback thanh toán thành công
  tableSessionDetail,
  tableInfo,
  orderItems,
  orderSubtotal
}: InvoiceDetailModalProps) => {
  const queryClient = useQueryClient()
  const { employeeId } = useAppStore()
  const [paymentMethod, setPaymentMethod] = useState<number | null>(null) // 0 = Cash, 1 = Bank Transfer
  const { can } = useAuthorization()
  const canViewInvoices = can(AppAbility.INVOICES_VIEW)
  const canManageInvoices = can(AppAbility.INVOICES_MANAGE)

  useEffect(() => {
    if (open && !canViewInvoices) {
      toast.warn('Bạn không có quyền xem chi tiết hóa đơn.', { autoClose: 1500 })
      onClose()
    }
  }, [open, canViewInvoices, onClose])

  useEffect(() => {
    if (!canManageInvoices) {
      setPaymentMethod(null)
    }
  }, [canManageInvoices])
  const [shouldExportInvoice, setShouldExportInvoice] = useState(false)

  useEffect(() => {
    if (!open) {
      setPaymentMethod(null)
      setShouldExportInvoice(false)
    }
  }, [open])

  // Fetch full invoice detail
  const { data: invoiceDetailData, isLoading } = useQuery({
    queryKey: ["invoiceDetail", invoiceId],
    queryFn: () => invoicePaymentAPI.getDetailInvoice(invoiceId!),
    enabled: Boolean(invoiceId && open && canViewInvoices),
    staleTime: 30000
  })

  const invoiceDetail = invoiceDetailData?.data?.data as InvoiceDetail | undefined

  const appliedPromotions = useMemo(() => {
    if (!invoiceDetail) return [] as InvoicePromotion[]

    const rawPromotions = invoiceDetail.invoice_promotions ?? []

    return Array.isArray(rawPromotions) ? (rawPromotions as InvoicePromotion[]) : []
  }, [invoiceDetail])

  // Calculate financial info
  const financialInfo = useMemo(() => {
    if (!invoiceDetail) {
      return {
        subtotal: 0,
        tax: 0,
        finalAmount: 0,
        discount: 0,
        totalPaid: 0,
        remaining: 0,
        discountAmount: 0,
        subtotalAfterDiscount: 0,
        taxAmount: 0
      }
    }

    const subtotal = toNumber(invoiceDetail.total_amount)
    const discount = Math.max(toNumber(invoiceDetail.discount), 0)
    const tax = Math.max(toNumber(invoiceDetail.tax), 0)
    const finalAmount = toNumber(invoiceDetail.final_amount)
    const discountAmount = subtotal * (discount / 100)
    const subtotalAfterDiscount = subtotal - discountAmount

    const totalPaid =
      invoiceDetail.payments
        ?.filter((payment) => payment.status === 1)
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0) || 0

    const remaining = Math.max(finalAmount - totalPaid, 0)
    const taxAmount = Math.max(finalAmount - subtotalAfterDiscount, 0)

    return {
      subtotal,
      tax,
      finalAmount,
      discount,
      totalPaid,
      remaining,
      discountAmount,
      subtotalAfterDiscount,
      taxAmount
    }
  }, [invoiceDetail])

  const paymentStats = useMemo(() => {
    const payments = invoiceDetail?.payments ?? []

    if (payments.length === 0) {
      return { total: 0, success: 0, failed: 0, pending: 0 }
    }

    return payments.reduce(
      (acc, payment) => {
        acc.total += 1

        if (payment.status === 1) {
          acc.success += 1
        } else if (payment.status === 0) {
          acc.failed += 1
        } else {
          acc.pending += 1
        }

        return acc
      },
      { total: 0, success: 0, failed: 0, pending: 0 }
    )
  }, [invoiceDetail?.payments])

  // ✅ Mutation thanh toán
  const paymentMutation = useMutation({
    mutationFn: (payload: InvoicePaymentUpdatePayload) => {
      return invoicePaymentAPI.update(invoiceId!, payload)
    }
  })

  // Handle thanh toán
  const handlePayment = () => {
    if (!canManageInvoices) {
      toast.warn('Bạn không có quyền thanh toán hóa đơn.', { autoClose: 1500 })
      return
    }
    if (paymentMethod === null || !invoiceDetail) return

    const amountToPay = financialInfo.remaining
    const selectedMethod = paymentMethod
    const shouldDownload = shouldExportInvoice

    const payload: InvoicePaymentUpdatePayload = {
      table_session_id: tableSessionId,
      amount: amountToPay,
      method: selectedMethod,
      status_payment: 1,
      employee_id: employeeId as string
    }

    paymentMutation.mutate(payload, {
      onSuccess: async () => {
        toast.success("Thanh toán thành công!", { autoClose: 1500 })

        queryClient.invalidateQueries({ queryKey: ["invoiceDetail", invoiceId] })
        queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
        queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", tableSessionId] })
        queryClient.invalidateQueries({ queryKey: ["listInvoicesForTableSession", tableSessionId] })

        if (onPaymentSuccess) {
          onPaymentSuccess()
        }

        if (shouldDownload) {
          await exportInvoicePdf({
            invoiceDetail,
            paidAmount: amountToPay,
            paymentMethod: selectedMethod,
            tableSessionDetail,
            tableInfo,
            orderItems,
            orderSubtotal
          })
        }

        onClose()
      },
      onError: (error: unknown) => {
        const message = isAxiosError(error)
          ? error.response?.data?.message || "Thanh toán thất bại. Vui lòng thử lại."
          : "Thanh toán thất bại. Vui lòng thử lại."

        toast.error(message, {
          autoClose: 2000
        })
      }
    })
  }

  // Get status info
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { text: "Chưa thanh toán", color: "red" }
      case 1:
        return { text: "Thanh toán một phần", color: "orange" }
      case 2:
        return { text: "Đã thanh toán", color: "green" }
      default:
        return { text: "Không xác định", color: "default" }
    }
  }

  // Get operation type badge
  const getOperationTypeBadge = () => {
    if (!invoiceDetail?.operation_type) return null

    if (invoiceDetail.operation_type === "split_invoice") {
      return <Tag color="purple">Tách {invoiceDetail.split_percentage ? `${invoiceDetail.split_percentage}%` : ""}</Tag>
    }

    if (invoiceDetail.operation_type === "merge_invoice") {
      return <Tag color="cyan">Gộp hóa đơn</Tag>
    }

    return <Tag>{invoiceDetail.operation_type}</Tag>
  }

  const statusInfo = invoiceDetail ? getStatusInfo(invoiceDetail.status) : null

  if (!canViewInvoices) {
    return null
  }

  return (
    <Modal
      title={
        <Space>
          <FileText size={20} />
          <span>Chi tiết hóa đơn #{invoiceId}</span>
        </Space>
      }
  open={open && canViewInvoices}
      onCancel={onClose}
      footer={null}
      width={700}
      centered // ✅ Center modal
      loading={isLoading}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)", // ✅ Giới hạn chiều cao
          overflowY: "auto", // ✅ Cho phép scroll
          padding: "20px"
        }
      }}
    >
      {invoiceDetail && (
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          {/* Summary Card */}
          <Card
            size="small"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", marginBottom: "6px" }}>
                      Tạm tính
                    </div>
                    <div style={{ color: "#ffffff", fontSize: "24px", fontWeight: 600 }}>
                      {formatCurrency(financialInfo.subtotal)}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", marginBottom: "6px" }}>
                      Giảm giá
                    </div>
                    <div style={{ color: "#ffccc7", fontSize: "24px", fontWeight: 600 }}>
                      {financialInfo.discount > 0
                        ? `- ${formatCurrency(financialInfo.discountAmount)}`
                        : formatCurrency(0)}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", marginBottom: "6px" }}>
                      Thuế VAT
                    </div>
                    <div style={{ color: "#bae7ff", fontSize: "24px", fontWeight: 600 }}>
                      {financialInfo.tax > 0 ? `+ ${formatCurrency(financialInfo.taxAmount)}` : formatCurrency(0)}
                    </div>
                  </div>
                </Col>
              </Row>

              <Divider dashed style={{ borderColor: "rgba(255, 255, 255, 0.25)", margin: "4px 0 2px" }} />

              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", marginBottom: "6px" }}>
                      Tổng phải thu
                    </div>
                    <div style={{ color: "#ffffff", fontSize: "26px", fontWeight: "bold" }}>
                      {formatCurrency(financialInfo.finalAmount)}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", marginBottom: "6px" }}>
                      Đã thanh toán
                    </div>
                    <div style={{ color: "#95de64", fontSize: "26px", fontWeight: "bold" }}>
                      {formatCurrency(financialInfo.totalPaid)}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", marginBottom: "6px" }}>
                      Còn lại
                    </div>
                    <div
                      style={{
                        color: financialInfo.remaining > 0 ? "#ffd666" : "#b7eb8f",
                        fontSize: "26px",
                        fontWeight: "bold"
                      }}
                    >
                      {formatCurrency(financialInfo.remaining)}
                    </div>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Invoice Details */}
          <Descriptions
            bordered
            column={1}
            size="small"
            labelStyle={{ fontWeight: "bold", width: "35%" }}
            contentStyle={{ textAlign: "right" }}
          >
            <Descriptions.Item label="Mã hóa đơn">
              <Space>
                <span style={{ fontSize: "15px", fontWeight: "bold" }}>#{invoiceDetail.id}</span>
                {getOperationTypeBadge()}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <Tag color={statusInfo?.color} style={{ fontSize: "13px" }}>
                {statusInfo?.text}
              </Tag>
            </Descriptions.Item>

            {invoiceDetail.parent_invoice_id && (
              <Descriptions.Item label="Hóa đơn gốc">
                <span style={{ color: "#1890ff", fontWeight: "bold" }}>#{invoiceDetail.parent_invoice_id}</span>
              </Descriptions.Item>
            )}

            {invoiceDetail.operation_notes && (
              <Descriptions.Item label="Ghi chú">{invoiceDetail.operation_notes}</Descriptions.Item>
            )}

            {/* <Descriptions.Item label="Tạm tính">
              <span style={{ fontSize: '14px' }}>
                {formatCurrency(financialInfo.subtotal)}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Giảm giá">
              <span style={{ fontSize: '14px' }}>
                {financialInfo.discount} %
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Thuế VAT">
              <span style={{ fontSize: '14px' }}>
                {financialInfo.tax} %
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Tổng tiền cuối">
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                {formatCurrency(financialInfo.finalAmount)}
              </span>
            </Descriptions.Item> */}
          </Descriptions>

          {appliedPromotions.length > 0 && (
            <Card title="Khuyến mãi áp dụng" size="small" style={{ marginTop: "16px" }}>
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                {appliedPromotions.map((promotion) => {
                  const discountLabel = resolvePromotionDiscountLabel(promotion.discount_value, promotion.promotion)

                  const appliedAtLabel = formatDateTime(promotion.applied_at)

                  const validityLabel = formatPromotionDateRange(
                    promotion.promotion?.start_date,
                    promotion.promotion?.end_date
                  )

                  return (
                    <div
                      key={promotion.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #f0f0f0",
                        backgroundColor: "#fafafa"
                      }}
                    >
                      <Space style={{ justifyContent: "space-between", width: "100%" }}>
                        <span style={{ fontWeight: 600 }}>
                          {promotion.promotion?.code || `Khuyến mãi #${promotion.promotion_id}`}
                        </span>
                        <Tag color="processing">{discountLabel}</Tag>
                      </Space>

                      <div style={{ fontSize: "12px", color: "#666" }}>Hiệu lực: {validityLabel}</div>

                      <div style={{ fontSize: "12px", color: "#666" }}>Áp dụng: {appliedAtLabel}</div>

                      {promotion.promotion?.description && (
                        <div style={{ fontSize: "12px", color: "#8c8c8c", lineHeight: 1.5 }}>
                          Mô tả: {promotion.promotion.description}
                        </div>
                      )}
                    </div>
                  )
                })}
              </Space>
            </Card>
          )}

          {/* Payment History */}
          {invoiceDetail.payments && invoiceDetail.payments.length > 0 && (
            <Card title="Lịch sử thanh toán" size="small" style={{ marginTop: "16px" }}>
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Số giao dịch</div>
                      <div style={{ fontSize: "18px", fontWeight: 600 }}>{paymentStats.total}</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Thành công</div>
                      <div style={{ fontSize: "18px", fontWeight: 600, color: "#52c41a" }}>{paymentStats.success}</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Thất bại</div>
                      <div style={{ fontSize: "18px", fontWeight: 600, color: "#ff4d4f" }}>{paymentStats.failed}</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Tổng đã thanh toán</div>
                      <div style={{ fontSize: "18px", fontWeight: 600, color: "#1677ff" }}>
                        {formatCurrency(financialInfo.totalPaid)}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Divider style={{ margin: "8px 0" }} />

                {invoiceDetail.payments.map((payment) => {
                  const statusMeta = getPaymentStatusMeta(payment.status)
                  return (
                    <div
                      key={payment.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #f0f0f0",
                        backgroundColor: payment.status === 1 ? "#f6ffed" : "#fff1f0"
                      }}
                    >
                      <Row align="middle" gutter={8}>
                        <Col flex="auto">
                          <Space>
                            <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
                            <span style={{ fontSize: "13px", color: "#666" }}>
                              {getPaymentMethodLabel(payment.method)}
                            </span>
                          </Space>
                        </Col>
                        <Col>
                          <span style={{ fontWeight: "bold", fontSize: "14px" }}>{formatCurrency(payment.amount)}</span>
                        </Col>
                      </Row>

                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Thời gian: {formatDateTime(payment.paid_at)}
                          </div>
                        </Col>
                        <Col span={12} style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Nhân viên: {payment.employee?.full_name || "Không xác định"}
                          </div>
                        </Col>
                      </Row>

                      {payment.desc_issue && (
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>Ghi chú: {payment.desc_issue}</div>
                      )}
                    </div>
                  )
                })}
              </Space>
            </Card>
          )}

          {/* ✅ Form thanh toán tích hợp - Chỉ hiện khi còn tiền chưa thanh toán */}
          {financialInfo.remaining > 0 && invoiceDetail.status !== 2 && (
            <>
              <Divider style={{ margin: "16px 0" }} />

              <Card
                title={
                  <Space>
                    <CreditCard size={18} />
                    <span>Thanh toán</span>
                  </Space>
                }
                size="small"
                style={{ marginTop: "8px" }}
              >
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item
                      label="Số tiền cần thanh toán"
                      labelStyle={{ fontWeight: "bold" }}
                      contentStyle={{ textAlign: "right" }}
                    >
                      <span style={{ fontSize: "18px", fontWeight: "bold", color: "#ff4d4f" }}>
                        {formatCurrency(financialInfo.remaining)}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>

                  <div>
                    <div style={{ marginBottom: "8px", fontWeight: "bold" }}>Chọn phương thức thanh toán:</div>
                    <Radio.Group
                      value={paymentMethod}
                      onChange={(e) => {
                        if (!canManageInvoices) return
                        setPaymentMethod(e.target.value)
                      }}
                      style={{ width: "100%" }}
                      disabled={!canManageInvoices}
                    >
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Radio value={0} style={{ fontSize: "15px" }}>
                          💵 Tiền mặt
                        </Radio>
                        <Radio value={1} style={{ fontSize: "15px" }}>
                          🏦 Chuyển khoản ngân hàng
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </div>

                  <Checkbox checked={shouldExportInvoice} onChange={(e) => setShouldExportInvoice(e.target.checked)}>
                    Xuất hóa đơn PDF sau khi thanh toán
                  </Checkbox>
                </Space>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: "16px" }}>
            {/* ✅ Nút tách hóa đơn - Chỉ hiện khi status = 0 hoặc 1 */}
            {onSplitInvoice && canManageInvoices && (invoiceDetail.status === 0 || invoiceDetail.status === 1) && (
              <Button
                size="large"
                icon={<Split size={18} />}
                onClick={() => {
                  onSplitInvoice(invoiceDetail)
                }}
                style={{
                  backgroundColor: "#722ed1",
                  borderColor: "#722ed1",
                  color: "#fff",
                  height: "44px",
                  fontSize: "15px"
                }}
              >
                Tách hóa đơn
              </Button>
            )}

            {/* ✅ Nút thanh toán - Chỉ enable khi đã chọn phương thức */}
            {financialInfo.remaining > 0 && invoiceDetail.status !== 2 && (
              <Button
                type="primary"
                size="large"
                icon={<CreditCard size={18} />}
                onClick={handlePayment}
                disabled={paymentMethod === null || !canManageInvoices}
                loading={paymentMutation.isPending}
                style={{
                  backgroundColor:
                    paymentMethod !== null && canManageInvoices ? "#52c41a" : undefined,
                  borderColor:
                    paymentMethod !== null && canManageInvoices ? "#52c41a" : undefined,
                  height: "44px",
                  fontSize: "15px"
                }}
              >
                {!canManageInvoices
                  ? 'Bạn không có quyền thanh toán'
                  : paymentMethod === null
                  ? "Chọn phương thức thanh toán"
                  : `Thanh toán ${formatCurrency(financialInfo.remaining)}`}
              </Button>
            )}

            <Button size="large" onClick={onClose} style={{ height: "44px" }}>
              Đóng
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  )
}

export default InvoiceDetailModal
