/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Modal, Descriptions, Space, Button, InputNumber, Radio, Divider } from "antd"
import { useState, useMemo } from "react"
import { toast } from "react-toastify"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import { useAppStore } from "src/StateGlobal/zustand"
import { InvoicePaymentPayload } from "src/Types/invoicePayment.type"
import PromotionForm from "../PromotionForm"

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  totalAmount: number // Tạm tính từ order
  tableSessionId: string
  idDiningTable: string
}

const CreateInvoiceModal = ({ open, onClose, totalAmount, tableSessionId, idDiningTable }: CreateInvoiceModalProps) => {
  const queryClient = useQueryClient()
  const { employeeId } = useAppStore()

  const [vat, setVat] = useState<number>(10) // Default 10%
  const [totalPercentage, setTotalPercentage] = useState<number>(0) // Discount từ promotions
  const [listPromotionApply, setListPromotionApply] = useState<
    { promotion_id: string; discount_value: number }[] | null
  >(null)
  const [paymentMethod, setPaymentMethod] = useState<number>(0) // 0 = Cash, 1 = Bank Transfer

  // Calculate final amount với discount + VAT
  const financialCalculation = useMemo(() => {
    const subtotal = totalAmount
    const discountPercent = totalPercentage
    const vatPercent = vat

    // Discount amount (VNĐ)
    const discountAmount = subtotal * (discountPercent / 100)
    const afterDiscount = subtotal - discountAmount

    // Tax amount (VNĐ)
    const taxAmount = afterDiscount * (vatPercent / 100)
    const finalAmount = afterDiscount + taxAmount

    return {
      subtotal,
      discountPercent,
      discountAmount,
      afterDiscount,
      taxAmount,
      vatPercent,
      finalAmount
    }
  }, [totalAmount, totalPercentage, vat])

  // ✅ Separate mutations for draft and payment to prevent conflicts
  const saveDraftMutation = useMutation({
    mutationFn: (payload: InvoicePaymentPayload) => {
      return invoicePaymentAPI.create(payload)
    }
  })

  const payNowMutation = useMutation({
    mutationFn: (payload: InvoicePaymentPayload) => {
      return invoicePaymentAPI.create(payload)
    }
  })

  // Handler: Lưu hóa đơn tạm (status = 0, không có payment)
  const handleSaveDraftInvoice = () => {
    const payload: InvoicePaymentPayload = {
      table_session_id: tableSessionId,
      total_amount: financialCalculation.subtotal,
      discount: financialCalculation.discountPercent,
      tax: financialCalculation.vatPercent,
      final_amount: financialCalculation.finalAmount,
      status: 0, // ✅ Unpaid - Chưa thanh toán
      listPromotionApply,
      employee_id: employeeId as string,
      method: paymentMethod,
      status_payment: 0,
      isDraft: true
    }

    saveDraftMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã lưu hóa đơn tạm thời!", { autoClose: 1500 })
        onClose()
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
        queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", tableSessionId] })
        queryClient.invalidateQueries({ queryKey: ["listInvoicesForTableSession", tableSessionId] })
      },
      onError: (err: any) => {
        console.error("Error creating draft invoice:", err)
        toast.error("Lỗi khi tạo hóa đơn tạm thời!", { autoClose: 1500 })
      }
    })
  }

  // Handler: Thanh toán ngay (tạo invoice + payment)
  const handlePayNow = () => {
    const payload: InvoicePaymentPayload = {
      table_session_id: tableSessionId,
      total_amount: financialCalculation.subtotal,
      discount: financialCalculation.discountPercent,
      tax: financialCalculation.vatPercent,
      final_amount: financialCalculation.finalAmount,
      status: 2, // ✅ Paid - Đã thanh toán
      listPromotionApply,
      employee_id: employeeId as string,
      method: paymentMethod,
      status_payment: 1, // ✅ Payment thành công
      paymentBefore: financialCalculation.finalAmount,
      isDraft: false
    }

    payNowMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Thanh toán thành công!", { autoClose: 1500 })
        onClose()
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
        queryClient.invalidateQueries({ queryKey: ["detailTableSessionOrder", tableSessionId] })
        queryClient.invalidateQueries({ queryKey: ["listInvoicesForTableSession", tableSessionId] })
      },
      onError: (err: any) => {
        console.error("Error processing payment:", err)
        toast.error("Lỗi khi thanh toán!", { autoClose: 1500 })
      }
    })
  }

  return (
    <Modal
      title="Tạo hóa đơn"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered // ✅ Center modal
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)", // ✅ Responsive height
          overflowY: "auto",
          padding: "20px"
        }
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Financial Summary */}
        <Descriptions column={1} bordered size="small" layout="horizontal">
          <Descriptions.Item label="Tạm tính" contentStyle={{ fontWeight: 500 }}>
            {financialCalculation.subtotal.toLocaleString("vi-VN")} đ
          </Descriptions.Item>
        </Descriptions>

        <Divider style={{ margin: "12px 0" }} />

        {/* Promotion Form */}
        <div>
          <h3 style={{ marginBottom: "8px", fontWeight: 600 }}>Áp dụng khuyến mãi</h3>
          <PromotionForm setTotalPercentage={setTotalPercentage} setListPromotionApply={setListPromotionApply} />
        </div>

        {/* VAT Input */}
        <div>
          <h3 style={{ marginBottom: "8px", fontWeight: 600 }}>Thuế VAT (%)</h3>
          <InputNumber
            min={0}
            max={100}
            value={vat}
            onChange={(value) => setVat(value || 0)}
            style={{ width: "200px" }}
            placeholder="Nhập % VAT"
          />
        </div>

        <Divider style={{ margin: "12px 0" }} />

        {/* Final Calculation */}
        <Descriptions column={1} bordered size="small" layout="horizontal">
          <Descriptions.Item label="Giảm giá">
            {financialCalculation.discountPercent}% (-{financialCalculation.discountAmount.toLocaleString("vi-VN")} đ)
          </Descriptions.Item>
          <Descriptions.Item label="Sau giảm giá">
            {financialCalculation.afterDiscount.toLocaleString("vi-VN")} đ
          </Descriptions.Item>
          <Descriptions.Item label="Thuế VAT ({vat}%)">
            +{financialCalculation.taxAmount.toLocaleString("vi-VN")} đ
          </Descriptions.Item>
          <Descriptions.Item
            label="Tổng tiền cuối"
            contentStyle={{ color: "red", fontWeight: "bold", fontSize: "16px" }}
          >
            {financialCalculation.finalAmount.toLocaleString("vi-VN")} đ
          </Descriptions.Item>
        </Descriptions>

        <Divider style={{ margin: "12px 0" }} />

        {/* Payment Method */}
        <div>
          <h3 style={{ marginBottom: "8px", fontWeight: 600 }}>Phương thức thanh toán</h3>
          <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <Radio value={0}>Tiền mặt</Radio>
            <Radio value={1}>Chuyển khoản ngân hàng</Radio>
          </Radio.Group>
        </div>

        {/* Action Buttons */}
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose} disabled={saveDraftMutation.isPending || payNowMutation.isPending}>
            Hủy
          </Button>
          <Button
            type="default"
            onClick={handleSaveDraftInvoice}
            loading={saveDraftMutation.isPending}
            disabled={payNowMutation.isPending} // ✅ Disable khi button kia đang xử lý
            style={{
              backgroundColor: "#faad14",
              borderColor: "#faad14",
              color: "#fff"
            }}
          >
            Lưu hóa đơn tạm
          </Button>
          <Button
            type="primary"
            onClick={handlePayNow}
            loading={payNowMutation.isPending}
            disabled={saveDraftMutation.isPending} // ✅ Disable khi button kia đang xử lý
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a"
            }}
          >
            Thanh toán ngay
          </Button>
        </Space>
      </Space>
    </Modal>
  )
}

export default CreateInvoiceModal
