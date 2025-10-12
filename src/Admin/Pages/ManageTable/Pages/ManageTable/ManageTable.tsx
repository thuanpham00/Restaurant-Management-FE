/* eslint-disable @typescript-eslint/no-explicit-any */
import { Row, Spin, Pagination, Empty, Divider, Button, Modal, Form, InputNumber, Switch, Input, Select } from "antd"
import omitBy from "lodash/omitBy"
import isUndefined from "lodash/isUndefined"
import useQueryParams from "src/Hook/useQueryParams"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { diningTableAPI, tableSessionAPI } from "src/Apis/Admin"
import { ErrorResponse, PaginatedResponse } from "src/Types/utils.type"
import { Helmet } from "react-helmet-async"
import "antd/dist/reset.css"
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom"
import { Filter, RotateCcw, Table2 } from "lucide-react"
import { Fragment, useState } from "react"
import { toast } from "react-toastify"
import { isError422 } from "src/Helpers/utils"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import { cleanObject } from "src/Helpers/common"
import { path } from "src/Constants/path"
import { omit } from "lodash"
import NavigateBack from "src/Admin/Components/NavigateBack"
import TableSessionItem from "../../Components/TableSessionItem"
import { TableSession } from "src/Types/tableSession.type"

export default function ManageTable() {
  const navigate = useNavigate()
  const queryParams: queryParamConfigTableSessions = useQueryParams()
  const queryConfig: queryParamConfigTableSessions = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "8",
      is_active: queryParams.is_active,
      session_status: queryParams.session_status,
      capacity: queryParams.capacity
    },
    isUndefined
  )

  const { data, isFetching, isError } = useQuery({
    queryKey: ["listTableSession", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListTableSession(queryConfig, controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000, // dưới 3 phút nó không gọi lại api
    placeholderData: keepPreviousData
  })

  const paginated: PaginatedResponse<TableSession> | undefined = data?.data.data
  const listTableSession = paginated?.data || []

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const [addItem, setAddItem] = useState<boolean | null>(null)

  // 1. Form filter
  const [filterForm] = Form.useForm()

  // 2. Form tạo bàn mới
  const [addTableForm] = Form.useForm()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const createDiningTableMutation = useMutation({
    mutationFn: (body: { table_number: number; capacity: number; is_active: boolean }) => {
      return diningTableAPI.createDiningTable({
        table_number: body.table_number,
        capacity: body.capacity,
        is_active: body.is_active
      })
    },
    onSuccess: () => {
      // Khi API tạo bàn thành công
      toast.success("Tạo bàn mới thành công!", {
        autoClose: 1500
      })
      setAddItem(null) // Đóng modal
      addTableForm.resetFields() // Reset form
      setLoading(false)
      queryClient.invalidateQueries({ queryKey: ["listTableSession", queryConfig] }) // refetch danh sách bàn
    },
    onError: (error: any) => {
      if (isError422<ErrorResponse<Record<string, string[]>>>(error)) {
        const errors = error.response?.data?.errors
        addTableForm.setFields(
          Object.entries(errors as Record<string, string[]>).map(([field, messages]) => ({
            name: field,
            errors: messages
          }))
        )
      }
    }
  })

  const handleAddDiningTable = (values: { table_number: number; capacity: number; is_active: boolean }) => {
    setLoading(true)
    createDiningTableMutation.mutate(values)
  }

  const handleApplyForm = (values: any) => {
    const params: queryParamConfigTableSessions = cleanObject({
      ...queryConfig,
      page: 1,
      is_active: Number(values.is_active),
      session_status: values.session_status,
      capacity: values.capacity
    })
    navigate({
      pathname: `${path.AdminTables}`,
      search: createSearchParams(params).toString()
    })
  }

  const resetFilterForm = () => {
    const filteredSearch = omit(queryConfig, ["is_active", "session_status", "capacity"])
    navigate({ pathname: `${path.AdminTables}`, search: createSearchParams(filteredSearch).toString() })
    filterForm.resetFields()
  }

  return (
    <div>
      <Helmet>
        <title>Danh sách bàn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>

      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Trạng thái bàn hiện tại
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
          <Form.Item name="capacity">
            <Input type="number" placeholder="Sức chứa..." min={1} className="w-32" />
          </Form.Item>

          <Form.Item name="session_status">
            <Select placeholder="Trạng thái bàn" allowClear className="w-48" dropdownStyle={{ width: 140 }}>
              <Select.Option value="empty">Trống</Select.Option>
              <Select.Option value="pending">Đặt trước</Select.Option>
              <Select.Option value="active">Đang phục vụ</Select.Option>
              <Select.Option value="completed">Hoàn tất</Select.Option>
              <Select.Option value="cancelled">Hủy</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_active">
            <Select placeholder="Bàn mở/tắt" allowClear className="w-32">
              <Select.Option value="1">Mở</Select.Option>
              <Select.Option value="0">Tắt</Select.Option>
            </Select>
          </Form.Item>

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
        </Form>
        <Button
          type="primary"
          icon={<Table2 />}
          onClick={() => setAddItem(true)}
          disabled={loading}
          className="whitespace-nowrap"
        >
          Thêm bàn mới
        </Button>
      </div>

      <Modal
        title="Thêm bàn mới"
        closable={{ "aria-label": "Custom Close Button" }}
        open={addItem === true}
        onCancel={() => setAddItem(false)}
        okText="Tạo"
        onOk={() => addTableForm.submit()}
      >
        <Form form={addTableForm} layout="vertical" onFinish={handleAddDiningTable} initialValues={{ is_active: true }}>
          <Form.Item label="Số bàn" name="table_number" rules={[{ required: true, message: "Vui lòng nhập số bàn!" }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Sức chứa" name="capacity" rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Hoạt động" name="is_active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

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
      ) : isError ? (
        <Empty description="Không thể tải danh sách bàn" className="mt-16" />
      ) : listTableSession.length === 0 ? (
        <Empty description="Không có bàn hợp lệ" className="mt-16" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {listTableSession.map((table, index) => (
              <Fragment key={table.dining_table_id}>
                <TableSessionItem table={table} index={index} />
              </Fragment>
            ))}
          </Row>

          <Divider />

          <div style={{ marginTop: 16, textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
            <Pagination
              current={parseInt(queryConfig.page as string)}
              total={paginated?.total}
              pageSize={parseInt(queryConfig.per_page as string)}
              onChange={handlePaginationChange}
              showSizeChanger
              pageSizeOptions={["8", "10", "20", "50"]}
            />
          </div>
        </>
      )}
    </div>
  )
}
