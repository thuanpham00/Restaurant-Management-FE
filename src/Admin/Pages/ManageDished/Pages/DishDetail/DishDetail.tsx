/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Form, Input, InputNumber, Modal, Select, Spin, Switch } from "antd"
import { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { dishCategoryAPI, dishesAPI } from "src/Apis"
import { assets } from "src/Assets/assets"
import InputFileImage from "src/Components/InputFileImage"
import { Dish } from "src/Types/dish.type"

export default function DishDetail() {
  const { state } = useLocation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [checkUpdate, setCheckUpdate] = useState(false)
  const [loading, setLoading] = useState(false)

  const detailDish = state?.dataDish as Dish

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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formAddMenuItem] = Form.useForm()

  const { data: availableIngredientsData, isLoading: isLoadingDishes } = useQuery({
    queryKey: ["available-dishes", detailDish.id],
    queryFn: () => dishesAPI.getIngredientNotOnDish(detailDish.id),
    // enabled: isModalOpen // chỉ load khi mở modal
  })

  const availableIngredients = availableIngredientsData?.data?.data || []
  console.log(availableIngredients)

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
                  <InputFileImage onChange={handleChangeImage} />
                </div>
              </Form.Item>
            </div>
          </div>

          <div>
            {checkUpdate ? (
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
            )}
          </div>
        </Form>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Danh sách món ăn trong thực đơn</h2>
          <Button type="primary" onClick={() => handleUpdateDish(true)}>
            + Thêm món ăn
          </Button>
        </div>

        {/* {isFetching ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : listItemInMenu && listItemInMenu.length > 0 ? (
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
                total={listItemInMenu.length}
                pageSize={pageSize}
                onChange={handlePaginationChange}
                showSizeChanger
                pageSizeOptions={["5", "10", "20", "50"]}
              />
            </div>
          </div>
        ) : (
          <Empty description="Không có món ăn nào trong menu" />
        )} */}

        {/* <Modal title="Thêm món ăn vào menu" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={false}>
          {isLoadingDishes ? (
            <div className="flex justify-center items-center py-8">
              <Spin />
            </div>
          ) : (
            <Form form={formAddMenuItem} layout="vertical" onFinish={handleUpdateForm}>
              <Form.Item
                name="dish_id"
                label="Chọn món ăn"
                rules={[{ required: true, message: "Vui lòng chọn món ăn!" }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn món ăn chưa có trong menu"
                  options={(availableDishes as AddDishToMenu[])?.map((dish) => ({
                    value: dish.id,
                    label: dish.name
                  }))}
                  onChange={handleDishChange}
                />
              </Form.Item>

              <Form.Item name="price_base" label="Giá gốc món ăn">
                <InputNumber
                  disabled
                  min={0}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  placeholder="Nhập giá bán cho món ăn"
                />
              </Form.Item>

              <Form.Item
                name="price"
                label="Giá bán trong menu"
                rules={[
                  { required: true, message: "Vui lòng nhập giá bán!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const base = getFieldValue("price_base")
                      if (value === undefined || value === null) {
                        return Promise.resolve()
                      }
                      if (base !== undefined && value < base) {
                        return Promise.reject(new Error("Giá bán phải lớn hơn hoặc bằng giá gốc!"))
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  placeholder="Nhập giá bán cho món ăn"
                />
              </Form.Item>

              <Form.Item name="notes" label="Ghi chú món ăn">
                <Input className="w-full" placeholder="Nhập ghi chú món ăn (nếu có)" />
              </Form.Item>

              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsModalOpen(false)} className="mr-2">
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={addDishToMenuMutation.isPending || updateDishToMenuMutation.isPending}
                >
                  {typeof editing === "string" ? "Cập nhật thực đơn" : "Thêm món ăn"}
                </Button>
              </div>
            </Form>
          )}
        </Modal> */}
      </div>
    </div>
  )
}
