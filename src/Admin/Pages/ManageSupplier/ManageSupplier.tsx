/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Descriptions, Form, Input, Modal, Select, Space, Spin, Switch, Table, Tag, Collapse } from "antd"
import { ColumnsType } from "antd/es/table"
import { isUndefined, omitBy } from "lodash"
import { Plus, Filter, RotateCcw, Edit, Trash2, Eye, AlertTriangle, Package } from "lucide-react"
import { Fragment, useState, useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { suppliersAPI, ingredientsAPI } from "src/Apis/Admin"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { Supplier, SupplierCreateInput, SupplierFormInput, queryParamConfigSupplier } from "src/Types/supplier.type"
import { PaginatedResponse } from "src/Types/utils.type"
import { AppAbility, useAuthorization } from "src/Authorization"

const { Option } = Select

export default function ManageSupplier() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParams: queryParamConfigSupplier = useQueryParams()

  const queryConfig: queryParamConfigSupplier = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "15",
      name: queryParams.name,
      email: queryParams.email,
      phone: queryParams.phone,
      is_active: queryParams.is_active,
      ingredient_ids: queryParams.ingredient_ids
    },
    isUndefined
  )

  const { can } = useAuthorization()
  const canViewSuppliers = can(AppAbility.SUPPLIERS_VIEW)
  const canManageSuppliers = can(AppAbility.SUPPLIERS_MANAGE)

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listSuppliers", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return suppliersAPI.getList(queryConfig, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: canViewSuppliers
  })

  const paginated = data?.data?.data as PaginatedResponse<Supplier>
  const listSuppliers = paginated?.data || []

  const { data: ingredientsData } = useQuery({
    queryKey: ["listIngredients"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return ingredientsAPI.getList({ per_page: "1000" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000,
    enabled: canViewSuppliers
  })

  const ingredientsList = (ingredientsData?.data?.data as any)?.data || []

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: SupplierCreateInput) => {
      return suppliersAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Thêm nhà cung cấp thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listSuppliers"] })
      setIsModalOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm nhà cung cấp thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: SupplierFormInput) => {
      return suppliersAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật nhà cung cấp thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listSuppliers"] })
      queryClient.invalidateQueries({ queryKey: ["supplierDetail", editingId] })
      setIsModalOpen(false)
      setEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa nhà cung cấp thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listSuppliers"] })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Không thể xóa nhà cung cấp có phiếu nhập kho liên quan"
      toast.error(errorMessage, { autoClose: 2500 })
    }
  })

  // ========== EFFECTS ==========
  useEffect(() => {
    filterForm.setFieldsValue({
      name: queryParams.name,
      email: queryParams.email,
      phone: queryParams.phone,
      is_active: queryParams.is_active,
      ingredient_ids: queryParams.ingredient_ids
    })
  }, [queryParams, filterForm])

  useEffect(() => {
    if (!canManageSuppliers) {
      setIsModalOpen(false)
      setEditingId(null)
      form.resetFields()
    }
  }, [canManageSuppliers, form])

  if (!canViewSuppliers) {
    return null
  }

  // ========== HANDLERS ==========
  const handleOpenModal = (record?: Supplier) => {
    if (!canManageSuppliers) {
      toast.warn("Bạn không có quyền quản lý nhà cung cấp.")
      return
    }
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue({
        name: record.name,
        phone: record.phone,
        contact_person_name: record.contact_person_name,
        contact_person_phone: record.contact_person_phone,
        email: record.email,
        address: record.address,
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
    if (!canManageSuppliers) {
      toast.warn("Bạn không có quyền quản lý nhà cung cấp.")
      return
    }
    try {
      const values = await form.validateFields()
      if (editingId) {
        updateMutation.mutate(values)
      } else {
        createMutation.mutate(values as SupplierCreateInput)
      }
    } catch (error) {
      console.log("Validation Failed:", error)
    }
  }

  const handleDelete = (id: string) => {
    if (!canManageSuppliers) {
      toast.warn("Bạn không có quyền quản lý nhà cung cấp.")
      return
    }
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa nhà cung cấp này? Chỉ có thể xóa nhà cung cấp không có phiếu nhập kho.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const handleRowClick = (record: Supplier) => {
    setSelectedSupplier(record)
    setIsDetailModalOpen(true)
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams)
  }

  const handleApplyFilter = (values: any) => {
    const baseParams = {
      ...queryConfig,
      page: "1",
      name: values.name,
      email: values.email,
      phone: values.phone,
      is_active: values.is_active
    }

    delete baseParams.ingredient_ids

    const params = cleanObject(baseParams)
    const searchParamsObj = new URLSearchParams(params)

    // Add ingredient_ids as array parameters with [] suffix
    if (values.ingredient_ids && Array.isArray(values.ingredient_ids)) {
      values.ingredient_ids.forEach((id: string) => {
        searchParamsObj.append("ingredient_ids[]", id)
      })
    }

    navigate({
      pathname: path.AdminSuppliers,
      search: searchParamsObj.toString()
    })
  }

  const resetFilter = () => {
    const filteredParams = new URLSearchParams()
    if (queryConfig.page) filteredParams.set("page", queryConfig.page)
    if (queryConfig.per_page) filteredParams.set("per_page", queryConfig.per_page)

    navigate({
      pathname: path.AdminSuppliers,
      search: filteredParams.toString()
    })
    filterForm.resetFields()
  }

  // ========== COLUMNS ==========
  const columns: ColumnsType<Supplier> = [
    {
      title: <div className="text-left">Mã</div>,
      dataIndex: "id",
      key: "id",
      width: 120,
      fixed: "left",
      render: (val) => <div className="text-left font-mono text-xs">{val}</div>
    },
    {
      title: <div className="text-left">Tên nhà cung cấp</div>,
      dataIndex: "name",
      key: "name",
      width: 250,
      fixed: "left",
      render: (val, record) => (
        <div className="text-left">
          <div className="font-medium">{val}</div>
          <div className="text-xs text-gray-500">{record.contact_person_name}</div>
        </div>
      )
    },
    {
      title: <div className="text-left">Số điện thoại</div>,
      dataIndex: "phone",
      key: "phone",
      width: 130,
      render: (val) => <div className="text-left">{val || "-"}</div>
    },
    {
      title: <div className="text-left">Email</div>,
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (val) => <div className="text-left">{val || "-"}</div>
    },
    {
      title: <div className="text-left">Địa chỉ</div>,
      dataIndex: "address",
      key: "address",
      width: 250,
      render: (val) => (
        <div className="text-left text-xs" title={val}>
          {val ? (val.length > 50 ? `${val.substring(0, 50)}...` : val) : "-"}
        </div>
      )
    },
    {
      title: <div className="text-center">Trạng thái</div>,
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (val) => (
        <div className="text-center">
          <Tag color={val ? "green" : "red"}>{val ? "Hoạt động" : "Ngừng"}</Tag>
        </div>
      )
    },
    {
      title: <div className="text-center">Ngày tạo</div>,
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (val) => <div className="text-center text-xs">{new Date(val).toLocaleString("vi-VN")}</div>
    },
    {
      title: <div className="text-center">Hành động</div>,
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" className="flex justify-center">
          <Button
            type="link"
            icon={<Eye size={16} />}
            onClick={(e) => {
              e.stopPropagation()
              handleRowClick(record)
            }}
            title="Xem chi tiết"
          />
          {canManageSuppliers && (
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
          )}
        </Space>
      )
    }
  ]

  // Nested table columns for import details
  const detailColumns: ColumnsType<any> = [
    {
      title: <span className="text-sm">Nguyên liệu</span>,
      dataIndex: ["ingredient", "name"],
      key: "ingredient_name",
      render: (val) => <span className="font-medium text-xs">{val}</span>
    },
    {
      title: <span className="text-sm">Đơn vị</span>,
      dataIndex: ["ingredient", "unit"],
      key: "unit",
      width: 80,
      align: "center",
      render: (val) => <span className="text-xs">{val}</span>
    },
    {
      title: <span className="text-sm">Đặt hàng</span>,
      dataIndex: "ordered_quantity",
      key: "ordered_quantity",
      width: 100,
      align: "center",
      render: (val, record) => (
        <span className="text-xs">
          {parseFloat(val).toLocaleString()} {record.ingredient?.unit}
        </span>
      )
    },
    {
      title: <span className="text-sm">Nhận được</span>,
      dataIndex: "received_quantity",
      key: "received_quantity",
      width: 100,
      align: "center",
      render: (val, record) => {
        const ordered = parseFloat(record.ordered_quantity)
        const received = parseFloat(val)
        const isDifferent = ordered !== received
        return (
          <Tag color={isDifferent ? "orange" : "green"} className="text-xs">
            {isDifferent && <AlertTriangle size={12} className="inline mr-1" />}
            {received.toLocaleString()} {record.ingredient?.unit}
          </Tag>
        )
      }
    },
    {
      title: <span className="text-sm">Đơn giá</span>,
      dataIndex: "unit_price",
      key: "unit_price",
      width: 120,
      align: "right",
      render: (val) => <span className="text-xs">{parseFloat(val).toLocaleString("vi-VN")} đ</span>
    },
    {
      title: <span className="text-sm">Thành tiền</span>,
      dataIndex: "total_price",
      key: "total_price",
      width: 130,
      align: "right",
      render: (val) => <span className="font-semibold text-xs">{parseFloat(val).toLocaleString("vi-VN")} đ</span>
    }
  ]

  return (
    <Fragment>
      <Helmet>
        <title>Quản lý nhà cung cấp</title>
        <meta name="description" content="Quản lý thông tin nhà cung cấp và phiếu nhập kho" />
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 my-2 flex items-center gap-2">
        Quản lý nhà cung cấp
      </h1>

      <Spin spinning={isFetching}>
        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <Form form={filterForm} layout="inline" onFinish={handleApplyFilter} className="flex flex-wrap gap-2">
            <Form.Item name="name" className="mb-2">
              <Input placeholder="Tìm theo tên" allowClear style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="phone" className="mb-2">
              <Input placeholder="Số điện thoại" allowClear style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="email" className="mb-2">
              <Input placeholder="Email" allowClear style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="is_active" className="mb-2">
              <Select placeholder="Trạng thái" allowClear style={{ width: 150 }}>
                <Option value="1">Hoạt động</Option>
                <Option value="0">Ngừng</Option>
              </Select>
            </Form.Item>
            <Form.Item name="ingredient_ids" className="mb-2">
              <Select
                mode="multiple"
                placeholder="Lọc theo nguyên liệu"
                allowClear
                style={{ minWidth: 250, maxWidth: 400 }}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={ingredientsList.map((ing: any) => ({
                  value: ing.id,
                  label: `${ing.name} (${ing.unit})`
                }))}
                maxTagCount="responsive"
              />
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
            Tổng số: <span className="font-semibold">{paginated?.total || 0}</span> nhà cung cấp
          </div>
          {canManageSuppliers && (
            <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
              Thêm nhà cung cấp
            </Button>
          )}
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={listSuppliers}
          rowKey="id"
          scroll={{ x: 1500, y: "calc(100vh - 400px)" }}
          pagination={{
            current: Number(queryConfig.page),
            pageSize: Number(queryConfig.per_page),
            total: paginated?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhà cung cấp`,
            onChange: handlePaginationChange
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            className: "cursor-pointer hover:bg-gray-50"
          })}
        />
      </Spin>

      {/* Create/Edit Modal */}
      <Modal
        title={<span className="text-base">{editingId ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}</span>}
        open={isModalOpen && canManageSuppliers}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        okText={editingId ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        width={700}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: !canManageSuppliers }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            paddingTop: "16px"
          }
        }}
        style={{ top: 50 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={<span className="text-sm">Tên nhà cung cấp</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên nhà cung cấp" }]}
          >
            <Input placeholder="VD: Công Ty Thực Phẩm ABC" className="text-sm" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label={<span className="text-sm">Số điện thoại</span>}>
              <Input placeholder="0901234567" className="text-sm" />
            </Form.Item>

            <Form.Item name="email" label={<span className="text-sm">Email</span>}>
              <Input type="email" placeholder="contact@company.com" className="text-sm" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="contact_person_name" label={<span className="text-sm">Tên người liên hệ</span>}>
              <Input placeholder="Nguyễn Văn A" className="text-sm" />
            </Form.Item>

            <Form.Item name="contact_person_phone" label={<span className="text-sm">SĐT người liên hệ</span>}>
              <Input placeholder="0901234567" className="text-sm" />
            </Form.Item>
          </div>

          <Form.Item name="address" label={<span className="text-sm">Địa chỉ</span>}>
            <Input.TextArea rows={3} placeholder="123 Đường ABC, Quận XYZ, TP. HCM" className="text-sm" />
          </Form.Item>

          <Form.Item name="is_active" label={<span className="text-sm">Trạng thái</span>} valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={<span className="text-base">Chi tiết nhà cung cấp</span>}
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false)
          setSelectedSupplier(null)
        }}
        style={{ top: 40 }}
        footer={
          canManageSuppliers
            ? [
                <Button
                  key="close"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedSupplier(null)
                  }}
                >
                  Đóng
                </Button>,
                <Button
                  key="edit"
                  type="primary"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    if (selectedSupplier) {
                      handleOpenModal(selectedSupplier)
                    }
                  }}
                >
                  Chỉnh sửa
                </Button>
              ]
            : [
                <Button
                  key="close"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedSupplier(null)
                  }}
                >
                  Đóng
                </Button>
              ]
        }
        width={1100}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            paddingTop: "16px"
          }
        }}
      >
        <Spin spinning={false}>
          {selectedSupplier && (
            <div>
              {/* Basic Information */}
              <Descriptions bordered column={2} size="small" className="mb-6">
                <Descriptions.Item label={<span className="text-sm">Mã</span>} span={2}>
                  <span className="font-mono text-sm">{selectedSupplier.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Tên nhà cung cấp</span>} span={2}>
                  <span className="font-semibold text-sm">{selectedSupplier.name}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Số điện thoại</span>}>
                  <span className="text-sm">{selectedSupplier.phone || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Email</span>}>
                  <span className="text-sm">{selectedSupplier.email || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Người liên hệ</span>}>
                  <span className="text-sm">{selectedSupplier.contact_person_name || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">SĐT người liên hệ</span>}>
                  <span className="text-sm">{selectedSupplier.contact_person_phone || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Địa chỉ</span>} span={2}>
                  <span className="text-sm">{selectedSupplier.address || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Trạng thái</span>}>
                  <Tag color={selectedSupplier.is_active ? "green" : "red"} className="text-sm">
                    {selectedSupplier.is_active ? "Hoạt động" : "Ngừng"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày tạo</span>}>
                  <span className="text-sm">{new Date(selectedSupplier.created_at).toLocaleString("vi-VN")}</span>
                </Descriptions.Item>
              </Descriptions>

              {/* Stock Imports Section */}
              {selectedSupplier.stock_imports && selectedSupplier.stock_imports.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-base font-semibold mb-3 text-gray-700 flex items-center gap-2">
                    <Package size={18} />
                    Lịch sử nhập kho ({selectedSupplier.stock_imports.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Collapse
                      accordion
                      className="bg-white"
                      items={selectedSupplier.stock_imports.map((stockImport: any, index: number) => ({
                        key: stockImport.id,
                        label: (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">
                              #{index + 1} - Phiếu {stockImport.id}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {new Date(stockImport.import_date).toLocaleDateString("vi-VN")}
                              </span>
                              <span className="font-semibold text-sm text-green-600">
                                {parseFloat(stockImport.total_amount).toLocaleString("vi-VN")} đ
                              </span>
                            </div>
                          </div>
                        ),
                        children: (
                          <div>
                            <Table
                              dataSource={stockImport.details}
                              columns={detailColumns}
                              rowKey="id"
                              pagination={false}
                              size="small"
                              scroll={{ x: 800 }}
                              summary={(data) => {
                                const total = data.reduce((sum, item) => sum + parseFloat(item.total_price), 0)
                                return (
                                  <Table.Summary fixed>
                                    <Table.Summary.Row>
                                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                                        <span className="font-semibold text-sm">Tổng cộng:</span>
                                      </Table.Summary.Cell>
                                      <Table.Summary.Cell index={1} align="right">
                                        <span className="font-bold text-sm text-green-600">
                                          {total.toLocaleString("vi-VN")} đ
                                        </span>
                                      </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                  </Table.Summary>
                                )
                              }}
                            />
                          </div>
                        )
                      }))}
                    />
                  </div>
                </div>
              )}

              {(!selectedSupplier.stock_imports || selectedSupplier.stock_imports.length === 0) && (
                <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Chưa có phiếu nhập kho nào</p>
                </div>
              )}
            </div>
          )}
        </Spin>
      </Modal>
    </Fragment>
  )
}
