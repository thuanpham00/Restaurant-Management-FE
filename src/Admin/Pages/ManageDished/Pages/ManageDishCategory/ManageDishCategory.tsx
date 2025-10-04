/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Empty, Form, Input, Modal, Pagination, Spin, Table } from "antd"
import { ColumnsType } from "antd/es/table"
import { isUndefined, omit, omitBy } from "lodash"
import { Beef } from "lucide-react"
import { Fragment, useState } from "react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { adminAPI } from "src/Apis/admin.api"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigCategoryDish } from "src/Types/queryParams.type"
import { CategoryDishes } from "src/Types/utils.type"

export default function ManageDishCategory() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryParams: queryParamConfigCategoryDish = useQueryParams()
  const queryConfig: queryParamConfigCategoryDish = omitBy(
    {
      page: queryParams.page || "1",
      limit: queryParams.limit || "5",
      desc: queryParams.desc,
      name: queryParams.name
    },
    isUndefined
  )

  const { data, isFetching } = useQuery({
    queryKey: ["listDishCategory", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return adminAPI.dishes_category.getList(queryConfig, controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data
  const listCategoryDish = paginated?.data

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null | boolean>(null)
  const [form] = Form.useForm<CategoryDishes>()

  const handleEdit = async (record: any | boolean) => {
    if (record === true) {
      form.setFieldsValue({
        name: "",
        desc: ""
      })
      setEditingId(true)
    } else {
      form.setFieldsValue({
        name: record.name,
        desc: record.desc
      })
      setEditingId(record.id)
    }
    setIsModalOpen(true)
  }

  // Update API
  const updateMutation = useMutation({
    mutationFn: (values: Partial<CategoryDishes>) => {
      return adminAPI.dishes_category.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật thể loại thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listDishCategory"] })
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error("Cập nhật thể loại thất bại", {
        autoClose: 1500
      })
    }
  })

  const createMutation = useMutation({
    mutationFn: (values: { name: string; desc?: string }) => {
      return adminAPI.dishes_category.create(values)
    },
    onSuccess: () => {
      toast.success("Tạo thể loại thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listDishCategory"] })
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error("Tạo thể loại thất bại", {
        autoClose: 1500
      })
    }
  })

  const handleUpdate = () => {
    if (editingId === true) {
      form.validateFields().then((values) => {
        createMutation.mutate(values)
      })
    } else {
      form.validateFields().then((values) => {
        updateMutation.mutate(values)
      })
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAPI.dishes_category.delete(id),
    onSuccess: () => {
      toast.success("Xóa thể loại thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listDishCategory"] })
    },
    onError: () => {
      toast.error("Thể loại đang sử dụng nên không thể xóa!", {
        autoClose: 1500
      })
    }
  })

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Bạn có chắc muốn xóa?",
      content: "Thể loại sẽ bị xóa vĩnh viễn.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const columns: ColumnsType<CategoryDishes> = [
    {
      title: <div className="text-left">Mã thể loại</div>,
      dataIndex: "id",
      key: "id",
      render: (val) => <div className="text-left">{val}</div>
    },
    {
      title: <div className="text-left">Tên thể loại</div>,
      dataIndex: "name",
      key: "name",
      render: (val) => <div className="text-left">{val}</div>
    },
    {
      title: <div className="text-left">Mô tả</div>,
      dataIndex: "desc",
      key: "desc",
      render: (text) => (
        <div className="text-left">{text !== "" ? text : <i className="text-gray-400">Không có</i>}</div>
      )
    },
    {
      title: <div className="text-left">Số lượng món</div>,
      dataIndex: "dishes_count",
      key: "dishes_count",
      render: (val) => <div className="text-left">{val}</div>
    },
    {
      title: <div className="text-left">Ngày tạo</div>,
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => <div className="text-left">{new Date(value).toLocaleString()}</div>
    },
    {
      title: <div className="text-left">Ngày cập nhật</div>,
      dataIndex: "updated_at",
      key: "updated_at",
      render: (value) => <div className="text-left">{new Date(value).toLocaleString()}</div>
    },
    {
      title: <div className="text-left">Hành động</div>,
      key: "actions",
      render: (_, record) => (
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
    searchParams.set("limit", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const [filterForm] = Form.useForm()

  const handleApplyForm = (values: any) => {
    const params: queryParamConfigCategoryDish = cleanObject({
      ...queryConfig,
      page: 1,
      name: values.name,
      desc: values.desc
    })
    navigate({
      pathname: `${path.AdminCategoryDish}`,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const filteredSearch = omit(queryConfig, ["name", "desc"])
    navigate({ pathname: `${path.AdminCategoryDish}`, search: createSearchParams(filteredSearch).toString() })
    filterForm.resetFields()
  }

  return (
    <div>
      <Helmet>
        <title>Thể loại món ăn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Thể loại món ăn
      </h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 mb-4">
        <Form
          form={filterForm}
          layout="inline"
          onFinish={handleApplyForm}
          className="flex flex-wrap items-center gap-1"
          initialValues={{ capacity: undefined, status: undefined, is_active: undefined }}
        >
          <div className="text-[15px] font-semibold">Bộ lọc & tìm kiếm: </div>
          <Form.Item name="name">
            <Input type="text" placeholder="Tên thể loại..." className="w-48" />
          </Form.Item>

          <Form.Item name="desc">
            <Input type="text" placeholder="Mô tả..." className="w-48" />
          </Form.Item>

          <Form.Item>
            <Button onClick={resetFilterForm}>Reset</Button>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Áp dụng
            </Button>
          </Form.Item>
        </Form>

        <Button type="primary" icon={<Beef />} onClick={() => handleEdit(true)} className="whitespace-nowrap">
          Thêm thể loại
        </Button>
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
      ) : (listCategoryDish as CategoryDishes[]).length === 0 ? (
        <Empty description="Không có thể loại hợp lệ" className="mt-16" />
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={listCategoryDish as CategoryDishes[]}
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
              pageSize={parseInt(queryConfig.limit as string)}
              onChange={handlePaginationChange}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
            />
          </div>
        </Fragment>
      )}

      {/* Modal Edit */}
      <Modal
        title="Thông tin thể loại"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleUpdate}
        confirmLoading={updateMutation.isPending || createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên thể loại" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="desc" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
