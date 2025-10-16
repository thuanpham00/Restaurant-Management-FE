/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Modal, Descriptions, Space, Button, Radio } from "antd"
import { useState } from "react"
import { toast } from "react-toastify"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import { useAppStore } from "src/StateGlobal/zustand"
import { InvoiceDetail, InvoicePaymentPayload, InvoicePaymentUpdatePayload } from "src/Types/invoicePayment.type"

interface PaymentDetailModalProps {
  open: boolean
  onClosePayment: () => void
  onCloseInvoice: () => void
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
  paymentBefore?: number // trả trước
  setPrePaymentValue?: React.Dispatch<React.SetStateAction<string>>
  setHasSessionPending?: React.Dispatch<React.SetStateAction<boolean>>
  detailInvoice?: InvoiceDetail
  idDiningTable?: string
}

const PaymentDetailModal = ({
  open,
  onClosePayment,
  onCloseInvoice,
  totalAmount,
  totalPercentage,
  vat,
  finalAmount,
  listPromotionApply,
  table_session_id,
  paymentBefore,
  setPrePaymentValue,
  setHasSessionPending,
  detailInvoice,
  idDiningTable
}: PaymentDetailModalProps) => {
  const queryClient = useQueryClient()
  const { employeeId } = useAppStore()
  const [paymentMethod, setPaymentMethod] = useState<number>(0) // 0 = Cash, 1 = Bank Transfer

  const useCreateInvoicePayment = useMutation({
    mutationFn: (payload: InvoicePaymentPayload) => {
      return invoicePaymentAPI.create(payload)
    }
  })

  const useUpdateInvoicePayment = useMutation({
    mutationFn: (body: { id: string; payload: InvoicePaymentUpdatePayload | InvoicePaymentPayload }) => {
      return invoicePaymentAPI.update(body.id, body.payload)
    }
  })
  console.log(detailInvoice)
  const handleInvoicePayment = () => {
    if (detailInvoice && detailInvoice?.total_amount !== "0.00" && detailInvoice?.payments.length > 0) {
      // dành cho trả 1 phần trước đó
      const payload: InvoicePaymentUpdatePayload = {
        table_session_id: table_session_id,
        amount: Number(detailInvoice.final_amount) - Number(detailInvoice?.payments[0]?.amount ?? "0"), // lấy tổng tiền hóa đơn - tiền đã thanh toán lần đầu
        method: paymentMethod,
        status_payment: 1,
        employee_id: employeeId as string
      }
      useUpdateInvoicePayment.mutate(
        {
          id: detailInvoice.id,
          payload
        },
        {
          onSuccess: () => {
            toast.success("Thanh toán thành công!", { autoClose: 1500 })
            onCloseInvoice()
            onClosePayment()
            if (setHasSessionPending) {
              setHasSessionPending(false)
            }
            queryClient.invalidateQueries({
              queryKey: ["detailTableSession", idDiningTable]
            })
          },
          onError: (err: any) => {
            console.error("Error creating invoice:", err)
          }
        }
      )
    } else if (
      (detailInvoice && detailInvoice.total_amount !== "0.00" && detailInvoice.payments.length === 0) ||
      (detailInvoice && detailInvoice.total_amount === "0.00")
    ) {
      const payload: InvoicePaymentPayload = {
        table_session_id,
        total_amount: totalAmount,
        discount: totalPercentage,
        tax: vat,
        final_amount: finalAmount,
        status: paymentBefore ? 1 : 2,
        listPromotionApply,
        employee_id: employeeId,
        method: paymentMethod,
        status_payment: 1,
        ...(paymentBefore ? { paymentBefore } : {})
      }

      useUpdateInvoicePayment.mutate(
        {
          id: detailInvoice.id,
          payload
        },
        {
          onSuccess: () => {
            toast.success("Thanh toán thành công!", { autoClose: 1500 })
            onCloseInvoice()
            onClosePayment()
            if (setHasSessionPending) {
              setHasSessionPending(false)
            }
            queryClient.invalidateQueries({
              queryKey: ["detailTableSession", idDiningTable]
            })
          },
          onError: (err: any) => {
            console.error("Error creating invoice:", err)
          }
        }
      )
    } else {
      const payload: any = {
        table_session_id,
        total_amount: totalAmount,
        discount: totalPercentage,
        tax: vat,
        final_amount: finalAmount,
        status: paymentBefore ? 1 : 2,
        listPromotionApply,
        employee_id: employeeId,
        method: paymentMethod,
        status_payment: 1,
        ...(paymentBefore ? { paymentBefore } : {})
      }

      useCreateInvoicePayment.mutate(payload, {
        onSuccess: () => {
          toast.success("Thanh toán thành công!", { autoClose: 1500 })
          onCloseInvoice()
          onClosePayment()
          if (setHasSessionPending) {
            setHasSessionPending(false)
          }
          queryClient.invalidateQueries({
            queryKey: ["detailTableSession", idDiningTable]
          })
          queryClient.invalidateQueries({
            queryKey: ["detailDetailInvoice", table_session_id]
          })
          queryClient.invalidateQueries({
            queryKey: ["listReservationTableByIdTable", idDiningTable]
          })
          if (setPrePaymentValue) setPrePaymentValue("")
        },
        onError: (err: any) => {
          console.error("Error creating invoice:", err)
        }
      })
    }
  }

  const renderDescriptions = () => {
    if (!detailInvoice || Number(detailInvoice.total_amount) === 0) {
      console.log("hihi")
      return (
        <Descriptions column={1} bordered size="small" layout="horizontal">
          <Descriptions.Item label="Tạm tính" contentStyle={{ color: "red", fontWeight: 500 }}>
            {totalAmount.toLocaleString("vi-VN")} đ
          </Descriptions.Item>
          <Descriptions.Item label="Giảm giá">{totalPercentage} %</Descriptions.Item>
          <Descriptions.Item label="Thuế VAT">{vat}%</Descriptions.Item>
          <Descriptions.Item label="Tổng tiền" contentStyle={{ color: "red", fontWeight: 500 }}>
            <b>{paymentBefore ? paymentBefore.toLocaleString("vi-VN") : finalAmount.toLocaleString("vi-VN")} đ</b>
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <Radio value={0}>Tiền mặt</Radio>
              <Radio value={1}>Chuyển khoản ngân hàng</Radio>
            </Radio.Group>
          </Descriptions.Item>
        </Descriptions>
      )
    }

    if (Number(detailInvoice.total_amount) > 0 && detailInvoice.payments.length === 0) {
      return (
        <Descriptions column={1} bordered size="small" layout="horizontal">
          <Descriptions.Item label="Tạm tính" contentStyle={{ color: "red", fontWeight: 500 }}>
            {totalAmount.toLocaleString("vi-VN")} đ
          </Descriptions.Item>
          <Descriptions.Item label="Giảm giá">{totalPercentage} %</Descriptions.Item>
          <Descriptions.Item label="Thuế VAT">{vat}%</Descriptions.Item>
          <Descriptions.Item label="Tổng tiền" contentStyle={{ color: "red", fontWeight: 500 }}>
            <b>{paymentBefore ? paymentBefore.toLocaleString("vi-VN") : finalAmount.toLocaleString("vi-VN")} đ</b>
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <Radio value={0}>Tiền mặt</Radio>
              <Radio value={1}>Chuyển khoản ngân hàng</Radio>
            </Radio.Group>
          </Descriptions.Item>
        </Descriptions>
      )
    }

    const paid = Number(detailInvoice?.payments[0]?.amount ?? 0)
    const remaining = Number(detailInvoice.final_amount) - paid

    // Hóa đơn mới hoặc total_amount = 0
    return (
      <Descriptions column={1} bordered size="small" layout="horizontal">
        <Descriptions.Item label="Tổng tiền" contentStyle={{ color: "red", fontWeight: 500 }}>
          {Number(detailInvoice.final_amount).toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Đã thanh toán">{paid.toLocaleString("vi-VN")} đ</Descriptions.Item>
        <Descriptions.Item label="Còn lại" contentStyle={{ color: "red", fontWeight: 500 }}>
          {remaining.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Phương thức thanh toán">
          <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <Radio value={0}>Tiền mặt</Radio>
            <Radio value={1}>Chuyển khoản ngân hàng</Radio>
          </Radio.Group>
        </Descriptions.Item>
      </Descriptions>
    )
  }

  return (
    <Modal
      title="Chi tiết hóa đơn"
      open={open}
      onCancel={onClosePayment}
      footer={null}
      width={600}
      styles={{ body: { maxHeight: 400, overflowY: "auto" } }}
    >
      {renderDescriptions()}
      <Space className="mt-4 flex justify-end items-center">
        <Button type="primary" onClick={handleInvoicePayment}>
          Xác nhận thanh toán
        </Button>
        <Button onClick={onClosePayment}>Hủy</Button>
      </Space>
    </Modal>
  )
}

export default PaymentDetailModal
