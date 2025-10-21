/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Empty, Form, Input, InputNumber, Modal, Pagination, Select, Spin, Switch, Table } from "antd"
import { ColumnsType } from "antd/es/table"
import { Edit, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { dishCategoryAPI, dishesAPI } from "src/Apis"
import { assets } from "src/Assets/assets"
import { AppAbility, useAuthorization } from "src/Authorization"
import InputFileImage from "src/Components/InputFileImage"
import { Dish } from "src/Types/dish.type"
import { IngredientDish } from "src/Types/ingredientDish.type"

export default function DishDetail() {
  const { state } = useLocation()
  const detailDish = state?.dataDish as Dish
  const { can } = useAuthorization()
  const canManageDish = can(AppAbility.DISH_MANAGE)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [checkUpdate, setCheckUpdate] = useState(false)
  const [loading, setLoading] = useState(false)

  const getListDishCategory = useQuery({
    queryKey: ["listNameDishCategory"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return dishCategoryAPI.getListNameCategory(controller.signal)
    },
    retry: 0
  })

  const listNameDishCategory = getListDishCategory.data?.data?.data || ([] as { id: string; name: string }[])

  const [form] = Form.useForm<Dish>()
  const [file, setFile] = useState<File | undefined>(undefined)
  const [previewOldImage, setPreviewOldImage] = useState<string>("")

  const previewImage = useMemo(() => {
    return file ? URL.createObjectURL(file) : ""
  }, [file])

  const handleChangeImage = (file?: File) => {
    setFile(file as File)
  }

  useEffect(() => {
    form.setFieldsValue({
      name: detailDish.name,
      desc: detailDish.desc,
      price: detailDish.price,
      cooking_time: detailDish.cooking_time,
      category_id: detailDish.category_id,
      is_active: detailDish.is_active
    })
    setFile(undefined)
    setPreviewOldImage(detailDish.image as string)
  }, [detailDish, form])

  const updateMutation = useMutation({
    mutationFn: (values: {
      name?: string
      desc?: string
      price?: string
      cooking_time?: number
      category_id?: string
      is_active?: boolean
      image?: File
    }) => {
      return dishesAPI.update(detailDish.id as string, values)
    }
  })

  const deleteIngredientDishByIdDish = useMutation({
    mutationFn: (body: { idIngredientDish: string }) => {
      return dishesAPI.deleteIngredientDishByIdDish(detailDish.id, body.idIngredientDish)
    },
    onSuccess: () => {
      toast.success("Xóa nguyên liệu khỏi món ăn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listIngredientInDish", detailDish] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Xóa nguyên liệu thất bại!", {
        autoClose: 1500
      })
    }
  })

  const handleUpdate = () => {
    form.validateFields().then((values) => {
      setLoading(true)

      const payload: any = {
        ...values
      }

      if (file) {
        payload.image = file
      }

      updateMutation.mutate(payload, {
        onSuccess: (res) => {
          const updatedDish = res.data.data

          toast.success("Cập nhật món ăn thành công!", { autoClose: 1500 })
          form.setFieldsValue(updatedDish)
          setCheckUpdate(false)
          queryClient.invalidateQueries({ queryKey: ["listDish"] })

          navigate(".", { replace: true, state: { dataDish: updatedDish } })
        },
        onError: () => {
          toast.error("Cập nhật món ăn thất bại", {
            autoClose: 1500
          })
        },
        onSettled: () => {
          setLoading(false)
        }
      })
    })
  }

  // danh sách nguyên liệu thuộc 1 món ăn
  const { data, isFetching } = useQuery({
    queryKey: ["listIngredientInDish", detailDish],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return dishesAPI.getListIngredientByIdDish(detailDish.id)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const listIngredientInDish = data?.data.data

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return (listIngredientInDish || []).slice(start, end)
  }, [listIngredientInDish, currentPage, pageSize])

  const columns: ColumnsType<IngredientDish> = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 70,
      align: "center",
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: "Tên nguyên liệu",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <b>{text}</b>
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      align: "center",
      width: 100
    },
    {
      title: <div className="text-center">Số lượng</div>,
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      width: 120,
      render: (value: string) => <span className="text-center block">{parseFloat(value).toFixed(2)}</span>
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("vi-VN")
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (record) => {
        console.log(record)
        return (
          <div className="flex justify-center gap-2">
            <Button type="link" onClick={() => handleUpdateDish(record)} disabled={!canManageDish}>
              <Edit size={16} />
            </Button>
            <Button
              danger
              type="link"
              disabled={!canManageDish}
              onClick={() => {
                Modal.confirm({
                  title: "Xác nhận xóa",
                  content: `Bạn có chắc muốn xóa món "${record.name}" khỏi danh sách nguyên liệu?`,
                  okText: "Xóa",
                  cancelText: "Hủy",
                  okType: "danger",
                  onOk: () => {
                    deleteIngredientDishByIdDish.mutate({
                      idIngredientDish: record.id
                    })
                  }
                })
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )
      }
    }
  ]

  const handlePaginationChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formAddMenuItem] = Form.useForm()

  const { data: availableIngredientsData, isLoading: isLoadingDishes } = useQuery({
    queryKey: ["available-dishes", detailDish.id],
    queryFn: () => dishesAPI.getIngredientNotOnDish(detailDish.id),
    enabled: isModalOpen // chỉ load khi mở modal
  })

  const availableIngredients = availableIngredientsData?.data?.data || []

  const handleDishChange = (ingredientId: any) => {
    const selectedIngredient = availableIngredients.find((eng: any) => eng.id === ingredientId.key)
    if (selectedIngredient) {
      formAddMenuItem.setFieldsValue({
        unit: selectedIngredient.unit,
        current_stock: selectedIngredient.current_stock,
        quantity: 0,
        ingredient_id: ingredientId
      })
    }
  }

  const [editing, setEditing] = useState<boolean | string | null>(null)
  const handleUpdateDish = (record: IngredientDish | boolean) => {
    setIsModalOpen(true)
    if (record === true) {
      formAddMenuItem.setFieldsValue({
        ingredient_id: "",
        unit: "",
        current_stock: "",
        quantity: "",
        notes: ""
      })
      setEditing(false)
    } else if (typeof record === "object") {
      formAddMenuItem.setFieldsValue({
        ingredient_id: { value: record.ingredient_id, label: record.name },
        unit: record.unit,
        current_stock: record.current_stock,
        quantity: record.quantity,
        notes: record.note
      })
      setEditing(record.id)
    }
  }

  const addIngredientToDishMutation = useMutation({
    mutationFn: (body: { ingredient_id: string; quantity: string; notes?: string }) => {
      return dishesAPI.addIngredientDishByIdDish(detailDish.id, body)
    },
    onSuccess: () => {
      toast.success("Thêm nguyên liệu vào món ăn thành công!", {
        autoClose: 1500
      })
      setIsModalOpen(false)
      setEditing(null)
      formAddMenuItem.resetFields()
      queryClient.invalidateQueries({ queryKey: ["listIngredientInDish", detailDish] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Thêm nguyên liệu thất bại!", {
        autoClose: 1500
      })
    }
  })

  const updateIngredientToDishMutation = useMutation({
    mutationFn: (body: { ingredient_id: string; quantity: string; notes: string }) => {
      return dishesAPI.updateIngredientDishByIdDish(detailDish.id, editing as string, body)
    },
    onSuccess: () => {
      toast.success("Cập nhật món ăn vào menu thành công!", {
        autoClose: 1500
      })
      setIsModalOpen(false)
      setEditing(null)
      formAddMenuItem.resetFields()
      queryClient.invalidateQueries({ queryKey: ["listIngredientInDish", detailDish] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Cập nhật nguyên liệu thất bại!", {
        autoClose: 1500
      })
    }
  })

  const handleUpdateForm = () => {
    formAddMenuItem.validateFields().then(async (values) => {
      const ingredientId = values.ingredient_id.value // <--- đây mới là id
      const payload = {
        ingredient_id: ingredientId,
        quantity: values.quantity.toString(),
        notes: values.notes
      }

      if (typeof editing === "string") {
        await updateIngredientToDishMutation.mutateAsync(payload)
      } else {
        await addIngredientToDishMutation.mutateAsync(payload)
      }
    })
  }

  return (
    <div>
      <Helmet>
        <title>Chi tiết món ăn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Chi tiết món ăn
      </h1>

      <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-md">
        <Form form={form} layout="vertical" className="w-full">
          <div className="flex items-center">
            <div className="flex-1">
              <Form.Item name="name" label="Tên món" rules={[{ required: true, message: "Vui lòng nhập tên món" }]}>
                <Input placeholder="Nhập tên món" disabled={!checkUpdate} />
              </Form.Item>
              {/* Mô tả */}
              <Form.Item name="desc" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Mô tả món ăn..." disabled={!checkUpdate} />
              </Form.Item>
              <div className="w-full flex items-center justify-between">
                <Form.Item label="Giá gốc" className="flex-1" name="price">
                  <Input placeholder="Nhập giá gốc" disabled={!checkUpdate} />
                </Form.Item>

                <Form.Item
                  className="flex-1"
                  name="cooking_time"
                  label="Thời gian nấu"
                  rules={[{ required: true, message: "Nhập thời gian nấu" }]}
                >
                  <InputNumber min={1} addonAfter="phút" disabled={!checkUpdate} />
                </Form.Item>
              </div>
              <Form.Item name="category_id" label="Loại món" rules={[{ required: true, message: "Chọn loại món" }]}>
                <Select placeholder="Chọn loại món" disabled={!checkUpdate}>
                  {listNameDishCategory?.map((c: any) => (
                    <Select.Option key={c.id} value={c.id}>
                      {c.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="is_active" label="Trạng thái" initialValue={true}>
                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" disabled={!checkUpdate} />
              </Form.Item>
            </div>
            <div className="flex-1">
              <Form.Item name="image">
                <div className="flex items-center justify-center flex-col px-4 shadow-sm">
                  <div className="mb-2 text-black dark:text-white">Ảnh món ăn</div>
                  <img
                    src={previewImage || previewOldImage || assets.rectangles.Burger}
                    className="h-72 w-72 rounded-lg mx-auto"
                    alt="avatar default"
                  />
                  {canManageDish && <InputFileImage onChange={handleChangeImage} />}
                </div>
              </Form.Item>
            </div>
          </div>

          <div>
            {canManageDish ? (
              checkUpdate ? (
                <div className="flex items-center gap-2 justify-end">
                  <Button danger onClick={() => setCheckUpdate(false)}>
                    Hủy
                  </Button>
                  <Button type="primary" disabled={loading} htmlType="submit" onClick={handleUpdate}>
                    Lưu
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <Button danger type="primary">
                    Xóa
                  </Button>
                  <Button onClick={() => setCheckUpdate(true)} type="primary">
                    Cập nhật
                  </Button>
                </div>
              )
            ) : null}
          </div>
        </Form>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Danh sách nguyên liệu trong món ăn</h2>
          {canManageDish && (
            <Button type="primary" onClick={() => handleUpdateDish(true)}>
              + Thêm nguyên liệu
            </Button>
          )}
        </div>

        {isFetching ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : listIngredientInDish && listIngredientInDish.length > 0 ? (
          <div>
            <Table
              dataSource={paginatedData}
              columns={columns}
              rowKey="id"
              pagination={false}
              bordered
              loading={isFetching}
            />
            <div style={{ marginTop: 16, textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
              <Pagination
                current={currentPage}
                total={listIngredientInDish.length}
                pageSize={pageSize}
                onChange={handlePaginationChange}
                showSizeChanger
                pageSizeOptions={["5", "10", "20", "50"]}
              />
            </div>
          </div>
        ) : (
          <Empty description="Không có món ăn nào trong menu" />
        )}

        <Modal
          title="Thêm nguyên liệu vào món ăn"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={false}
          style={{
            top: 80
          }}
        >
          {isLoadingDishes ? (
            <div className="flex justify-center items-center py-8">
              <Spin />
            </div>
          ) : (
            <Form form={formAddMenuItem} layout="vertical" onFinish={handleUpdateForm}>
              <Form.Item
                name="ingredient_id"
                label="Chọn nguyên liệu"
                rules={[{ required: true, message: "Vui lòng chọn nguyên liệu!" }]}
              >
                <Select
                  labelInValue
                  showSearch
                  placeholder="Chọn nguyên liệu chưa có trong món ăn"
                  options={(availableIngredients as any[])?.map((ing) => ({
                    value: ing.id,
                    label: ing.name
                  }))}
                  onChange={handleDishChange}
                />
              </Form.Item>

              <Form.Item name="unit" label="Đơn vị">
                <InputNumber
                  disabled
                  min={0}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  placeholder="Đơn vị nguyên liệu"
                />
              </Form.Item>

              <Form.Item name="current_stock" label="Số lượng tồn kho">
                <InputNumber
                  disabled
                  min={0}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  placeholder="Số lượng tồn"
                />
              </Form.Item>

              <Form.Item
                name="quantity"
                label="Số lượng dùng cho món ăn"
                rules={[
                  { required: true, message: "Vui lòng nhập số lượng món ăn cần chế biến!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const currentStock = getFieldValue("current_stock")

                      if (value == null) {
                        return Promise.reject(new Error("Vui lòng nhập số lượng!"))
                      }
                      if (value <= 0) {
                        return Promise.reject(new Error("Số lượng phải lớn hơn 0!"))
                      }
                      if (value > currentStock) {
                        return Promise.reject(new Error("Số lượng món ăn không được vượt quá tồn kho!"))
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
              >
                <InputNumber min={1} className="w-full" placeholder="Nhập số lượng dùng" />
              </Form.Item>

              <Form.Item name="notes" label="Ghi chú nguyên liệu">
                <Input className="w-full" placeholder="Nhập ghi chú nguyên liệu (nếu có)" />
              </Form.Item>

              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsModalOpen(false)} className="mr-2">
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateIngredientToDishMutation.isPending || addIngredientToDishMutation.isPending}
                >
                  {typeof editing === "string" ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu"}
                </Button>
              </div>
            </Form>
          )}
        </Modal>
      </div>
    </div>
  )
}
