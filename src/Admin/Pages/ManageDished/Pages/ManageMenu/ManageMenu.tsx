/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Spin,
  Switch,
  Table,
  Tag
} from "antd"
import { isUndefined, omit, omitBy } from "lodash"
import { Beef, Filter, RotateCcw } from "lucide-react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { Fragment } from "react/jsx-runtime"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { menusAPI } from "src/Apis/Admin"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigMenu } from "src/Types/queryParams.type"
import { PaginatedResponse } from "src/Types/utils.type"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { Menus } from "src/Types/menu.type"
import { AppAbility, PermissionGate, useAuthorization } from "src/Authorization"

export default function ManageMenu() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useAuthorization()
  const canManageMenu = can(AppAbility.MENU_MANAGE)
  const queryParams: queryParamConfigMenu = useQueryParams()
  const queryConfig: queryParamConfigMenu = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "5",
      name: queryParams.name,
      desc: queryParams.desc,
      is_active: queryParams.is_active
    },
    isUndefined
  )

  const { data, isFetching } = useQuery({
    queryKey: ["listMenu", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return menusAPI.getList(queryConfig, controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data as PaginatedResponse<Menus>
  const listMenu = (paginated?.data || []) as Menus[]

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const columns = [
    {
      title: <div className="text-left">Mã thực đơn</div>,
      dataIndex: "id",
      key: "id",
      render: (val: string) => <div className="text-left">{val}</div>
    },
    {
      title: <div className="text-left">Tên thực đơn</div>,
      dataIndex: "name",
      key: "name",
      render: (val: string) => <div className="text-left">{val}</div>
    },
    {
      title: <div className="text-left">Mô tả</div>,
      dataIndex: "description",
      key: "description",
      render: (val: string) => <div className="text-left">{val}</div>
    },
    {
      title: <div className="text-center">Phiên bản</div>,
      dataIndex: "version",
      key: "version",
      render: (val: string) => <div className="text-center">{val}</div>
    },
    {
      title: <div className="text-center">Số lượng món ăn</div>,
      dataIndex: "items_count",
      key: "items_count",
      render: (val: string) => <div className="text-center">{val}</div>
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
        <div className="flex items-center justify-center">
          <Link
            to={`${path.AdminMenu}/${record.id}`}
            state={{
              dataMenu: record
            }}
            className="text-blue-500 text-center"
          >
            Xem chi tiết
          </Link>
        </div>
      )
    }
  ]

  const [filterForm] = Form.useForm()

  const handleApplyForm = (values: any) => {
    const params: queryParamConfigMenu = cleanObject({
      ...queryConfig,
      page: 1,
      name: values.name,
      desc: values.desc,
      is_active: values.is_active
    })
    navigate({
      pathname: `${path.AdminMenu}`,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const filteredSearch = omit(queryConfig, ["name", "desc", "is_active"])
    navigate({ pathname: `${path.AdminMenu}`, search: createSearchParams(filteredSearch).toString() })
    filterForm.resetFields()
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null | boolean>(null)
  const [form] = Form.useForm<Menus>()

  useEffect(() => {
    if (!canManageMenu) {
      setIsModalOpen(false)
      setEditingId(null)
    }
  }, [canManageMenu])

  const handleEdit = async (record: any | boolean) => {
    if (!canManageMenu) {
      toast.warn("Bạn không có quyền quản lý thực đơn.")
      return
    }
    if (record === true) {
      form.setFieldsValue({
        name: "",
        description: "",
        version: 0,
        is_active: false
      })
      setEditingId(true)
    }
    setIsModalOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: (values: { name: string; desc?: string }) => {
      return menusAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Tạo thực đơn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listMenu"] })
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error("Hiện đã có một menu đang được áp dụng. Chỉ được kích hoạt một menu tại một thời điểm.", {
        autoClose: 1500
      })
    }
  })

  const handleUpdate = () => {
    if (!canManageMenu) {
      toast.warn("Bạn không có quyền quản lý thực đơn.")
      return
    }
    if (editingId === true) {
      form.validateFields().then((values) => {
        createMutation.mutate(values)
      })
    }
  }

  return (
    <div>
      <Helmet>
        <title>Danh sách thực đơn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách thực đơn
      </h1>

      <div className="mt-4  gap-4 mb-4">
        <Form
          form={filterForm}
          layout="inline"
          onFinish={handleApplyForm}
          className="flex flex-wrap items-center justify-between"
          initialValues={{ name: undefined, category: undefined, is_active: undefined }}
        >
          <div className="flex items-center gap-1">
            <div className="text-[15px] font-semibold">Bộ lọc & tìm kiếm: </div>
            <Form.Item name="name">
              <Input type="text" placeholder="Tên thực đơn..." className="w-48" />
            </Form.Item>

            <Form.Item name="desc">
              <Input type="text" placeholder="Mô tả..." className="w-48" />
            </Form.Item>

            <Form.Item name="is_active">
              <Select placeholder="Trạng thái" allowClear className="w-32" dropdownStyle={{ width: 100 }}>
                <Select.Option value="1">Hoạt động</Select.Option>
                <Select.Option value="0">Ngừng</Select.Option>
              </Select>
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

        <PermissionGate ability={AppAbility.MENU_MANAGE}>
          <div className="flex justify-end mt-4">
            <Button type="primary" icon={<Beef />} onClick={() => handleEdit(true)} className="whitespace-nowrap">
              Thêm thực đơn
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
      ) : (listMenu as Menus[]).length === 0 ? (
        <Empty description="Không có thực đơn hợp lệ" className="mt-16" />
      ) : (
        <Fragment>
          <Alert
            message={
              <span style={{ fontWeight: 500 }}>
                Lưu ý: Tại một thời điểm chỉ có thể áp dụng được một menu duy nhất.
              </span>
            }
            type="warning"
            showIcon
            closable
            style={{
              marginBottom: 16,
              borderRadius: 8,
              fontSize: 15,
              background: "#fffbe6"
            }}
          />
          <Table
            rowKey="id"
            dataSource={listMenu}
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
        title="Thông tin Menu"
        open={isModalOpen}
        width={700}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleUpdate}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          {/* Tên Menu */}
          <Form.Item name="name" label="Tên Menu" rules={[{ required: true, message: "Vui lòng nhập tên menu" }]}>
            <Input placeholder="Nhập tên menu..." />
          </Form.Item>

          {/* Mô tả */}
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả menu..." />
          </Form.Item>

          {/* Phiên bản */}
          <Form.Item
            name="version"
            label="Phiên bản"
            rules={[
              { required: true, message: "Vui lòng nhập phiên bản" },
              { type: "number", min: 1, message: "Phiên bản phải >= 1" }
            ]}
          >
            <InputNumber min={1} className="w-full" placeholder="Nhập số phiên bản..." />
          </Form.Item>

          {/* Trạng thái hoạt động */}
          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
            tooltip="Chỉ một menu được kích hoạt tại một thời điểm"
          >
            <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Không hoạt động" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
