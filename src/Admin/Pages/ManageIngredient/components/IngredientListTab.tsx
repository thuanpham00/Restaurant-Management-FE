/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Descriptions,
  Upload
} from "antd"
import type { UploadFile } from "antd/es/upload/interface"
import { ColumnsType } from "antd/es/table"
import { isUndefined, omitBy } from "lodash"
import { Plus, Filter, RotateCcw, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Fragment, useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { ingredientsAPI, ingredientCategoriesAPI } from "src/Apis/Admin"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import {
  Ingredient,
  IngredientCreateInput,
  IngredientFormInput,
  queryParamConfigIngredient
} from "src/Types/ingredient.type"
import { PaginatedResponse } from "src/Types/utils.type"

const { Option } = Select

const getBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

export default function IngredientListTab() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParams: queryParamConfigIngredient = useQueryParams()

  // Parse category_ids[] from URL
  const categoryIdsFromUrl = searchParams.getAll("category_ids[]")

  const queryConfig: queryParamConfigIngredient = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "15",
      name: queryParams.name,
      unit: queryParams.unit,
      is_active: queryParams.is_active,
      low_stock: queryParams.low_stock,
      category_ids: categoryIdsFromUrl.length > 0 ? categoryIdsFromUrl : undefined
    },
    isUndefined
  )

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>("")
  const [previewTitle, setPreviewTitle] = useState<string>("")

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    const latestFileList = newFileList
      .slice(-1)
      .map((file) => {
        if (file.originFileObj instanceof File) {
          const previewUrl = URL.createObjectURL(file.originFileObj as File)
          return {
            ...file,
            status: "done" as UploadFile["status"],
            thumbUrl: previewUrl
          }
        }
        return { ...file, status: "done" as UploadFile["status"] }
      })
    setFileList(latestFileList)
    const latestFile = latestFileList[0]

    if (latestFile && latestFile.originFileObj) {
      setSelectedImageFile(latestFile.originFileObj as File)
    }

    if (!latestFile) {
      setSelectedImageFile(null)
    }
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj as File)
    }

  const previewSrc = (file.url ?? file.thumbUrl ?? (file.preview as string) ?? "") as string
    setPreviewImage(previewSrc)
    setPreviewOpen(true)
    setPreviewTitle(file.name || "Ảnh nguyên liệu")
  }

  const uploadButton = (
    <div className="flex flex-col items-center justify-center text-gray-500">
      <Plus size={20} />
      <div className="mt-1 text-xs">Tải ảnh</div>
    </div>
  )

  // ========== QUERIES ==========
  const { data, isFetching } = useQuery({
    queryKey: ["listIngredients", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return ingredientsAPI.getList(queryConfig, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data?.data as PaginatedResponse<Ingredient>
  const listIngredients = paginated?.data || []

  // Get categories for select
  const { data: categoriesData } = useQuery({
    queryKey: ["ingredient-categories-select"],
    queryFn: () => {
      const controller = new AbortController()
      return ingredientCategoriesAPI.getList({ per_page: "99" }, controller.signal)
    },
    staleTime: 5 * 60 * 1000
  })

  const categoryOptions =
    ((categoriesData?.data?.data as any)?.data || []).map((cat: any) => ({
      label: cat.name,
      value: cat.id
    })) || []

  // Set initial filter values from URL
  useEffect(() => {
    filterForm.setFieldsValue({
      name: queryParams.name,
      unit: queryParams.unit,
      is_active: queryParams.is_active,
      low_stock: queryParams.low_stock,
      category_ids: categoryIdsFromUrl.length > 0 ? categoryIdsFromUrl : undefined
    })
  }, [filterForm, queryParams, categoryIdsFromUrl])

  useEffect(() => {
    return () => {
      fileList.forEach((file) => {
        if (file.thumbUrl && file.thumbUrl.startsWith("blob:")) {
          URL.revokeObjectURL(file.thumbUrl)
        }
      })
    }
  }, [fileList])

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: IngredientCreateInput) => {
      return ingredientsAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Thêm nguyên liệu thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
      setIsModalOpen(false)
      form.resetFields()
      setFileList([])
      setSelectedImageFile(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm nguyên liệu thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: IngredientFormInput) => {
      return ingredientsAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật nguyên liệu thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
      setIsModalOpen(false)
      setEditingId(null)
      setFileList([])
      setSelectedImageFile(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ingredientsAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa nguyên liệu thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listIngredients"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa nguyên liệu thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS ==========
  const handleOpenModal = (record?: Ingredient) => {
    setSelectedImageFile(null)
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue({
        name: record.name,
        unit: record.unit,
        current_stock: parseFloat(record.current_stock),
        min_stock: parseFloat(record.min_stock),
        max_stock: parseFloat(record.max_stock),
        is_active: record.is_active,
        ingredient_category_id: record.ingredient_category_id
      })
      const existingImage = record.image_url || record.image
      setFileList(
        existingImage
          ? [
              {
                uid: record.id,
                name: record.name,
                status: "done",
                url: existingImage,
                thumbUrl: existingImage
              } as UploadFile
            ]
          : []
      )
    } else {
      setEditingId(null)
      form.resetFields()
      form.setFieldsValue({ is_active: true })
      setFileList([])
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        name: values.name,
        unit: values.unit,
        ingredient_category_id: values.ingredient_category_id,
        current_stock: values.current_stock ?? undefined,
        min_stock: values.min_stock,
        max_stock: values.max_stock ?? undefined,
        is_active: values.is_active ?? true,
        image: selectedImageFile ?? null
      }

      if (editingId) {
        updateMutation.mutate(payload)
      } else {
        createMutation.mutate(payload as IngredientCreateInput)
      }
    } catch (error) {
      console.log("Validation Failed:", error)
    }
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa nguyên liệu này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const handleRowClick = (record: Ingredient) => {
    setSelectedIngredient(record)
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
      name: values.name,
      unit: values.unit,
      is_active: values.is_active,
      low_stock: values.low_stock
    })

    // Handle category_ids array - convert to multiple query params
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })

    // Add category_ids as array format: category_ids[]=id1&category_ids[]=id2
    if (values.category_ids && Array.isArray(values.category_ids) && values.category_ids.length > 0) {
      values.category_ids.forEach((id: string) => {
        searchParams.append("category_ids[]", id)
      })
    }

    navigate({
      pathname: path.AdminIngredients,
      search: searchParams.toString()
    })
  }

  const resetFilter = () => {
    const filteredParams = new URLSearchParams()

    // Only keep page and per_page
    if (queryConfig.page) filteredParams.set("page", queryConfig.page)
    if (queryConfig.per_page) filteredParams.set("per_page", queryConfig.per_page)

    navigate({
      pathname: path.AdminIngredients,
      search: filteredParams.toString()
    })
    filterForm.resetFields()
  }

  const isLowStock = (current: string, minimum: string) => {
    return parseFloat(current) <= parseFloat(minimum)
  }

  // ========== COLUMNS ==========
  const columns: ColumnsType<Ingredient> = [
    {
      title: <div className="text-left">STT</div>,
      key: "index",
      width: 70,
      fixed: "left",
      render: (_: any, __: Ingredient, index: number) => {
        const pageNumber = Number(queryConfig.page)
        const pageSizeNumber = Number(queryConfig.per_page)
        return <div className="text-left">{(pageNumber - 1) * pageSizeNumber + index + 1}</div>
      }
    },
    {
      title: <div className="text-left">Mã</div>,
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (val) => <div className="text-left font-mono text-sm">{val}</div>
    },
    {
      title: <div className="text-left">Hình ảnh</div>,
      key: "image",
      width: 120,
      align: "center",
      render: (_: any, record: Ingredient) => {
        const imageSrc = record.image_url || record.image
        return imageSrc ? (
          <img src={imageSrc} alt={record.name} className="h-14 w-14 object-cover rounded-md border" />
        ) : (
          <span className="text-xs italic text-gray-400">Không có</span>
        )
      }
    },
    {
      title: <div className="text-left">Tên nguyên liệu</div>,
      dataIndex: "name",
      key: "name",
      render: (val) => <div className="text-left font-medium text-sm">{val}</div>
    },
    {
      title: <div className="text-left">Danh mục</div>,
      dataIndex: ["category", "name"],
      key: "category",
      width: 180,
      render: (val) => (
        <Tag color="blue" className="text-sm">
          {val || "N/A"}
        </Tag>
      )
    },
    {
      title: <div className="text-left">Đơn vị</div>,
      dataIndex: "unit",
      key: "unit",
      width: 100,
      align: "center",
      render: (val) => <div className="text-sm">{val}</div>
    },
    {
      title: <div className="text-left">Tồn kho</div>,
      dataIndex: "current_stock",
      key: "current_stock",
      width: 150,
      align: "center",
      render: (val, record) => {
        const low = isLowStock(val, record.min_stock)
        return (
          <Tag color={low ? "red" : "green"} className="flex items-center justify-center gap-1 w-fit mx-auto">
            {low && <AlertTriangle size={14} />}
            <span className="text-sm">
              {parseFloat(val).toLocaleString()} {record.unit}
            </span>
          </Tag>
        )
      }
    },
    {
      title: <div className="text-left">Tồn tối thiểu</div>,
      dataIndex: "min_stock",
      key: "min_stock",
      width: 130,
      align: "center",
      render: (val, record) => (
        <div className="text-sm">
          {parseFloat(val).toLocaleString()} {record.unit}
        </div>
      )
    },
    {
      title: <div className="text-left">Tồn tối đa</div>,
      dataIndex: "max_stock",
      key: "max_stock",
      width: 130,
      align: "center",
      render: (val, record) => (
        <div className="text-sm">{val ? `${parseFloat(val).toLocaleString()} ${record.unit}` : "-"}</div>
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
      title: "Hành động",
      key: "actions",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Space size="small">
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
            <Form.Item name="name" className="mb-2">
              <Input placeholder="Tìm theo tên" allowClear style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="unit" className="mb-2">
              <Input placeholder="Đơn vị" allowClear style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="category_ids" className="mb-2">
              <Select
                mode="multiple"
                placeholder="Chọn danh mục"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ minWidth: 200, maxWidth: 300 }}
                maxTagCount="responsive"
              >
                {categoryOptions.map((opt: any) => (
                  <Option key={opt.value} value={opt.value} label={opt.label}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="is_active" className="mb-2">
              <Select placeholder="Trạng thái" allowClear style={{ width: 150 }}>
                <Option value="1">Hoạt động</Option>
                <Option value="0">Ngừng</Option>
              </Select>
            </Form.Item>
            <Form.Item name="low_stock" className="mb-2">
              <Select placeholder="Tồn kho" allowClear style={{ width: 150 }}>
                <Option value="1">Sắp hết</Option>
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
            Tổng số: <span className="font-semibold">{paginated?.total || 0}</span> nguyên liệu
          </div>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal()}>
            Thêm nguyên liệu
          </Button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={listIngredients}
          rowKey="id"
          scroll={{ x: 1400, y: "calc(100vh - 400px)" }}
          pagination={{
            current: Number(queryConfig.page),
            pageSize: Number(queryConfig.per_page),
            total: paginated?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nguyên liệu`,
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
        title={<span className="text-base">{editingId ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu mới"}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingId(null)
          form.resetFields()
          setFileList([])
          setSelectedImageFile(null)
        }}
        okText={editingId ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        width={650}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
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
            label={<span className="text-sm">Tên nguyên liệu</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên nguyên liệu" }]}
          >
            <Input placeholder="VD: Gạo tẻ" className="text-sm" />
          </Form.Item>

          <Form.Item
            name="unit"
            label={<span className="text-sm">Đơn vị</span>}
            rules={[{ required: true, message: "Vui lòng nhập đơn vị" }]}
          >
            <Input placeholder="VD: kg, lít, gram" className="text-sm" />
          </Form.Item>

          <Form.Item
            name="ingredient_category_id"
            label={<span className="text-sm">Danh mục</span>}
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select placeholder="Chọn danh mục" allowClear showSearch optionFilterProp="label" className="text-sm">
              {categoryOptions.map((opt: any) => (
                <Option key={opt.value} value={opt.value} label={opt.label}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={<span className="text-sm">Hình ảnh</span>}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              onPreview={handlePreview}
              beforeUpload={() => false}
              accept="image/jpeg,image/png"
              maxCount={1}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
            <div className="text-xs text-gray-500">Hỗ trợ định dạng JPG, PNG và kích thước tối đa 1MB.</div>
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="current_stock" label={<span className="text-sm">Tồn kho</span>}>
              <InputNumber placeholder="0" min={0} className="w-full text-sm" />
            </Form.Item>

            <Form.Item
              name="min_stock"
              label={<span className="text-sm">Tồn tối thiểu</span>}
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <InputNumber placeholder="0" min={0} className="w-full text-sm" />
            </Form.Item>

            <Form.Item name="max_stock" label={<span className="text-sm">Tồn tối đa</span>}>
              <InputNumber placeholder="0" min={0} className="w-full text-sm" />
            </Form.Item>
          </div>

          <Form.Item name="is_active" label={<span className="text-sm">Trạng thái</span>} valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => {
          setPreviewOpen(false)
          setPreviewImage("")
          setPreviewTitle("")
        }}
      >
        <img alt={previewTitle} style={{ width: "100%" }} src={previewImage} />
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={<span className="text-base">Chi tiết nguyên liệu</span>}
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false)
          setSelectedIngredient(null)
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setIsDetailModalOpen(false)
              handleOpenModal(selectedIngredient!)
            }}
          >
            Chỉnh sửa
          </Button>
        ]}
        width={750}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            paddingTop: "16px"
          }
        }}
      >
        {selectedIngredient && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label={<span className="text-sm">Mã</span>} span={2}>
              <span className="font-mono text-sm">{selectedIngredient.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Tên nguyên liệu</span>} span={2}>
              <span className="font-semibold text-sm">{selectedIngredient.name}</span>
            </Descriptions.Item>
            {(selectedIngredient.image_url || selectedIngredient.image) && (
              <Descriptions.Item label={<span className="text-sm">Hình ảnh</span>} span={2}>
                <div className="flex items-center justify-center">
                  <img
                    src={selectedIngredient.image_url || selectedIngredient.image || ""}
                    alt={selectedIngredient.name}
                    className="max-h-48 rounded-md border object-cover"
                  />
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label={<span className="text-sm">Danh mục</span>} span={2}>
              <Tag color="blue" className="text-sm">
                {selectedIngredient.category?.name}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Đơn vị</span>}>
              <span className="text-sm">{selectedIngredient.unit}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Trạng thái</span>}>
              <Tag color={selectedIngredient.is_active ? "green" : "red"} className="text-sm">
                {selectedIngredient.is_active ? "Hoạt động" : "Ngừng"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Tồn kho hiện tại</span>}>
              <Tag
                color={isLowStock(selectedIngredient.current_stock, selectedIngredient.min_stock) ? "red" : "green"}
                className="text-sm"
              >
                {parseFloat(selectedIngredient.current_stock).toLocaleString()} {selectedIngredient.unit}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Tồn tối thiểu</span>}>
              <span className="text-sm">
                {parseFloat(selectedIngredient.min_stock).toLocaleString()} {selectedIngredient.unit}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Tồn tối đa</span>} span={2}>
              <span className="text-sm">
                {selectedIngredient.max_stock
                  ? `${parseFloat(selectedIngredient.max_stock).toLocaleString()} ${selectedIngredient.unit}`
                  : "Không giới hạn"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Ngày tạo</span>} span={2}>
              <span className="text-sm">{new Date(selectedIngredient.created_at).toLocaleString("vi-VN")}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="text-sm">Ngày cập nhật</span>} span={2}>
              <span className="text-sm">{new Date(selectedIngredient.updated_at).toLocaleString("vi-VN")}</span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Fragment>
  )
}
