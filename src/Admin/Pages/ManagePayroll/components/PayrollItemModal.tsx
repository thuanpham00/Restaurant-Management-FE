import { useMutation } from "@tanstack/react-query"
import { Modal, Form, Radio, Input, InputNumber, Button, Select } from "antd"
import { Plus, Edit } from "lucide-react"
import { toast } from "react-toastify"
import { payrollItemsAPI } from "src/Apis/Admin"
import {
  PayrollItem,
  PayrollItemFormInput,
  ITEM_TYPE,
  COMMON_ITEM_CODES,
  COMMON_ITEM_DESCRIPTIONS
} from "src/Types/payroll.type"

interface PayrollItemModalProps {
  open: boolean
  payrollId: string
  item: PayrollItem | null
  onClose: () => void
  onSuccess: () => void
  disabled?: boolean
}

export default function PayrollItemModal({
  open,
  payrollId,
  item,
  onClose,
  onSuccess,
  disabled = false
}: PayrollItemModalProps) {
  const [form] = Form.useForm()
  const isEditMode = !!item

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: PayrollItemFormInput) => payrollItemsAPI.create(values),
    onSuccess: () => {
      toast.success("Thêm khoản mục thành công!", { autoClose: 1500 })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm khoản mục thất bại", {
        autoClose: 1500
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PayrollItemFormInput> }) =>
      payrollItemsAPI.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật khoản mục thành công!", { autoClose: 1500 })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS ==========
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (isEditMode && item) {
        updateMutation.mutate({
          id: item.id,
          data: {
            code: values.code,
            description: values.description,
            amount: values.amount
          }
        })
      } else {
        createMutation.mutate({
          payroll_id: payrollId,
          item_type: values.item_type,
          code: values.code,
          description: values.description,
          amount: values.amount
        })
      }
    })
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleCodeChange = (code: string) => {
    if (code in COMMON_ITEM_DESCRIPTIONS) {
      form.setFieldsValue({
        description: COMMON_ITEM_DESCRIPTIONS[code]
      })
    }
  }

  // Set form values for edit mode
  if (open && isEditMode && item) {
    form.setFieldsValue({
      item_type: item.item_type,
      code: item.code,
      description: item.description,
      amount: parseFloat(item.amount)
    })
  } else if (open && !isEditMode) {
    form.setFieldsValue({
      item_type: ITEM_TYPE.EARNING
    })
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {isEditMode ? <Edit size={20} /> : <Plus size={20} />}
          <span>
            {disabled ? "Xem chi tiết khoản mục" : isEditMode ? "Chỉnh sửa khoản mục" : "Thêm khoản mục mới"}
          </span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={
        disabled ? (
          <div className="flex justify-end">
            <Button onClick={handleClose}>Đóng</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button onClick={handleClose}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isEditMode ? "Cập nhật" : "Thêm"}
            </Button>
          </div>
        )
      }
      width={600}
    >
      <Form form={form} layout="vertical" className="mt-4" disabled={disabled}>
        <Form.Item
          name="item_type"
          label="Loại khoản mục"
          rules={[{ required: true, message: "Vui lòng chọn loại!" }]}
        >
          <Radio.Group disabled={isEditMode || disabled}>
            <Radio value={ITEM_TYPE.EARNING}>Thu nhập</Radio>
            <Radio value={ITEM_TYPE.DEDUCTION}>Khấu trừ</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã khoản mục"
          rules={[
            { required: true, message: "Vui lòng nhập mã!" },
            { max: 50, message: "Mã không được quá 50 ký tự" }
          ]}
        >
          <Select
            placeholder="Chọn hoặc nhập mã..."
            showSearch
            allowClear
            onChange={handleCodeChange}
            options={Object.entries(COMMON_ITEM_CODES).map(([, value]) => ({
              label: value,
              value: value
            }))}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[
            { required: true, message: "Vui lòng nhập mô tả!" },
            { max: 255, message: "Mô tả không được quá 255 ký tự" }
          ]}
        >
          <Input.TextArea
            rows={2}
            placeholder="VD: Thưởng hiệu suất tháng, Phạt đi trễ..."
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Số tiền (VND)"
          rules={[
            { required: true, message: "Vui lòng nhập số tiền!" },
            { type: "number", min: 0, message: "Số tiền phải lớn hơn 0" }
          ]}
        >
          <InputNumber
            className="w-full"
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>

        {disabled ? (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Thông báo:</strong> Bảng lương đã được thanh toán, không thể chỉnh sửa các khoản mục.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Lưu ý:</strong> Khoản mục "Thu nhập" sẽ được cộng vào lương, khoản mục "Khấu
              trừ" sẽ bị trừ đi. Tổng lương cuối cùng sẽ được tự động tính lại.
            </p>
          </div>
        )}
      </Form>
    </Modal>
  )
}
