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
  Switch,
  Card,
  Space,
  Divider,
  Tooltip
} from "antd"
import { isUndefined, omitBy } from "lodash"
import { Shield, Edit, Trash2, Plus, Filter, RotateCcw, Eye, Grid } from "lucide-react"
import { Fragment, useState } from "react"
import { Helmet } from "react-helmet-async"
import { toast } from "react-toastify"
import { createSearchParams, useNavigate } from "react-router-dom"
import type { ColumnsType } from "antd/es/table"

import NavigateBack from "src/Admin/Components/NavigateBack"
import { rolesAPI, permissionsAPI } from "src/Apis/Admin"
import { cleanObject } from "src/Helpers/common"
import { path } from "src/Constants/path"
import useQueryParams from "src/Hook/useQueryParams"
import { PaginatedResponse } from "src/Types/utils.type"
import { Role, queryParamConfigRole } from "src/Types/user.type"
import { Permission } from "src/Types/permissions.type"

const { Option } = Select
const { TextArea } = Input

export default function ManageRoles() {
  const queryConfig: queryParamConfigRole = useQueryParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // ========== STATE ==========
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== QUERY ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listRoles", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const params = omitBy(
        {
          page: queryConfig.page || "1",
          per_page: queryConfig.per_page || "15",
          name: queryConfig.name,
          is_active: queryConfig.is_active
        },
        isUndefined
      )

      return rolesAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data?.data as PaginatedResponse<Role>
  const listRoles = paginated?.data || []

  // Get all permissions for create/edit
  const { data: permissionsData } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: () => permissionsAPI.getList({ per_page: "99" }),
    staleTime: 5 * 60 * 1000
  })

  const allPermissions = permissionsData?.data?.data?.data || []

  // Get role detail with permissions
  const { data: roleDetailData, isFetching: roleDetailLoading } = useQuery({
    queryKey: ["role-detail", selectedRole?.id],
    queryFn: () => {
      if (!selectedRole?.id) return Promise.reject("No role selected")
      return rolesAPI.getDetail(selectedRole.id)
    },
    enabled: !!selectedRole?.id && (isDetailModalOpen || isEditModalOpen),
    staleTime: 3 * 60 * 1000
  })

  const roleDetail = roleDetailData?.data?.data

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (body: { name: string; description?: string; is_active?: boolean; permission_ids?: string[] }) => {
      return rolesAPI.create(body)
    },
    onSuccess: () => {
      toast.success("Tạo vai trò thành công!")
      queryClient.invalidateQueries({ queryKey: ["listRoles"] })
      queryClient.invalidateQueries({ queryKey: ["roles-matrix"] })
      setIsCreateModalOpen(false)
      createForm.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Tạo vai trò thất bại!")
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; is_active?: boolean } }) => {
      return rolesAPI.update(id, data)
    },
    onSuccess: () => {
      toast.success("Cập nhật vai trò thành công!")
      queryClient.invalidateQueries({ queryKey: ["listRoles"] })
      queryClient.invalidateQueries({ queryKey: ["role-detail"] })
      queryClient.invalidateQueries({ queryKey: ["roles-matrix"] })
      setIsEditModalOpen(false)
      editForm.resetFields()
      setSelectedRole(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật vai trò thất bại!")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return rolesAPI.delete(id)
    },
    onSuccess: () => {
      toast.success("Xóa vai trò thành công!")
      queryClient.invalidateQueries({ queryKey: ["listRoles"] })
      queryClient.invalidateQueries({ queryKey: ["roles-matrix"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa vai trò thất bại!")
    }
  })

  const syncPermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      return rolesAPI.syncPermissions(roleId, permissionIds)
    },
    onSuccess: () => {
      toast.success("Cập nhật quyền thành công!")
      queryClient.invalidateQueries({ queryKey: ["listRoles"] })
      queryClient.invalidateQueries({ queryKey: ["role-detail"] })
      queryClient.invalidateQueries({ queryKey: ["roles-matrix"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật quyền thất bại!")
    }
  })

  // ========== HANDLERS ==========
  const handleView = (role: Role) => {
    setSelectedRole(role)
    setIsDetailModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setIsEditModalOpen(true)
  }

  const handleDelete = (role: Role) => {
    Modal.confirm({
      title: "Xác nhận xóa vai trò",
      content: `Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutation.mutate(role.id)
      }
    })
  }

  const handleCreate = (values: any) => {
    const body = {
      name: values.name,
      description: values.description,
      is_active: values.is_active ?? true,
      permission_ids: values.permission_ids || []
    }
    createMutation.mutate(body)
  }

  const handleUpdate = (values: any) => {
    if (!selectedRole) return

    const body = cleanObject({
      name: values.name,
      description: values.description,
      is_active: values.is_active
    })

    updateMutation.mutate({ id: selectedRole.id, data: body })

    // Update permissions separately if changed
    if (values.permission_ids) {
      syncPermissionsMutation.mutate({
        roleId: selectedRole.id,
        permissionIds: values.permission_ids
      })
    }
  }

  const handleApplyFilter = (values: any) => {
    const params = cleanObject({
      page: "1",
      per_page: queryConfig.per_page || "15",
      name: values.name?.trim(),
      is_active: values.is_active
    }) as queryParamConfigRole

    navigate({
      pathname: path.AdminRoles,
      search: createSearchParams(params as Record<string, string>).toString()
    })
  }

  const handleResetFilter = () => {
    filterForm.resetFields()
    navigate({
      pathname: path.AdminRoles,
      search: createSearchParams({ page: "1", per_page: queryConfig.per_page || "15" }).toString()
    })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    const params = cleanObject({
      page: page.toString(),
      per_page: pageSize.toString(),
      name: queryConfig.name,
      is_active: queryConfig.is_active
    }) as queryParamConfigRole

    navigate({
      pathname: path.AdminRoles,
      search: createSearchParams(params as Record<string, string>).toString()
    })
  }

  // ========== COLUMNS ==========
  const columns: ColumnsType<Role> = [
    {
      title: "Tên vai trò",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text: string, record: Role) => (
        <Tooltip
          title={
            <div>
              <div className="font-semibold mb-1">{text}</div>
              {record.description && <div className="text-xs text-gray-300">{record.description}</div>}
            </div>
          }
          placement="topLeft"
        >
          <div className="flex flex-col gap-1 cursor-help">
            <span className="font-semibold">{text}</span>
          </div>
        </Tooltip>
      )
    },
    {
      title: "Số quyền",
      dataIndex: "permissions",
      key: "permissions_count",
      width: 120,
      align: "center",
      render: (permissions: Permission[]) => <Tag color="blue">{permissions?.length || 0} quyền</Tag>
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 150,
      align: "center",
      render: (isActive: boolean) => (
        <Badge status={isActive ? "success" : "error"} text={isActive ? "Hoạt động" : "Không hoạt động"} />
      )
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN")
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_: any, record: Role) => (
        <Space size="small">
          <Button type="link" icon={<Eye size={16} />} onClick={() => handleView(record)}>
          </Button>
          <Button type="link" icon={<Edit size={16} />} onClick={() => handleEdit(record)}>
          </Button>
          <Button type="link" danger icon={<Trash2 size={16} />} onClick={() => handleDelete(record)}>
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Fragment>
      <Helmet>
        <title>Quản lý Vai trò | Restaurant Management</title>
        <meta name="description" content="Quản lý vai trò và phân quyền trong hệ thống" />
      </Helmet>

      <div className="p-6">
        <NavigateBack />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Quản lý Vai trò</h1>
          </div>

          <Space>
            <Button type="default" icon={<Grid size={16} />} onClick={() => navigate("/admin/permission-matrix")}>
              Ma trận Phân quyền
            </Button>
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
              Thêm vai trò
            </Button>
          </Space>
        </div>

        {/* Filter Section */}
        <Card
          className="mb-4 bg-white border-none rounded-xl shadow-sm 
             [&_.ant-card-body]:!p-4"
        >
          <Form
            form={filterForm}
            layout="inline"
            onFinish={handleApplyFilter}
            className="flex flex-wrap items-center gap-3"
          >
            {/* Ô nhập tên vai trò */}
            <Form.Item name="name" className="mb-0">
              <Input placeholder="Tên vai trò..." allowClear className="w-52" />
            </Form.Item>

            {/* Select trạng thái */}
            <Form.Item name="is_active" className="mb-0">
              <Select placeholder="Trạng thái" allowClear className="w-40">
                <Option value="1">Hoạt động</Option>
                <Option value="0">Không hoạt động</Option>
              </Select>
            </Form.Item>

            {/* Nút lọc */}
            <Form.Item className="mb-0">
              <Button type="primary" htmlType="submit" icon={<Filter size={16} />}>
                Lọc
              </Button>
            </Form.Item>

            {/* Nút reset */}
            <Form.Item className="mb-0">
              <Button icon={<RotateCcw size={16} />} onClick={handleResetFilter}>
                Reset
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Table */}
        <Card
          className="bg-white border-none rounded-xl shadow-sm 
             [&_.ant-card-body]:!p-0"
        >
          <Table
            columns={columns}
            dataSource={listRoles}
            rowKey="id"
            loading={isFetching}
            pagination={{
              current: Number(queryConfig.page) || 1,
              pageSize: Number(queryConfig.per_page) || 15,
              total: paginated?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} vai trò`,
              onChange: handlePaginationChange
            }}
            scroll={{
              y: "calc(100vh - 400px)",
              x: true
            }}
          />
        </Card>

        {/* Create Modal */}
        <Modal
          title="Thêm vai trò mới"
          open={isCreateModalOpen}
          onCancel={() => {
            setIsCreateModalOpen(false)
            createForm.resetFields()
          }}
          footer={null}
          width={700}
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="name"
              label="Tên vai trò"
              rules={[{ required: true, message: "Vui lòng nhập tên vai trò" }]}
            >
              <Input placeholder="VD: Quản lý kho" />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={3} placeholder="Mô tả vai trò..." />
            </Form.Item>

            <Form.Item name="permission_ids" label="Quyền hạn">
              <Select
                mode="multiple"
                placeholder="Chọn quyền cho vai trò"
                showSearch
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                options={allPermissions.map((p) => ({
                  label: `${p.name} (${p.code})`,
                  value: p.id
                }))}
              />
            </Form.Item>

            <Form.Item name="is_active" label="Trạng thái" valuePropName="checked" initialValue={true}>
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
            </Form.Item>

            <Form.Item className="mb-0">
              <Space className="w-full justify-end">
                <Button
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    createForm.resetFields()
                  }}
                >
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                  Tạo vai trò
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Chỉnh sửa vai trò"
          open={isEditModalOpen}
          onCancel={() => {
            setIsEditModalOpen(false)
            editForm.resetFields()
            setSelectedRole(null)
          }}
          footer={null}
          width={700}
        >
          {roleDetailLoading ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : (
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleUpdate}
              initialValues={{
                name: roleDetail?.name,
                description: roleDetail?.description,
                is_active: roleDetail?.is_active,
                permission_ids: roleDetail?.permissions?.map((p) => p.id) || []
              }}
            >
              <Form.Item
                name="name"
                label="Tên vai trò"
                rules={[{ required: true, message: "Vui lòng nhập tên vai trò" }]}
              >
                <Input placeholder="VD: Quản lý kho" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả">
                <TextArea rows={3} placeholder="Mô tả vai trò..." />
              </Form.Item>

              <Form.Item name="permission_ids" label="Quyền hạn">
                <Select
                  mode="multiple"
                  placeholder="Chọn quyền cho vai trò"
                  showSearch
                  filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  options={allPermissions.map((p) => ({
                    label: `${p.name} (${p.code})`,
                    value: p.id
                  }))}
                />
              </Form.Item>

              <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
              </Form.Item>

              <Form.Item className="mb-0">
                <Space className="w-full justify-end">
                  <Button
                    onClick={() => {
                      setIsEditModalOpen(false)
                      editForm.resetFields()
                      setSelectedRole(null)
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updateMutation.isPending || syncPermissionsMutation.isPending}
                  >
                    Cập nhật
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </Modal>

        {/* Detail Modal */}
        <Modal
          title="Chi tiết vai trò"
          open={isDetailModalOpen}
          onCancel={() => {
            setIsDetailModalOpen(false)
            setSelectedRole(null)
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setIsDetailModalOpen(false)
                setSelectedRole(null)
              }}
            >
              Đóng
            </Button>
          ]}
          width={700}
          bodyStyle={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: 12
          }}
        >
          {roleDetailLoading ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : (
            <div>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Tên vai trò">{roleDetail?.name}</Descriptions.Item>
                <Descriptions.Item label="Mô tả">{roleDetail?.description || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Badge
                    status={roleDetail?.is_active ? "success" : "error"}
                    text={roleDetail?.is_active ? "Hoạt động" : "Không hoạt động"}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {roleDetail?.created_at ? new Date(roleDetail.created_at).toLocaleString("vi-VN") : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật cuối">
                  {roleDetail?.updated_at ? new Date(roleDetail.updated_at).toLocaleString("vi-VN") : "N/A"}
                </Descriptions.Item>
              </Descriptions>

              <Divider>Quyền hạn ({roleDetail?.permissions?.length || 0})</Divider>

              <div className="space-y-2">
                {roleDetail?.permissions && roleDetail.permissions.length > 0 ? (
                  roleDetail.permissions.map((permission) => (
                    <Card key={permission.id} size="small">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.code}</div>
                          {permission.description && (
                            <div className="text-xs text-gray-400 mt-1">{permission.description}</div>
                          )}
                        </div>
                        <Badge
                          status={permission.is_active ? "success" : "error"}
                          text={permission.is_active ? "Hoạt động" : "Không hoạt động"}
                        />
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-4">Vai trò chưa có quyền nào</div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Fragment>
  )
}
