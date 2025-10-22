/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Tag,
  Space,
  Descriptions,
  Spin
} from "antd"
import { Plus, Edit, Trash2, Eye, Filter, Minus, RotateCcw } from "lucide-react"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { Helmet } from "react-helmet-async"
import { toast } from "react-toastify"
import { omitBy, isUndefined } from "lodash"

import { stockExportsAPI } from "src/Apis/Admin/stockExports.api"
import { ingredientsAPI } from "src/Apis/Admin/ingredients.api"
import {
  StockExport,
  StockExportCreateInput,
  StockExportFormInput,
  queryParamConfigStockExport
} from "src/Types/stockExport.type"
import { PaginatedResponse } from "src/Types/utils.type"
import useQueryParams from "src/Hook/useQueryParams"
import { cleanObject } from "src/Helpers/common"
import { path } from "src/Constants/path"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { AppAbility, useAuthorization } from "src/Authorization"

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const STATUS_OPTIONS = [
  { value: 0, label: "Nháp", color: "default" },
  { value: 1, label: "Đang xử lý", color: "processing" },
  { value: 2, label: "Hoàn thành", color: "success" }
]

export default function ManageStockExport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParams: queryParamConfigStockExport = useQueryParams()

  const queryConfig: queryParamConfigStockExport = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "15",
      date_from: queryParams.date_from,
      date_to: queryParams.date_to,
      status: queryParams.status
    },
    isUndefined
  )

  const { can } = useAuthorization()
  const canViewWarehouseExport = can(AppAbility.WAREHOUSE_EXPORT_VIEW)
  const canManageWarehouseExport = can(AppAbility.WAREHOUSE_EXPORT_MANAGE)

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedStockExport, setSelectedStockExport] = useState<StockExport | null>(null)

  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const watchedDetails = Form.useWatch("details", form)

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listStockExports", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return stockExportsAPI.getList(queryConfig, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: canViewWarehouseExport
  })

  const paginated = data?.data?.data as PaginatedResponse<StockExport>
  const listStockExports = paginated?.data || []

  // Fetch ingredients for form dropdown
  const { data: ingredientsData } = useQuery({
    queryKey: ["listIngredients"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return ingredientsAPI.getList({ per_page: "1000" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000,
    enabled: canManageWarehouseExport
  })

  const ingredientsList = (ingredientsData?.data?.data as any)?.data || []

  // Get detail when opening detail modal
  const { data: detailData, isFetching: isFetchingDetail } = useQuery({
    queryKey: ["stockExportDetail", selectedStockExport?.id],
    queryFn: () => stockExportsAPI.getDetail(selectedStockExport?.id as string),
    enabled: !!selectedStockExport?.id && isDetailModalOpen && canViewWarehouseExport,
    staleTime: 2 * 60 * 1000
  })

  const stockExportDetail = (detailData?.data?.data as StockExport) || selectedStockExport

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: StockExportCreateInput) => {
      return stockExportsAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Thêm phiếu xuất kho thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockExports"] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] }) // Refresh stock
      setIsModalOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm phiếu xuất kho thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: StockExportFormInput) => {
      return stockExportsAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật phiếu xuất kho thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockExports"] })
      queryClient.invalidateQueries({ queryKey: ["stockExportDetail", editingId] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
      setIsModalOpen(false)
      setEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockExportsAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa phiếu xuất kho thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockExports"] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Không thể xóa phiếu xuất kho"
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
      status: queryParams.status ? Number(queryParams.status) : undefined
    })
  }, [queryParams, filterForm])

  useEffect(() => {
    if (!canManageWarehouseExport) {
      setIsModalOpen(false)
      setEditingId(null)
      form.resetFields()
    }
  }, [canManageWarehouseExport, form])

  if (!canViewWarehouseExport) {
    return null
  }

  // ========== HANDLERS ==========
  const handleOpenModal = (record?: StockExport) => {
    if (!canManageWarehouseExport) {
      toast.warn("Bạn không có quyền quản lý phiếu xuất kho.")
      return
    }
    setIsModalOpen(true)

    if (record) {
      setEditingId(record.id)
      // Use setTimeout to ensure modal is rendered before setting values
      setTimeout(() => {
        form.setFieldsValue({
          export_date: dayjs(record.export_date),
          purpose: record.purpose,
          status: record.status,
          details: record.details.map((detail) => ({
            id: detail.id,
            ingredient_id: detail.ingredient_id,
            quantity: parseFloat(detail.quantity)
          }))
        })
      }, 0)
    } else {
      setEditingId(null)
      // Reset to initial values
      form.resetFields()
    }
  }

  const handleSubmit = async () => {
    if (!canManageWarehouseExport) {
      toast.warn("Bạn không có quyền quản lý phiếu xuất kho.")
      return
    }
    try {
      const values = await form.validateFields()
      const formattedValues = {
        ...values,
        export_date: values.export_date.format("YYYY-MM-DD"),
        purpose: values.purpose || "",
        details: values.details.map((detail: any) => ({
          ...detail,
          quantity: Number(detail.quantity)
        }))
      }

      if (editingId) {
        updateMutation.mutate(formattedValues)
      } else {
        createMutation.mutate(formattedValues as StockExportCreateInput)
      }
    } catch (error) {
      console.log("Validation Failed:", error)
    }
  }

  const handleDelete = (id: string) => {
    if (!canManageWarehouseExport) {
      toast.warn("Bạn không có quyền quản lý phiếu xuất kho.")
      return
    }
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa phiếu xuất kho này? Hành động này sẽ ảnh hưởng đến số lượng tồn kho.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const handleRowClick = (record: StockExport) => {
    setSelectedStockExport(record)
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
      status: values.status !== undefined ? String(values.status) : undefined
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
      pathname: path.AdminWarehouseOut,
      search: searchParamsObj.toString()
    })
  }

  const resetFilter = () => {
    const filteredParams = new URLSearchParams()
    if (queryConfig.page) filteredParams.set("page", queryConfig.page)
    if (queryConfig.per_page) filteredParams.set("per_page", queryConfig.per_page)

    navigate({
      pathname: path.AdminWarehouseOut,
      search: filteredParams.toString()
    })
    filterForm.resetFields()
  }

  // Get status tag
  const getStatusTag = (status: number, label: string) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status)
    return <Tag color={statusOption?.color || "default"}>{label || statusOption?.label}</Tag>
  }

  // ========== COLUMNS ==========
  const columns: ColumnsType<StockExport> = [
    {
      title: <div className="text-left">STT</div>,
      key: "index",
      width: 70,
      fixed: "left",
      render: (_: any, __: StockExport, index: number) => {
        const pageNumber = Number(queryConfig.page)
        const pageSizeNumber = Number(queryConfig.per_page)
        return <div className="text-left">{(pageNumber - 1) * pageSizeNumber + index + 1}</div>
      }
    },
    {
      title: <div className="text-left">Mã phiếu</div>,
      dataIndex: "id",
      key: "id",
      width: 130,
      fixed: "left",
      render: (val) => <div className="text-left font-mono text-sm">{val}</div>
    },
    {
      title: <div className="text-left">Ngày xuất</div>,
      dataIndex: "export_date",
      key: "export_date",
      width: 120,
      render: (val) => <div className="text-left text-sm">{dayjs(val).format("DD/MM/YYYY")}</div>
    },
    {
      title: <div className="text-left">Lý do xuất</div>,
      dataIndex: "purpose",
      key: "purpose",
      ellipsis: true,
      render: (val) => <div className="text-left text-sm">{val || <span className="text-gray-400">-</span>}</div>
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
      title: <div className="text-left">Trạng thái</div>,
      dataIndex: "status",
      key: "status",
      width: 130,
      align: "center",
      render: (status: number, record: StockExport) => getStatusTag(status, record.status_label)
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
          {canManageWarehouseExport && (
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
      title: <span className="text-sm">Số lượng xuất</span>,
      dataIndex: "quantity",
      key: "quantity",
      width: 150,
      align: "right",
      render: (val) => (
        <span className="font-semibold text-sm">
          {parseFloat(val).toLocaleString("vi-VN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      )
    }
  ]

  return (
    <Fragment>
      <Helmet>
        <title>Quản lý xuất kho</title>
        <meta name="description" content="Quản lý phiếu xuất kho nguyên liệu" />
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 my-2 flex items-center gap-2">
        Quản lý xuất kho
      </h1>

      <Spin spinning={isFetching}>
        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <Form form={filterForm} layout="inline" onFinish={handleApplyFilter} className="flex flex-wrap gap-2">
            <Form.Item name="date_range" className="mb-2">
              <RangePicker placeholder={["Từ ngày", "Đến ngày"]} style={{ width: 280 }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="status" className="mb-2">
              <Select placeholder="Lọc theo trạng thái" allowClear style={{ width: 200 }} showSearch>
                {STATUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
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
            Tổng số: <span className="font-semibold">{paginated?.total || 0}</span> phiếu xuất
          </div>
          {canManageWarehouseExport && (
            <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
              Thêm phiếu xuất
            </Button>
          )}
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={listStockExports}
          rowKey="id"
          scroll={{ x: 1200, y: "calc(100vh - 400px)" }}
          pagination={{
            current: Number(queryConfig.page),
            pageSize: Number(queryConfig.per_page),
            total: paginated?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phiếu xuất`,
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
            {editingId ? "Chỉnh sửa phiếu xuất kho" : "Thêm phiếu xuất kho mới"}
          </span>
        }
        open={isModalOpen && canManageWarehouseExport}
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
            disabled={!canManageWarehouseExport}
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
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          initialValues={{
            export_date: dayjs(),
            status: 0,
            details: []
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-sm font-medium">Ngày xuất</span>}
              name="export_date"
              rules={[{ required: true, message: "Vui lòng chọn ngày xuất" }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày xuất" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium">Trạng thái</span>}
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái">
                {STATUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item label={<span className="text-sm font-medium">Lý do xuất</span>} name="purpose">
            <TextArea placeholder="Nhập lý do xuất kho (VD: Phục vụ nhà hàng, hư hỏng, mất mát...)" rows={3} />
          </Form.Item>

          <div className="mt-6 h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Chi tiết nguyên liệu</span>
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
                    <div className="col-span-6 text-sm font-medium text-gray-700">Nguyên liệu</div>
                    <div className="col-span-4 text-sm font-medium text-gray-700">Số lượng xuất</div>
                    <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Hành động</div>
                  </div>

                  <div className="space-y-3">
                    {fields.map(({ key, name, ...restField }) => {
                      const detailValues = watchedDetails?.[name]
                      const ingredientId = detailValues?.ingredient_id
                      const selectedIngredient = ingredientsList.find((ing: any) => ing.id === ingredientId)
                      const unit = selectedIngredient?.unit || "đơn vị"

                      return (
                        <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-12 gap-3">
                            <Form.Item
                              {...restField}
                              name={[name, "ingredient_id"]}
                              rules={[{ required: true, message: "Chọn nguyên liệu" }]}
                              className="col-span-6 mb-0"
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
                              name={[name, "quantity"]}
                              rules={[
                                { required: true, message: "Nhập số lượng" },
                                { type: "number", min: 0.01, message: "Phải > 0" }
                              ]}
                              className="col-span-4 mb-0"
                            >
                              <InputNumber
                                placeholder="Số lượng xuất"
                                style={{ width: "100%" }}
                                min={0.01}
                                precision={2}
                                addonAfter={unit}
                                className="text-sm"
                              />
                            </Form.Item>

                            <div className="col-span-2 flex items-start justify-center">
                              <Button
                                danger
                                icon={<Minus size={16} />}
                                onClick={() => remove(name)}
                                disabled={fields.length === 1 || !canManageWarehouseExport}
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
                    onClick={() => add({ ingredient_id: undefined, quantity: 0 })}
                    icon={<Plus size={16} />}
                    className="mt-3 w-full"
                    disabled={!canManageWarehouseExport}
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
        title={<span className="text-lg font-semibold">Chi tiết phiếu xuất kho</span>}
        open={isDetailModalOpen}
        style={{ top: 40 }}
        onCancel={() => {
          setIsDetailModalOpen(false)
          setSelectedStockExport(null)
        }}
        footer={
          canManageWarehouseExport
            ? [
                <Button
                  key="close"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedStockExport(null)
                  }}
                >
                  Đóng
                </Button>,
                <Button
                  key="edit"
                  type="primary"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    if (stockExportDetail) {
                      handleOpenModal(stockExportDetail)
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
                    setSelectedStockExport(null)
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
          {stockExportDetail && (
            <div>
              {/* Basic Information */}
              <Descriptions bordered column={2} size="small" className="mb-6">
                <Descriptions.Item label={<span className="text-sm">Mã phiếu</span>} span={2}>
                  <span className="font-mono text-sm">{stockExportDetail.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày xuất</span>}>
                  <span className="text-sm">{dayjs(stockExportDetail.export_date).format("DD/MM/YYYY")}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Trạng thái</span>}>
                  {getStatusTag(stockExportDetail.status, stockExportDetail.status_label)}
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Lý do xuất</span>} span={2}>
                  <span className="text-sm">
                    {stockExportDetail.purpose || <span className="text-gray-400">-</span>}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày tạo</span>}>
                  <span className="text-sm">{dayjs(stockExportDetail.created_at).format("DD/MM/YYYY HH:mm")}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày cập nhật</span>}>
                  <span className="text-sm">{dayjs(stockExportDetail.updated_at).format("DD/MM/YYYY HH:mm")}</span>
                </Descriptions.Item>
              </Descriptions>

              {/* Details Table */}
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-3 text-gray-700">
                  Chi tiết nguyên liệu ({stockExportDetail.details?.length || 0} mặt hàng)
                </h3>
                <Table
                  dataSource={stockExportDetail.details}
                  columns={detailColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 600 }}
                />
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </Fragment>
  )
}
