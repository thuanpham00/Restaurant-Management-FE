import { Card, Radio, Space, Typography, Tag, Button, Alert } from 'antd'
import { CreditCard, AlertCircle } from 'lucide-react'
import { useMemo } from 'react'
import type { Invoice, InvoiceDetail } from '../../../../../Types/invoicePayment.type'
import { AppAbility, useAuthorization } from 'src/Authorization'

const { Text } = Typography

interface InvoiceSelectorProps {
  currentInvoice: InvoiceDetail
  childInvoices?: Invoice[]
  selectedInvoiceId: string
  onSelectInvoice: (invoiceId: string) => void
  onProceedPayment: () => void
  disabled?: boolean
}

export const InvoiceSelector = ({
  currentInvoice,
  childInvoices,
  selectedInvoiceId,
  onSelectInvoice,
  onProceedPayment,
  disabled
}: InvoiceSelectorProps) => {
  const { can } = useAuthorization()
  const canViewInvoices = can(AppAbility.INVOICES_VIEW)
  const canManageInvoices = can(AppAbility.INVOICES_MANAGE)

  if (!canViewInvoices) {
    return null
  }

  // Calculate remaining amount for each invoice
  const getRemaining = (invoice: Invoice | InvoiceDetail) => {
    const payments = 'payments' in invoice && Array.isArray(invoice.payments) ? invoice.payments : []
    const totalPaid = payments.filter((p) => p.status === 1).reduce((sum, p) => sum + Number(p.amount), 0)
    return Number(invoice.final_amount) - totalPaid
  }

  // Get all selectable invoices
  const selectableInvoices = useMemo(() => {
    const invoices: { invoice: Invoice | InvoiceDetail; remaining: number; isChild: boolean }[] = []

    // Add current invoice if has remaining
    const currentRemaining = getRemaining(currentInvoice)
    if (currentRemaining > 0) {
      invoices.push({
        invoice: currentInvoice,
        remaining: currentRemaining,
        isChild: false
      })
    }

    // Add child invoices with remaining
    if (childInvoices && childInvoices.length > 0) {
      childInvoices.forEach((child) => {
        const childRemaining = getRemaining(child)
        if (childRemaining > 0) {
          invoices.push({
            invoice: child,
            remaining: childRemaining,
            isChild: true
          })
        }
      })
    }

    return invoices
  }, [currentInvoice, childInvoices])

  // Check if has any unpaid invoices
  const hasUnpaidInvoices = selectableInvoices.length > 0

  // Get selected invoice info
  const selectedInfo = useMemo(() => {
    const found = selectableInvoices.find((item) => item.invoice.id === selectedInvoiceId)
    return found || null
  }, [selectableInvoices, selectedInvoiceId])

  // If no unpaid invoices
  if (!hasUnpaidInvoices) {
    return (
      <Card
        title={
          <Space>
            <CreditCard size={16} />
            <span>Thanh toán hóa đơn</span>
          </Space>
        }
      >
        <Alert
          message="Tất cả hóa đơn đã được thanh toán"
          description="Không có hóa đơn nào cần thanh toán thêm."
          type="success"
          showIcon
        />
      </Card>
    )
  }

  // If only one invoice to pay
  if (selectableInvoices.length === 1) {
    const singleInvoice = selectableInvoices[0]
    return (
      <Card
        title={
          <Space>
            <CreditCard size={16} />
            <span>Thanh toán hóa đơn</span>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card
            size="small"
            style={{
              backgroundColor: '#e6f7ff',
              border: '2px solid #1890ff'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Text strong style={{ fontSize: 16 }}>
                    #{singleInvoice.invoice.id}
                  </Text>
                  {singleInvoice.isChild && singleInvoice.invoice.split_percentage && (
                    <Tag color="purple">Tách {singleInvoice.invoice.split_percentage}%</Tag>
                  )}
                </Space>
                <Tag color="orange">Chưa thanh toán đủ</Tag>
              </Space>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text type="secondary">Số tiền còn lại:</Text>
                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                  {singleInvoice.remaining.toLocaleString()} đ
                </Text>
              </Space>
            </Space>
          </Card>

          <Button
            type="primary"
            size="large"
            block
            icon={<CreditCard size={16} />}
            onClick={onProceedPayment}
            disabled={disabled || !canManageInvoices}
          >
            Tiến hành thanh toán #{singleInvoice.invoice.id}
          </Button>
        </Space>
      </Card>
    )
  }

  // Multiple invoices to select from
  return (
    <Card
      title={
        <Space>
          <CreditCard size={16} />
          <span>Chọn hóa đơn thanh toán</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          message={
            <Space>
              <AlertCircle size={14} />
              <Text>
                Có {selectableInvoices.length} hóa đơn chưa thanh toán đủ. Vui lòng chọn hóa đơn để thanh toán.
              </Text>
            </Space>
          }
          type="info"
          showIcon={false}
        />

        <Radio.Group
          value={selectedInvoiceId}
          onChange={(e) => {
            if (!canManageInvoices) return
            onSelectInvoice(e.target.value)
          }}
          style={{ width: '100%' }}
          disabled={!canManageInvoices}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {selectableInvoices.map((item) => (
              <Card
                key={item.invoice.id}
                size="small"
                hoverable
                style={{
                  backgroundColor: selectedInvoiceId === item.invoice.id ? '#e6f7ff' : '#fafafa',
                  border:
                    selectedInvoiceId === item.invoice.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (!canManageInvoices) return
                  onSelectInvoice(item.invoice.id)
                }}
              >
                <Radio value={item.invoice.id}>
                  <Space direction="vertical" style={{ marginLeft: 8 }}>
                    <Space>
                      <Text strong style={{ fontSize: 16 }}>
                        #{item.invoice.id}
                      </Text>
                      {item.isChild ? (
                        <Tag color="purple">
                          Hóa đơn con {item.invoice.split_percentage && `(${item.invoice.split_percentage}%)`}
                        </Tag>
                      ) : (
                        <Tag color="blue">Hóa đơn {childInvoices && childInvoices.length > 0 ? 'gốc' : 'chính'}</Tag>
                      )}
                    </Space>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text type="secondary">Còn lại:</Text>
                      <Text strong style={{ color: '#ff4d4f' }}>
                        {item.remaining.toLocaleString()} đ
                      </Text>
                    </Space>
                  </Space>
                </Radio>
              </Card>
            ))}
          </Space>
        </Radio.Group>

        {selectedInfo && (
          <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text type="secondary">Hóa đơn đã chọn:</Text>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 16 }}>
                  #{selectedInfo.invoice.id}
                </Text>
                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                  {selectedInfo.remaining.toLocaleString()} đ
                </Text>
              </Space>
            </Space>
          </Card>
        )}

        <Button
          type="primary"
          size="large"
          block
          icon={<CreditCard size={16} />}
          onClick={() => {
            if (!canManageInvoices) return
            onProceedPayment()
          }}
          disabled={disabled || !selectedInfo || !canManageInvoices}
        >
          Thanh toán hóa đơn #{selectedInvoiceId}
        </Button>
      </Space>
    </Card>
  )
}

export default InvoiceSelector
