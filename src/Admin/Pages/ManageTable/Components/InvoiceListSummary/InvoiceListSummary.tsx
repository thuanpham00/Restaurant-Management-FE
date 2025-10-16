import { Card, Space, Tag, Typography, Empty, Button, Row, Col } from "antd"
import { FileText, Eye } from "lucide-react"
import { useMemo } from "react"
import type { Invoice } from "../../../../../Types/invoicePayment.type"

const { Text } = Typography

interface InvoiceListSummaryProps {
  invoices: Invoice[]
  onViewDetail: (invoice: Invoice) => void
}

export const InvoiceListSummary = ({ invoices, onViewDetail }: InvoiceListSummaryProps) => {
  // Calculate totals
  const summary = useMemo(() => {
    let totalAmount = 0
    let totalRemaining = 0
    let unpaidCount = 0
    let partialPaidCount = 0
    let paidCount = 0

    invoices.forEach((inv) => {
      totalAmount += Number(inv.final_amount)

      // Note: Invoice type doesn't have payments, so we can't calculate remaining
      // Will show final_amount as remaining for unpaid/partial invoices
      if (inv.status === 0) {
        unpaidCount++
        totalRemaining += Number(inv.final_amount)
      } else if (inv.status === 1) {
        partialPaidCount++
        totalRemaining += Number(inv.final_amount) // Approximation
      } else if (inv.status === 2) {
        paidCount++
      }
    })

    return {
      totalAmount,
      totalRemaining,
      unpaidCount,
      partialPaidCount,
      paidCount
    }
  }, [invoices])

  // Get status info
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { text: "Chưa thanh toán", color: "red" }
      case 1:
        return { text: "Thanh toán 1 phần", color: "orange" }
      case 2:
        return { text: "Hoàn tất thanh toán", color: "green" }
      default:
        return { text: "Không xác định", color: "default" }
    }
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <Empty description="Chưa có hóa đơn nào" />
      </Card>
    )
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {/* Summary Statistics - Enhanced Design */}
      <Card 
        size="small" 
        style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
        }}
        styles={{
          body: {
            padding: "20px"
          }
        }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col span={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>
                Tổng hóa đơn
              </div>
              <div style={{ color: "#ffffff", fontSize: "32px", fontWeight: "bold", lineHeight: 1 }}>
                {invoices.length}
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", marginTop: "4px" }}>
                hóa đơn
              </div>
            </div>
          </Col>
          
          <Col span={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>
                Tổng tiền
              </div>
              <div style={{ color: "#ffffff", fontSize: "28px", fontWeight: "bold", lineHeight: 1 }}>
                {summary.totalAmount.toLocaleString()}
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", marginTop: "4px" }}>
                VNĐ
              </div>
            </div>
          </Col>
          
          <Col span={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>
                Còn lại
              </div>
              <div 
                style={{ 
                  color: summary.totalRemaining > 0 ? "#ffd666" : "#95de64",
                  fontSize: "28px", 
                  fontWeight: "bold",
                  lineHeight: 1,
                  textShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
              >
                {summary.totalRemaining.toLocaleString()}
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", marginTop: "4px" }}>
                VNĐ
              </div>
            </div>
          </Col>
        </Row>
        
        {/* Status breakdown */}
        <Row gutter={12} style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <Col span={8}>
            <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.9)", fontSize: "13px" }}>
              <span style={{ color: "#ff4d4f", fontWeight: "bold", fontSize: "18px" }}>{summary.unpaidCount}</span> Chưa thanh toán
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.9)", fontSize: "13px" }}>
              <span style={{ color: "#faad14", fontWeight: "bold", fontSize: "18px" }}>{summary.partialPaidCount}</span> Thanh toán 1 phần
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.9)", fontSize: "13px" }}>
              <span style={{ color: "#52c41a", fontWeight: "bold", fontSize: "18px" }}>{summary.paidCount}</span> Hoàn tất thanh toán
            </div>
          </Col>
        </Row>
      </Card>

      {/* Invoice Cards */}
      <Row gutter={[16, 16]}>
        {invoices.map((invoice) => {
          const statusInfo = getStatusInfo(invoice.status)
          return (
            <Col span={12} key={invoice.id}>
              <Card
                size="small"
                hoverable
                style={{
                  border: `2px solid ${
                    statusInfo.color === "red"
                      ? "rgba(255, 77, 79, 0.4)"
                      : statusInfo.color === "orange"
                        ? "rgba(250, 140, 22, 0.4)"
                        : "rgba(82, 196, 26, 0.4)"
                  }`
                }}
              >
                <Space direction="vertical" style={{ width: "100%" }} size="small">
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                      <FileText size={16} />
                      <Text strong>#{invoice.id}</Text>
                    </Space>
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                  </Space>

                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text type="secondary">Tổng tiền:</Text>
                    <Text strong>{Number(invoice.final_amount).toLocaleString()} đ</Text>
                  </Space>

                  <Button
                    type="link"
                    size="small"
                    icon={<Eye size={14} />}
                    onClick={() => onViewDetail(invoice)}
                    style={{ padding: 0 }}
                  >
                    Xem chi tiết
                  </Button>
                </Space>
              </Card>
            </Col>
          )
        })}
      </Row>
    </Space>
  )
}

export default InvoiceListSummary
