import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Modal, Form, InputNumber, Input, Button, Divider, Tag, Table, Spin } from "antd"
import { Plus, Edit, Trash2, DollarSign } from "lucide-react"
import { useState } from "react"
import { toast } from "react-toastify"
import { payrollAPI, payrollItemsAPI } from "src/Apis/Admin"
import {
  Payroll,
  PayrollFormInput,
  PayrollItem,
  ITEM_TYPE_LABELS,
  ITEM_TYPE_COLORS
} from "src/Types/payroll.type"
import PayrollItemModal from "./PayrollItemModal"

interface PayrollDetailModalProps {
  open: boolean
  payroll: Payroll
  onClose: () => void
  onSuccess: () => void
}

export default function PayrollDetailModal({
  open,
  payroll,
  onClose,
  onSuccess
}: PayrollDetailModalProps) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null)

  // ========== QUERIES ==========
  const { data: payrollDetailData, isFetching } = useQuery({
    queryKey: ["payroll", payroll.id],
    queryFn: () => payrollAPI.getDetail(payroll.id),
    enabled: open,
    staleTime: 1 * 60 * 1000
  })

  const payrollDetail = payrollDetailData?.data?.data

  // ========== MUTATIONS ==========
  const updateMutation = useMutation({
    mutationFn: (values: PayrollFormInput) => payrollAPI.update(payroll.id, values),
    onSuccess: () => {
      toast.success("Cập nhật bảng lương thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["payroll", payroll.id] })
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => payrollItemsAPI.delete(itemId),
    onSuccess: () => {
      toast.success("Xóa khoản mục thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["payroll", payroll.id] })
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS ==========
  const handleUpdate = () => {
    form.validateFields().then((values) => {
      updateMutation.mutate(values)
    })
  }

  const handleAddItem = () => {
    setSelectedItem(null)
    setIsItemModalOpen(true)
  }

  const handleEditItem = (item: PayrollItem) => {
    setSelectedItem(item)
    setIsItemModalOpen(true)
  }

  const handleDeleteItem = (item: PayrollItem) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa khoản mục "${item.description}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteItemMutation.mutate(item.id)
    })
  }

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false)
    setSelectedItem(null)
  }

  // ========== FORMAT HELPERS ==========
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(num)
  }

  // ========== ITEMS TABLE COLUMNS ==========
  const itemColumns = [
    {
      title: "Loại",
      dataIndex: "item_type",
      key: "item_type",
      width: 100,
      render: (type: number) => (
        <Tag color={ITEM_TYPE_COLORS[type]}>{ITEM_TYPE_LABELS[type]}</Tag>
      )
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 120
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      align: "right" as const,
      render: (_: any, record: PayrollItem) => (
        <span
          className={`font-mono ${record.item_type === 0 ? "text-green-600" : "text-red-600"}`}
        >
          {parseFloat(record.signed_amount) > 0 ? "+" : ""}
          {formatCurrency(record.amount)}
        </span>
      )
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_: any, record: PayrollItem) => (
        <div className="flex gap-2">
          <Button
            size="small"
            type="text"
            icon={<Edit size={14} />}
            onClick={() => handleEditItem(record)}
          />
          <Button
            size="small"
            type="text"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDeleteItem(record)}
          />
        </div>
      )
    }
  ]

  // ========== RENDER ==========
  if (isFetching || !payrollDetail) {
    return (
      <Modal open={open} onCancel={onClose} footer={null} width={900}>
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      </Modal>
    )
  }

  // Set form values
  if (open && payrollDetail) {
    form.setFieldsValue({
      base_salary: parseFloat(payrollDetail.base_salary),
      bonus: parseFloat(payrollDetail.bonus),
      deductions: parseFloat(payrollDetail.deductions),
      notes: payrollDetail.notes
    })
  }

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-blue-500" />
            <span>Chi tiết Bảng lương</span>
          </div>
        }
        open={open}
        onCancel={onClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              onClick={handleUpdate}
              loading={updateMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Cập nhật
            </Button>
          </div>
        }
        width={900}
        styles={{
          body: {
            maxHeight: "calc(100vh - 250px)",
            overflowY: "auto",
            overflowX: "hidden"
          }
        }}
      >
        <div className="py-4">
          {/* Employee Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Nhân viên:</span>
                <div className="font-semibold text-lg">{payrollDetail.employee.full_name}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Tháng/Năm:</span>
                <div className="font-semibold text-lg">
                  {payrollDetail.month.toString().padStart(2, "0")}/{payrollDetail.year}
                </div>
              </div>
            </div>
          </div>

          {/* Base Salary Form */}
          <Form form={form} layout="vertical">
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name="base_salary"
                label="Lương cơ bản (VND)"
                rules={[{ required: true, message: "Vui lòng nhập lương cơ bản!" }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                />
              </Form.Item>

              <Form.Item
                name="bonus"
                label="Thưởng (VND)"
                rules={[{ required: true, message: "Vui lòng nhập thưởng!" }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                />
              </Form.Item>

              <Form.Item
                name="deductions"
                label="Khấu trừ (VND)"
                rules={[{ required: true, message: "Vui lòng nhập khấu trừ!" }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                />
              </Form.Item>
            </div>

            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={2} placeholder="Ghi chú thêm..." />
            </Form.Item>
          </Form>

          <Divider />

          {/* Items Section */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-base">Chi tiết các khoản</h4>
            <Button
              type="dashed"
              icon={<Plus size={16} />}
              onClick={handleAddItem}
              size="small"
            >
              Thêm khoản mục
            </Button>
          </div>

          <Table
            rowKey="id"
            columns={itemColumns}
            dataSource={payrollDetail.items || []}
            pagination={false}
            size="small"
            bordered
          />

          <Divider />

          {/* Final Calculation */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Tổng thực lĩnh:</span>
              <span className="text-2xl font-bold text-green-700">
                {formatCurrency(payrollDetail.final_salary)}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              = Lương cơ bản + Thưởng - Khấu trừ + Tổng thu nhập - Tổng khấu trừ từ chi tiết các khoản mục ở trên
            </div>
          </div>
        </div>
      </Modal>

      {/* Item Modal */}
      <PayrollItemModal
        open={isItemModalOpen}
        payrollId={payroll.id}
        item={selectedItem}
        onClose={handleCloseItemModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["payroll", payroll.id] })
          queryClient.invalidateQueries({ queryKey: ["payrolls"] })
          handleCloseItemModal()
        }}
      />
    </>
  )
}
