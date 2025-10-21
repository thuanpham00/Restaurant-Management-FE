/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Modal, Descriptions, Space, Button, Radio } from "antd"
import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import { useAppStore } from "src/StateGlobal/zustand"
import { InvoiceDetail, InvoicePaymentPayload, InvoicePaymentUpdatePayload } from "src/Types/invoicePayment.type"
import { AppAbility, useAuthorization } from "src/Authorization"

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
  const { can } = useAuthorization()
  const canViewInvoices = can(AppAbility.INVOICES_VIEW)
  const canManageInvoices = can(AppAbility.INVOICES_MANAGE)

  useEffect(() => {
    if (open && !canViewInvoices) {
      toast.warn("Bạn không có quyền xem chi tiết hóa đơn.", { autoClose: 1500 })
      onClosePayment()
    }
  }, [open, canViewInvoices, onClosePayment])

  const handlePaymentMethodChange = (value: number) => {
    if (!canManageInvoices) return
    setPaymentMethod(value)
  }

  const totalPaid = useMemo(() => {
    if (!detailInvoice?.payments) return 0
    return detailInvoice.payments
      .filter((p) => p.status === 1) // Status 1 = Completed
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }, [detailInvoice?.payments])

  const remainingAmount = useMemo(() => {
    if (!detailInvoice) return 0
    return Number(detailInvoice.final_amount) - totalPaid
  }, [detailInvoice, totalPaid])

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
  const handleInvoicePayment = () => {
    if (!canManageInvoices) {
      toast.warn("Bạn không có quyền thanh toán hóa đơn.", { autoClose: 1500 })
      return
    }
    if (detailInvoice && detailInvoice?.total_amount !== "0.00" && detailInvoice?.payments.length > 0) {
      // dành cho trả 1 phần trước đó
      const payload: InvoicePaymentUpdatePayload = {
        table_session_id: table_session_id,
        amount: remainingAmount,
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
            queryClient.invalidateQueries({
              queryKey: ["detailTableSessionOrder", table_session_id]
            })
            queryClient.invalidateQueries({
              queryKey: ["listInvoicesForTableSession", table_session_id]
            })
            queryClient.invalidateQueries({
              queryKey: ["invoiceDetail", detailInvoice.id]
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
        isDraft: false,
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
        isDraft: false,
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
            queryKey: ["detailTableSessionOrder", table_session_id]
          })
          queryClient.invalidateQueries({
            queryKey: ["detailDetailInvoice", table_session_id]
          })
          queryClient.invalidateQueries({
            queryKey: ["listInvoicesForTableSession", table_session_id]
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
      return (
        <Descriptions column={1} bordered size="small" layout="horizontal">
          <Descriptions.Item label="Tạm tính" contentStyle={{ color: "red", fontWeight: 500 }}>
            {totalAmount.toLocaleString("vi-VN")} đ
          </Descriptions.Item>
          <Descriptions.Item label="Giảm giá">{totalPercentage} %</Descriptions.Item>
          <Descriptions.Item label="Thuế VAT">{vat} %</Descriptions.Item>
          <Descriptions.Item label="Tổng tiền" contentStyle={{ color: "red", fontWeight: 500 }}>
            <b>{paymentBefore ? paymentBefore.toLocaleString("vi-VN") : finalAmount.toLocaleString("vi-VN")} đ</b>
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              disabled={!canManageInvoices}
            >
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
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              disabled={!canManageInvoices}
            >
              <Radio value={0}>Tiền mặt</Radio>
              <Radio value={1}>Chuyển khoản ngân hàng</Radio>
            </Radio.Group>
          </Descriptions.Item>
        </Descriptions>
      )
    }

    return (
      <Descriptions column={1} bordered size="small" layout="horizontal">
        <Descriptions.Item label="Tổng tiền" contentStyle={{ color: "red", fontWeight: 500 }}>
          {Number(detailInvoice.final_amount).toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Hoàn tất thanh toán">
          <span className="text-green-600 font-semibold">{totalPaid.toLocaleString("vi-VN")} đ</span>
        </Descriptions.Item>
        <Descriptions.Item label="Còn lại" contentStyle={{ color: "red", fontWeight: 500 }}>
          <span className="text-red-600 font-semibold text-base">{remainingAmount.toLocaleString("vi-VN")} đ</span>
        </Descriptions.Item>
        <Descriptions.Item label="Phương thức thanh toán">
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => handlePaymentMethodChange(e.target.value)}
            disabled={!canManageInvoices}
          >
            <Radio value={0}>Tiền mặt</Radio>
            <Radio value={1}>Chuyển khoản ngân hàng</Radio>
          </Radio.Group>
        </Descriptions.Item>
      </Descriptions>
    )
  }

  if (!canViewInvoices) {
    return null
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
        <Button type="primary" onClick={handleInvoicePayment} disabled={!canManageInvoices}>
          Xác nhận thanh toán
        </Button>
        <Button onClick={onClosePayment}>Hủy</Button>
      </Space>
    </Modal>
  )
}

export default PaymentDetailModal
