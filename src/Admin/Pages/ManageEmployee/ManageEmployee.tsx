/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
  Descriptions,
  Badge,
  DatePicker,
  InputNumber,
  Switch
} from "antd"
import { isUndefined, omitBy } from "lodash"
import { Users, Edit, Trash2, Plus, Filter, RotateCcw, Eye } from "lucide-react"
import { Fragment, useState, useEffect, useMemo } from "react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import dayjs from "dayjs"

import NavigateBack from "src/Admin/Components/NavigateBack"
import { employeesAPI, rolesAPI } from "src/Apis/Admin"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { PaginatedResponse } from "src/Types/utils.type"
import { Employee, EmployeeCreateInput, EmployeeFormInput, queryParamConfigEmployee } from "src/Types/employee.type"
import InputFileImage from "src/Components/InputFileImage"
import { assets } from "src/Assets/assets"
import { AppAbility, PermissionGate, useAuthorization } from "src/Authorization"

const { Option } = Select

const CONTRACT_TYPES = {
  0: { label: "Full-time", color: "green" },
  1: { label: "Part-time", color: "blue" }
}

const GENDER_OPTIONS = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" }
]

export default function ManageEmployee() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryConfig: queryParamConfigEmployee = useQueryParams()
  const queryClient = useQueryClient()
  const { can } = useAuthorization()
  const canManageEmployees = can(AppAbility.EMPLOYEES_MANAGE)

  // ========== STATE ==========
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialFormValues, setInitialFormValues] = useState<any>(null)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [createAvatarFile, setCreateAvatarFile] = useState<File | null>(null)
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const defaultAvatar = assets.rectangles.chef3

  const createAvatarPreview = useMemo(
    () => (createAvatarFile ? URL.createObjectURL(createAvatarFile) : ""),
    [createAvatarFile]
  )
  const editAvatarPreview = useMemo(() => (editAvatarFile ? URL.createObjectURL(editAvatarFile) : ""), [editAvatarFile])

  useEffect(() => {
    if (!createAvatarPreview) return
    return () => {
      URL.revokeObjectURL(createAvatarPreview)
    }
  }, [createAvatarPreview])

  useEffect(() => {
    if (!editAvatarPreview) return
    return () => {
      URL.revokeObjectURL(editAvatarPreview)
    }
  }, [editAvatarPreview])

  useEffect(() => {
    if (!canManageEmployees) {
      setIsCreateModalOpen(false)
      setIsEditMode(false)
      setEditAvatarFile(null)
    }
  }, [canManageEmployees])

  // ========== QUERY ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listEmployees", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const params = omitBy(
        {
          page: queryConfig.page || "1",
          per_page: queryConfig.per_page || "15",
          full_name: queryConfig.full_name,
          is_active: queryConfig.is_active,
          contract_type: queryConfig.contract_type,
          gender: queryConfig.gender,
          hire_date_from: queryConfig.hire_date_from,
          hire_date_to: queryConfig.hire_date_to,
          role_id: queryConfig.role_id
        },
        isUndefined
      )

      return employeesAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data?.data as PaginatedResponse<Employee>
  const listEmployees = paginated?.data || []

  // Get roles for select
  const { data: rolesData } = useQuery({
    queryKey: ["roles-select"],
    queryFn: () => {
      const controller = new AbortController()
      return rolesAPI.getList({ per_page: "99" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  const roleOptions =
    (rolesData?.data?.data as any)?.data?.map((role: any) => ({
      label: role.name,
      value: role.id
    })) || []

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: EmployeeCreateInput) => {
      return employeesAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Thêm nhân viên thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listEmployees"] })
      setIsCreateModalOpen(false)
      createForm.resetFields()
      setCreateAvatarFile(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm nhân viên thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: EmployeeFormInput) => {
      return employeesAPI.update(selectedEmployee?.id as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật nhân viên thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listEmployees"] })
      queryClient.invalidateQueries({ queryKey: ["employeeDetail", selectedEmployee?.id] })
      setIsEditMode(false)
      setHasChanges(false)
      setEditAvatarFile(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa nhân viên thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listEmployees"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa nhân viên thất bại", { autoClose: 1500 })
    }
  })
  const { data: detailData, isFetching: isFetchingDetail } = useQuery({
    queryKey: ["employeeDetail", selectedEmployee?.id],
    queryFn: () => employeesAPI.getDetail(selectedEmployee?.id as string),
    enabled: !!selectedEmployee?.id && isDetailModalOpen,
    staleTime: 2 * 60 * 1000
  })

  const employeeDetail = detailData?.data?.data as Employee

  useEffect(() => {
    if (isEditMode && employeeDetail) {
      const currentValues = form.getFieldsValue()
      const isChanged = JSON.stringify(currentValues) !== JSON.stringify(initialFormValues)
      setHasChanges(isChanged || !!editAvatarFile)
    }
  }, [form, isEditMode, employeeDetail, initialFormValues, editAvatarFile])

  // ========== HANDLERS ==========
  const handleCreateAvatarChange = (file?: File) => {
    setCreateAvatarFile(file || null)
  }

  const handleRemoveCreateAvatar = () => {
    setCreateAvatarFile(null)
  }

  const handleEditAvatarChange = (file?: File) => {
    const nextFile = file || null
    setEditAvatarFile(nextFile)
    if (nextFile) {
      setHasChanges(true)
    } else if (isEditMode) {
      const currentValues = form.getFieldsValue()
      const isChanged = JSON.stringify(currentValues) !== JSON.stringify(initialFormValues)
      setHasChanges(isChanged)
    }
  }

  const handleRemoveEditAvatar = () => {
    handleEditAvatarChange(undefined)
  }

  const handleRowClick = (record: Employee) => {
    setSelectedEmployee(record)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setHasChanges(false)
    setEditAvatarFile(null)

    const values = {
      full_name: record.full_name,
      phone: record.phone,
      gender: record.gender,
      address: record.address,
      bank_account: record.bank_account,
      contract_type: record.contract_type,
      base_salary: record.base_salary,
      hire_date: record.hire_date ? dayjs(record.hire_date) : null,
      is_active: record.is_active
    }
    form.setFieldsValue(values)
    setInitialFormValues(values)
  }

  const handleEdit = (record?: Employee) => {
    if (!canManageEmployees) {
      toast.warn("Bạn không có quyền quản lý nhân viên.")
      return
    }
    if (record) {
      setSelectedEmployee(record)
      setIsDetailModalOpen(true)
      const values = {
        full_name: record.full_name,
        phone: record.phone,
        gender: record.gender,
        address: record.address,
        bank_account: record.bank_account,
        contract_type: record.contract_type,
        base_salary: record.base_salary,
        hire_date: record.hire_date ? dayjs(record.hire_date) : null,
        is_active: record.is_active
      }
      form.setFieldsValue(values)
      setInitialFormValues(values)
    }
    setIsEditMode(true)
    setHasChanges(false)
    setEditAvatarFile(null)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setHasChanges(false)
    setEditAvatarFile(null)
    if (initialFormValues) {
      form.setFieldsValue(initialFormValues)
    }
  }

  const handleUpdate = () => {
    if (!canManageEmployees) {
      toast.warn("Bạn không có quyền quản lý nhân viên.")
      return
    }
    form.validateFields().then((values) => {
      const submitValues = {
        ...values,
        hire_date: values.hire_date ? dayjs(values.hire_date).format("YYYY-MM-DD") : undefined
      }
      const cleanedValues = Object.fromEntries(
        Object.entries(submitValues).filter(([_, v]) => v !== null && v !== undefined && v !== "")
      )
      const payload: EmployeeFormInput = cleanedValues as EmployeeFormInput
      if (editAvatarFile) {
        payload.avatar = editAvatarFile
      }
      updateMutation.mutate(payload)
    })
  }

  const handleCreate = () => {
    if (!canManageEmployees) {
      toast.warn("Bạn không có quyền quản lý nhân viên.")
      return
    }
    createForm.validateFields().then((values) => {
      const submitValues = {
        ...values,
        hire_date: values.hire_date ? dayjs(values.hire_date).format("YYYY-MM-DD") : undefined,
        base_salary: values.base_salary?.toString() || "0"
      }
      const payload: EmployeeCreateInput = submitValues as EmployeeCreateInput
      if (createAvatarFile) {
        payload.avatar = createAvatarFile
      }
      createMutation.mutate(payload)
    })
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setIsEditMode(false)
    setSelectedEmployee(null)
    setHasChanges(false)
    setInitialFormValues(null)
    setEditAvatarFile(null)
    form.resetFields()
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setCreateAvatarFile(null)
    createForm.resetFields()
  }

  const handleDelete = (id: string, fullName: string) => {
    if (!canManageEmployees) {
      toast.warn("Bạn không có quyền quản lý nhân viên.")
      return
    }
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa nhân viên "${fullName}"?`,
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
    const params: queryParamConfigEmployee = cleanObject({
      page: "1",
      per_page: queryConfig.per_page || "15",
      full_name: values.full_name,
      is_active: values.is_active === true ? 1 : values.is_active === false ? 0 : undefined,
      contract_type: values.contract_type?.toString(),
      gender: values.gender,
      hire_date_from: values.hire_date_range?.[0] ? dayjs(values.hire_date_range[0]).format("YYYY-MM-DD") : undefined,
      hire_date_to: values.hire_date_range?.[1] ? dayjs(values.hire_date_range[1]).format("YYYY-MM-DD") : undefined,
      role_id: values.role_id
    })

    navigate({
      pathname: path.AdminStaff,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const params = { page: "1", per_page: queryConfig.per_page || "15" }
    navigate({
      pathname: path.AdminStaff,
      search: createSearchParams(params).toString()
    })
    filterForm.resetFields()
  }

  // ========== TABLE COLUMNS ==========
  const columns = [
    {
      title: "Tên nhân viên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Users size={20} className="text-blue-500" />
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
      title: "Vai trò",
      dataIndex: ["user", "role", "name"],
      key: "role",
      render: (_: any, record: Employee) => {
        const roleName = record.user?.role?.name
        return roleName ? <Tag color="purple">{roleName}</Tag> : <i className="text-gray-400">Chưa có</i>
      }
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => text || <i className="text-gray-400">Chưa cập nhật</i>
    },
    {
      title: "Loại hợp đồng",
      dataIndex: "contract_type",
      key: "contract_type",
      render: (type: number) => {
        const contract = CONTRACT_TYPES[type as keyof typeof CONTRACT_TYPES]
        return <Tag color={contract.color}>{contract.label}</Tag>
      }
    },
    {
      title: "Lương cơ bản",
      dataIndex: "base_salary",
      key: "base_salary",
      width: 120,
      render: (salary: string) => <span className="font-medium">{parseFloat(salary).toLocaleString("vi-VN")} đ</span>
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (is_active: boolean) => (
        <Badge status={is_active ? "success" : "error"} text={is_active ? "Hoạt động" : "Ngừng hoạt động"} />
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Employee) => (
        <div className="flex gap-2">
          <Button
            type="link"
            icon={<Eye size={16} />}
            onClick={(e) => {
              e.stopPropagation()
              navigate(path.AdminStaffDetail.replace(":id", record.id))
            }}
          >
          </Button>
          {canManageEmployees && (
            <>
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
              />
            </>
          )}
        </div>
      )
    }
  ]

  // ========== RENDER ==========
  return (
    <div>
      <Helmet>
        <title>Quản lý Nhân viên</title>
      </Helmet>

      <NavigateBack />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Nhân viên</h1>
        <PermissionGate ability={AppAbility.EMPLOYEES_MANAGE}>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              if (!canManageEmployees) {
                toast.warn("Bạn không có quyền quản lý nhân viên.")
                return
              }
              setIsCreateModalOpen(true)
            }}
          >
            Thêm nhân viên
          </Button>
        </PermissionGate>
      </div>

      {/* Filter Form */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <Form form={filterForm} layout="inline" onFinish={handleApplyFilter} className="flex flex-wrap gap-4">
          <Form.Item name="full_name" className="mb-0">
            <Input placeholder="Tên nhân viên..." className="w-48" />
          </Form.Item>

          <Form.Item name="is_active" className="mb-0">
            <Select placeholder="Trạng thái" allowClear style={{ width: 160 }}>
              <Option value={1}>Hoạt động</Option>
              <Option value={0}>Ngừng hoạt động</Option>
            </Select>
          </Form.Item>

          <Form.Item name="contract_type" className="mb-0">
            <Select placeholder="Loại hợp đồng" allowClear className="w-40">
              {Object.entries(CONTRACT_TYPES).map(([value, { label }]) => (
                <Option key={value} value={parseInt(value)}>
                  {label}
                </Option>
              ))}
            </Select>
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

          <Form.Item name="role_id" className="mb-0">
            <Select
              placeholder="Vai trò"
              allowClear
              showSearch
              optionFilterProp="label"
              dropdownStyle={{ width: "auto" }}
            >
              {roleOptions
                .filter((role: { label: string; value: string }) => role.label !== "Customer")
                .map((role: { label: string; value: string }) => (
                  <Option key={role.value} value={role.value} label={role.label}>
                    {role.label}
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
              dataSource={listEmployees}
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
                showTotal: (total) => `Tổng ${total} nhân viên`
              }}
              scroll={{
                y: "calc(100vh - 500px)",
                x: true
              }}
            />
          </div>
        </Fragment>
      )}

      {/* Create Modal */}
      <Modal
        title="Thêm nhân viên mới"
        open={canManageEmployees && isCreateModalOpen}
        onCancel={handleCloseCreateModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseCreateModal}>Hủy</Button>
            <Button type="primary" onClick={handleCreate} loading={createMutation.isPending} disabled={!canManageEmployees}>
              Tạo mới
            </Button>
          </div>
        }
        width={700}
        centered
        styles={{
          body: {
            maxHeight: "calc(100vh - 150px)",
            overflowY: "auto",
            overflowX: "hidden"
          }
        }}
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <Form.Item label="Ảnh đại diện">
            <div className="flex flex-col items-center gap-3">
              <img
                src={createAvatarPreview || defaultAvatar}
                alt="employee avatar preview"
                className="w-24 h-24 rounded-full object-cover border"
              />
              <InputFileImage onChange={handleCreateAvatarChange} />
              {createAvatarFile && (
                <Button size="small" onClick={handleRemoveCreateAvatar}>
                  Bỏ chọn
                </Button>
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Tên nhân viên"
            rules={[
              { required: true, message: "Vui lòng nhập tên!" },
              { min: 2, message: "Tên phải có ít nhất 2 ký tự" }
            ]}
          >
            <Input placeholder="Nhập tên nhân viên" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" }
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ pattern: /^[0-9]{10,11}$/, message: "Số điện thoại phải có 10-11 chữ số" }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Form.Item
              name="password_confirmation"
              label="Xác nhận mật khẩu"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error("Mật khẩu không khớp!"))
                  }
                })
              ]}
            >
              <Input.Password placeholder="Xác nhận mật khẩu" />
            </Form.Item>
          </div>

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
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="contract_type"
              label="Loại hợp đồng"
              rules={[{ required: true, message: "Vui lòng chọn loại hợp đồng!" }]}
            >
              <Select placeholder="Chọn loại hợp đồng">
                {Object.entries(CONTRACT_TYPES).map(([value, { label }]) => (
                  <Option key={value} value={parseInt(value)}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="base_salary"
              label="Lương cơ bản"
              rules={[{ required: true, message: "Vui lòng nhập lương!" }]}
            >
              <InputNumber
                className="w-full"
                placeholder="Nhập lương cơ bản"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, "") : "0") as any}
                min={0}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="hire_date" label="Ngày tuyển dụng">
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>

            <Form.Item name="bank_account" label="Số tài khoản ngân hàng">
              <Input placeholder="Nhập số tài khoản" />
            </Form.Item>
          </div>

          <Form.Item name="role_id" label="Vai trò" rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}>
            <Select placeholder="Chọn vai trò" showSearch optionFilterProp="label">
              {roleOptions.map((role: { label: string; value: string }) => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="is_active" label="Trạng thái" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail/Edit Modal */}
      <Modal
        title={isEditMode ? "Chỉnh sửa Nhân viên" : "Chi tiết Nhân viên"}
        open={isDetailModalOpen}
        onCancel={handleCloseModal}
        footer={
          <div className="flex justify-between items-center">
            <div className="flex justify-end gap-2 flex-1">
              {!isEditMode ? (
                <>
                  <Button onClick={handleCloseModal}>Đóng</Button>
                  {canManageEmployees && (
                    <Button type="primary" icon={<Edit size={16} />} onClick={() => handleEdit()}>
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
                    disabled={!hasChanges || !canManageEmployees}
                  >
                    Cập nhật
                  </Button>
                </>
              )}
            </div>
          </div>
        }
        width={700}
        centered
        styles={{
          body: {
            maxHeight: "calc(100vh - 150px)",
            overflowY: "auto",
            overflowX: "hidden"
          }
        }}
      >
        {isFetchingDetail ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : employeeDetail ? (
          !isEditMode ? (
            // View Mode - Descriptions
            <div>
              <div className="flex flex-col items-center gap-3 mb-4">
                <img
                  src={editAvatarPreview || employeeDetail.user.avatar || defaultAvatar}
                  alt="employee avatar"
                  className="w-24 h-24 rounded-full object-cover border"
                />
              </div>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Tên nhân viên">{employeeDetail.full_name}</Descriptions.Item>
                <Descriptions.Item label="Email">{employeeDetail.user.email}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {employeeDetail.phone || <i className="text-gray-400">Chưa cập nhật</i>}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {employeeDetail.gender
                    ? GENDER_OPTIONS.find((opt) => opt.value === employeeDetail.gender)?.label
                    : "Chưa xác định"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {employeeDetail.address || <i className="text-gray-400">Chưa cập nhật</i>}
                </Descriptions.Item>
                <Descriptions.Item label="Số tài khoản">
                  {employeeDetail.bank_account || <i className="text-gray-400">Chưa cập nhật</i>}
                </Descriptions.Item>
                <Descriptions.Item label="Loại hợp đồng">
                  <Tag color={CONTRACT_TYPES[employeeDetail.contract_type as keyof typeof CONTRACT_TYPES].color}>
                    {CONTRACT_TYPES[employeeDetail.contract_type as keyof typeof CONTRACT_TYPES].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Lương cơ bản">
                  <span className="font-medium">
                    {parseFloat(employeeDetail.base_salary).toLocaleString("vi-VN")} đ
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tuyển dụng">
                  {employeeDetail.hire_date ? (
                    dayjs(employeeDetail.hire_date).format("DD/MM/YYYY")
                  ) : (
                    <i className="text-gray-400">Chưa cập nhật</i>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Badge
                    status={employeeDetail.is_active ? "success" : "error"}
                    text={employeeDetail.is_active ? "Hoạt động" : "Ngừng hoạt động"}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái tài khoản">
                  <Badge
                    status={employeeDetail.user.status === 1 ? "success" : "error"}
                    text={employeeDetail.user.status_label}
                  />
                </Descriptions.Item>

                <Descriptions.Item label="Ngày tạo">
                  {new Date(employeeDetail.created_at).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">
                  {new Date(employeeDetail.updated_at).toLocaleString("vi-VN")}
                </Descriptions.Item>
              </Descriptions>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Tên nhân viên">{employeeDetail.full_name}</Descriptions.Item>
                <Descriptions.Item label="Email">{employeeDetail.user.email}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {employeeDetail.phone || <i className="text-gray-400">Chưa cập nhật</i>}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {employeeDetail.gender
                    ? GENDER_OPTIONS.find((opt) => opt.value === employeeDetail.gender)?.label
                    : "Chưa xác định"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {employeeDetail.address || <i className="text-gray-400">Chưa cập nhật</i>}
                </Descriptions.Item>
                <Descriptions.Item label="Số tài khoản">
                  {employeeDetail.bank_account || <i className="text-gray-400">Chưa cập nhật</i>}
                </Descriptions.Item>
                <Descriptions.Item label="Loại hợp đồng">
                  <Tag color={CONTRACT_TYPES[employeeDetail.contract_type as keyof typeof CONTRACT_TYPES].color}>
                    {CONTRACT_TYPES[employeeDetail.contract_type as keyof typeof CONTRACT_TYPES].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Lương cơ bản">
                  <span className="font-medium">
                    {parseFloat(employeeDetail.base_salary).toLocaleString("vi-VN")} đ
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tuyển dụng">
                  {employeeDetail.hire_date ? (
                    dayjs(employeeDetail.hire_date).format("DD/MM/YYYY")
                  ) : (
                    <i className="text-gray-400">Chưa cập nhật</i>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Badge
                    status={employeeDetail.is_active ? "success" : "error"}
                    text={employeeDetail.is_active ? "Hoạt động" : "Ngừng hoạt động"}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái tài khoản">
                  <Badge
                    status={employeeDetail.user.status === 1 ? "success" : "error"}
                    text={employeeDetail.user.status_label}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {new Date(employeeDetail.created_at).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">
                  {new Date(employeeDetail.updated_at).toLocaleString("vi-VN")}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ) : (
            // Edit Mode - Form
            <Form form={form} layout="vertical" className="mt-4" onValuesChange={() => setHasChanges(true)}>
              <Form.Item label="Ảnh đại diện">
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={editAvatarPreview || employeeDetail.user.avatar || defaultAvatar}
                    alt="employee avatar"
                    className="w-24 h-24 rounded-full object-cover border"
                  />
                  <InputFileImage onChange={handleEditAvatarChange} />
                  {editAvatarFile && (
                    <Button size="small" onClick={handleRemoveEditAvatar}>
                      Bỏ chọn
                    </Button>
                  )}
                </div>
              </Form.Item>

              <Form.Item
                name="full_name"
                label="Tên nhân viên"
                rules={[
                  { required: true, message: "Vui lòng nhập tên!" },
                  { min: 2, message: "Tên phải có ít nhất 2 ký tự" }
                ]}
              >
                <Input placeholder="Nhập tên nhân viên" />
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

              <Form.Item name="bank_account" label="Số tài khoản ngân hàng">
                <Input placeholder="Nhập số tài khoản" />
              </Form.Item>

              <Form.Item name="contract_type" label="Loại hợp đồng">
                <Select placeholder="Chọn loại hợp đồng">
                  {Object.entries(CONTRACT_TYPES).map(([value, { label }]) => (
                    <Option key={value} value={parseInt(value)}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="base_salary" label="Lương cơ bản">
                <Input placeholder="Nhập lương cơ bản" />
              </Form.Item>

              <Form.Item name="hire_date" label="Ngày tuyển dụng">
                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>

              <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
              </Form.Item>
            </Form>
          )
        ) : null}
      </Modal>
    </div>
  )
}
