/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Descriptions, Form, Input, Modal, Space, Spin, Switch, Table, Tag } from "antd"
import { ColumnsType } from "antd/es/table"
import { isUndefined, omit, omitBy } from "lodash"
import { Plus, Filter, RotateCcw, Edit, Trash2, Eye, AlertTriangle } from "lucide-react"
import { Fragment, useEffect, useState } from "react"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { ingredientCategoriesAPI } from "src/Apis/Admin"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import {
  IngredientCategory,
  IngredientCategoryCreateInput,
  IngredientCategoryFormInput,
  queryParamConfigIngredientCategory
} from "src/Types/ingredientCategory.type"
import { PaginatedResponse } from "src/Types/utils.type"
import { AppAbility, PermissionGate, useAuthorization } from "src/Authorization"

export default function IngredientCategoryListTab() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParams: queryParamConfigIngredientCategory = useQueryParams()
  const { can } = useAuthorization()
  const canManageIngredients = can(AppAbility.INGREDIENTS_MANAGE)

  const queryConfig: queryParamConfigIngredientCategory = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "15",
      search: queryParams.search,
      is_active: queryParams.is_active
    },
    isUndefined
  )

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== HELPER ==========
  const isLowStock = (current: string, minimum: string) => {
    return parseFloat(current) <= parseFloat(minimum)
  }

  useEffect(() => {
    if (!canManageIngredients) {
      setIsModalOpen(false)
      setEditingId(null)
    }
  }, [canManageIngredients])

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listIngredientCategories", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return ingredientCategoriesAPI.getList(queryConfig, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data?.data as PaginatedResponse<IngredientCategory>
  const listCategories = paginated?.data || []

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: IngredientCategoryCreateInput) => {
      return ingredientCategoriesAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Thêm danh mục thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listIngredientCategories"] })
      queryClient.invalidateQueries({ queryKey: ["ingredient-categories-select"] })
      setIsModalOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm danh mục thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: IngredientCategoryFormInput) => {
      return ingredientCategoriesAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật danh mục thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listIngredientCategories"] })
      queryClient.invalidateQueries({ queryKey: ["ingredient-categories-select"] })
      setIsModalOpen(false)
      setEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ingredientCategoriesAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa danh mục thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listIngredientCategories"] })
      queryClient.invalidateQueries({ queryKey: ["ingredient-categories-select"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể xóa danh mục có nguyên liệu", { autoClose: 2000 })
    }
  })

  // ========== HANDLERS ==========
  const handleOpenModal = (record?: IngredientCategory) => {
    if (!canManageIngredients) {
      toast.warn("Bạn không có quyền quản lý nguyên liệu.")
      return
    }
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue({
        name: record.name,
        is_active: record.is_active
      })
    } else {
      setEditingId(null)
      form.resetFields()
      form.setFieldsValue({ is_active: true })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!canManageIngredients) {
      toast.warn("Bạn không có quyền quản lý nguyên liệu.")
      return
    }
    try {
      const values = await form.validateFields()
      if (editingId) {
        updateMutation.mutate(values)
      } else {
        createMutation.mutate(values as IngredientCategoryCreateInput)
      }
    } catch (error) {
      console.log("Validation Failed:", error)
    }
  }

  const handleDelete = (id: string) => {
    if (!canManageIngredients) {
      toast.warn("Bạn không có quyền quản lý nguyên liệu.")
      return
    }
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa danh mục này? Chỉ có thể xóa danh mục không có nguyên liệu.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const handleRowClick = (record: IngredientCategory) => {
    setSelectedCategory(record)
    setIsDetailModalOpen(true)
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams)
  }

  const handleApplyFilter = (values: any) => {
    const params = cleanObject({
      ...queryConfig,
      page: "1",
      search: values.search,
      is_active: values.is_active
    })
    navigate({
      pathname: path.AdminIngredients,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilter = () => {
    const filteredSearch = omit(queryConfig, ["search", "is_active"])
    navigate({
      pathname: path.AdminIngredients,
      search: createSearchParams(filteredSearch).toString()
    })
    filterForm.resetFields()
  }

  // ========== COLUMNS ==========
  const columns: ColumnsType<IngredientCategory> = [
    {
      title: <div className="text-left">Mã</div>,
      dataIndex: "id",
      key: "id",
      width: 120,
      fixed: "left",
      render: (val) => <div className="text-left font-mono text-sm">{val}</div>
    },
    {
      title: <div className="text-left">Tên danh mục</div>,
      dataIndex: "name",
      key: "name",
      render: (val) => <div className="text-left font-medium text-sm">{val}</div>
    },
    {
      title: <div className="text-left">Số nguyên liệu</div>,
      dataIndex: "ingredients_count",
      key: "ingredients_count",
      width: 150,
      align: "center",
      render: (val) => (
        <Tag color="blue" className="text-sm">
          {val}
        </Tag>
      )
    },
    {
      title: <div className="text-left">Trạng thái</div>,
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      align: "center",
      render: (val) => <Tag color={val ? "green" : "red"}>{val ? "Hoạt động" : "Ngừng"}</Tag>
    },
    {
      title: <div className="text-left">Ngày tạo</div>,
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (val) => <div className="text-left text-sm">{new Date(val).toLocaleString("vi-VN")}</div>
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<Eye size={16} />}
            onClick={(e) => {
              e.stopPropagation()
              handleRowClick(record)
            }}
            title="Xem chi tiết"
          />
          {canManageIngredients ? (
            <>
              <Button
                type="link"
                icon={<Edit size={16} />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenModal(record)
                }}
                title="Chỉnh sửa"
              />
              <Button
                danger
                type="link"
                icon={<Trash2 size={16} />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(record.id)
                }}
                title="Xóa"
              />
            </>
          ) : null}
        </Space>
      )
    }
  ]

  return (
    <Fragment>
      <Spin spinning={isFetching}>
        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <Form form={filterForm} layout="inline" onFinish={handleApplyFilter} className="flex flex-wrap gap-2">
            <Form.Item name="search" className="mb-2">
              <Input placeholder="Tìm kiếm theo tên" allowClear style={{ width: 250 }} />
            </Form.Item>
            <Form.Item name="is_active" className="mb-2">
              <Input placeholder="Trạng thái (1: Hoạt động, 0: Ngừng)" allowClear style={{ width: 250 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<Filter size={16} />} className="mb-2">
              Lọc
            </Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetFilter} className="mb-2">
              Đặt lại
            </Button>
          </Form>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Tổng số: <span className="font-semibold">{paginated?.total || 0}</span> danh mục
          </div>
          <PermissionGate ability={AppAbility.INGREDIENTS_MANAGE}>
            <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
              Thêm danh mục
            </Button>
          </PermissionGate>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={listCategories}
          rowKey="id"
          scroll={{ x: 1200, y: "calc(100vh - 400px)" }}
          pagination={{
            current: Number(queryConfig.page),
            pageSize: Number(queryConfig.per_page),
            total: paginated?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} danh mục`,
            onChange: handlePaginationChange
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" }
          })}
        />
      </Spin>

      {/* Create/Edit Modal */}
      <Modal
        title={<span className="text-base">{editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}</span>}
        open={canManageIngredients && isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        okText={editingId ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        width={550}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: !canManageIngredients }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            paddingTop: "16px"
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={<span className="text-sm">Tên danh mục</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
          >
            <Input placeholder="VD: Rau củ & Thảo mộc" className="text-sm" />
          </Form.Item>

          <Form.Item name="is_active" label={<span className="text-sm">Trạng thái</span>} valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={<span className="text-base">Chi tiết danh mục nguyên liệu</span>}
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false)
          setSelectedCategory(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedCategory(null)
            }}
          >
            Đóng
          </Button>,
          canManageIngredients ? (
            <Button
              key="edit"
              type="primary"
              onClick={() => {
                setIsDetailModalOpen(false)
                handleOpenModal(selectedCategory!)
              }}
            >
              Chỉnh sửa
            </Button>
          ) : null
        ]}
        width={900}
        styles={{
          body: {
            maxHeight: "calc(100vh - 250px)",
            overflowY: "auto",
            overflowX: "hidden"
          }
        }}
      >
        {selectedCategory && (
          <div>
            <Descriptions bordered column={2} size="small" className="mb-6">
              <Descriptions.Item label={<span className="text-sm">Mã</span>} span={2}>
                <span className="font-mono text-sm">{selectedCategory.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-sm">Tên danh mục</span>} span={2}>
                <span className="font-semibold text-sm">{selectedCategory.name}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-sm">Số nguyên liệu</span>}>
                <Tag color="blue" className="text-sm">
                  {selectedCategory.ingredients_count}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-sm">Trạng thái</span>}>
                <Tag color={selectedCategory.is_active ? "green" : "red"} className="text-sm">
                  {selectedCategory.is_active ? "Hoạt động" : "Ngừng"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-sm">Ngày tạo</span>}>
                <span className="text-sm">{new Date(selectedCategory.created_at).toLocaleString("vi-VN")}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-sm">Cập nhật lần cuối</span>}>
                <span className="text-sm">{new Date(selectedCategory.updated_at).toLocaleString("vi-VN")}</span>
              </Descriptions.Item>
            </Descriptions>

            {selectedCategory.ingredients && selectedCategory.ingredients.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-3 text-gray-700">
                  Danh sách nguyên liệu ({selectedCategory.ingredients.length})
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Table
                    dataSource={selectedCategory.ingredients}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{
                      y: 350,
                      x: true
                    }}
                    columns={[
                      {
                        title: <span className="text-sm">Tên</span>,
                        dataIndex: "name",
                        key: "name",
                        render: (val) => <span className="font-medium text-sm">{val}</span>
                      },
                      {
                        title: <span className="text-sm">Đơn vị</span>,
                        dataIndex: "unit",
                        key: "unit",
                        width: 100,
                        align: "center",
                        render: (val) => <span className="text-sm">{val}</span>
                      },
                      {
                        title: <span className="text-sm">Tồn kho</span>,
                        dataIndex: "current_stock",
                        key: "current_stock",
                        width: 150,
                        align: "center",
                        render: (val, record) => {
                          const low = isLowStock(val, record.min_stock)
                          return (
                            <Tag
                              color={low ? "red" : "green"}
                              className="flex items-center justify-center gap-1 w-fit mx-auto text-sm"
                            >
                              {low && <AlertTriangle size={12} />}
                              <span className="text-sm">
                                {parseFloat(val).toLocaleString()} {record.unit}
                              </span>
                            </Tag>
                          )
                        }
                      },
                      {
                        title: <span className="text-sm">Tối thiểu</span>,
                        dataIndex: "min_stock",
                        key: "min_stock",
                        width: 110,
                        align: "center",
                        render: (val, record) => (
                          <span className="text-sm">
                            {parseFloat(val).toLocaleString()} {record.unit}
                          </span>
                        )
                      },
                      {
                        title: <span className="text-sm">Trạng thái</span>,
                        dataIndex: "is_active",
                        key: "is_active",
                        width: 110,
                        align: "center",
                        render: (val) => (
                          <Tag color={val ? "green" : "red"} className="text-sm">
                            {val ? "Hoạt động" : "Ngừng"}
                          </Tag>
                        )
                      }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Fragment>
  )
}
