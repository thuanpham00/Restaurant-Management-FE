import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Form, InputNumber, Input, Button, Divider, Tag, Table, Spin, Modal } from "antd"
import { Plus, Edit, Trash2, DollarSign, Save } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { Helmet } from "react-helmet-async"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { payrollAPI, payrollItemsAPI } from "src/Apis/Admin"
import {
  PayrollFormInput,
  PayrollItem,
  ITEM_TYPE_LABELS,
  ITEM_TYPE_COLORS,
  PAYROLL_STATUS_LABELS,
  PAYROLL_STATUS
} from "src/Types/payroll.type"
import PayrollItemModal from "./components/PayrollItemModal"
import PaymentModal from "./components/PaymentModal"

export default function PayrollDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null)

  // ========== QUERIES ==========
  const { data: payrollDetailData, isFetching } = useQuery({
    queryKey: ["payroll", id],
    queryFn: () => payrollAPI.getDetail(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000
  })

  const payrollDetail = payrollDetailData?.data?.data

  // ========== MUTATIONS ==========
  const updateMutation = useMutation({
    mutationFn: (values: PayrollFormInput) => payrollAPI.update(id!, values),
    onSuccess: () => {
      toast.success("Cập nhật bảng lương thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["payroll", id] })
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => payrollItemsAPI.delete(itemId),
    onSuccess: () => {
      toast.success("Xóa khoản mục thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["payroll", id] })
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

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false)
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
      width: 100,
      render: (_: any, record: PayrollItem) => (
        <div className="flex gap-2">
          <Button
            size="small"
            type="text"
            icon={<Edit size={14} />}
            onClick={() => handleEditItem(record)}
            disabled={isPaid}
          />
          <Button
            size="small"
            type="text"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDeleteItem(record)}
            disabled={isPaid}
          />
        </div>
      )
    }
  ]

  // ========== RENDER ==========
  if (isFetching || !payrollDetail) {
    return (
      <div className="p-6">
        <Helmet>
          <title>Chi tiết Bảng lương</title>
        </Helmet>
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      </div>
    )
  }

  // Set form values
  form.setFieldsValue({
    base_salary: parseFloat(payrollDetail.base_salary),
    bonus: parseFloat(payrollDetail.bonus),
    deductions: parseFloat(payrollDetail.deductions),
    notes: payrollDetail.notes
  })

  const isPaid = payrollDetail.status === PAYROLL_STATUS.PAID

  return (
    <div className="p-6">
      <Helmet>
        <title>Chi tiết Bảng lương - {payrollDetail.employee.full_name}</title>
      </Helmet>

      <NavigateBack />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <DollarSign size={24} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Chi tiết Bảng lương
            </h1>
            <Tag color={payrollDetail.status === 0 ? "orange" : "green"}>
              {PAYROLL_STATUS_LABELS[payrollDetail.status]}
            </Tag>
          </div>
          <p className="text-gray-500 mt-1">
            {payrollDetail.employee.full_name} - Tháng {payrollDetail.month.toString().padStart(2, "0")}/{payrollDetail.year}
          </p>
        </div>

        <div className="flex gap-2">
          {!isPaid && (
            <>
              <Button
                type="primary"
                icon={<Save size={18} />}
                onClick={handleUpdate}
                loading={updateMutation.isPending}
                size="large"
                className="bg-blue-500 hover:bg-blue-600"
              >
                Lưu thay đổi
              </Button>
              <Button
                icon={<DollarSign size={18} />}
                onClick={handleOpenPaymentModal}
                size="large"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Thanh toán
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Employee Info & Salary Form */}
        <div className="col-span-2 space-y-6">
          {/* Employee Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin nhân viên</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Tên nhân viên:</span>
                <div className="font-semibold text-base mt-1">{payrollDetail.employee.full_name}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Loại hợp đồng:</span>
                <div className="font-semibold text-base mt-1">{payrollDetail.employee.contract_label}</div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Tháng/Năm:</span>
                <div className="font-semibold text-base mt-1">
                  {payrollDetail.month.toString().padStart(2, "0")}/{payrollDetail.year}
                </div>
              </div>
              {payrollDetail.paid_at && (
                <div>
                  <span className="text-gray-500 text-sm">Ngày thanh toán:</span>
                  <div className="font-semibold text-base mt-1">
                    {new Date(payrollDetail.paid_at).toLocaleString("vi-VN")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Salary Form Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin lương cơ bản</h3>
            <Form form={form} layout="vertical" disabled={isPaid}>
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
                    size="large"
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
                    size="large"
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
                    size="large"
                  />
                </Form.Item>
              </div>

              <Form.Item name="notes" label="Ghi chú">
                <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
              </Form.Item>
            </Form>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chi tiết các khoản thu nhập & khấu trừ</h3>
              {!isPaid && (
                <Button
                  type="dashed"
                  icon={<Plus size={16} />}
                  onClick={handleAddItem}
                >
                  Thêm khoản mục
                </Button>
              )}
            </div>

            <Table
              rowKey="id"
              columns={itemColumns}
              dataSource={payrollDetail.items || []}
              pagination={false}
              size="middle"
              bordered
            />
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="col-span-1">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-6 text-center">Tổng kết lương</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Lương cơ bản:</span>
                <span className="font-mono font-semibold text-blue-600">
                  {formatCurrency(payrollDetail.base_salary)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Thưởng:</span>
                <span className="font-mono font-semibold text-green-600">
                  {formatCurrency(payrollDetail.bonus)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Khấu trừ:</span>
                <span className="font-mono font-semibold text-red-600">
                  -{formatCurrency(payrollDetail.deductions)}
                </span>
              </div>

              {payrollDetail.items && payrollDetail.items.length > 0 && (
                <>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Thu nhập khác:</span>
                    <span className="font-mono font-semibold text-green-600">
                      +{formatCurrency(
                        payrollDetail.items
                          .filter((item) => item.item_type === 0)
                          .reduce((sum, item) => sum + parseFloat(item.amount), 0)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Khấu trừ khác:</span>
                    <span className="font-mono font-semibold text-red-600">
                      -{formatCurrency(
                        payrollDetail.items
                          .filter((item) => item.item_type === 1)
                          .reduce((sum, item) => sum + parseFloat(item.amount), 0)
                      )}
                    </span>
                  </div>
                </>
              )}

              <Divider className="my-4" />

              <div className="bg-white rounded-lg p-4 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Thực lĩnh:</span>
                  <span className="text-3xl font-bold text-green-700">
                    {formatCurrency(payrollDetail.final_salary)}
                  </span>
                </div>
              </div>

              {payrollDetail.payment_method_label && (
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Phương thức thanh toán:</div>
                  <div className="font-semibold">{payrollDetail.payment_method_label}</div>
                  {payrollDetail.payment_ref && (
                    <div className="text-xs text-gray-500 mt-1">Mã GD: {payrollDetail.payment_ref}</div>
                  )}
                </div>
              )}
            </div>

            {!isPaid && (
              <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Lưu ý:</strong> Tổng lương được tính tự động dựa trên các khoản mục. 
                  Nhấn "Lưu thay đổi" để cập nhật.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      <PayrollItemModal
        open={isItemModalOpen}
        payrollId={id!}
        item={selectedItem}
        onClose={handleCloseItemModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["payroll", id] })
          queryClient.invalidateQueries({ queryKey: ["payrolls"] })
          handleCloseItemModal()
        }}
        disabled={isPaid}
      />

      {/* Payment Modal */}
      {payrollDetail && (
        <PaymentModal
          open={isPaymentModalOpen}
          payroll={payrollDetail}
          onClose={handleClosePaymentModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["payroll", id] })
            queryClient.invalidateQueries({ queryKey: ["payrolls"] })
            handleClosePaymentModal()
            // Optionally navigate back after payment
            // navigate(path.AdminPayroll)
          }}
        />
      )}
    </div>
  )
}
