import { useMutation } from "@tanstack/react-query"
import { Modal, Form, Select, Input, Button } from "antd"
import { CreditCard } from "lucide-react"
import { toast } from "react-toastify"
import { payrollAPI } from "src/Apis/Admin"
import { Payroll, MarkAsPaidInput, PAYMENT_METHOD } from "src/Types/payroll.type"

interface PaymentModalProps {
  open: boolean
  payroll: Payroll
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({ open, payroll, onClose, onSuccess }: PaymentModalProps) {
  const [form] = Form.useForm()

  // ========== MUTATION ==========
  const markAsPaidMutation = useMutation({
    mutationFn: (values: MarkAsPaidInput) => payrollAPI.markAsPaid(payroll.id, values),
    onSuccess: () => {
      toast.success("Đánh dấu đã thanh toán thành công!", { autoClose: 1500 })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Đánh dấu thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLER ==========
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      markAsPaidMutation.mutate({
        payment_method: values.payment_method,
        payment_ref: values.payment_ref,
        notes: values.notes
      })
    })
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  // ========== FORMAT HELPERS ==========
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(num)
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-green-500" />
          <span>Thanh toán lương</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose}>Hủy</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={markAsPaidMutation.isPending}
            className="bg-green-500 hover:bg-green-600"
          >
            Xác nhận thanh toán
          </Button>
        </div>
      }
      width={600}
    >
      <div className="py-4">
        {/* Payroll Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Nhân viên:</span>
              <div className="font-semibold">{payroll.employee.full_name}</div>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Tháng/Năm:</span>
              <div className="font-semibold">
                {payroll.month.toString().padStart(2, "0")}/{payroll.year}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 text-sm">Số tiền thanh toán:</span>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(payroll.final_salary)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="payment_method"
            label="Phương thức thanh toán"
            rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán!" }]}
            initialValue={PAYMENT_METHOD.BANK_TRANSFER}
          >
            <Select
              placeholder="Chọn phương thức..."
              options={[
                { label: "Tiền mặt", value: PAYMENT_METHOD.CASH },
                { label: "Chuyển khoản", value: PAYMENT_METHOD.BANK_TRANSFER },
                { label: "Ví điện tử", value: PAYMENT_METHOD.E_WALLET }
              ]}
            />
          </Form.Item>

          <Form.Item name="payment_ref" label="Mã giao dịch / Tham chiếu">
            <Input placeholder="VD: TXN123456, hoặc để trống nếu thanh toán tiền mặt" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm về thanh toán..." />
          </Form.Item>
        </Form>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Lưu ý:</strong> Sau khi xác nhận thanh toán, trạng thái bảng lương sẽ được
            chuyển sang "Đã thanh toán" và không thể chỉnh sửa.
          </p>
        </div>
      </div>
    </Modal>
  )
}
