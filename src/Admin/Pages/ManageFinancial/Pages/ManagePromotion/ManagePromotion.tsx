/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag
} from "antd"
import { ColumnsType } from "antd/es/table"
import { isUndefined, omit, omitBy } from "lodash"
import { Beef, Filter, RotateCcw } from "lucide-react"
import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { Fragment } from "react/jsx-runtime"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { promotionAPI } from "src/Apis/Admin/promotion.api"
import { path } from "src/Constants/path"
import { cleanObject } from "src/Helpers/common"
import useQueryParams from "src/Hook/useQueryParams"
import { Promotion } from "src/Types/promotion.type"
import { queryParamConfigPromotion } from "src/Types/queryParams.type"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import customParseFormat from "dayjs/plugin/customParseFormat"
import weekday from "dayjs/plugin/weekday"
import localeData from "dayjs/plugin/localeData"
import weekOfYear from "dayjs/plugin/weekOfYear"
import weekYear from "dayjs/plugin/weekYear"
import { isError400 } from "src/Helpers/utils"

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(weekday)
dayjs.extend(localeData)
dayjs.extend(weekOfYear)
dayjs.extend(weekYear)

export default function ManagePromotion() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryParams: queryParamConfigPromotion = useQueryParams()
  const queryConfig: queryParamConfigPromotion = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "5",
      is_active: queryParams.is_active,
      code: queryParams.code,
      desc: queryParams.desc,
      discount_percent: queryParams.discount_percent
    },
    isUndefined
  )

  const { data, isFetching } = useQuery({
    queryKey: ["listPromotion", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return promotionAPI.getList(queryConfig, controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data
  const listPromotion = paginated?.data

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa khuyến mãi thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listPromotion"] })
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
      content: "Khuyến mãi sẽ bị xóa vĩnh viễn.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  const columns: ColumnsType<Promotion> = [
    {
      title: "Mã khuyến mãi",
      dataIndex: "id",
      key: "id",
      render: (text: string) => <span>{text}</span>
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (text: string) => <span>{text}</span>
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => <span>{text || "-"}</span>
    },
    {
      title: "Giảm (%)",
      dataIndex: "discount_percent",
      key: "discount_percent",
      render: (value: string) => <span>{parseFloat(value).toFixed(2)}%</span>
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "start_date",
      key: "start_date",
      render: (date: string) => <span>{new Date(date).toLocaleDateString()}</span>
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "end_date",
      key: "end_date",
      render: (date: string) => <span>{new Date(date).toLocaleDateString()}</span>
    },
    {
      title: "Số lần sử dụng tối đa",
      dataIndex: "usage_limit",
      key: "usage_limit",
      render: (value: number) => <span className="text-center block">{value}</span>
    },
    {
      title: <div className="text-center">Lượt dùng</div>,
      dataIndex: "used_count",
      key: "used_count",
      render: (value: number) => <span className="text-center block">{value}</span>
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Đang hoạt động" : "Ngừng"}</Tag>
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Promotion) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button danger type="link" onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      )
    }
  ]

  const [filterForm] = Form.useForm()

  const handleApplyForm = (values: any) => {
    const params: queryParamConfigPromotion = cleanObject({
      ...queryConfig,
      page: 1,
      code: values.code,
      desc: values.desc,
      discount_percent: values.discount_percent,
      is_active: values.is_active
    })
    navigate({
      pathname: `${path.AdminPromotions}`,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const filteredSearch = omit(queryConfig, ["code", "desc", "discount_percent", "is_active"])
    navigate({ pathname: `${path.AdminPromotions}`, search: createSearchParams(filteredSearch).toString() })
    filterForm.resetFields()
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null | boolean>(null)
  const [form] = Form.useForm<Promotion>()

  const handleEdit = async (record: Promotion | boolean) => {
    if (record === true) {
      form.setFieldsValue({
        code: "",
        description: "",
        discount_percent: "",
        usage_limit: 0,
        start_date: null,
        end_date: null,
        is_active: true
      })
      setEditingId(true)
    } else if (typeof record === "object") {
      form.setFieldsValue({
        code: record.code,
        description: record.description,
        discount_percent: record.discount_percent,
        usage_limit: record.usage_limit,
        start_date: record.start_date ? dayjs(record.start_date) : null,
        end_date: record.end_date ? dayjs(record.end_date) : null,
        is_active: record.is_active
      })
      setEditingId(record.id)
    }
    setIsModalOpen(true)
  }

  // Update API
  const updateMutation = useMutation({
    mutationFn: (values: {
      code: string
      description: string
      discount_percent: string
      usage_limit: number
      start_date: string
      end_date: string
      is_active: boolean
    }) => {
      return promotionAPI.update(editingId as string, values)
    },
    onSuccess: () => {
      toast.success("Cập nhật khuyến mãi thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listPromotion"] })
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error("Cập nhật khuyến mãi thất bại", {
        autoClose: 1500
      })
    }
  })

  const createMutation = useMutation({
    mutationFn: (values: {
      code: string
      description: string
      discount_percent: string
      usage_limit: number
      start_date: string
      end_date: string
      is_active: boolean
    }) => {
      return promotionAPI.create(values)
    },
    onSuccess: () => {
      toast.success("Tạo khuyến mãi thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listPromotion"] })
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error("Tạo khuyến mãi thất bại", {
        autoClose: 1500
      })
    }
  })

  const handleUpdate = () => {
    form.validateFields().then((values) => {
      // convert Moment -> string
      const payload = {
        ...values,
        start_date: values.start_date?.format("YYYY-MM-DD") ?? "",
        end_date: values.end_date?.format("YYYY-MM-DD") ?? "",
        discount_percent: String(values.discount_percent),
        usage_limit: Number(values.usage_limit),
        is_active: values.is_active ?? false
      }

      if (editingId === true) {
        createMutation.mutate(payload) // create
      } else {
        updateMutation.mutate(payload) // update
      }
    })
  }

  return (
    <div>
      <Helmet>
        <title>Quản lý khuyến mãi</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách khuyến mãi
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
          <Form.Item name="code">
            <Input type="text" placeholder="Code khuyến mãi..." className="w-48" />
          </Form.Item>

          <Form.Item name="desc">
            <Input type="text" placeholder="Mô tả..." className="w-48" />
          </Form.Item>

          <Form.Item name="discount_percent">
            <Input type="number" placeholder="% Giảm giá" className="w-40" addonAfter="%" />
          </Form.Item>

          <Form.Item name="is_active">
            <Select placeholder="Trạng thái" allowClear className="w-32" dropdownStyle={{ width: 120 }}>
              <Select.Option value="1">Hoạt động</Select.Option>
              <Select.Option value="0">Ngừng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<Filter size={16} />}>
              Lọc
            </Button>
          </Form.Item>

          <Form.Item>
            <Button icon={<RotateCcw size={16} />} onClick={resetFilterForm}>
              Đặt lại
            </Button>
          </Form.Item>
        </Form>

        <Button type="primary" icon={<Beef />} onClick={() => handleEdit(true)} className="whitespace-nowrap">
          Thêm khuyến mãi
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
      ) : (listPromotion as Promotion[])?.length === 0 ? (
        <Empty description="Không có khuyến mãi hợp lệ" className="mt-16" />
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={listPromotion as Promotion[]}
            pagination={false}
            bordered={true}
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

      {/* Modal Edit */}
      <Modal
        width={800}
        title="Thông tin khuyến mãi"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={false}
        onOk={handleUpdate}
        confirmLoading={updateMutation.isPending || createMutation.isPending}
        style={{ top: 60 }}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="code" label="Code khuyến mãi" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="discount_percent"
                label="Giảm giá (%)"
                rules={[
                  { required: true, message: "Vui lòng nhập phần trăm giảm giá" },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === "") {
                        return Promise.resolve()
                      }
                      const num = Number(value)
                      if (isNaN(num)) {
                        return Promise.reject(new Error("Giá trị phải là số"))
                      }
                      if (num < 0 || num > 100) {
                        return Promise.reject(new Error("Giá trị từ 0 đến 100"))
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="usage_limit"
                label="Số lần sử dụng tối đa"
                rules={[
                  { required: true, message: "Vui lòng nhập số lần sử dụng" },
                  { type: "number", min: 1, message: "Phải lớn hơn 0" }
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const endDate = getFieldValue("end_date")
                      if (!value || !endDate || value.isBefore(endDate) || value.isSame(endDate)) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc"))
                    }
                  })
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label="Ngày kết thúc"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày kết thúc" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue("start_date")
                      if (!value || !startDate || value.isAfter(startDate) || value.isSame(startDate)) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"))
                    }
                  })
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsModalOpen(false)} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending || createMutation.isPending}>
              {typeof editingId === "string" ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
