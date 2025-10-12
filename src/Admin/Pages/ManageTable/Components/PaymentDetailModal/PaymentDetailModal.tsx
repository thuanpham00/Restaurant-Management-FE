/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query"
import { Modal, Descriptions, Space, Button, Radio } from "antd"
import { useState } from "react"
import { toast } from "react-toastify"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import { useAppStore } from "src/StateGlobal/zustand"
import { InvoicePaymentPayload } from "src/Types/invoicePayment.type"

interface PaymentDetailModalProps {
  open: boolean
  onClose: () => void
  totalAmount: number
  totalPercentage: number
  vat: number
  finalAmount: number
  listPromotionApply:
    | {
        promotion_id: string
        discount_value: number
      }[]
    | null
  table_session_id: string
}

const PaymentDetailModal = ({
  open,
  onClose,
  totalAmount,
  totalPercentage,
  vat,
  finalAmount,
  listPromotionApply,
  table_session_id
}: PaymentDetailModalProps) => {
  const { employeeId } = useAppStore()
  const [paymentMethod, setPaymentMethod] = useState<number>(0) // 0 = Cash, 1 = Bank Transfer

  const useCreateInvoicePayment = useMutation({
    mutationFn: (payload: InvoicePaymentPayload) => {
      return invoicePaymentAPI.create(payload)
    }
  })

  const handleInvoicePayment = () => {
    const payload = {
      table_session_id: table_session_id,
      total_amount: totalAmount,
      discount: totalPercentage,
      tax: vat,
      final_amount: finalAmount,
      status: 2,
      listPromotionApply: listPromotionApply,
      employee_id: employeeId,
      method: paymentMethod,
      status_payment: 1
    }

    console.log(payload)

    useCreateInvoicePayment.mutate(payload, {
      onSuccess: () => {
        toast.success("Thanh toán thành công!", { autoClose: 1500 })
        onClose()
      },
      onError: (err: any) => {
        console.error("Error creating invoice:", err)
      }
    })
  }

  return (
    <Modal
      title="Chi tiết hóa đơn"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      bodyStyle={{ maxHeight: 400, overflowY: "auto" }}
    >
      <Descriptions column={1} bordered size="small" layout="horizontal">
        <Descriptions.Item label="Tạm tính" contentStyle={{ color: "red", fontWeight: 500 }}>
          {totalAmount.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Giảm giá">{totalPercentage} %</Descriptions.Item>
        <Descriptions.Item label="Thuế VAT">{vat}%</Descriptions.Item>
        <Descriptions.Item label="Tổng tiền" contentStyle={{ color: "red", fontWeight: 500 }}>
          <b>{finalAmount.toLocaleString("vi-VN")} đ</b>
        </Descriptions.Item>

        <Descriptions.Item label="Phương thức thanh toán">
          <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <Radio value={0}>Tiền mặt</Radio>
            <Radio value={1}>Chuyển khoản ngân hàng</Radio>
          </Radio.Group>
        </Descriptions.Item>
      </Descriptions>

      <Space className="mt-4 flex justify-end items-center">
        <Button type="primary" onClick={handleInvoicePayment}>
          Xác nhận thanh toán
        </Button>
        <Button onClick={onClose}>Hủy</Button>
      </Space>
    </Modal>
  )
}

export default PaymentDetailModal
