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
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag
} from "antd"
import { isUndefined, omit, omitBy } from "lodash"
import { Beef, Filter, RotateCcw } from "lucide-react"
import { Fragment, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { dishesAPI, dishCategoryAPI } from "src/Apis/Admin"
import { assets } from "src/Assets/assets"
import InputFileImage from "src/Components/InputFileImage"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import { isError400 } from "src/Helpers/utils"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigCategoryDish, queryParamConfigDish } from "src/Types/queryParams.type"
import { Dishes } from "src/Types/utils.type"

export default function ManageDish() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const getListDishCategory = useQuery({
    queryKey: ["listNameDishCategory", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return dishCategoryAPI.getListNameCategory(controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data
  const listDish = paginated?.data

  const listNameDishCategory = getListDishCategory.data?.data?.data || ([] as { id: string; name: string }[])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null | boolean>(null)
  const [form] = Form.useForm<Dishes>()

  const [file, setFile] = useState<File | null>(null)
  const avatarWatch = Form.useWatch("image", form)

  const previewImage = useMemo(() => {
    return file ? URL.createObjectURL(file) : ""
  }, [file])

  const handleChangeImage = (file?: File) => {
    setFile(file as File)
  }

  // const updateImageDishMutation = useMutation({
  //   mutationFn: (body: { file: File; dishId: string }) => {
  //     return MediaAPI.uploadImageDish(body.file, body.dishId)
  //   }
  // })

  // Update API
  const updateMutation = useMutation({
    mutationFn: (values: Partial<Dishes>) => {
      return dishesAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật món ăn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listDish"] })
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error("Cập nhật món ăn thất bại", {
        autoClose: 1500
      })
    }
  })

  const createMutation = useMutation({
    mutationFn: (values: { name: string; desc?: string }) => {
      return dishesAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Tạo món ăn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listDish"] })
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error("Tạo món ăn thất bại", {
        autoClose: 1500
      })
    }
  })

  const handleEdit = async (record: any | boolean) => {
    if (record === true) {
      form.setFieldsValue({
        name: "",
        desc: "",
        price: "",
        cooking_time: 0,
        category_id: "",
        is_active: true
      })
      setEditingId(true)
    } else {
      form.setFieldsValue({
        name: record.name,
        desc: record.desc,
        price: record.price,
        cooking_time: record.cooking_time,
        category_id: record.category_id,
        is_active: record.is_active,
        image: record.image
      })
      setEditingId(record.id)
    }
    setIsModalOpen(true)
  }

  const handleUpdate = () => {
    form.validateFields().then(async (values) => {
      try {
        // let imageUrl = values.image

        // // 🟢 Nếu người dùng chọn ảnh mới => upload lên server trước
        // if (file) {
        //   const res = await updateImageDishMutation.mutateAsync({
        //     file,
        //     dishId: editingId as string
        //   })
        //   imageUrl = res.data.data.url // đường dẫn ảnh trả về từ backend
        // }

        const payload = {
          ...values
          // image: imageUrl
        }

        // 🟢 Nếu đang tạo mới
        if (editingId === true) {
          await createMutation.mutateAsync(payload)
        } else {
          await updateMutation.mutateAsync(payload)
        }

        setIsModalOpen(false)
        setFile(null) // reset file
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        toast.error("Cập nhật món ăn thất bại!", { autoClose: 1500 })
      }
    })
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dishesAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa món ăn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listDish"] })
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
    Modal.confirm({
      title: "Bạn có chắc muốn xóa?",
      content: "Món ăn sẽ bị xóa vĩnh viễn.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(id)
    })
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
      render: (_: any, record: any) => (
        <div className="text-left">
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button danger type="link" onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </div>
      )
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

  return (
    <div>
      <Helmet>
        <title>Danh sách món ăn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách món ăn
      </h1>

      <div className="mt-4  gap-4 mb-4">
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

        <div className="flex justify-end mt-4">
          <Button type="primary" icon={<Beef />} onClick={() => handleEdit(true)} className="whitespace-nowrap">
            Thêm món ăn
          </Button>
        </div>
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
      ) : (listDish as Dishes[])?.length === 0 ? (
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
        onCancel={() => setIsModalOpen(false)}
        footer={false}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <div className="flex items-center">
            <div>
              <Form.Item name="name" label="Tên món" rules={[{ required: true, message: "Vui lòng nhập tên món" }]}>
                <Input placeholder="Nhập tên món" />
              </Form.Item>
              {/* Mô tả */}
              <Form.Item name="desc" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Mô tả món ăn..." />
              </Form.Item>
              <div className="flex items-center justify-between">
                <Form.Item label="Giá gốc" className="flex-1" name="price">
                  <Input placeholder="Nhập tên món" />
                </Form.Item>

                <Form.Item
                  className="flex-1"
                  name="cooking_time"
                  label="Thời gian nấu"
                  rules={[{ required: true, message: "Nhập thời gian nấu" }]}
                >
                  <InputNumber min={1} addonAfter="phút" />
                </Form.Item>
              </div>
              <Form.Item name="category_id" label="Loại món" rules={[{ required: true, message: "Chọn loại món" }]}>
                <Select placeholder="Chọn loại món">
                  {listNameDishCategory?.map((c: any) => (
                    <Select.Option key={c.id} value={c.id}>
                      {c.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="is_active" label="Trạng thái" initialValue={true}>
                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="image">
                <div className="flex items-center justify-center flex-col px-4 shadow-sm">
                  <div className="mb-2 text-black dark:text-white">Ảnh món ăn</div>
                  <img
                    src={previewImage || avatarWatch || assets.rectangles.Burger}
                    className="h-28 w-28 rounded-full mx-auto"
                    alt="avatar default"
                  />
                  <InputFileImage onChange={handleChangeImage} />
                </div>
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsModalOpen(false)} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending || createMutation.isPending}>
              {typeof editingId === "string" ? "Cập nhật món ăn" : "Thêm món ăn"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
