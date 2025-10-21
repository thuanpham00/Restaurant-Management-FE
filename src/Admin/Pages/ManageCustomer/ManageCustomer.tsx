/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Form, Input, Modal, Select, Spin, Table, Tag, Descriptions, Badge } from "antd"
import type { ColumnsType } from "antd/es/table"
import { isUndefined, omitBy } from "lodash"
import { UserCircle, Edit, Trash2, Filter, RotateCcw } from "lucide-react"
import { Fragment, useState, useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { customersAPI } from "src/Apis/Admin"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigCustomer, Customer } from "src/Types/customers.type"
import { PaginatedResponse } from "src/Types/utils.type"
import { AppAbility, useAuthorization } from "src/Authorization"

const { Option } = Select

const MEMBERSHIP_LEVELS = {
  0: { label: "Bronze", color: "#cd7f32" },
  1: { label: "Silver", color: "#c0c0c0" },
  2: { label: "Gold", color: "#ffd700" },
  3: { label: "Platinum", color: "#e5e4e2" }
}

const GENDER_OPTIONS = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" }
]

export default function ManageCustomer() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryConfig: queryParamConfigCustomer = useQueryParams()
  const queryClient = useQueryClient()
  const { can } = useAuthorization()
  const canViewCustomers = can(AppAbility.CUSTOMERS_VIEW)
  const canManageCustomers = can(AppAbility.CUSTOMERS_MANAGE)

  // ========== STATE ==========
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialFormValues, setInitialFormValues] = useState<any>(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== QUERY ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listCustomers", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const params = omitBy(
        {
          page: queryConfig.page || "1",
          per_page: queryConfig.per_page || "15",
          full_name: queryConfig.full_name,
          phone: queryConfig.phone,
          gender: queryConfig.gender,
          membership_level: queryConfig.membership_level,
          user_id: queryConfig.user_id
        },
        isUndefined
      )

      return customersAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: canViewCustomers
  })

  const paginated = data?.data?.data as PaginatedResponse<Customer>
  const listCustomers = paginated?.data || []

  // ========== MUTATIONS ==========
  const updateMutation = useMutation({
    mutationFn: (values: any) => {
      return customersAPI.update(selectedCustomer?.id as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật khách hàng thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listCustomers"] })
      queryClient.invalidateQueries({ queryKey: ["customerDetail", selectedCustomer?.id] })
      setIsEditMode(false)
      setHasChanges(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa khách hàng thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listCustomers"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa khách hàng thất bại", { autoClose: 1500 })
    }
  })

  const { data: detailData, isFetching: isFetchingDetail } = useQuery({
    queryKey: ["customerDetail", selectedCustomer?.id],
    queryFn: () => customersAPI.getDetail(selectedCustomer?.id as string),
    enabled: !!selectedCustomer?.id && isDetailModalOpen && canViewCustomers,
    staleTime: 2 * 60 * 1000
  })

  const customerDetail = detailData?.data?.data as Customer

  useEffect(() => {
    if (isEditMode && customerDetail) {
      const currentValues = form.getFieldsValue()
      const isChanged = JSON.stringify(currentValues) !== JSON.stringify(initialFormValues)
      setHasChanges(isChanged)
    }
  }, [form, isEditMode, customerDetail, initialFormValues])

  useEffect(() => {
    if (!canManageCustomers) {
      setIsEditMode(false)
    }
  }, [canManageCustomers])

  if (!canViewCustomers) {
    return null
  }

  // ========== HANDLERS ==========
  const handleRowClick = (record: Customer) => {
    setSelectedCustomer(record)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setHasChanges(false)

    const values = {
      full_name: record.full_name,
      phone: record.phone,
      gender: record.gender,
      address: record.address,
      membership_level: record.membership_level
    }
    form.setFieldsValue(values)
    setInitialFormValues(values)
  }

  const handleEdit = (record?: Customer) => {
    if (!canManageCustomers) {
      toast.warn("Bạn không có quyền quản lý khách hàng.")
      return
    }
    if (record) {
      setSelectedCustomer(record)
      setIsDetailModalOpen(true)
      const values = {
        full_name: record.full_name,
        phone: record.phone,
        gender: record.gender,
        address: record.address,
        membership_level: record.membership_level
      }
      form.setFieldsValue(values)
      setInitialFormValues(values)
    }
    setIsEditMode(true)
    setHasChanges(false)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setHasChanges(false)
    if (initialFormValues) {
      form.setFieldsValue(initialFormValues)
    }
  }

  const handleUpdate = () => {
    if (!canManageCustomers) {
      toast.warn("Bạn không có quyền quản lý khách hàng.")
      return
    }
    form.validateFields().then((values) => {
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== null && v !== undefined && v !== "")
      )
      updateMutation.mutate(cleanedValues)
    })
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setIsEditMode(false)
    setSelectedCustomer(null)
    setHasChanges(false)
    setInitialFormValues(null)
    form.resetFields()
  }

  const handleDelete = (id: string, fullName: string) => {
    if (!canManageCustomers) {
      toast.warn("Bạn không có quyền quản lý khách hàng.")
      return
    }
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa khách hàng "${fullName}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams)
  }

  const handleApplyFilter = (values: any) => {
    const params: queryParamConfigCustomer = cleanObject({
      page: "1",
      per_page: queryConfig.per_page || "15",
      full_name: values.full_name,
      phone: values.phone,
      gender: values.gender,
      membership_level: values.membership_level?.toString()
    })
    navigate({
      pathname: path.AdminCustomers,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const params = { page: "1", per_page: queryConfig.per_page || "15" }
    navigate({
      pathname: path.AdminCustomers,
      search: createSearchParams(params).toString()
    })
    filterForm.resetFields()
  }

  // ========== TABLE COLUMNS ==========
  const columns: ColumnsType<Customer> = [
    {
      title: "Tên khách hàng",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <UserCircle size={20} className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: "Email",
      dataIndex: ["user", "email"],
      key: "email"
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => text || <i className="text-gray-400">Chưa cập nhật</i>
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      render: (gender: string | null) => {
        if (!gender) return <i className="text-gray-400">Chưa xác định</i>
        const option = GENDER_OPTIONS.find((opt) => opt.value === gender)
        return option?.label || gender
      }
    },
    {
      title: "Cấp độ thành viên",
      dataIndex: "membership_level",
      key: "membership_level",
      render: (level: number) => {
        const membership = MEMBERSHIP_LEVELS[level as keyof typeof MEMBERSHIP_LEVELS]
        return (
          <Tag color={membership.color} style={{ fontWeight: "bold" }}>
            {membership.label}
          </Tag>
        )
      }
    },
    {
      title: "Trạng thái",
      dataIndex: ["user", "status"],
      key: "status",
      render: (status: number) => (
        <Badge status={status === 1 ? "success" : "error"} text={status === 1 ? "Hoạt động" : "Ngừng"} />
      )
    }
  ]

  if (canManageCustomers) {
    columns.push({
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_: any, record: Customer) => (
        <div className="flex gap-2">
          <Button
            type="link"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(record)
            }}
          >
          </Button>
          <Button
            type="link"
            danger
            icon={<Trash2 size={16} />}
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(record.id, record.full_name)
            }}
          >
          </Button>
        </div>
      )
    })
  }

  // ========== RENDER ==========
  return (
    <div>
      <Helmet>
        <title>Quản lý Khách hàng</title>
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 mb-4">Danh sách Khách hàng</h1>

      {/* Filter Form */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <Form form={filterForm} layout="inline" onFinish={handleApplyFilter} className="flex flex-wrap gap-4">
          <Form.Item name="full_name" className="mb-0">
            <Input placeholder="Tên khách hàng..." className="w-48" />
          </Form.Item>

          <Form.Item name="phone" className="mb-0">
            <Input placeholder="Số điện thoại..." className="w-48" />
          </Form.Item>

          <Form.Item name="gender" className="mb-0">
            <Select placeholder="Giới tính" allowClear className="w-36">
              {GENDER_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="membership_level" className="mb-0">
            <Select placeholder="Cấp độ thành viên" allowClear className="w-48">
              {Object.entries(MEMBERSHIP_LEVELS).map(([value, { label }]) => (
                <Option key={value} value={parseInt(value)}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" icon={<Filter size={16} />} htmlType="submit">
              Lọc
            </Button>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button icon={<RotateCcw size={16} />} onClick={resetFilterForm}>
              Đặt lại
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
          <div className="bg-white rounded-lg shadow">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={listCustomers}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: "pointer" }
              })}
              pagination={{
                current: parseInt(queryConfig.page as string) || 1,
                total: paginated?.total,
                pageSize: parseInt(queryConfig.per_page as string) || 15,
                onChange: handlePaginationChange,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} khách hàng`
              }}
              scroll={{
                y: "calc(100vh - 500px)",
                x: true
              }}
            />
          </div>
        </Fragment>
      )}

      {/* Detail/Edit Modal */}
      <Modal
        title={isEditMode ? "Chỉnh sửa Khách hàng" : "Chi tiết Khách hàng"}
        open={isDetailModalOpen}
        onCancel={handleCloseModal}
        footer={
          <div className="flex justify-end gap-2">
            {!isEditMode ? (
              <>
                <Button onClick={handleCloseModal}>Đóng</Button>
                {canManageCustomers && (
                  <Button type="primary" icon={<Edit size={16} />} onClick={() => handleEdit()}>
                    Chỉnh sửa
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={handleCancelEdit}>Hủy</Button>
                <Button
                  type="primary"
                  onClick={handleUpdate}
                  loading={updateMutation.isPending}
                  disabled={!hasChanges || !canManageCustomers}
                >
                  Cập nhật
                </Button>
              </>
            )}
          </div>
        }
        width={700}
        styles={{
          body: {
            maxHeight: "calc(100vh - 250px)",
            overflowY: "auto",
            overflowX: "hidden"
          }
        }}
      >
        {isFetchingDetail ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : customerDetail ? (
          !isEditMode ? (
            // View Mode - Descriptions
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Tên khách hàng">{customerDetail.full_name}</Descriptions.Item>
              <Descriptions.Item label="Email">{customerDetail.user.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {customerDetail.phone || <i className="text-gray-400">Chưa cập nhật</i>}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {customerDetail.gender
                  ? GENDER_OPTIONS.find((opt) => opt.value === customerDetail.gender)?.label
                  : "Chưa xác định"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {customerDetail.address || <i className="text-gray-400">Chưa cập nhật</i>}
              </Descriptions.Item>
              <Descriptions.Item label="Cấp độ thành viên">
                <Tag
                  color={MEMBERSHIP_LEVELS[customerDetail.membership_level as keyof typeof MEMBERSHIP_LEVELS].color}
                  style={{ fontWeight: "bold" }}
                >
                  {MEMBERSHIP_LEVELS[customerDetail.membership_level as keyof typeof MEMBERSHIP_LEVELS].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái tài khoản">
                <Badge
                  status={customerDetail.user.status === 1 ? "success" : "error"}
                  text={customerDetail.user.status_label}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Avatar">
                {customerDetail.user.avatar ? (
                  <img src={customerDetail.user.avatar} alt="Avatar" className="w-16 h-16 rounded-full" />
                ) : (
                  <i className="text-gray-400">Không có</i>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(customerDetail.created_at).toLocaleString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {new Date(customerDetail.updated_at).toLocaleString("vi-VN")}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            // Edit Mode - Form
            <Form form={form} layout="vertical" className="mt-4" onValuesChange={() => setHasChanges(true)}>
              <Form.Item
                name="full_name"
                label="Tên khách hàng"
                rules={[
                  { required: true, message: "Vui lòng nhập tên!" },
                  { min: 2, message: "Tên phải có ít nhất 2 ký tự" }
                ]}
              >
                <Input placeholder="Nhập tên khách hàng" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ pattern: /^[0-9]{10,11}$/, message: "Số điện thoại phải có 10-11 chữ số" }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item name="gender" label="Giới tính">
                <Select placeholder="Chọn giới tính" allowClear>
                  {GENDER_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea rows={3} placeholder="Nhập địa chỉ" />
              </Form.Item>

              <Form.Item name="membership_level" label="Cấp độ thành viên">
                <Select placeholder="Chọn cấp độ">
                  {Object.entries(MEMBERSHIP_LEVELS).map(([value, { label }]) => (
                    <Option key={value} value={parseInt(value)}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          )
        ) : null}
      </Modal>
    </div>
  )
}
