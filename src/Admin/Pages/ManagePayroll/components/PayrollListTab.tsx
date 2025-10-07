import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Form, Select, Table, Tag, Modal, Spin, DatePicker, Tooltip } from "antd"
import { isUndefined, omitBy } from "lodash"
import {
  DollarSign,
  Eye,
  Plus,
  CreditCard,
  Calendar as CalendarIcon,
  Filter,
  RotateCcw
} from "lucide-react"
import { Fragment, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import dayjs from "dayjs"
import { payrollAPI, employeesAPI } from "src/Apis/Admin"
import {
  Payroll,
  queryParamConfigPayroll,
  PAYROLL_STATUS_LABELS,
  PAYROLL_STATUS_COLORS,
  PAYROLL_STATUS,
  GeneratePayrollInput
} from "src/Types/payroll.type"
import { PaginatedResponse } from "src/Types/utils.type"
import useQueryParams from "src/Hook/useQueryParams"
import { path } from "src/Constants/path"
import PaymentModal from "./PaymentModal"

export default function PayrollListTab() {
  const queryConfig: queryParamConfigPayroll = useQueryParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // ========== STATE ==========
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  
  const [generateForm] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["payrolls", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const params = omitBy(
        {
          page: queryConfig.page || "1",
          per_page: queryConfig.per_page || "15",
          employee_id: queryConfig.employee_id,
          status: queryConfig.status,
          month: queryConfig.month,
          year: queryConfig.year
        },
        isUndefined
      )

      return payrollAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "active"],
    queryFn: () => {
      const controller = new AbortController()
      return employeesAPI.getList({ is_active: "true", per_page: "1000" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  const paginated = data?.data?.data as PaginatedResponse<Payroll>
  const listPayrolls = paginated?.data || []
  const activeEmployees = employeesData?.data?.data?.data || []

  // ========== MUTATIONS ==========
  const generateMutation = useMutation({
    mutationFn: (values: GeneratePayrollInput) => payrollAPI.generate(values),
    onSuccess: () => {
      toast.success("Tạo bảng lương thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      handleCloseGenerateModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Tạo bảng lương thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS ==========
  const handleOpenGenerateModal = () => {
    generateForm.resetFields()
    // Set default to current month/year
    generateForm.setFieldsValue({
      month: dayjs().month() + 1,
      year: dayjs().year()
    })
    setIsGenerateModalOpen(true)
  }

  const handleCloseGenerateModal = () => {
    setIsGenerateModalOpen(false)
    generateForm.resetFields()
  }

  const handleGenerate = () => {
    generateForm.validateFields().then((values) => {
      const monthDate = dayjs(values.month_year)
      generateMutation.mutate({
        month: monthDate.month() + 1,
        year: monthDate.year()
      })
    })
  }

  const handleOpenPaymentModal = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setIsPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedPayroll(null)
  }

  // ========== FILTER HANDLERS ==========
  const handleFilter = () => {
    const values = filterForm.getFieldsValue()
    const params = new URLSearchParams(window.location.search)

    if (values.employee_id) {
      params.set("employee_id", values.employee_id)
    } else {
      params.delete("employee_id")
    }

    if (values.status !== undefined && values.status !== null && values.status !== "") {
      params.set("status", values.status.toString())
    } else {
      params.delete("status")
    }

    if (values.month) {
      params.set("month", values.month.toString())
    } else {
      params.delete("month")
    }

    if (values.year) {
      params.set("year", values.year.toString())
    } else {
      params.delete("year")
    }

    params.set("page", "1")
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const handleResetFilter = () => {
    filterForm.resetFields()
    window.history.pushState({}, "", window.location.pathname)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  // ========== FORMAT HELPERS ==========
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(num)
  }

  // ========== TABLE COLUMNS ==========
  const columns = [
    {
      title: "Nhân viên",
      dataIndex: ["employee", "full_name"],
      key: "employee",
      width: 180,
      render: (text: string) => (
        <div className="font-medium">{text}</div>
      )
    },
    {
      title: "Tháng/Năm",
      key: "period",
      width: 120,
      render: (_: any, record: Payroll) => (
        <div className="flex items-center gap-1">
          <CalendarIcon size={14} className="text-gray-400" />
          <span className="font-mono">{`${record.month.toString().padStart(2, "0")}/${record.year}`}</span>
        </div>
      )
    },
    {
      title: "Lương cơ bản",
      dataIndex: "base_salary",
      key: "base_salary",
      width: 140,
      align: "right" as const,
      render: (value: string) => (
        <span className="font-mono text-blue-600">{formatCurrency(value)}</span>
      )
    },
    {
      title: "Thưởng",
      dataIndex: "bonus",
      key: "bonus",
      width: 120,
      align: "right" as const,
      render: (value: string) => (
        <span className="font-mono text-green-600">{formatCurrency(value)}</span>
      )
    },
    {
      title: "Khấu trừ",
      dataIndex: "deductions",
      key: "deductions",
      width: 120,
      align: "right" as const,
      render: (value: string) => (
        <span className="font-mono text-red-600">{formatCurrency(value)}</span>
      )
    },
    {
      title: "Thực lĩnh",
      dataIndex: "final_salary",
      key: "final_salary",
      width: 150,
      align: "right" as const,
      render: (value: string) => (
        <span className="font-mono font-bold text-lg text-green-700">
          {formatCurrency(value)}
        </span>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: number) => (
        <Tag color={PAYROLL_STATUS_COLORS[status]}>
          {PAYROLL_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: "Thanh toán",
      key: "payment",
      width: 150,
      render: (_: any, record: Payroll) => (
        <div className="text-sm">
          {record.payment_method_label && (
            <div className="text-gray-600">{record.payment_method_label}</div>
          )}
          {record.paid_at && (
            <div className="text-gray-400 text-xs">
              {dayjs(record.paid_at).format("DD/MM/YYYY HH:mm")}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Hành động",
      key: "action",
      width: 80,
      fixed: "right" as const,
      render: (_: any, record: Payroll) => (
        <div className="flex gap-1">
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              type="text"
              icon={<Eye size={16} />}
              onClick={(e) => {
                e.stopPropagation()
                navigate(`${path.AdminPayroll}/${record.id}`)
              }}
            />
          </Tooltip>
          {record.status === PAYROLL_STATUS.DRAFT && (
            <Tooltip title="Thanh toán">
              <Button
                size="small"
                type="text"
                icon={<CreditCard size={16} />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenPaymentModal(record)
                }}
                className="text-green-600 hover:text-green-700"
              />
            </Tooltip>
          )}
        </div>
      )
    }
  ]

  // ========== RENDER ==========
  return (
    <div>
      {/* Header & Actions */}
      <div className="flex justify-between items-center mb-4 px-4 pt-4">
        <div>
          <h3 className="text-lg font-semibold">Danh sách Bảng lương</h3>
          <p className="text-gray-500 text-sm">Quản lý bảng lương nhân viên theo tháng</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleOpenGenerateModal}
          size="large"
          className="bg-blue-500 hover:bg-blue-600"
        >
          Tạo bảng lương
        </Button>
      </div>

      {/* Filter Form */}
      <div className="mb-4 px-4 bg-gray-50 py-4 mx-4 rounded-lg">
        <Form form={filterForm} layout="inline" className="flex flex-wrap gap-3">
          <Form.Item name="employee_id" className="mb-0">
            <Select
              placeholder="Chọn nhân viên..."
              className="w-48"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={activeEmployees.map((emp: any) => ({
                label: emp.full_name,
                value: emp.id
              }))}
            />
          </Form.Item>

          <Form.Item name="status" className="mb-0">
            <Select
              placeholder="Trạng thái..."
              style={{ width: "fit-content", minWidth: 140 }}
              allowClear
              options={[
                { label: "Nháp", value: 0 },
                { label: "Đã thanh toán", value: 1 }
              ]}
            />
          </Form.Item>

          <Form.Item name="month" className="mb-0">
            <Select
              placeholder="Tháng..."
              style={{ width: "fit-content", minWidth: 100 }}
              allowClear
              options={Array.from({ length: 12 }, (_, i) => ({
                label: `Tháng ${i + 1}`,
                value: i + 1
              }))}
            />
          </Form.Item>

          <Form.Item name="year" className="mb-0">
            <Select
              placeholder="Năm..."
              className="w-32"
              allowClear
              options={Array.from({ length: 5 }, (_, i) => {
                const year = dayjs().year() - i
                return { label: year.toString(), value: year }
              })}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" icon={<Filter size={16} />} onClick={handleFilter}>
              Lọc
            </Button>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
              Reset
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Table */}
      {isFetching ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <Fragment>
          <div className="px-4">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={listPayrolls}
              onRow={(record) => ({
                onClick: () => navigate(`${path.AdminPayroll}/${record.id}`),
                className: "cursor-pointer hover:bg-gray-50 transition-colors"
              })}
              pagination={{
                current: parseInt(queryConfig.page as string) || 1,
                total: paginated?.total,
                pageSize: parseInt(queryConfig.per_page as string) || 15,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} bảng lương`,
                onChange: (page, pageSize) => {
                  const params = new URLSearchParams(window.location.search)
                  params.set("page", page.toString())
                  params.set("per_page", pageSize.toString())
                  window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
                  window.dispatchEvent(new PopStateEvent("popstate"))
                }
              }}
              scroll={{
                y: "calc(100vh - 500px)", 
                x: true 
              }}
              bordered
            />
          </div>
        </Fragment>
      )}

      {/* Generate Payroll Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-blue-500" />
            <span>Tạo bảng lương mới</span>
          </div>
        }
        open={isGenerateModalOpen}
        onCancel={handleCloseGenerateModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseGenerateModal}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={generateMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Tạo bảng lương
            </Button>
          </div>
        }
        width={500}
      >
        <Form form={generateForm} layout="vertical" className="mt-4">
          <Form.Item
            name="month_year"
            label="Chọn tháng/năm"
            rules={[{ required: true, message: "Vui lòng chọn tháng/năm!" }]}
            initialValue={dayjs()}
          >
            <DatePicker
              picker="month"
              format="MM/YYYY"
              placeholder="Chọn tháng/năm"
              className="w-full"
            />
          </Form.Item>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Lưu ý:</strong> Hệ thống sẽ tự động tạo bảng lương cho tất cả nhân viên đang
              hoạt động trong tháng này. Bạn có thể chỉnh sửa chi tiết sau khi tạo.
            </p>
          </div>
        </Form>
      </Modal>

      {/* Payment Modal */}
      {selectedPayroll && (
        <PaymentModal
          open={isPaymentModalOpen}
          payroll={selectedPayroll}
          onClose={handleClosePaymentModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["payrolls"] })
            handleClosePaymentModal()
          }}
        />
      )}
    </div>
  )
}
