/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Col,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Row,
  Select,
  Spin,
  Switch,
  Table
} from "antd"
import { ColumnsType } from "antd/es/table"
import { Edit, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { menusAPI } from "src/Apis"
import { assets } from "src/Assets/assets"
import { path } from "src/Constants/path"
import { isError400 } from "src/Helpers/utils"
import { AddDishToMenu, Menus } from "src/Types/menu.type"
import { AppAbility, PermissionGate, useAuthorization } from "src/Authorization"

type DishMenu = {
  id: string
  menu_id: string
  dish_id: string
  dish_name: string
  price_base: string
  price: string
  notes: string
  dish_image: string
}

export default function MenuDetail() {
  const { state } = useLocation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { can } = useAuthorization()
  const canManageMenu = can(AppAbility.MENU_MANAGE)

  const detailMenu = state?.dataMenu as Menus

  const [checkUpdate, setCheckUpdate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<Menus>()

  const { data, isFetching } = useQuery({
    queryKey: ["listDishInMenu", detailMenu],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return menusAPI.getMenuItemByIdMenu(detailMenu.id)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const listItemInMenu = data?.data.data.items

  useEffect(() => {
    form.setFieldsValue({
      name: detailMenu.name,
      description: detailMenu.description,
      version: detailMenu.version,
      is_active: detailMenu.is_active
    })
  }, [detailMenu, form])

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Menus>) => {
      return menusAPI.update(detailMenu.id as string, values)
    }
  })

  const handleUpdate = () => {
    if (!canManageMenu) {
      toast.warn("Bạn không có quyền quản lý thực đơn.")
      return
    }
    form.validateFields().then((values) => {
      setLoading(true)

      updateMutation.mutate(values, {
        onSuccess: (res) => {
          toast.success("Cập nhật thực đơn thành công!", { autoClose: 1500 })
          form.setFieldsValue(res.data) // nếu API trả về dữ liệu mới
          setCheckUpdate(false)
          queryClient.invalidateQueries({ queryKey: ["listMenu"] })
        },
        onError: (error) => {
          if (isError400<any>(error)) {
            toast.error(error.response?.data?.message, { autoClose: 1500 })
          }
        },
        onSettled: () => {
          setLoading(false)
        }
      })
    })
  }

  const deleteMenuMutation = useMutation({
    mutationFn: (id: string) => menusAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa thực đơn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listMenu"] })
      navigate(path.AdminMenu)
    },
    onError: (error) => {
      if (isError400<any>(error)) {
        toast.error(error.response?.data?.message, {
          autoClose: 1500
        })
      }
    }
  })

  const deleteMenuItemMutation = useMutation({
    mutationFn: (body: { idMenu: string; idMenuItem: string }) =>
      menusAPI.deleteMenuItemByIdMenu(body.idMenu, body.idMenuItem),
    onSuccess: () => {
      toast.success("Xóa món ăn khỏi thực đơn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listDishInMenu"] })
    },
    onError: (error) => {
      if (isError400<any>(error)) {
        toast.error(error.response?.data?.message, {
          autoClose: 1500
        })
      }
    }
  })

  const handleDelete = (id: string) => {
    if (!canManageMenu) {
      toast.warn("Bạn không có quyền quản lý thực đơn.")
      return
    }
    Modal.confirm({
      title: "Bạn có chắc muốn xóa?",
      content: "Thực đơn sẽ bị xóa vĩnh viễn.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMenuMutation.mutate(id)
    })
  }

  const columns: ColumnsType<any> = [
    {
      title: <div className="text-center">STT</div>,
      dataIndex: "index",
      key: "index",
      width: 70,
      render: (_, __, index) => <div className="text-center">{index + 1}</div>
    },
    {
      title: "Tên món ăn",
      dataIndex: "dish_name",
      key: "dish_name",
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          {record.image ? (
            <Image
              src={record.image}
              alt={record.dish_name}
              className="rounded-md object-cover"
              width={64}
              height={64}
            />
          ) : (
            <Image
              src={assets.rectangles.Burger}
              alt={record.dish_name}
              className="rounded-md object-cover"
              width={64}
              height={64}
            />
          )}
          <div>
            <p className="font-medium">{record.dish_name}</p>
          </div>
        </div>
      )
    },
    {
      title: "Giá gốc món ăn",
      dataIndex: "price_base",
      key: "price_base",
      render: (text: number) => Number(text).toLocaleString("vi-VN") + " đ"
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price",
      render: (text: number) => Number(text).toLocaleString("vi-VN") + " đ"
    },
    {
      title: "Mô tả món ăn",
      dataIndex: "notes",
      key: "notes"
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (record) => {
        if (!canManageMenu) {
          return <span className="text-gray-400 italic">Không có quyền</span>
        }
        return (
          <div className="flex justify-center gap-2">
            <Button type="link" onClick={() => handleUpdateDish(record)}>
              <Edit size={16} />
            </Button>
            <Button
              type="link"
              danger
              onClick={() => {
                Modal.confirm({
                  title: "Xác nhận xóa",
                  content: `Bạn có chắc muốn xóa món "${record.dish_name}" khỏi thực đơn?`,
                  okText: "Xóa",
                  cancelText: "Hủy",
                  okType: "danger",
                  onOk: () => {
                    deleteMenuItemMutation.mutate({
                      idMenu: detailMenu.id,
                      idMenuItem: record.id
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formAddMenuItem] = Form.useForm()

  useEffect(() => {
    if (!canManageMenu) {
      setCheckUpdate(false)
      setIsModalOpen(false)
    }
  }, [canManageMenu])

  const { data: availableDishesData, isLoading: isLoadingDishes } = useQuery({
    queryKey: ["available-dishes", detailMenu.id],
    queryFn: () => menusAPI.getDishNotOnTheMenu(detailMenu.id),
    enabled: isModalOpen // chỉ load khi mở modal
  })

  const availableDishes = availableDishesData?.data?.data || []

  const handleDishChange = (dishId: string) => {
    const selectedDish = availableDishes.find((dish) => dish.id === dishId)
    if (selectedDish) {
      formAddMenuItem.setFieldsValue({
        price_base: selectedDish.price
      })
    }
  }

  const [editing, setEditing] = useState<boolean | string | null>(null)

  const handleUpdateDish = (record: DishMenu | boolean) => {
    if (!canManageMenu) {
      toast.warn("Bạn không có quyền quản lý thực đơn.")
      return
    }
    setIsModalOpen(true)
    if (record === true) {
      formAddMenuItem.setFieldsValue({
        dish_id: "",
        price_base: "",
        price: "",
        notes: ""
      })
      setEditing(false)
    } else if (typeof record === "object") {
      formAddMenuItem.setFieldsValue({
        dish_id: { value: record.dish_id, label: record.dish_name },
        price_base: record.price_base,
        price: record.price,
        notes: record.notes
      })
      setEditing(record.id)
    }
  }

  const addDishToMenuMutation = useMutation({
    mutationFn: (body: { dish_id: string; price: number; notes: string }) => {
      return menusAPI.createMenuItemByIdMenu(detailMenu.id, body)
    },
    onSuccess: () => {
      toast.success("Thêm món ăn vào menu thành công!", {
        autoClose: 1500
      })
      setIsModalOpen(false)
      formAddMenuItem.resetFields()
      queryClient.invalidateQueries({ queryKey: ["listDishInMenu"] })
    }
  })

  const updateDishToMenuMutation = useMutation({
    mutationFn: (body: { idMenuItem: string; dish_id: string; price: number; notes: string }) => {
      return menusAPI.updateMenuItemByIdMenu(detailMenu.id, body.idMenuItem, body)
    },
    onSuccess: () => {
      toast.success("Cập nhật món ăn vào menu thành công!", {
        autoClose: 1500
      })
      setIsModalOpen(false)
      formAddMenuItem.resetFields()
      queryClient.invalidateQueries({ queryKey: ["listDishInMenu"] })
    }
  })

  const handleUpdateForm = () => {
    if (!canManageMenu) {
      toast.warn("Bạn không có quyền quản lý thực đơn.")
      return
    }
    formAddMenuItem.validateFields().then(async (values) => {
      if (typeof editing === "string") {
        await updateDishToMenuMutation.mutateAsync({
          idMenuItem: editing,
          dish_id: values.dish_id.value,
          price: values.price,
          notes: values.notes
        })
      } else {
        await addDishToMenuMutation.mutateAsync({
          dish_id: values.dish_id.value,
          price: values.price,
          notes: values.notes
        })
      }
    })
  }

  // phân trang danh sách món ăn thuộc 1 menu
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return (listItemInMenu || []).slice(start, end)
  }, [listItemInMenu, currentPage, pageSize])

  const handlePaginationChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
  }

  return (
    <div>
      <Helmet>
        <title>Chi tiết thực đơn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Chi tiết thực đơn
      </h1>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md">
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="Tên Menu" rules={[{ required: true, message: "Vui lòng nhập tên menu" }]}>
                <Input placeholder="Nhập tên menu..." disabled={!checkUpdate} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version"
                label="Phiên bản"
                rules={[
                  { required: true, message: "Vui lòng nhập phiên bản" },
                  { type: "number", min: 1, message: "Phiên bản phải >= 1" }
                ]}
              >
                <InputNumber min={1} className="w-full" placeholder="Nhập số phiên bản..." disabled={!checkUpdate} />
              </Form.Item>
            </Col>
          </Row>

          {/* Mô tả */}
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả menu..." disabled={!checkUpdate} />
          </Form.Item>

          {/* Trạng thái hoạt động */}
          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
            tooltip="Chỉ một menu được kích hoạt tại một thời điểm"
          >
            <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Không hoạt động" disabled={!checkUpdate} />
          </Form.Item>

          <PermissionGate ability={AppAbility.MENU_MANAGE} fallback={null}>
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
                  <Button danger type="primary" onClick={() => handleDelete(detailMenu.id)}>
                    Xóa
                  </Button>
                  <Button onClick={() => setCheckUpdate(true)} type="primary">
                    Cập nhật
                  </Button>
                </div>
              )}
            </div>
          </PermissionGate>
        </Form>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Danh sách món ăn trong thực đơn</h2>
          <PermissionGate ability={AppAbility.MENU_MANAGE}>
            <Button type="primary" onClick={() => handleUpdateDish(true)}>
              + Thêm món ăn
            </Button>
          </PermissionGate>
        </div>

        {isFetching ? (
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
        )}

        <Modal
          title="Thêm món ăn vào menu"
          open={canManageMenu && isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={false}
        >
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
                  labelInValue
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
        </Modal>
      </div>
    </div>
  )
}
