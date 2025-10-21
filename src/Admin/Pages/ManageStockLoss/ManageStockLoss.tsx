/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { Table, Button, Modal, Form, DatePicker, Select, InputNumber, Space, Descriptions, Spin, Input } from "antd"
import { Plus, Edit, Trash2, Eye, Filter, RotateCcw} from "lucide-react"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { Helmet } from "react-helmet-async"
import { toast } from "react-toastify"
import { omitBy, isUndefined } from "lodash"

import { stockLossesAPI } from "src/Apis/Admin/stockLosses.api"
import { ingredientsAPI } from "src/Apis/Admin/ingredients.api"
import { employeesAPI } from "src/Apis/Admin/employees.api"
import {
  StockLoss,
  StockLossCreateInput,
  StockLossFormInput,
  queryParamConfigStockLoss
} from "src/Types/stockLoss.type"
import { PaginatedResponse } from "src/Types/utils.type"
import useQueryParams from "src/Hook/useQueryParams"
import { cleanObject } from "src/Helpers/common"
import { path } from "src/Constants/path"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { AppAbility, useAuthorization } from "src/Authorization"

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

export default function ManageStockLoss() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParams: queryParamConfigStockLoss = useQueryParams()

  const queryConfig: queryParamConfigStockLoss = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "15",
      date_from: queryParams.date_from,
      date_to: queryParams.date_to,
      ingredient_id: queryParams.ingredient_id
    },
    isUndefined
  )

  const { can } = useAuthorization()
  const canViewWarehouseLoss = can(AppAbility.WAREHOUSE_LOSS_VIEW)
  const canManageWarehouseLoss = can(AppAbility.WAREHOUSE_LOSS_MANAGE)

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedStockLoss, setSelectedStockLoss] = useState<StockLoss | null>(null)

  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const watchedIngredientId = Form.useWatch("ingredient_id", form)

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listStockLosses", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return stockLossesAPI.getList(queryConfig, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: canViewWarehouseLoss
  })

  const paginated = data?.data?.data as PaginatedResponse<StockLoss>
  const listStockLosses = paginated?.data || []

  // Fetch ingredients for filter and form dropdown
  const { data: ingredientsData } = useQuery({
    queryKey: ["listIngredients"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return ingredientsAPI.getList({ per_page: "1000" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000,
    enabled: canViewWarehouseLoss
  })

  const ingredientsList = (ingredientsData?.data?.data as any)?.data || []

  // Fetch employees for form dropdown (optional field)
  const { data: employeesData } = useQuery({
    queryKey: ["listEmployees"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return employeesAPI.getList({ per_page: "1000" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000,
    enabled: canManageWarehouseLoss
  })

  const employeesList = (employeesData?.data?.data as any)?.data || []

  // Get detail when opening detail modal
  const { data: detailData, isFetching: isFetchingDetail } = useQuery({
    queryKey: ["stockLossDetail", selectedStockLoss?.id],
    queryFn: () => stockLossesAPI.getDetail(selectedStockLoss?.id as string),
    enabled: !!selectedStockLoss?.id && isDetailModalOpen && canViewWarehouseLoss,
    staleTime: 2 * 60 * 1000
  })

  const stockLossDetail = (detailData?.data?.data as StockLoss) || selectedStockLoss

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: StockLossCreateInput) => {
      return stockLossesAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Thêm phiếu hao hụt thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockLosses"] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] }) // Refresh stock
      setIsModalOpen(false)
      form.resetFields()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm phiếu hao hụt thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: StockLossFormInput) => {
      return stockLossesAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật phiếu hao hụt thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockLosses"] })
      queryClient.invalidateQueries({ queryKey: ["stockLossDetail", editingId] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
      setIsModalOpen(false)
      setEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockLossesAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa phiếu hao hụt thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listStockLosses"] })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Không thể xóa phiếu hao hụt"
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
      ingredient_id: queryParams.ingredient_id
    })
  }, [queryParams, filterForm])

  useEffect(() => {
    if (!canManageWarehouseLoss) {
      setIsModalOpen(false)
      setEditingId(null)
      form.resetFields()
    }
  }, [canManageWarehouseLoss, form])

  if (!canViewWarehouseLoss) {
    return null
  }

  // ========== HANDLERS ==========
  const handleOpenModal = (record?: StockLoss) => {
    if (!canManageWarehouseLoss) {
      toast.warn("Bạn không có quyền quản lý phiếu hao hụt.")
      return
    }
    setIsModalOpen(true)

    if (record) {
      setEditingId(record.id)
      // Use setTimeout to ensure modal is rendered before setting values
      setTimeout(() => {
        form.setFieldsValue({
          loss_date: dayjs(record.loss_date),
          ingredient_id: record.ingredient_id,
          quantity: parseFloat(record.quantity),
          reason: record.reason || "",
          employee_id: record.employee_id || undefined
        })
      }, 0)
    } else {
      setEditingId(null)
      // Reset to initial values
      form.resetFields()
    }
  }

  const handleSubmit = async () => {
    if (!canManageWarehouseLoss) {
      toast.warn("Bạn không có quyền quản lý phiếu hao hụt.")
      return
    }
    try {
      const values = await form.validateFields()
      const formattedValues = {
        loss_date: values.loss_date.format("YYYY-MM-DD"),
        ingredient_id: values.ingredient_id,
        quantity: Number(values.quantity),
        reason: values.reason || "",
        employee_id: values.employee_id || undefined
      }

      if (editingId) {
        updateMutation.mutate(formattedValues)
      } else {
        createMutation.mutate(formattedValues as StockLossCreateInput)
      }
    } catch (error) {
      console.log("Validation Failed:", error)
    }
  }

  const handleDelete = (id: string) => {
    if (!canManageWarehouseLoss) {
      toast.warn("Bạn không có quyền quản lý phiếu hao hụt.")
      return
    }
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa phiếu hao hụt này? Hành động này sẽ ảnh hưởng đến số lượng tồn kho.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const handleRowClick = (record: StockLoss) => {
    setSelectedStockLoss(record)
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
      ingredient_id: values.ingredient_id
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
      pathname: path.AdminInventoryLoss,
      search: searchParamsObj.toString()
    })
  }

  const resetFilter = () => {
    const filteredParams = new URLSearchParams()
    if (queryConfig.page) filteredParams.set("page", queryConfig.page)
    if (queryConfig.per_page) filteredParams.set("per_page", queryConfig.per_page)

    navigate({
      pathname: path.AdminInventoryLoss,
      search: filteredParams.toString()
    })
    filterForm.resetFields()
  }

  // ========== COLUMNS ==========
  const columns: ColumnsType<StockLoss> = [
    {
      title: <div className="text-left">STT</div>,
      key: "index",
      width: 70,
      fixed: "left",
      render: (_: any, __: StockLoss, index: number) => {
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
      title: <div className="text-left">Ngày hao hụt</div>,
      dataIndex: "loss_date",
      key: "loss_date",
      width: 120,
      render: (val) => <div className="text-left text-sm">{dayjs(val).format("DD/MM/YYYY")}</div>
    },
    {
      title: <div className="text-left">Nguyên liệu</div>,
      dataIndex: ["ingredient", "name"],
      key: "ingredient_name",
      width: 200,
      render: (val, record) => (
        <div className="text-left">
          <div className="font-medium text-sm">{val || "-"}</div>
          <div className="text-xs text-gray-500">Đơn vị: {record.ingredient?.unit || ""}</div>
        </div>
      )
    },
    {
      title: <div className="text-right">Số lượng hao hụt</div>,
      dataIndex: "quantity",
      key: "quantity",
      width: 150,
      align: "right",
      render: (val, record) => (
        <div className="text-right font-semibold text-red-600 text-sm">
          {parseFloat(val).toLocaleString("vi-VN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}{" "}
          {record.ingredient?.unit}
        </div>
      )
    },
    {
      title: <div className="text-left">Lý do</div>,
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (val) => <div className="text-left text-sm">{val || <span className="text-gray-400">-</span>}</div>
    },
    {
      title: <div className="text-left">Người ghi nhận</div>,
      dataIndex: ["employee", "full_name"],
      key: "employee_name",
      width: 150,
      render: (val) => <div className="text-left text-sm">{val || <span className="text-gray-400">-</span>}</div>
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
          {canManageWarehouseLoss && (
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

  return (
    <Fragment>
      <Helmet>
        <title>Quản lý hao hụt kho</title>
        <meta name="description" content="Quản lý phiếu hao hụt nguyên liệu" />
      </Helmet>

      <NavigateBack />

      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 my-2 flex items-center gap-2">
        Quản lý hao hụt kho
      </h1>

      <Spin spinning={isFetching}>
        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <Form form={filterForm} layout="inline" onFinish={handleApplyFilter} className="flex flex-wrap gap-2">
            <Form.Item name="date_range" className="mb-2">
              <RangePicker placeholder={["Từ ngày", "Đến ngày"]} style={{ width: 280 }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="ingredient_id" className="mb-2">
              <Select
                placeholder="Lọc theo nguyên liệu"
                allowClear
                style={{ width: 250 }}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={ingredientsList.map((ingredient: any) => ({
                  value: ingredient.id,
                  label: `${ingredient.name} (${ingredient.unit})`
                }))}
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
            Tổng số: <span className="font-semibold">{paginated?.total || 0}</span> phiếu hao hụt
          </div>
          {canManageWarehouseLoss && (
            <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
              Thêm phiếu hao hụt
            </Button>
          )}
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={listStockLosses}
          rowKey="id"
          scroll={{ x: 1300, y: "calc(100vh - 400px)" }}
          pagination={{
            current: Number(queryConfig.page),
            pageSize: Number(queryConfig.per_page),
            total: paginated?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phiếu hao hụt`,
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
            {editingId ? "Chỉnh sửa phiếu hao hụt" : "Thêm phiếu hao hụt mới"}
          </span>
        }
        open={isModalOpen && canManageWarehouseLoss}
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
            disabled={!canManageWarehouseLoss}
          >
            {editingId ? "Cập nhật" : "Thêm mới"}
          </Button>
        ]}
        width={700}
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
            loss_date: dayjs(),
            quantity: 0,
            reason: ""
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-sm font-medium">Ngày hao hụt</span>}
              name="loss_date"
              rules={[{ required: true, message: "Vui lòng chọn ngày hao hụt" }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày hao hụt" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium">Nguyên liệu</span>}
              name="ingredient_id"
              rules={[{ required: true, message: "Vui lòng chọn nguyên liệu" }]}
            >
              <Select
                placeholder="Chọn nguyên liệu"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.children ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {ingredientsList.map((ingredient: any) => (
                  <Option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.unit})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={<span className="text-sm font-medium">Số lượng hao hụt</span>}
              name="quantity"
              rules={[
                { required: true, message: "Vui lòng nhập số lượng" },
                { type: "number", min: 0.01, message: "Số lượng phải lớn hơn 0" }
              ]}
            >
              <InputNumber
                placeholder="Nhập số lượng"
                style={{ width: "100%" }}
                min={0}
                precision={2}
                addonAfter={
                  ingredientsList.find((ing: any) => ing.id === watchedIngredientId)?.unit || "đơn vị"
                }
              />
            </Form.Item>

            <Form.Item label={<span className="text-sm font-medium">Người ghi nhận</span>} name="employee_id">
              <Select placeholder="Chọn người ghi nhận (tùy chọn)" showSearch allowClear>
                {employeesList.map((employee: any) => (
                  <Option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item label={<span className="text-sm font-medium">Lý do hao hụt</span>} name="reason">
            <TextArea
              rows={4}
              placeholder="Nhập lý do hao hụt (hỏng, hết hạn, thất thoát...)"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={<span className="text-lg font-semibold">Chi tiết phiếu hao hụt</span>}
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false)
          setSelectedStockLoss(null)
        }}
        footer={
          canManageWarehouseLoss
            ? [
                <Button
                  key="close"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedStockLoss(null)
                  }}
                >
                  Đóng
                </Button>,
                <Button
                  key="edit"
                  type="primary"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    if (stockLossDetail) {
                      handleOpenModal(stockLossDetail)
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
                    setSelectedStockLoss(null)
                  }}
                >
                  Đóng
                </Button>
              ]
        }
        width={800}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            paddingTop: "16px"
          }
        }}
      >
        <Spin spinning={isFetchingDetail}>
          {stockLossDetail && (
            <div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label={<span className="text-sm">Mã phiếu</span>} span={2}>
                  <span className="font-mono text-sm">{stockLossDetail.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày hao hụt</span>}>
                  <span className="text-sm">{dayjs(stockLossDetail.loss_date).format("DD/MM/YYYY")}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Người ghi nhận</span>}>
                  <span className="text-sm">{stockLossDetail.employee?.full_name || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Nguyên liệu</span>} span={2}>
                  <span className="text-sm font-medium">
                    {stockLossDetail.ingredient?.name} ({stockLossDetail.ingredient?.unit})
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Số lượng hao hụt</span>} span={2}>
                  <span className="font-semibold text-base text-red-600">
                    {parseFloat(stockLossDetail.quantity).toLocaleString("vi-VN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{" "}
                    {stockLossDetail.ingredient?.unit}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Lý do hao hụt</span>} span={2}>
                  <span className="text-sm">{stockLossDetail.reason || "-"}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày tạo</span>}>
                  <span className="text-sm">{dayjs(stockLossDetail.created_at).format("DD/MM/YYYY HH:mm")}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span className="text-sm">Ngày cập nhật</span>}>
                  <span className="text-sm">{dayjs(stockLossDetail.updated_at).format("DD/MM/YYYY HH:mm")}</span>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Spin>
      </Modal>
    </Fragment>
  )
}
