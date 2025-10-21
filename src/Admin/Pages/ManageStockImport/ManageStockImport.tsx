/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, DatePicker, Descriptions, Form, InputNumber, Modal, Select, Space, Spin, Table, Tag } from "antd"
import type { InputNumberProps } from "antd"
import { ColumnsType } from "antd/es/table"
import { isUndefined, omitBy } from "lodash"
import { Plus, Filter, RotateCcw, Edit, Trash2, Eye, AlertTriangle, Minus } from "lucide-react"
import { Fragment, useState, useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { stockImportsAPI, suppliersAPI, ingredientsAPI } from "src/Apis/Admin"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import {
  StockImport,
  StockImportCreateInput,
  StockImportFormInput,
  queryParamConfigStockImport
} from "src/Types/stockImport.type"
import { PaginatedResponse } from "src/Types/utils.type"
import dayjs from "dayjs"
import { AppAbility, useAuthorization } from "src/Authorization"

const { Option } = Select
const { RangePicker } = DatePicker

export default function ManageStockImport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParams: queryParamConfigStockImport = useQueryParams()

  const queryConfig: queryParamConfigStockImport = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "15",
      date_from: queryParams.date_from,
      date_to: queryParams.date_to,
      supplier_id: queryParams.supplier_id
    },
    isUndefined
  )

  const { can } = useAuthorization()
  const canViewWarehouseImport = can(AppAbility.WAREHOUSE_IMPORT_VIEW)
  const canManageWarehouseImport = can(AppAbility.WAREHOUSE_IMPORT_MANAGE)

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedStockImport, setSelectedStockImport] = useState<StockImport | null>(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const watchedDetails = Form.useWatch("details", form)
  const parseNumericInput: NonNullable<InputNumberProps<number>["parser"]> = (value) => {
    if (!value) return 0
    const normalized = value.replace(/\s/g, "").replace(/,/g, "")
    const parsed = Number(normalized)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listStockImports", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return stockImportsAPI.getList(queryConfig, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: canViewWarehouseImport
  })

  const paginated = data?.data?.data as PaginatedResponse<StockImport>
  const listStockImports = paginated?.data || []

  // Get list of suppliers for filter and form
  const { data: suppliersData } = useQuery({
    queryKey: ["listSuppliers"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return suppliersAPI.getList({ per_page: "1000" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000,
    enabled: canViewWarehouseImport
  })

  const suppliersList = (suppliersData?.data?.data as any)?.data || []

  // Get list of ingredients for form
  const { data: ingredientsData } = useQuery({
    queryKey: ["listIngredients"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return ingredientsAPI.getList({ per_page: "1000" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000,
    enabled: canManageWarehouseImport
  })

  const ingredientsList = (ingredientsData?.data?.data as any)?.data || []

  // Get detail when opening detail modal
  const { data: detailData, isFetching: isFetchingDetail } = useQuery({
    queryKey: ["stockImportDetail", selectedStockImport?.id],
    queryFn: () => stockImportsAPI.getDetail(selectedStockImport?.id as string),
    enabled: !!selectedStockImport?.id && isDetailModalOpen && canViewWarehouseImport,
    staleTime: 2 * 60 * 1000
  })

  const stockImportDetail = (detailData?.data?.data as StockImport) || selectedStockImport

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: StockImportCreateInput) => {
      return stockImportsAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Thêm phiếu nhập kho thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockImports"] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] }) // Refresh stock
      setIsModalOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm phiếu nhập kho thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: StockImportFormInput) => {
      return stockImportsAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật phiếu nhập kho thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockImports"] })
      queryClient.invalidateQueries({ queryKey: ["stockImportDetail", editingId] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
      setIsModalOpen(false)
      setEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockImportsAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa phiếu nhập kho thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockImports"] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Không thể xóa phiếu nhập kho"
      toast.error(errorMessage, { autoClose: 2500 })
    }
  })

  // ========== EFFECTS ==========
  // Set filter form values from URL params
  useEffect(() => {
    const dateRange =
      queryParams.date_from && queryParams.date_to
        ? [dayjs(queryParams.date_from), dayjs(queryParams.date_to)]
        : undefined

    filterForm.setFieldsValue({
      date_range: dateRange,
      supplier_id: queryParams.supplier_id
    })
  }, [queryParams, filterForm])

  useEffect(() => {
    if (!canManageWarehouseImport) {
      setIsModalOpen(false)
      setEditingId(null)
      form.resetFields()
    }
  }, [canManageWarehouseImport, form])

  if (!canViewWarehouseImport) {
    return null
  }

  // ========== HANDLERS ==========
  const handleOpenModal = (record?: StockImport) => {
    if (!canManageWarehouseImport) {
      toast.warn("Bạn không có quyền quản lý phiếu nhập kho.")
      return
    }
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue({
        import_date: dayjs(record.import_date),
        supplier_id: record.supplier_id,
        details: record.details.map((detail) => ({
          id: detail.id,
          ingredient_id: detail.ingredient_id,
          ordered_quantity: parseFloat(detail.ordered_quantity),
          received_quantity: parseFloat(detail.received_quantity),
          unit_price: parseFloat(detail.unit_price)
        }))
      })
    } else {
      setEditingId(null)
      form.resetFields()
      form.setFieldsValue({
        import_date: dayjs(),
        details: [{ ingredient_id: "", ordered_quantity: 0, received_quantity: 0, unit_price: 0 }]
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!canManageWarehouseImport) {
      toast.warn("Bạn không có quyền quản lý phiếu nhập kho.")
      return
    }
    try {
      const values = await form.validateFields()
      const formattedValues = {
        ...values,
        import_date: values.import_date.format("YYYY-MM-DD"),
        details: values.details.map((detail: any) => ({
          ...detail,
          ordered_quantity: Number(detail.ordered_quantity),
          received_quantity: Number(detail.received_quantity),
          unit_price: Number(detail.unit_price)
        }))
      }

      if (editingId) {
        updateMutation.mutate(formattedValues)
      } else {
        createMutation.mutate(formattedValues as StockImportCreateInput)
      }
    } catch (error) {
      console.log("Validation Failed:", error)
    }
  }

  const handleDelete = (id: string) => {
    if (!canManageWarehouseImport) {
      toast.warn("Bạn không có quyền quản lý phiếu nhập kho.")
      return
    }
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa phiếu nhập kho này? Hành động này sẽ ảnh hưởng đến số lượng tồn kho.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const handleRowClick = (record: StockImport) => {
    setSelectedStockImport(record)
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
      supplier_id: values.supplier_id
    }

    delete baseParams.date_from
    delete baseParams.date_to

    const params = cleanObject(baseParams)
    const searchParamsObj = new URLSearchParams(params)

    // Add date range if selected
    if (values.date_range && values.date_range[0] && values.date_range[1]) {
      searchParamsObj.set("date_from", values.date_range[0].format("YYYY-MM-DD"))
      searchParamsObj.set("date_to", values.date_range[1].format("YYYY-MM-DD"))
    }

    navigate({
      pathname: path.AdminWarehouseIn,
      search: searchParamsObj.toString()
    })
  }

  const resetFilter = () => {
    const filteredParams = new URLSearchParams()
    if (queryConfig.page) filteredParams.set("page", queryConfig.page)
    if (queryConfig.per_page) filteredParams.set("per_page", queryConfig.per_page)

    navigate({
      pathname: path.AdminWarehouseIn,
      search: filteredParams.toString()
    })
    filterForm.resetFields()
  }

  // Calculate total amount for display
  const calculateTotalAmount = (details: any[]) => {
    if (!details || details.length === 0) return 0
    return details.reduce((sum, detail) => {
      if (!detail) return sum // Skip undefined items
      const received = parseFloat(detail.received_quantity) || 0
      const price = parseFloat(detail.unit_price) || 0
      return sum + received * price
    }, 0)
  }

  // ========== COLUMNS ==========
  const columns: ColumnsType<StockImport> = [
    {
      title: <div className="text-left">Mã phiếu</div>,
      dataIndex: "id",
      key: "id",
      width: 130,
      fixed: "left",
      render: (val) => <div className="text-left font-mono text-sm">{val}</div>
    },
    {
      title: <div className="text-left">Ngày nhập</div>,
      dataIndex: "import_date",
      key: "import_date",
      width: 120,
      render: (val) => <div className="text-left text-sm">{dayjs(val).format("DD/MM/YYYY")}</div>
    },
    {
      title: <div className="text-left">Nhà cung cấp</div>,
      dataIndex: ["supplier", "name"],
      key: "supplier_name",
      width: 250,
      render: (val, record) => (
        <div className="text-left">
          <div className="font-medium text-sm">{val || "-"}</div>
          <div className="text-xs text-gray-500">{record.supplier?.phone || ""}</div>
        </div>
      )
    },
    {
      title: <div className="text-left">Số mặt hàng</div>,
      dataIndex: "details",
      key: "details_count",
      width: 110,
      align: "center",
      render: (details) => <div className="text-sm">{details?.length || 0}</div>
    },
    {
      title: <div className="text-right">Tổng tiền</div>,
      dataIndex: "total_amount",
      key: "total_amount",
      width: 150,
      align: "right",
      render: (val) => (
        <div className="text-right font-semibold text-green-600 text-sm">
          {parseFloat(val).toLocaleString("vi-VN")} đ
        </div>
      )
    },
    {
      title: <div className="text-left">Ngày tạo</div>,
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (val) => <div className="text-left text-sm">{dayjs(val).format("DD/MM/YYYY HH:mm")}</div>
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: "right",
      width: 130,
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
          {canManageWarehouseImport && (
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

  // Detail columns for nested table
  const detailColumns: ColumnsType<any> = [
    {
      title: <span className="text-sm">Nguyên liệu</span>,
      dataIndex: ["ingredient", "name"],
      key: "ingredient_name",
      render: (val) => <span className="font-medium text-sm">{val}</span>
    },
    {
      title: <span className="text-sm">Đơn vị</span>,
      dataIndex: ["ingredient", "unit"],
      key: "unit",
      width: 80,
      align: "center",
      render: (val) => <span className="text-sm">{val}</span>
    },
    {
      title: <span className="text-sm">Đặt hàng</span>,
      dataIndex: "ordered_quantity",
      key: "ordered_quantity",
      width: 100,
      align: "center",
      render: (val, record) => (
        <span className="text-sm">
          {parseFloat(val).toLocaleString()} {record.ingredient?.unit}
        </span>
      )
    },
    {
      title: <span className="text-sm">Nhận được</span>,
      dataIndex: "received_quantity",
      key: "received_quantity",
      width: 110,
      align: "center",
      render: (val, record) => {
        const ordered = parseFloat(record.ordered_quantity)
        const received = parseFloat(val)
        const isDifferent = ordered !== received
        return (
          <Tag color={isDifferent ? "orange" : "green"} className="text-sm">
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
      render: (val) => <span className="text-sm">{parseFloat(val).toLocaleString("vi-VN")} đ</span>
    },
    {
      title: <span className="text-sm">Thành tiền</span>,
      dataIndex: "total_price",
      key: "total_price",
      width: 130,
      align: "right",
      render: (val) => <span className="font-semibold text-sm">{parseFloat(val).toLocaleString("vi-VN")} đ</span>
    }
  ]

  return (
    <Fragment>
      <Helmet>
        <title>Quản lý nhập kho</title>
        <meta name="description" content="Quản lý phiếu nhập kho nguyên liệu" />
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 my-2 flex items-center gap-2">
        Quản lý nhập kho
      </h1>

      <Spin spinning={isFetching}>
        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <Form form={filterForm} layout="inline" onFinish={handleApplyFilter} className="flex flex-wrap gap-2">
            <Form.Item name="date_range" className="mb-2">
              <RangePicker placeholder={["Từ ngày", "Đến ngày"]} style={{ width: 280 }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="supplier_id" className="mb-2">
              <Select placeholder="Lọc theo nhà cung cấp" allowClear style={{ width: 250 }} showSearch>
                {suppliersList.map((supplier: any) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
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
            Tổng số: <span className="font-semibold">{paginated?.total || 0}</span> phiếu nhập
          </div>
          {canManageWarehouseImport && (
            <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
              Thêm phiếu nhập
            </Button>
          )}
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={listStockImports}
          rowKey="id"
          scroll={{ x: 1200, y: "calc(100vh - 400px)" }}
          pagination={{
            current: Number(queryConfig.page),
            pageSize: Number(queryConfig.per_page),
            total: paginated?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phiếu nhập`,
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
        title={
          <span className="text-lg font-semibold">
            {editingId ? "Chỉnh sửa phiếu nhập kho" : "Thêm phiếu nhập kho mới"}
          </span>
        }
        open={isModalOpen && canManageWarehouseImport}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalOpen(false)
              setEditingId(null)
              form.resetFields()
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            disabled={!canManageWarehouseImport}
          >
            {editingId ? "Cập nhật" : "Thêm mới"}
          </Button>
        ]}
        width={1000}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto"
          }
        }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-sm font-medium">Ngày nhập</span>}
              name="import_date"
              rules={[{ required: true, message: "Vui lòng chọn ngày nhập" }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày nhập" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium">Nhà cung cấp</span>}
              name="supplier_id"
              rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}
            >
              <Select placeholder="Chọn nhà cung cấp" showSearch allowClear>
                {suppliersList.map((supplier: any) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Chi tiết nguyên liệu</span>
              <span className="text-base font-semibold text-green-600">
                Tổng: {calculateTotalAmount(watchedDetails || []).toLocaleString("vi-VN")} đ
              </span>
            </div>

            <Form.List
              name="details"
              rules={[
                {
                  validator: async (_, details) => {
                    if (!details || details.length === 0) {
                      return Promise.reject(new Error("Vui lòng thêm ít nhất một nguyên liệu"))
                    }
                  }
                }
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-3 mb-2 px-4">
                    <div className="col-span-4 text-sm font-medium text-gray-700">Nguyên liệu</div>
                    <div className="col-span-2 text-sm font-medium text-gray-700">SL đặt hàng</div>
                    <div className="col-span-2 text-sm font-medium text-gray-700">SL nhận được</div>
                    <div className="col-span-3 text-sm font-medium text-gray-700">Đơn giá (VNĐ)</div>
                    <div className="col-span-1 text-sm font-medium text-gray-700 text-center">Hành động</div>
                  </div>

                  <div className="space-y-3">
                    {fields.map(({ key, name, ...restField }) => {
                      const detailValues = watchedDetails?.[name]
                      const ingredientId = detailValues?.ingredient_id
                      const selectedIngredient = ingredientsList.find((ing: any) => ing.id === ingredientId)
                      const ingredientUnit = selectedIngredient?.unit || "đơn vị"

                      return (
                        <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-12 gap-3">
                            <Form.Item
                              {...restField}
                              name={[name, "ingredient_id"]}
                              rules={[{ required: true, message: "Chọn nguyên liệu" }]}
                              className="col-span-4 mb-0"
                            >
                              <Select
                                placeholder="Chọn nguyên liệu"
                                showSearch
                                filterOption={(input, option) =>
                                  String(option?.children ?? "")
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                              >
                                {ingredientsList.map((ing: any) => (
                                  <Option key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.unit})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>

                            <Form.Item
                              {...restField}
                              name={[name, "ordered_quantity"]}
                              rules={[
                                { required: true, message: "Nhập SL đặt" },
                                { type: "number", min: 0, message: "Phải >= 0" }
                              ]}
                              className="col-span-2 mb-0"
                            >
                              <InputNumber
                                placeholder="SL đặt"
                                style={{ width: "100%" }}
                                min={0}
                                precision={2}
                                addonAfter={ingredientUnit}
                                className="text-sm"
                              />
                            </Form.Item>

                            <Form.Item
                              {...restField}
                              name={[name, "received_quantity"]}
                              rules={[
                                { required: true, message: "Nhập SL nhận" },
                                { type: "number", min: 0, message: "Phải >= 0" }
                              ]}
                              className="col-span-2 mb-0"
                            >
                              <InputNumber
                                placeholder="SL nhận"
                                style={{ width: "100%" }}
                                min={0}
                                precision={2}
                                addonAfter={ingredientUnit}
                                className="text-sm"
                              />
                            </Form.Item>

                            <Form.Item
                              {...restField}
                              name={[name, "unit_price"]}
                              rules={[
                                { required: true, message: "Nhập đơn giá" },
                                { type: "number", min: 0, message: "Phải >= 0" }
                              ]}
                              className="col-span-3 mb-0"
                            >
                              <InputNumber
                                placeholder="Đơn giá"
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={parseNumericInput}
                                className="text-sm"
                              />
                            </Form.Item>

                            <div className="col-span-1 flex items-start justify-center">
                              <Button
                                danger
                                icon={<Minus size={16} />}
                                onClick={() => remove(name)}
                                disabled={fields.length === 1 || !canManageWarehouseImport}
                                title="Xóa"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Form.ErrorList errors={errors} />

                  <Button
                    type="dashed"
                    onClick={() =>
                      add({ ingredient_id: undefined, ordered_quantity: 0, received_quantity: 0, unit_price: 0 })
                    }
                    icon={<Plus size={16} />}
                    className="mt-3 w-full"
                    disabled={!canManageWarehouseImport}
                  >
                    Thêm nguyên liệu
                  </Button>
                </>
              )}
            </Form.List>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={<span className="text-lg font-semibold">Chi tiết phiếu nhập kho</span>}
        open={isDetailModalOpen}
        style={{ top: 40 }}
        onCancel={() => {
          setIsDetailModalOpen(false)
          setSelectedStockImport(null)
        }}
        footer={
          canManageWarehouseImport
            ? [
                <Button
                  key="close"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedStockImport(null)
                  }}
                >
                  Đóng
                </Button>,
                <Button
                  key="edit"
                  type="primary"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    if (stockImportDetail) {
                      handleOpenModal(stockImportDetail)
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
                    setSelectedStockImport(null)
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
        <Spin spinning={isFetchingDetail}>
          {stockImportDetail && (
            <div>
              {/* Basic Information */}
              <Descriptions bordered column={2} size="small" className="mb-6">
                <Descriptions.Item label={<span className="text-sm">Mã phiếu</span>} span={2}>
                  <span className="font-mono text-sm">{stockImportDetail.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày nhập</span>}>
                  <span className="text-sm">{dayjs(stockImportDetail.import_date).format("DD/MM/YYYY")}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Nhà cung cấp</span>}>
                  <span className="text-sm font-medium">{stockImportDetail.supplier?.name || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">SĐT nhà cung cấp</span>}>
                  <span className="text-sm">{stockImportDetail.supplier?.phone || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Email nhà cung cấp</span>}>
                  <span className="text-sm">{stockImportDetail.supplier?.email || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Tổng tiền</span>} span={2}>
                  <span className="font-semibold text-base text-green-600">
                    {parseFloat(stockImportDetail.total_amount).toLocaleString("vi-VN")} đ
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày tạo</span>}>
                  <span className="text-sm">{dayjs(stockImportDetail.created_at).format("DD/MM/YYYY HH:mm")}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày cập nhật</span>}>
                  <span className="text-sm">{dayjs(stockImportDetail.updated_at).format("DD/MM/YYYY HH:mm")}</span>
                </Descriptions.Item>
              </Descriptions>

              {/* Details Table */}
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-3 text-gray-700">
                  Chi tiết nguyên liệu ({stockImportDetail.details?.length || 0} mặt hàng)
                </h3>
                <Table
                  dataSource={stockImportDetail.details}
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
                            <span className="font-bold text-sm text-green-600">{total.toLocaleString("vi-VN")} đ</span>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )
                  }}
                />
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </Fragment>
  )
}
