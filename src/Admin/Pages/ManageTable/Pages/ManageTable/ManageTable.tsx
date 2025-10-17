/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Row,
  Spin,
  Empty,
  Divider,
  Button,
  Modal,
  Form,
  InputNumber,
  Switch,
  Input,
  Select,
  Col,
  Typography
} from "antd"
import omitBy from "lodash/omitBy"
import isUndefined from "lodash/isUndefined"
import useQueryParams from "src/Hook/useQueryParams"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { diningTableAPI, tableSessionAPI } from "src/Apis/Admin"
import { ErrorResponse } from "src/Types/utils.type"
import { Helmet } from "react-helmet-async"
import "antd/dist/reset.css"
import { useRealtimeQuery } from "src/Hook/useRealtimeQuery"
import { createSearchParams, Link, useNavigate } from "react-router-dom"
import { Filter, RotateCcw, Table2, TabletSmartphone } from "lucide-react"
import { useState } from "react"
import { toast } from "react-toastify"
import { isError422 } from "src/Helpers/utils"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import { cleanObject } from "src/Helpers/common"
import { path } from "src/Constants/path"
import { omit } from "lodash"
import NavigateBack from "src/Admin/Components/NavigateBack"
import TableSessionItem from "../../Components/TableSessionItem"
import { TableSession } from "src/Types/tableSession.type"
import MergeIntoTable from "../../Components/MergeIntoTable"

const { Title } = Typography

export default function ManageTable() {
  const navigate = useNavigate()
  const queryParams: queryParamConfigTableSessions = useQueryParams()
  const queryConfig: queryParamConfigTableSessions = omitBy(
    {
      is_active: queryParams.is_active,
      session_status: queryParams.session_status,
      capacity: queryParams.capacity
    },
    isUndefined
  )

  // ✅ Query danh sách bàn - Auto refetch every 30 seconds + always fresh on mount
  const { data, isFetching, isError } = useRealtimeQuery(
    ["listTableSession", queryConfig],
    () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListTableSession(queryConfig, controller.signal)
    },
    {
      // refetchInterval: 30000 // Auto refetch every 30 seconds for table status updates
    }
  )

  const listTableSession = (data?.data.data || []) as TableSession[]

  // ✅ Query bàn active - Fresh data when needed (for merge table feature)
  const { data: dataTableSessionActive } = useRealtimeQuery(["listTableSessionActive"], () => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 10000)
    return tableSessionAPI.getListTableSession(
      {
        page: "1",
        per_page: "100"
      },
      controller.signal
    )
  })

  const listTableSessionActive = (dataTableSessionActive?.data.data || []) as TableSession[]

  const listTableSessionActiveData = listTableSessionActive.filter(
    (item) => item.session_status === 1 && item.session_type !== 1
  )

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

  const [mergedTable, setMergedTable] = useState(false)

  const groupedTablesMap = new Map<string, TableSession[]>()

  // Bước 1: Gom tất cả bàn có groupKey (merged_into hoặc session)
  const tempGroups = new Map<string, TableSession[]>()

  listTableSession.forEach((table) => {
    const groupKey = table.merged_into_session_id || table.session_id
    if (groupKey) {
      if (!tempGroups.has(groupKey)) tempGroups.set(groupKey, [])
      tempGroups.get(groupKey)!.push(table)
    }
  })

  // Bước 2: Chỉ giữ lại group có từ 2 bàn trở lên (tức là thật sự có gộp)
  tempGroups.forEach((tables, key) => {
    if (tables.length > 1) {
      groupedTablesMap.set(key, tables)
    }
  })

  // Bước 3: Đánh dấu những bàn đã nằm trong group
  const groupedTableIds = new Set(
    Array.from(groupedTablesMap.values())
      .flat()
      .map((t) => t.dining_table_id)
  )

  // Bàn độc lập (chưa gộp)
  const singleTables = listTableSession.filter((t) => !groupedTableIds.has(t.dining_table_id))

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
            <Select placeholder="Trạng thái phiên bàn" allowClear className="w-48" dropdownStyle={{ width: 140 }}>
              <Select.Option value="empty">Trống</Select.Option>
              <Select.Option value="pending">Đặt trước</Select.Option>
              <Select.Option value="active">Đang phục vụ</Select.Option>
              <Select.Option value="completed">Hoàn tất</Select.Option>
              <Select.Option value="cancelled">Hủy</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_active">
            <Select placeholder="Trạng thái bàn" allowClear className="w-32">
              <Select.Option value="1">Mở</Select.Option>
              <Select.Option value="0">Ngừng</Select.Option>
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

      <div className="flex justify-start mb-2">
        <Button
          type="default"
          icon={<TabletSmartphone size={16} />}
          onClick={() => setMergedTable(true)}
          disabled={loading}
          style={{
            backgroundColor: "#ffc300",
            borderColor: "#ffc300",
            color: "#fff"
          }}
          className="whitespace-nowrap hover:opacity-90"
        >
          Gộp bàn
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
      ) : isError ? (
        <Empty description="Không thể tải danh sách bàn" className="mt-16" />
      ) : listTableSession.length === 0 ? (
        <Empty description="Không có bàn hợp lệ" className="mt-16" />
      ) : (
        <>
          <>
            {/* --- Bàn gộp --- */}
            {groupedTablesMap.size > 0 && (
              <>
                <Title level={4} className="text-yellow-600 mb-3">
                  Bàn gộp
                </Title>

                <div className="flex items-center flex-wrap justify-between">
                  {Array.from(groupedTablesMap.entries()).map(([groupKey, tables]) => {
                    const widthValue = tables.length === 2 ? 49 : 99
                    const mainTable = tables.find((t) => t.session_id === groupKey) || tables[0]
                    const mainTableId = mainTable.dining_table_id
                    const subTables = tables
                      .filter((t) => t.dining_table_id !== mainTableId)
                      .map((t) => t.dining_table_id)
                    return (
                      <div
                        key={groupKey}
                        className="rounded-2xl p-3 mb-6 border-4 border-[#a3d9a5] shadow-[0_0_14px_#a3d9a5] transition-all duration-300"
                        style={{ width: `${widthValue}%` }}
                      >
                        <Row gutter={[16, 16]}>
                          {tables.map((table, index) => (
                            <Col key={table.dining_table_id} flex="1 0 45%">
                              <TableSessionItem
                                table={table}
                                index={index}
                                mainTableId={mainTableId}
                                subTables={subTables}
                              />
                            </Col>
                          ))}
                        </Row>
                        <div style={{ width: `${widthValue * 2}%` }} className="flex justify-center">
                          <Link
                            to={`${path.AdminTables}/${mainTableId}`}
                            state={{ tableName: mainTable.table_number, dataTable: mainTable }}
                            className="p-2 bg-red-500 rounded-sm text-white mt-2"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* --- Bàn đơn --- */}
            {singleTables.length > 0 && (
              <>
                <Title level={4} className="text-blue-600 mb-3">
                  Bàn đơn
                </Title>

                <Row gutter={[24, 24]}>
                  {singleTables.map((table, index) => (
                    <Col key={table.dining_table_id} xs={24} sm={12} md={8} lg={6} xl={6}>
                      <TableSessionItem table={table} index={index} />
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </>

          <Divider />
        </>
      )}

      <MergeIntoTable
        listTableSessionActiveData={listTableSessionActiveData}
        mergedTable={mergedTable}
        setMergedTable={setMergedTable}
        queryConfig={queryConfig}
      />

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
    </div>
  )
}
