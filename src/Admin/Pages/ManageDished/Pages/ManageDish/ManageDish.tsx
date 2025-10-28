/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Result,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag
} from "antd"
import { isUndefined, omit, omitBy } from "lodash"
import { Beef, Filter, RotateCcw } from "lucide-react"
import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { dishesAPI, dishCategoryAPI } from "src/Apis/Admin"
import { assets } from "src/Assets/assets"
import InputFileImage from "src/Components/InputFileImage"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { Dish } from "src/Types/dish.type"
import { queryParamConfigCategoryDish, queryParamConfigDish } from "src/Types/queryParams.type"
import { AppAbility, PermissionGate, useAuthorization } from "src/Authorization"

type DishFormPayload = {
  name: string
  desc: string
  price: string
  cooking_time: number
  category_id: string
  is_active: boolean
  image?: File
}

export default function ManageDish() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useAuthorization()
  const canViewDish = can(AppAbility.DISH_VIEW)
  const canManageDish = can(AppAbility.DISH_MANAGE)
  const ensureManagePermission = useCallback(() => {
    if (canManageDish) return true
    toast.warning("Bạn không có quyền quản lý món ăn.", { autoClose: 1500 })
    return false
  }, [canManageDish])
  const queryParams: queryParamConfigDish = useQueryParams()
  const queryConfig: queryParamConfigDish = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "5",
      name: queryParams.name,
      is_active: queryParams.is_active,
      category: queryParams.category,
      cooking_time: queryParams.cooking_time,
      min_price: queryParams.min_price,
      max_price: queryParams.max_price
    },
    isUndefined
  )

  const { data, isFetching } = useQuery({
    queryKey: ["listDish", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return dishesAPI.getList(queryConfig, controller.signal)
    },
    enabled: canViewDish,
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const getListDishCategory = useQuery({
    queryKey: ["listNameDishCategory"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return dishCategoryAPI.getListNameCategory(controller.signal)
    },
    enabled: canViewDish,
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data
  const listDish: Dish[] = paginated?.data || []

  const listNameDishCategory = getListDishCategory.data?.data?.data || ([] as { id: string; name: string }[])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDishId, setEditingDishId] = useState<string | null>(null)
  const [form] = Form.useForm<Record<string, any>>()

  const [file, setFile] = useState<File | undefined>(undefined)
  const [previewOldImage, setPreviewOldImage] = useState<string>("")

  const resetFormState = useCallback(() => {
    setFile(undefined)
    setPreviewOldImage("")
    setEditingDishId(null)
    form.resetFields()
  }, [form])

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    resetFormState()
  }, [resetFormState])

  const previewImage = useMemo(() => {
    return file ? URL.createObjectURL(file) : ""
  }, [file])

  useEffect(() => {
    if (!previewImage) return
    return () => {
      URL.revokeObjectURL(previewImage)
    }
  }, [previewImage])

  const handleChangeImage = (nextFile?: File) => {
    setFile(nextFile)
    if (nextFile) {
      setPreviewOldImage("")
    }
  }

  useEffect(() => {
    if (canManageDish) return
    handleModalClose()
  }, [canManageDish, handleModalClose])

  const createDishMutation = useMutation({
    mutationFn: (payload: DishFormPayload) => dishesAPI.create(payload),
    onSuccess: () => {
      toast.success("Tạo món ăn thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["listDish"] })
      handleModalClose()
    },
    onError: () => {
      toast.error("Tạo món ăn thất bại", { autoClose: 1500 })
    }
  })

  const isEditing = Boolean(editingDishId)

  const handleEdit = (record: Dish | true) => {
    resetFormState()

    if (record === true) {
      form.setFieldsValue({
        name: "",
        desc: "",
        price: "",
        cooking_time: undefined,
        category_id: undefined,
        is_active: true
      })
      setIsModalOpen(true)
      return
    }

    const categoryId = record.category_id || record.category?.id || ""
    setEditingDishId(record.id)
    form.setFieldsValue({
      name: record.name,
      desc: record.desc ?? "",
      price: record.price !== null && record.price !== undefined ? record.price.toString() : "",
      cooking_time: record.cooking_time,
      category_id: categoryId,
      is_active: record.is_active
    })
    setPreviewOldImage(record.image || "")
    setIsModalOpen(true)
  }

  const handleSubmit = (values: Record<string, any>) => {
    if (!ensureManagePermission()) return

    const payload: DishFormPayload = {
      name: values.name?.trim() || "",
      desc: (values.desc ?? "").trim(),
      price: values.price?.toString().trim() ?? "",
      cooking_time: Number(values.cooking_time),
      category_id: values.category_id,
      is_active: Boolean(values.is_active)
    }

    if (file) {
      payload.image = file
    }
    createDishMutation.mutate(payload)
  }

  const columns = [
    {
      title: <div className="text-left">Mã món ăn</div>,
      dataIndex: "id",
      key: "id",
      render: (val: string) => <div className="text-left">{val}</div>
    },
    {
      title: "Món ăn",
      dataIndex: ["dish", "dish_name"],
      key: "dish_name",
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          {record.image ? (
            <Image src={record.image} alt={record.name} className="rounded-md object-cover" width={64} height={64} />
          ) : (
            <Image
              src={assets.rectangles.Burger}
              alt={record.name}
              className="rounded-md object-cover"
              width={64}
              height={64}
            />
          )}
          <div>
            <p className="font-medium">{record.name}</p>
          </div>
        </div>
      )
    },
    {
      title: "Giá gốc",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (price: string) => <span>{Number(price).toLocaleString()} đ</span>
    },
    {
      title: "Thời gian nấu",
      dataIndex: "cooking_time",
      key: "cooking_time",
      render: (time: number) => <span>{time} phút</span>
    },
    {
      title: "Danh mục",
      dataIndex: ["category", "name"],
      key: "category"
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) => (active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngừng</Tag>)
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) => <div className="text-left">{new Date(value).toLocaleString()}</div>
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (value: string) => <div className="text-left">{new Date(value).toLocaleString()}</div>
    },
    {
      title: <div className="text-center">Hành động</div>,
      key: "actions",
      render: (_: any, record: any) => {
        return (
          <div className="flex items-center justify-center">
            <Link
              to={`${path.AdminDish}/${record.id}`}
              state={{
                dataDish: record,
                queryConfig: queryConfig
              }}
              className="text-blue-500"
            >
              Xem chi tiết
            </Link>
          </div>
        )
      }
    }
  ]

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const [filterForm] = Form.useForm()

  const handleApplyForm = (values: any) => {
    const params: queryParamConfigCategoryDish = cleanObject({
      ...queryConfig,
      page: 1,
      name: values.name,
      is_active: values.is_active,
      category: values.category,
      cooking_time: values.cooking_time,
      min_price: values.min_price,
      max_price: values.max_price
    })
    navigate({
      pathname: `${path.AdminDish}`,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const filteredSearch = omit(queryConfig, [
      "name",
      "is_active",
      "category",
      "cooking_time",
      "min_price",
      "max_price"
    ])
    navigate({ pathname: `${path.AdminDish}`, search: createSearchParams(filteredSearch).toString() })
    filterForm.resetFields()
  }

  if (!canViewDish) {
    return (
      <div>
        <Helmet>
          <title>Danh sách món ăn</title>
          <meta name="description" content="Đây là trang Restaurant Management - Quản lý món ăn" />
        </Helmet>
        <Result
          status="403"
          title="403"
          subTitle="Bạn không có quyền xem danh sách món ăn."
          extra={
            <Button type="primary" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <Helmet>
        <title>Danh sách món ăn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý món ăn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách món ăn
      </h1>

      <div className="mt-4 gap-4 mb-4">
        <Form
          form={filterForm}
          layout="inline"
          onFinish={handleApplyForm}
          className="flex flex-wrap items-center justify-between"
          initialValues={{
            name: undefined,
            is_active: undefined,
            category: queryConfig.category || undefined
          }}
        >
          <div className="flex items-center gap-1">
            <div className="text-[15px] font-semibold">Bộ lọc & tìm kiếm: </div>
            <Form.Item name="name">
              <Input type="text" placeholder="Tên món ăn..." className="w-48" />
            </Form.Item>

            <Form.Item name="cooking_time">
              <Input type="number" placeholder="Thời gian nấu..." className="w-40" addonAfter="Phút" />
            </Form.Item>

            <Form.Item name="is_active">
              <Select placeholder="Trạng thái" allowClear className="w-32">
                <Select.Option value="1">Hoạt động</Select.Option>
                <Select.Option value="0">Ngừng</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="category">
              <Select placeholder="Thể loại" allowClear className="w-60" dropdownStyle={{ width: 150 }}>
                {listNameDishCategory.map((item, index) => (
                  <Select.Option value={item.id} key={index}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Khoảng giá">
              <Space>
                <Form.Item name="min_price" noStyle>
                  <InputNumber placeholder="Từ" min={0} />
                </Form.Item>
                <span>-</span>
                <Form.Item
                  name="max_price"
                  noStyle
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const minPrice = getFieldValue("min_price")
                        if (!value || !minPrice || value >= minPrice) {
                          return Promise.resolve()
                        }
                        toast.error("Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu", {
                          autoClose: 1500
                        })
                      }
                    })
                  ]}
                >
                  <InputNumber placeholder="Đến" min={0} />
                </Form.Item>
              </Space>
            </Form.Item>
          </div>

          <div className="flex items-center justify-between gap-1">
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<Filter size={16} />}>
                Lọc
              </Button>
            </Form.Item>

            <Form.Item>
              <Button onClick={resetFilterForm} icon={<RotateCcw size={16} />}>
                Reset
              </Button>
            </Form.Item>
          </div>
        </Form>

        <PermissionGate ability={AppAbility.DISH_MANAGE}>
          <div className="flex justify-end mt-4">
            <Button type="primary" icon={<Beef />} onClick={() => handleEdit(true)} className="whitespace-nowrap">
              Thêm món ăn
            </Button>
          </div>
        </PermissionGate>
      </div>

      {isFetching ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column", // để tip xuất hiện bên dưới spinner,
            height: "calc(100vh - 200px)" // chiếm toàn màn hình
          }}
        >
          <Spin tip="Đang tải dữ liệu..." size="large">
            <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
          </Spin>
        </div>
      ) : listDish.length === 0 ? (
        <Empty description="Không có món ăn hợp lệ" className="mt-16" />
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            dataSource={listDish}
            loading={isFetching}
            columns={columns}
            pagination={false}
            bordered
            rowClassName={(_, index) =>
              index % 2 === 0
                ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
                : "bg-white hover:bg-blue-50 transition-colors"
            }
          />

          <div style={{ marginTop: 16, textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
            <Pagination
              current={parseInt(queryConfig.page as string)}
              total={paginated?.total}
              pageSize={parseInt(queryConfig.per_page as string)}
              onChange={handlePaginationChange}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
            />
          </div>
        </Fragment>
      )}

      <Modal
        title="Thông tin món ăn"
        open={isModalOpen}
        width={700}
        style={{ top: 40 }}
        onCancel={handleModalClose}
        footer={false}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="flex items-center justify-between">
            <div>
              <Form.Item name="name" label="Tên món" rules={[{ required: true, message: "Vui lòng nhập tên món" }]}>
                <Input placeholder="Nhập tên món" disabled={!canManageDish} />
              </Form.Item>
              {/* Mô tả */}
              <Form.Item name="desc" label="Mô tả" rules={[{ required: true, message: "Nhập mô tả món ăn" }]}>
                <Input.TextArea rows={3} placeholder="Mô tả món ăn..." disabled={!canManageDish} />
              </Form.Item>
              <div className="flex items-center justify-between">
                <Form.Item
                  label="Giá gốc"
                  className="flex-1"
                  name="price"
                  rules={[{ required: true, message: "Nhập giá gốc" }]}
                >
                  <Input placeholder="Nhập giá gốc" disabled={!canManageDish} />
                </Form.Item>

                <Form.Item
                  className="flex-1"
                  name="cooking_time"
                  label="Thời gian nấu"
                  rules={[{ required: true, message: "Nhập thời gian nấu" }]}
                >
                  <InputNumber min={1} addonAfter="phút" disabled={!canManageDish} />
                </Form.Item>
              </div>
              <Form.Item name="category_id" label="Loại món" rules={[{ required: true, message: "Chọn loại món" }]}>
                <Select placeholder="Chọn loại món" disabled={!canManageDish}>
                  {listNameDishCategory?.map((c: any) => (
                    <Select.Option key={c.id} value={c.id}>
                      {c.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="is_active" label="Trạng thái" initialValue={true} valuePropName="checked">
                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" disabled={!canManageDish} />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="image">
                <div className="flex items-center justify-center flex-col px-4 shadow-sm">
                  <div className="mb-2 text-black dark:text-white">Ảnh món ăn</div>
                  <img
                    src={previewImage || previewOldImage || assets.rectangles.Burger}
                    className="h-28 w-28 rounded-lg mx-auto"
                    alt="avatar default"
                  />
                  {canManageDish && <InputFileImage onChange={handleChangeImage} />}
                </div>
              </Form.Item>
            </div>
          </div>

          {canManageDish && (
            <div className="flex justify-end mt-4">
              <Button onClick={handleModalClose} className="mr-2">
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={createDishMutation.isPending}>
                {isEditing ? "Cập nhật món ăn" : "Thêm món ăn"}
              </Button>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}
