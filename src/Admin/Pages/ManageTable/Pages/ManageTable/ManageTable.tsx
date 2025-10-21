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
  Typography,
  Tag,
  Collapse
} from "antd"
import type { CollapseProps } from "antd"
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
import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { isError422 } from "src/Helpers/utils"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import { cleanObject } from "src/Helpers/common"
import { path } from "src/Constants/path"
import { omit } from "lodash"
import NavigateBack from "src/Admin/Components/NavigateBack"
import TableSessionItem from "../../Components/TableSessionItem"
import { TableSession } from "src/Types/tableSession.type"
import { TableSessionStatus, TableSessionType } from "src/Types/product.type"
import MergeIntoTable from "../../Components/MergeIntoTable"
import { AppAbility, useAuthorization } from "src/Authorization"

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

  const { can } = useAuthorization()
  const canViewTables = can(AppAbility.TABLES_VIEW)
  const canManageTables = can(AppAbility.TABLES_MANAGE)

  // ✅ Query danh sách bàn - Auto refetch every 30 seconds + always fresh on mount
  const { data, isFetching, isError } = useRealtimeQuery(
    ["listTableSession", queryConfig],
    () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListTableSession(queryConfig, controller.signal)
    },
    {
      enabled: canViewTables
      // refetchInterval: 30000 // Auto refetch every 30 seconds for table status updates
    }
  )

  const listTableSession = (data?.data.data || []) as TableSession[]

  // ✅ Query bàn active - Fresh data when needed (for merge table feature)
  const { data: dataTableSessionActive } = useRealtimeQuery(
    ["listTableSessionActive"],
    () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListTableSession(
        {
          page: "1",
          per_page: "100"
        },
        controller.signal
      )
    },
    { enabled: canViewTables }
  )

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
    if (!canManageTables) {
      toast.warn("Bạn không có quyền quản lý bàn.")
      return
    }
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
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<string[]>([])

  useEffect(() => {
    if (!canManageTables) {
      setAddItem(false)
      setMergedTable(false)
    }
  }, [canManageTables])

  const getStatusMeta = (table: TableSession) => {
    if (!table.session_id) {
      return { color: "green", label: "Trống" }
    }
    switch (table.session_status) {
      case TableSessionStatus.Pending:
        return { color: "orange", label: "Đang chờ" }
      case TableSessionStatus.Active:
        return { color: "blue", label: "Đang phục vụ" }
      case TableSessionStatus.Completed:
        return { color: "gray", label: "Hoàn tất" }
      case TableSessionStatus.Cancelled:
        return { color: "red", label: "Hủy" }
      case TableSessionStatus.Merged:
        return { color: "red", label: "Gộp bàn" }
      default:
        return { color: "default", label: "Không xác định" }
    }
  }

  const getTypeMeta = (table: TableSession) => {
    if (table.session_type === null || table.session_type === undefined) return null
    switch (table.session_type) {
      case TableSessionType.Offline:
        return { color: "default", label: "Offline" }
      case TableSessionType.Merge:
        return { color: "gold", label: "Ghép bàn" }
      case TableSessionType.Reservation:
        return { color: "cyan", label: "Đặt trước" }
      case TableSessionType.Split:
        return { color: "magenta", label: "Tách bàn" }
      default:
        return null
    }
  }

  const { groupedSessions, singleTables } = useMemo(() => {
    type TableGroup = {
      groupId: string
      mainTable: TableSession
      tables: TableSession[]
      subTableIds: string[]
      totalCapacity: number
    }

    const groupsByKey = new Map<string, TableSession[]>()
    listTableSession.forEach((table) => {
      const groupKey = table.merged_into_session_id ?? table.session_id
      if (!groupKey) return
      const current = groupsByKey.get(groupKey) ?? []
      current.push(table)
      groupsByKey.set(groupKey, current)
    })

    const groupedIds = new Set<string>()
    const groups: TableGroup[] = []

    groupsByKey.forEach((tables, groupId) => {
      const uniqueTablesMap = new Map<string, TableSession>()
      tables.forEach((table) => {
        uniqueTablesMap.set(table.dining_table_id, table)
      })

      const uniqueTables = Array.from(uniqueTablesMap.values())

      const mainTable =
        uniqueTables.find((table) => table.session_id === groupId && !table.merged_into_session_id) ??
        uniqueTables.find((table) => table.session_id === groupId) ??
        null

      if (!mainTable) return

      const subTables = uniqueTables
        .filter((table) => table.dining_table_id !== mainTable.dining_table_id)
        .sort((a, b) => a.table_number - b.table_number)

      if (subTables.length === 0) return

      const orderedTables = [mainTable, ...subTables]
      orderedTables.forEach((table) => groupedIds.add(table.dining_table_id))

      groups.push({
        groupId,
        mainTable,
        tables: orderedTables,
        subTableIds: subTables.map((table) => table.dining_table_id),
        totalCapacity: orderedTables.reduce((total, table) => total + (table.capacity || 0), 0)
      })
    })

    groups.sort((a, b) => a.mainTable.table_number - b.mainTable.table_number)

    const singles = listTableSession
      .filter((table) => !groupedIds.has(table.dining_table_id))
      .sort((a, b) => a.table_number - b.table_number)

    return { groupedSessions: groups, singleTables: singles }
  }, [listTableSession])

  useEffect(() => {
    if (groupedSessions.length === 0) {
      setExpandedGroupKeys((prev) => (prev.length === 0 ? prev : []))
      return
    }

    setExpandedGroupKeys((prev) => {
      if (prev.length === 0) {
        return [groupedSessions[0].groupId]
      }

      const validKeys = prev.filter((key) => groupedSessions.some((group) => group.groupId === key))

      if (validKeys.length === prev.length) {
        return prev
      }

      if (validKeys.length > 0) {
        return validKeys
      }

      return [groupedSessions[0].groupId]
    })
  }, [groupedSessions])

  const groupedCollapseItems: CollapseProps["items"] = groupedSessions.map((group) => {
    const statusMeta = getStatusMeta(group.mainTable)
    const typeMeta = getTypeMeta(group.mainTable)
    const activeServingCount = group.tables.filter((table) => table.session_status === TableSessionStatus.Active).length

    return {
      key: group.groupId,
      label: (
        <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
          <div className="flex flex-col">
            <span className="text-base font-semibold text-gray-900">Bàn {group.mainTable.table_number}</span>
            <span className="text-xs text-gray-500">
              {group.tables.length} bàn · Sức chứa {group.totalCapacity} người
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
            {typeMeta && <Tag color={typeMeta.color}>{typeMeta.label}</Tag>}
            {activeServingCount > 0 && <Tag color="green">Đang phục vụ: {activeServingCount}</Tag>}
          </div>
        </div>
      ),
      children: (
        <div className="rounded-xl border border-emerald-200 bg-white p-4">
          <Row gutter={[16, 16]}>
            {group.tables.map((table, index) => (
              <Col key={table.dining_table_id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <TableSessionItem
                  table={table}
                  index={index}
                  mainTableId={group.mainTable.dining_table_id}
                  subTables={group.subTableIds}
                />
              </Col>
            ))}
          </Row>
          <div className="mt-4 flex justify-end">
            <Link
              to={`${path.AdminTables}/${group.mainTable.dining_table_id}`}
              state={{ tableName: group.mainTable.table_number, dataTable: group.mainTable }}
              className="inline-flex items-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 hover:text-white"
            >
              Xem chi tiết nhóm bàn
            </Link>
          </div>
        </div>
      )
    }
  })

  if (!canViewTables) {
    return null
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
        {canManageTables && (
          <Button
            type="primary"
            icon={<Table2 />}
            onClick={() => {
              if (!canManageTables) {
                toast.warn("Bạn không có quyền quản lý bàn.")
                return
              }
              setAddItem(true)
            }}
            disabled={loading}
            className="whitespace-nowrap"
          >
            Thêm bàn mới
          </Button>
        )}
      </div>

      {canManageTables && (
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
      )}

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
            {groupedSessions.length > 0 && (
              <>
                <Title level={4} className="text-yellow-600 mb-3">
                  Bàn gộp
                </Title>

                <Collapse
                  bordered={false}
                  className="rounded-2xl border border-emerald-200 bg-white shadow-sm"
                  expandIconPosition="end"
                  activeKey={expandedGroupKeys}
                  onChange={(keys) => {
                    setExpandedGroupKeys(Array.isArray(keys) ? keys : [keys])
                  }}
                  items={groupedCollapseItems}
                />
              </>
            )}

            {/* --- Bàn đơn --- */}
            {singleTables.length > 0 && (
              <>
                <Title level={4} className="text-blue-600 mt-5 mb-3">
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

      {canManageTables && (
        <MergeIntoTable
          listTableSessionActiveData={listTableSessionActiveData}
          mergedTable={mergedTable}
          setMergedTable={setMergedTable}
          queryConfig={queryConfig}
        />
      )}

      <Modal
        title="Thêm bàn mới"
        closable={{ "aria-label": "Custom Close Button" }}
        open={canManageTables && addItem === true}
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
