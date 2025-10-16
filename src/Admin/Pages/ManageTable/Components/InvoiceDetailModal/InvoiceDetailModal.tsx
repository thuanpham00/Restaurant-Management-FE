import { Modal, Space, Button, Descriptions, Tag, Row, Col, Card } from 'antd'
import { FileText, CreditCard, Split } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { invoicePaymentAPI } from 'src/Apis/Admin/invoicePayment.api'
import PaymentDetailModal from '../PaymentDetailModal'
import type { InvoiceDetail } from '../../../../../Types/invoicePayment.type'

interface InvoiceDetailModalProps {
  open: boolean
  onClose: () => void
  invoiceId: string | null
  tableSessionId: string
  idDiningTable: string
  setHasSessionPending?: React.Dispatch<React.SetStateAction<boolean>>
  onSplitInvoice?: (invoice: InvoiceDetail) => void 
}

export const InvoiceDetailModal = ({
  open,
  onClose,
  invoiceId,
  tableSessionId,
  idDiningTable,
  setHasSessionPending,
  onSplitInvoice // ✅ Thêm callback
}: InvoiceDetailModalProps) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Fetch full invoice detail
  const { data: invoiceDetailData, isLoading } = useQuery({
    queryKey: ['invoiceDetail', invoiceId],
    queryFn: () => invoicePaymentAPI.getDetailInvoice(invoiceId!),
    enabled: Boolean(invoiceId && open),
    staleTime: 30000
  })

  const invoiceDetail = invoiceDetailData?.data?.data as InvoiceDetail | undefined

  // Calculate financial info
  const financialInfo = useMemo(() => {
    if (!invoiceDetail) return { totalPaid: 0, remaining: 0 }

    const totalPaid = invoiceDetail.payments
      ?.filter((p) => p.status === 1)
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

    const remaining = Number(invoiceDetail.final_amount) - totalPaid

    return { totalPaid, remaining }
  }, [invoiceDetail])

  // Get status info
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { text: 'Chưa thanh toán', color: 'red' }
      case 1:
        return { text: 'Thanh toán một phần', color: 'orange' }
      case 2:
        return { text: 'Đã thanh toán', color: 'green' }
      default:
        return { text: 'Không xác định', color: 'default' }
    }
  }

  // Get operation type badge
  const getOperationTypeBadge = () => {
    if (!invoiceDetail?.operation_type) return null

    if (invoiceDetail.operation_type === 'split_invoice') {
      return (
        <Tag color="purple">
          Tách {invoiceDetail.split_percentage ? `${invoiceDetail.split_percentage}%` : ''}
        </Tag>
      )
    }

    if (invoiceDetail.operation_type === 'merge_invoice') {
      return <Tag color="cyan">Gộp hóa đơn</Tag>
    }

    return <Tag>{invoiceDetail.operation_type}</Tag>
  }

  const statusInfo = invoiceDetail ? getStatusInfo(invoiceDetail.status) : null

  return (
    <Modal
      title={
        <Space>
          <FileText size={20} />
          <span>Chi tiết hóa đơn #{invoiceId}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered // ✅ Center modal
      loading={isLoading}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 200px)', // ✅ Giới hạn chiều cao
          overflowY: 'auto', // ✅ Cho phép scroll
          padding: '20px'
        }
      }}
    >
      {invoiceDetail && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Summary Card */}
          <Card 
            size="small"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', marginBottom: '8px' }}>
                    Tổng tiền
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '26px', fontWeight: 'bold' }}>
                    {Number(invoiceDetail.final_amount).toLocaleString()}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '4px' }}>
                    VNĐ
                  </div>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', marginBottom: '8px' }}>
                    Đã thanh toán
                  </div>
                  <div style={{ color: '#95de64', fontSize: '26px', fontWeight: 'bold' }}>
                    {financialInfo.totalPaid.toLocaleString()}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '4px' }}>
                    VNĐ
                  </div>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', marginBottom: '8px' }}>
                    Còn lại
                  </div>
                  <div 
                    style={{ 
                      color: financialInfo.remaining > 0 ? '#ffd666' : '#95de64',
                      fontSize: '26px', 
                      fontWeight: 'bold'
                    }}
                  >
                    {financialInfo.remaining.toLocaleString()}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '4px' }}>
                    VNĐ
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Invoice Details */}
          <Descriptions 
            bordered 
            column={2}
            size="small"
            labelStyle={{ fontWeight: 'bold', width: '40%' }}
          >
            <Descriptions.Item label="Mã hóa đơn" span={2}>
              <Space>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>#{invoiceDetail.id}</span>
                {getOperationTypeBadge()}
              </Space>
            </Descriptions.Item>
            
            <Descriptions.Item label="Trạng thái" span={2}>
              <Tag color={statusInfo?.color} style={{ fontSize: '14px' }}>
                {statusInfo?.text}
              </Tag>
            </Descriptions.Item>

            {invoiceDetail.parent_invoice_id && (
              <Descriptions.Item label="Hóa đơn gốc" span={2}>
                <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  #{invoiceDetail.parent_invoice_id}
                </span>
              </Descriptions.Item>
            )}

            {invoiceDetail.operation_notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {invoiceDetail.operation_notes}
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Tạm tính">
              {Number(invoiceDetail.total_amount).toLocaleString()} đ
            </Descriptions.Item>

            <Descriptions.Item label="Giảm giá">
              {invoiceDetail.discount ? `${Number(invoiceDetail.discount).toLocaleString()} đ` : '0 đ'}
            </Descriptions.Item>

            <Descriptions.Item label="Thuế VAT">
              {invoiceDetail.tax ? `${Number(invoiceDetail.tax).toLocaleString()} đ` : '0 đ'}
            </Descriptions.Item>

            <Descriptions.Item label="Tổng tiền cuối">
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                {Number(invoiceDetail.final_amount).toLocaleString()} đ
              </span>
            </Descriptions.Item>
          </Descriptions>

          {/* Payment History */}
          {invoiceDetail.payments && invoiceDetail.payments.length > 0 && (
            <Card 
              title="Lịch sử thanh toán" 
              size="small"
              style={{ marginTop: '16px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {invoiceDetail.payments.map((payment, index) => (
                  <div 
                    key={payment.id || index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: payment.status === 1 ? '#f6ffed' : '#fff1f0',
                      borderRadius: '6px',
                      border: `1px solid ${payment.status === 1 ? '#b7eb8f' : '#ffccc7'}`
                    }}
                  >
                    <Space>
                      <Tag color={payment.status === 1 ? 'success' : 'error'}>
                        {payment.status === 1 ? 'Thành công' : 'Thất bại'}
                      </Tag>
                      <span style={{ fontSize: '13px', color: '#666' }}>
                        {payment.method === 0 ? 'Tiền mặt' : payment.method === 1 ? 'Chuyển khoản' : 'Khác'}
                      </span>
                    </Space>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {Number(payment.amount).toLocaleString()} đ
                    </span>
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {/* ✅ Nút tách hóa đơn - Chỉ hiện khi status = 0 hoặc 1 */}
            {onSplitInvoice && (invoiceDetail.status === 0 || invoiceDetail.status === 1) && (
              <Button
                size="large"
                icon={<Split size={18} />}
                onClick={() => {
                  onSplitInvoice(invoiceDetail)
                  // Modal sẽ tự đóng khi user cancel hoặc complete split
                }}
                style={{
                  backgroundColor: '#722ed1',
                  borderColor: '#722ed1',
                  color: '#fff',
                  height: '44px',
                  fontSize: '15px'
                }}
              >
                Tách hóa đơn
              </Button>
            )}

            {financialInfo.remaining > 0 && invoiceDetail.status !== 2 && (
              <Button
                type="primary"
                size="large"
                icon={<CreditCard size={18} />}
                onClick={() => {
                  setShowPaymentModal(true)
                }}
                style={{
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  height: '44px',
                  fontSize: '15px'
                }}
              >
                Thanh toán {financialInfo.remaining.toLocaleString()} đ
              </Button>
            )}

            <Button size="large" onClick={onClose} style={{ height: '44px' }}>
              Đóng
            </Button>
          </Space>

          {/* Payment Modal */}
          {invoiceDetail && (
            <PaymentDetailModal
              open={showPaymentModal}
              onClosePayment={() => {
                setShowPaymentModal(false)
                onClose()
              }}
              onCloseInvoice={() => {
                setShowPaymentModal(false)
                onClose()
              }}
              totalAmount={Number(invoiceDetail.total_amount)}
              totalPercentage={0}
              vat={Number(invoiceDetail.tax)}
              finalAmount={Number(invoiceDetail.final_amount)}
              listPromotionApply={null}
              table_session_id={tableSessionId}
              setHasSessionPending={setHasSessionPending}
              detailInvoice={invoiceDetail}
              idDiningTable={idDiningTable}
            />
          )}
        </Space>
      )}
    </Modal>
  )
}

export default InvoiceDetailModal
